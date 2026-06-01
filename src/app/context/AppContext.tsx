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
import {
  mergeNotificationPreferences,
  normalizeAppState,
} from '../data/notificationPreferences';
import {
  buildBudgetGoalsForMonthlyBudget,
  DEFAULT_CATEGORY_BUDGET_WEIGHTS,
  getDefaultCategoryIds,
  sumBudgetGoals,
} from '../utils/budgetAllocation';
import { INITIAL_APP_STATE } from '../data/sampleData';
import { getItem, setItem } from '../utils/storage';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { AuthState, OnboardingState } from './OnboardingContext';
import {
  fetchAppState,
  syncActionToSupabase,
  createEmptyAppState,
  buildErasedAppState,
  eraseAllAppDataOnServer,
} from '../services/appDataService';
import { migrateLocalStorageIfNeeded } from '../services/migrateLocalStorage';
import { isShowcaseUser } from '../services/showcaseTestUser';
import { AppearanceProviderInner } from './AppearanceContext';
import {
  completeOnboardingOnServer,
  mergeOnboardingIntoAppState,
} from '../services/completeOnboarding';
import { parseReceiptFiles, parseReceiptImage } from '../services/receiptParseService';
import type { ExpenseFormDraft } from '../types/expenseDraft';
import { generateId } from '../utils/id';
import {
  buildFocusCategory,
  createFocusGoalAdjustmentExpense,
  focusCategoryId,
  focusGoalIdFromCategoryId,
  getActiveFocusCategoryId,
  isFocusCategoryId,
  isSpendingExpense,
  sumFocusCategoryContributions,
  syncPrimaryGoalTargetFromExpenses,
  type FocusGoalId,
} from '../data/focusCategory';
import { parsePrimaryGoal } from '../data/primaryGoalConfig';
import { goalRequiresTargetSetup } from '../data/primaryGoalTarget';
import {
  buildCanonicalRecurringMap,
  recurringAppliesToMonth,
  applyRecurringSeriesUpdate,
} from '../utils/recurringExpense';

