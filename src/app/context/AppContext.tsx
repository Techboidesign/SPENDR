import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { AppState, Action, Expense, CategoryCustomization } from '../data/types';
import { resolveCategories, resolveCategory } from '../data/categoryConfig';
import { getCategoryById as getDefaultCategoryById, type Category } from '../data/categories';
import type { CategoryIconKey } from '../data/categoryConfig';
import { INITIAL_APP_STATE } from '../data/sampleData';
import { getItem, setItem } from '../utils/storage';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useOnboarding } from './OnboardingContext';
import {
  fetchAppState,
  syncActionToSupabase,
} from '../services/appDataService';
import { migrateLocalStorageIfNeeded } from '../services/migrateLocalStorage';
import { completeOnboardingOnServer } from '../services/completeOnboarding';
import { parseReceiptFiles, parseReceiptImage } from '../services/receiptParseService';
import type { ExpenseFormDraft } from '../types/expenseDraft';
import { generateId } from '../utils/id';
import {
  buildCanonicalRecurringMap,
  recurringAppliesToMonth,
  applyRecurringSeriesUpdate,
} from '../utils/recurringExpense';

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE_STATE':
      return action.state;
    case 'RESET_STATE':
      return { ...INITIAL_APP_STATE, expenses: [], budgetGoals: [], customCategories: [] };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'ADD_EXPENSES':
      return { ...state, expenses: [...action.expenses, ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: applyRecurringSeriesUpdate(state.expenses, action.expense),
      };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.id) };
    case 'DELETE_EXPENSES':
      return { ...state, expenses: state.expenses.filter(e => !action.ids.includes(e.id)) };
    case 'SET_INCOME':
      return { ...state, income: action.amount };
    case 'SET_BUDGET':
      return { ...state, monthlyBudget: action.amount };
    case 'SET_CATEGORY_BUDGET': {
      const existing = state.budgetGoals.find(g => g.categoryId === action.categoryId);
      if (existing) {
        return {
          ...state,
          budgetGoals: state.budgetGoals.map(g =>
            g.categoryId === action.categoryId ? { ...g, amount: action.amount } : g,
          ),
        };
      }
      return {
        ...state,
        budgetGoals: [...state.budgetGoals, { categoryId: action.categoryId, amount: action.amount }],
      };
    }
    case 'SET_CURRENCY':
      return { ...state, currency: action.currency };
    case 'SET_USER_NAME':
      return { ...state, userName: action.name };
    case 'SET_USER_FULL_NAME':
      return { ...state, userFullName: action.fullName };
    case 'SET_USER_EMAIL':
      return { ...state, userEmail: action.email };
    case 'SET_USER_USERNAME':
      return { ...state, userUsername: action.username };
    case 'SET_USER_PHONE':
      return { ...state, userPhone: action.phone };
    case 'SET_USER_AVATAR':
      return { ...state, userAvatar: action.avatar };
    case 'SET_CATEGORY_CUSTOMIZATION':
      return {
        ...state,
        categoryCustomizations: {
          ...state.categoryCustomizations,
          [action.categoryId]: action.customization,
        },
      };
    case 'ADD_CUSTOM_CATEGORY':
      return {
        ...state,
        customCategories: [...state.customCategories, action.category],
      };
    case 'UPDATE_CUSTOM_CATEGORY':
      return {
        ...state,
        customCategories: state.customCategories.map(c =>
          c.id === action.category.id ? action.category : c,
        ),
      };
    default:
      return state;
  }
}

interface ResolvedCategory extends Category {
  iconKey: CategoryIconKey;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  categories: ResolvedCategory[];
  getCategory: (id: string) => ResolvedCategory;
  showAddModal: boolean;
  editingExpense: Expense | null;
  addModalDraft: ExpenseFormDraft | null;
  openAddModal: (expense?: Expense, draft?: ExpenseFormDraft) => void;
  closeAddModal: () => void;
  formatCurrency: (amount: number) => string;
  isDataLoading: boolean;
  isParsingReceipt: boolean;
  parseStatusMessage: string;
  scanReceiptFromCamera: (file: File) => Promise<void>;
  uploadReceiptDocuments: (files: File[]) => Promise<void>;
  completeOnboardingAndSync: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { auth, onboarding } = useOnboarding();
  const userId = auth.userId;
  const useCloud = isSupabaseConfigured && auth.isAuthenticated && Boolean(userId);

  const [state, baseDispatch] = useReducer(reducer, undefined, () => {
    if (!isSupabaseConfigured) {
      const saved = getItem<AppState>('appState');
      return saved ?? INITIAL_APP_STATE;
    }
    return { ...INITIAL_APP_STATE, expenses: [], budgetGoals: [] };
  });

  const [isDataLoading, setIsDataLoading] = useState(useCloud);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [addModalDraft, setAddModalDraft] = useState<ExpenseFormDraft | null>(null);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [parseStatusMessage, setParseStatusMessage] = useState('Analyzing receipt…');
  const stateRef = useRef(state);
  stateRef.current = state;

  // Offline fallback: persist to localStorage when Supabase is not configured
  useEffect(() => {
    if (!useCloud) {
      setItem('appState', state);
    }
  }, [state, useCloud]);