function withSyncedFocusContributions(state: AppState): AppState {
  return syncPrimaryGoalTargetFromExpenses(state);
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE_STATE':
      return syncPrimaryGoalTargetFromExpenses(normalizeAppState(action.state));
    case 'RESET_STATE':
      return createEmptyAppState();
    case 'ADD_EXPENSE':
      return withSyncedFocusContributions({
        ...state,
        expenses: [action.expense, ...state.expenses],
      });
    case 'ADD_EXPENSES':
      return withSyncedFocusContributions({
        ...state,
        expenses: [...action.expenses, ...state.expenses],
      });
    case 'UPDATE_EXPENSE':
      return withSyncedFocusContributions({
        ...state,
        expenses: applyRecurringSeriesUpdate(state.expenses, action.expense),
      });
    case 'DELETE_EXPENSE':
      return withSyncedFocusContributions({
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.id),
      });
    case 'DELETE_EXPENSES':
      return withSyncedFocusContributions({
        ...state,
        expenses: state.expenses.filter(e => !action.ids.includes(e.id)),
      });
    case 'SET_INCOME':
      return { ...state, income: action.amount };
    case 'SET_BUDGET': {
      const monthlyBudget = action.amount;
      const categoryIds = (action.categoryIds ?? getDefaultCategoryIds()).filter(
        id => !isFocusCategoryId(id),
      );
      const budgetGoals =
        monthlyBudget > 0
          ? buildBudgetGoalsForMonthlyBudget(
              monthlyBudget,
              categoryIds,
              DEFAULT_CATEGORY_BUDGET_WEIGHTS,
              state.budgetGoals,
            )
          : state.budgetGoals;
      return { ...state, monthlyBudget, budgetGoals };
    }
    case 'SET_CATEGORY_BUDGET': {
      if (isFocusCategoryId(action.categoryId)) return state;
      const budgetGoals =
        action.amount <= 0
          ? state.budgetGoals.filter(g => g.categoryId !== action.categoryId)
          : state.budgetGoals.some(g => g.categoryId === action.categoryId)
            ? state.budgetGoals.map(g =>
                g.categoryId === action.categoryId ? { ...g, amount: action.amount } : g,
              )
            : [
                ...state.budgetGoals,
                { categoryId: action.categoryId, amount: action.amount },
              ];
      return {
        ...state,
        budgetGoals,
        monthlyBudget: sumBudgetGoals(budgetGoals),
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
    case 'SET_NOTIFICATION_PREFERENCES':
      return {
        ...state,
        notificationPreferences: mergeNotificationPreferences(action.preferences),
      };
    case 'SET_APPEARANCE':
      return { ...state, appearance: action.mode };
    case 'SET_DISABLED_CATEGORY_IDS':
      return { ...state, disabledCategoryIds: action.categoryIds };
    case 'SET_PRIMARY_GOAL': {
      const nextState: AppState = {
        ...state,
        primaryGoal: action.goal,
        primaryGoalTarget:
          action.target !== undefined ? action.target : state.primaryGoalTarget,
      };
      return withSyncedFocusContributions(nextState);
    }
    case 'SET_FOCUS_GOAL_PROGRESS': {
      const goalId = parsePrimaryGoal(state.primaryGoal ?? undefined);
      if (!goalRequiresTargetSetup(goalId) || !state.primaryGoalTarget) return state;
      const focusId = focusCategoryId(goalId);
      if (!focusId) return state;
      const current = sumFocusCategoryContributions(state.expenses, focusId);
      const delta = action.totalAmount - current;
      if (delta === 0) return withSyncedFocusContributions(state);
      const adjustment = createFocusGoalAdjustmentExpense(
        focusId,
        goalId as FocusGoalId,
        delta,
      );
      if (!adjustment) return withSyncedFocusContributions(state);
      return withSyncedFocusContributions({
        ...state,
        expenses: [adjustment, ...state.expenses],
      });
    }
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
  /** Built-in + custom categories for the budget grid (no focus category). */
  budgetCategories: ResolvedCategory[];
  /** Categories in the add-expense picker (active focus category last when applicable). */
  expensePickerCategories: ResolvedCategory[];
  getCategory: (id: string) => ResolvedCategory;
  getFocusContributions: () => number;
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
  eraseAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({
  children,
  auth,
  onboarding,
}: {
  children: React.ReactNode;
  auth: AuthState;
  onboarding: OnboardingState;
}) {
  const userId = auth.userId;
  const useCloud =
    isSupabaseConfigured &&
    auth.isAuthenticated &&
    Boolean(userId) &&
    !isShowcaseUser(userId);

  const [state, baseDispatch] = useReducer(reducer, undefined, () => {
    if (!isSupabaseConfigured) {
      const saved = getItem<AppState>('appState');
      return saved ? normalizeAppState(saved) : createEmptyAppState();
    }
    return createEmptyAppState();
  });

  const [isDataLoading, setIsDataLoading] = useState(useCloud);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [addModalDraft, setAddModalDraft] = useState<ExpenseFormDraft | null>(null);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [parseStatusMessage, setParseStatusMessage] = useState('Analyzing receipt…');
  const stateRef = useRef(state);
  stateRef.current = state;
  const onboardingRef = useRef(onboarding);
  onboardingRef.current = onboarding;

  // Offline fallback: persist to localStorage when Supabase is not configured
  useEffect(() => {
    if (!useCloud) {
      setItem('appState', state);
    }
  }, [state, useCloud]);

  // Offline: reload per-user app state when account changes
  useEffect(() => {
    if (useCloud) return;
    if (!auth.isAuthenticated) {
      baseDispatch({ type: 'RESET_STATE' });
      return;
    }
    const saved = getItem<AppState>('appState');
    baseDispatch({
      type: 'HYDRATE_STATE',
      state: saved ?? createEmptyAppState({ userEmail: auth.email ?? '' }),
    });
  }, [useCloud, auth.userId, auth.isAuthenticated, auth.email]);

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
    if (!auth.isAuthenticated) {
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
    const onboardingSnapshot = onboardingRef.current;
    if (useCloud && userId) {
      const merged = await completeOnboardingOnServer(
        userId,
        onboardingSnapshot,
        stateRef.current,
      );
      baseDispatch({ type: 'HYDRATE_STATE', state: merged });
      return;
    }

    const merged = mergeOnboardingIntoAppState(stateRef.current, onboardingSnapshot.data);
    baseDispatch({ type: 'HYDRATE_STATE', state: merged });
  }, [useCloud, userId]);

  const eraseAllData = useCallback(async () => {
    const current = stateRef.current;
    const wiped =
      useCloud && userId
        ? await eraseAllAppDataOnServer(userId, current)
        : buildErasedAppState(current);

    baseDispatch({ type: 'HYDRATE_STATE', state: wiped });
    if (!useCloud) {
      setItem('appState', wiped);
    }
  }, [useCloud, userId]);

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
    () =>
      resolveCategories(
        state.categoryCustomizations,
        state.customCategories,
        state.disabledCategoryIds,
      ),
    [state.categoryCustomizations, state.customCategories, state.disabledCategoryIds],
  );

  const activeFocusCategoryId = useMemo(
    () => getActiveFocusCategoryId(parsePrimaryGoal(state.primaryGoal ?? undefined)),
    [state.primaryGoal],
  );

  const budgetCategories = useMemo(
    () => categories.filter(c => !isFocusCategoryId(c.id)),
    [categories],
  );

  const expensePickerCategories = useMemo(() => {
    if (!activeFocusCategoryId) return categories;
    const focus = buildFocusCategory(
      parsePrimaryGoal(state.primaryGoal ?? undefined) as 'save' | 'debt' | 'emergency',
    );
    return [...categories, focus];
  }, [activeFocusCategoryId, categories, state.primaryGoal]);

  const getCategory = useCallback(
    (id: string) => {
      const focusGoal = focusGoalIdFromCategoryId(id);
      if (focusGoal) return buildFocusCategory(focusGoal);

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

  const getFocusContributions = useCallback(() => {
    const id = activeFocusCategoryId;
    if (!id) return 0;
    return sumFocusCategoryContributions(state.expenses, id);
  }, [activeFocusCategoryId, state.expenses]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        categories,
        budgetCategories,
        expensePickerCategories,
        getCategory,
        getFocusContributions,
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
        eraseAllData,
      }}
    >
      <AppearanceProviderInner state={state} dispatch={dispatch}>
        {children}
      </AppearanceProviderInner>
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
    if (!isSpendingExpense(e)) continue;
    const amount = getMonthlyAmount(e);
    totals[e.categoryId] = (totals[e.categoryId] ?? 0) + amount;
  }
  return totals;
}

/** Month spend total — excludes goal/debt/emergency progress entries. */
export function getMonthSpendingTotal(expenses: AppState['expenses'], yearMonth: string) {
  return getMonthExpenses(expenses, yearMonth)
    .filter(isSpendingExpense)
    .reduce((sum, e) => sum + getMonthlyAmount(e), 0);
}