  // Load cloud data when user signs in
  useEffect(() => {
    if (!useCloud || !userId) {
      setIsDataLoading(false);
      return;
    }

    let cancelled = false;
    setIsDataLoading(true);

    (async () => {
      try {
        await migrateLocalStorageIfNeeded(userId);
        const remote = await fetchAppState(userId);
        if (!cancelled) {
          baseDispatch({ type: 'HYDRATE_STATE', state: remote });
        }
      } catch (err) {
        console.error('Failed to load app data:', err);
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [useCloud, userId]);

  // Reset when logged out
  useEffect(() => {
    if (!auth.isAuthenticated && isSupabaseConfigured) {
      baseDispatch({ type: 'RESET_STATE' });
    }
  }, [auth.isAuthenticated]);

  const dispatch = useCallback(
    (action: Action) => {
      baseDispatch(action);
      if (!useCloud || !userId) return;
      if (action.type === 'HYDRATE_STATE' || action.type === 'RESET_STATE') return;

      const nextState = reducer(stateRef.current, action);
      stateRef.current = nextState;

      syncActionToSupabase(userId, action, nextState).catch(err => {
        console.error('Sync failed:', err);
      });
    },
    [useCloud, userId],
  );

  const completeOnboardingAndSync = useCallback(async () => {
    if (!userId) return;
    const merged = await completeOnboardingOnServer(userId, onboarding, stateRef.current);
    baseDispatch({ type: 'HYDRATE_STATE', state: merged });
  }, [userId, onboarding]);

  const openAddModal = (expense?: Expense, draft?: ExpenseFormDraft) => {
    setEditingExpense(expense ?? null);
    setAddModalDraft(draft ?? null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingExpense(null);
    setAddModalDraft(null);
  };

  const applyParsedExpenses = useCallback(
    (items: Awaited<ReturnType<typeof parseReceiptImage>>) => {
      if (items.length === 1) {
        const item = items[0];
        setEditingExpense(null);
        setAddModalDraft({
          name: item.name,
          amount: String(item.amount),
          categoryId: item.categoryId,
          date: item.date,
          type: item.type,
          notes: item.notes,
          startDate: item.date,
        });
        setShowAddModal(true);
        return;
      }

      const expenses: Expense[] = items.map(item => ({
        id: generateId(),
        name: item.name,
        amount: item.amount,
        categoryId: item.categoryId,
        date: item.date,
        type: item.type,
        notes: item.notes,
        startDate: item.type !== 'one-time' ? item.date : undefined,
      }));
      dispatch({ type: 'ADD_EXPENSES', expenses });
    },
    [dispatch],
  );

  const scanReceiptFromCamera = useCallback(
    async (file: File) => {
      setIsParsingReceipt(true);
      setParseStatusMessage('Scanning receipt…');
      try {
        const items = await parseReceiptImage(file);
        applyParsedExpenses(items);
      } catch (err) {
        console.error(err);
        setParseStatusMessage(err instanceof Error ? err.message : 'Scan failed');
        window.setTimeout(() => setIsParsingReceipt(false), 2200);
        return;
      }
      setIsParsingReceipt(false);
    },
    [applyParsedExpenses],
  );

  const uploadReceiptDocuments = useCallback(
    async (files: File[]) => {
      setIsParsingReceipt(true);
      setParseStatusMessage(
        files.length > 1 ? `Parsing ${files.length} documents…` : 'Parsing document…',
      );
      try {
        const items = await parseReceiptFiles(files);
        applyParsedExpenses(items);
      } catch (err) {
        console.error(err);
        setParseStatusMessage(err instanceof Error ? err.message : 'Upload failed');
        window.setTimeout(() => setIsParsingReceipt(false), 2200);
        return;
      }
      setIsParsingReceipt(false);
    },
    [applyParsedExpenses],
  );

  const formatCurrency = (amount: number) => {
    const symbol =
      state.currency === 'EUR'
        ? '€'
        : state.currency === 'USD'
          ? '$'
          : state.currency === 'GBP'
            ? '£'
            : state.currency;
    if (state.currency === 'EUR') return `€${amount.toFixed(2)}`;
    if (state.currency === 'USD') return `$${amount.toFixed(2)}`;
    if (state.currency === 'GBP') return `£${amount.toFixed(2)}`;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const categories = useMemo(
    () => resolveCategories(state.categoryCustomizations, state.customCategories),
    [state.categoryCustomizations, state.customCategories],
  );

  const getCategory = useCallback(
    (id: string) => {
      const found = categories.find(c => c.id === id);
      if (found) return found;
      const custom = state.customCategories.find(c => c.id === id);
      if (custom) {
        return resolveCategories({}, [custom])[0];
      }
      return resolveCategory(getDefaultCategoryById(id), state.categoryCustomizations[id]);
    },
    [categories, state.categoryCustomizations, state.customCategories],
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        categories,
        getCategory,
        showAddModal,
        editingExpense,
        addModalDraft,
        openAddModal,
        closeAddModal,
        formatCurrency,
        isDataLoading,
        isParsingReceipt,
        parseStatusMessage,
        scanReceiptFromCamera,
        uploadReceiptDocuments,
        completeOnboardingAndSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function getMonthlyAmount(expense: Expense): number {
  if (expense.type === 'yearly') {
    return expense.amount / 12;
  }
  return expense.amount;
}

export function getMonthExpenses(expenses: AppState['expenses'], yearMonth: string) {
  const applicable: Expense[] = [];

  for (const expense of expenses) {
    if (expense.type === 'one-time' && expense.date.startsWith(yearMonth)) {
      applicable.push(expense);
    }
  }

  for (const expense of buildCanonicalRecurringMap(expenses).values()) {
    if (recurringAppliesToMonth(expense, yearMonth)) {
      applicable.push(expense);
    }
  }

  return applicable;
}

export { recurringAppliesToMonth } from '../utils/recurringExpense';

export function getCategoryTotals(expenses: AppState['expenses'], yearMonth: string) {
  const monthExp = getMonthExpenses(expenses, yearMonth);
  const totals: Record<string, number> = {};
  for (const e of monthExp) {
    const amount = getMonthlyAmount(e);
    totals[e.categoryId] = (totals[e.categoryId] ?? 0) + amount;
  }
  return totals;
}
