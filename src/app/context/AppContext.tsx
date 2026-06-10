import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useLayoutEffect,
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
  replaceAppStateOnServer,
} from '../services/appDataService';
import {
  applyImport,
  type ImportMode,
  type SpendrDataExport,
} from '../services/dataExportImport';
import { migrateLocalStorageIfNeeded } from '../services/migrateLocalStorage';
import { isShowcaseUser } from '../services/showcaseTestUser';
import {
  isShowcaseSessionActive,
  loadShowcaseAppState,
  loadShowcaseAuth,
  saveShowcaseAppState,
  showcaseHasDemoData,
} from '../services/showcaseSession';
import { createShowcaseAppState } from '../services/showcaseTestUser';
import { AppearanceProviderInner } from './AppearanceContext';
import {
  completeOnboardingOnServer,
  mergeOnboardingIntoAppState,
} from '../services/completeOnboarding';
import {
  parseReceiptFiles,
  parseReceiptImage,
  type ReceiptParseContext,
} from '../services/receiptParseService';
import type { ExpenseFormDraft, ReceiptScanResult } from '../types/expenseDraft';
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
    case 'SET_BUDGET':
      return { ...state, monthlyBudget: action.amount, budgetGoals: [] };
    case 'SET_CATEGORY_BUDGET':
      return state;
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
    case 'ADD_SAVINGS_GOAL':
      return { ...state, savingsGoals: [...state.savingsGoals, action.goal] };
    case 'UPDATE_SAVINGS_GOAL':
      return {
        ...state,
        savingsGoals: state.savingsGoals.map(g =>
          g.id === action.goal.id ? action.goal : g,
        ),
      };
    case 'DELETE_SAVINGS_GOAL':
      return {
        ...state,
        savingsGoals: state.savingsGoals.filter(g => g.id !== action.id),
      };
    case 'SET_FOCUS_GOAL_PROGRESS': {
      const goalId = action.goalType;
      if (!goalRequiresTargetSetup(goalId)) return state;
      if (!state.primaryGoalTarget) return state;
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
  getFocusContributions: (goalType?: import('../data/types').PrimaryGoalId) => number;
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
  receiptScanToast: { id: string; title: string; message: string } | null;
  clearReceiptScanToast: () => void;
  completeOnboardingAndSync: () => Promise<void>;
  eraseAllData: () => Promise<void>;
  importAppData: (payload: SpendrDataExport, mode: ImportMode) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function resolveInitialAppState(bootstrapAppState?: AppState | null): AppState {
  if (bootstrapAppState && showcaseHasDemoData(bootstrapAppState)) {
    return normalizeAppState(bootstrapAppState);
  }

  if (!isSupabaseConfigured) {
    const saved = getItem<AppState>('appState');
    if (showcaseHasDemoData(saved)) return normalizeAppState(saved!);
    return createEmptyAppState();
  }

  if (loadShowcaseAuth() || isShowcaseSessionActive()) {
    const showcase = loadShowcaseAppState();
    if (showcaseHasDemoData(showcase)) return showcase!;
    return createShowcaseAppState();
  }

  return createEmptyAppState();
}

export function AppProvider({
  children,
  auth,
  onboarding,
  bootstrapAppState = null,
}: {
  children: React.ReactNode;
  auth: AuthState;
  onboarding: OnboardingState;
  /** Injected on Test user sign-in so the first paint has demo data (avoids storage races). */
  bootstrapAppState?: AppState | null;
}) {
  const userId = auth.userId;
  const useCloud =
    isSupabaseConfigured &&
    auth.isAuthenticated &&
    Boolean(userId) &&
    !isShowcaseUser(userId);

  const [state, baseDispatch] = useReducer(reducer, undefined, () =>
    resolveInitialAppState(bootstrapAppState),
  );

  const [isDataLoading, setIsDataLoading] = useState(useCloud);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [addModalDraft, setAddModalDraft] = useState<ExpenseFormDraft | null>(null);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [parseStatusMessage, setParseStatusMessage] = useState('Reading receipt…');
  const [receiptScanToast, setReceiptScanToast] = useState<{
    id: string;
    title: string;
    message: string;
  } | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const authRef = useRef(auth);
  authRef.current = auth;
  const onboardingRef = useRef(onboarding);
  onboardingRef.current = onboarding;
  /** Avoid re-hydrating from storage and clobbering in-memory edits during the session. */
  const hydratedUserIdRef = useRef<string | null>(null);

  const shouldPersistShowcase = useCallback(() => {
    if (useCloud) return false;
    const uid = authRef.current.userId;
    return isShowcaseUser(uid) || isShowcaseSessionActive();
  }, [useCloud]);

  // Keep ref aligned when state is updated outside dispatch (hydrate effects, etc.)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Offline persistence (non-showcase — showcase saves synchronously in dispatch)
  useEffect(() => {
    if (useCloud || shouldPersistShowcase()) return;
    if (!isSupabaseConfigured) {
      setItem('appState', state);
    }
  }, [state, useCloud, shouldPersistShowcase]);

  // Showcase: backup persist on every state change (covers any dispatch path)
  useEffect(() => {
    if (!shouldPersistShowcase()) return;
    saveShowcaseAppState(state);
  }, [state, shouldPersistShowcase]);

  // Hydrate once per signed-in user (not on every render)
  useLayoutEffect(() => {
    if (useCloud) return;
    if (!auth.isAuthenticated) {
      hydratedUserIdRef.current = null;
      if (isShowcaseSessionActive() || loadShowcaseAuth()) return;
      baseDispatch({ type: 'RESET_STATE' });
      return;
    }
    const uid = auth.userId ?? '';
    if (hydratedUserIdRef.current === uid) return;
    hydratedUserIdRef.current = uid;

    if (bootstrapAppState && showcaseHasDemoData(bootstrapAppState)) {
      const next = normalizeAppState(bootstrapAppState);
      stateRef.current = next;
      baseDispatch({ type: 'HYDRATE_STATE', state: next });
      if (isShowcaseUser(uid)) saveShowcaseAppState(next);
      return;
    }

    const saved = isShowcaseUser(uid)
      ? loadShowcaseAppState()
      : getItem<AppState>('appState');
    const fallback = isShowcaseUser(uid)
      ? createShowcaseAppState()
      : createEmptyAppState({ userEmail: auth.email ?? '' });
    const next = showcaseHasDemoData(saved) ? saved! : fallback;
    stateRef.current = next;
    baseDispatch({ type: 'HYDRATE_STATE', state: next });
    if (isShowcaseUser(uid) || isShowcaseSessionActive()) {
      saveShowcaseAppState(next);
    }
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
        const local = getItem<AppState>('appState');
        if (!cancelled && local?.expenses?.length) {
          baseDispatch({ type: 'HYDRATE_STATE', state: local });
        }
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [useCloud, userId]);

  // Reset when logged out (skip while showcase session is restoring)
  useEffect(() => {
    if (auth.isAuthenticated) return;
    if (isShowcaseSessionActive() || loadShowcaseAuth()) return;
    baseDispatch({ type: 'RESET_STATE' });
  }, [auth.isAuthenticated]);

  const dispatch = useCallback(
    (action: Action) => {
      if (action.type === 'HYDRATE_STATE') {
        const next = normalizeAppState(action.state);
        stateRef.current = next;
        baseDispatch({ type: 'HYDRATE_STATE', state: next });
        if (shouldPersistShowcase()) saveShowcaseAppState(next);
        return;
      }

      if (action.type === 'RESET_STATE') {
        const empty = createEmptyAppState();
        stateRef.current = empty;
        baseDispatch(action);
        return;
      }

      const nextState = reducer(stateRef.current, action);
      stateRef.current = nextState;
      // Apply computed state directly — baseDispatch(action) would re-run the reducer on
      // stale React state and can drop updates (e.g. ADD_EXPENSE after hydrate).
      baseDispatch({ type: 'HYDRATE_STATE', state: nextState });

      if (shouldPersistShowcase()) {
        saveShowcaseAppState(nextState);
        return;
      }

      const uid = authRef.current.userId;
      if (!useCloud || !uid) return;

      syncActionToSupabase(uid, action, nextState).catch(err => {
        console.error('Sync failed:', err);
      });
    },
    [useCloud, shouldPersistShowcase],
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
        : isShowcaseUser(userId)
          ? createShowcaseAppState()
          : buildErasedAppState(current);

    baseDispatch({ type: 'HYDRATE_STATE', state: wiped });
    if (!useCloud) {
      if (isShowcaseUser(userId)) {
        saveShowcaseAppState(wiped);
      } else if (!isSupabaseConfigured) {
        setItem('appState', wiped);
      }
    }
  }, [useCloud, userId]);

  const importAppData = useCallback(
    async (payload: SpendrDataExport, mode: ImportMode) => {
      const current = stateRef.current;
      const next = normalizeAppState(applyImport(current, payload, mode));
      stateRef.current = next;

      if (useCloud && userId) {
        await replaceAppStateOnServer(userId, next);
      }

      baseDispatch({ type: 'HYDRATE_STATE', state: next });

      if (shouldPersistShowcase()) {
        saveShowcaseAppState(next);
      } else if (!useCloud && !isSupabaseConfigured) {
        setItem('appState', next);
      }
    },
    [useCloud, userId, shouldPersistShowcase],
  );

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

  const buildReceiptParseContext = useCallback((): ReceiptParseContext => {
    const current = stateRef.current;
    const resolved = resolveCategories(
      current.categoryCustomizations,
      current.customCategories,
      current.disabledCategoryIds,
    );
    const focusGoal = parsePrimaryGoal(current.primaryGoal ?? undefined);
    const activeFocusCategoryId = getActiveFocusCategoryId(focusGoal);
    const picker =
      activeFocusCategoryId && (focusGoal === 'save' || focusGoal === 'debt' || focusGoal === 'emergency')
        ? [...resolved, buildFocusCategory(focusGoal)]
        : resolved;

    return {
      expenses: current.expenses,
      allowedCategoryIds: picker.map(c => c.id),
      catalogNames: picker.map(c => ({ id: c.id, name: c.name })),
    };
  }, []);

  const clearReceiptScanToast = useCallback(() => {
    setReceiptScanToast(null);
  }, []);

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

  const getFocusContributions = useCallback(
    (goalType?: import('../data/types').PrimaryGoalId) => {
      const resolved =
        goalType ?? parsePrimaryGoal(state.primaryGoal ?? undefined);
      const id = focusCategoryId(resolved);
      if (!id) return 0;
      return sumFocusCategoryContributions(state.expenses, id);
    },
    [state.expenses, state.primaryGoal],
  );

  const formatCurrencyFromState = useCallback((amount: number) => {
    const currency = stateRef.current.currency;
    if (currency === 'EUR') return `€${amount.toFixed(2)}`;
    if (currency === 'USD') return `$${amount.toFixed(2)}`;
    if (currency === 'GBP') return `£${amount.toFixed(2)}`;
    return `${currency}${amount.toFixed(2)}`;
  }, []);

  const openDraftFromScan = useCallback((item: ReceiptScanResult['item']) => {
    setEditingExpense(null);
    setAddModalDraft({
      name: item.name,
      amount: item.amount > 0 ? String(item.amount) : '',
      categoryId: item.categoryId,
      date: item.date,
      type: item.type,
      notes: item.notes,
      startDate: item.date,
    });
    setShowAddModal(true);
  }, []);

  const applyReceiptScanResults = useCallback(
    (results: ReceiptScanResult[]) => {
      const autoSaved: ReceiptScanResult[] = [];
      const needsReview: ReceiptScanResult[] = [];

      for (const result of results) {
        if (result.autoSave && result.item.amount > 0) {
          autoSaved.push(result);
        } else {
          needsReview.push(result);
        }
      }

      if (autoSaved.length > 0) {
        const expenses: Expense[] = autoSaved.map(result => ({
          id: generateId(),
          name: result.item.name,
          amount: result.item.amount,
          categoryId: result.item.categoryId,
          date: result.item.date,
          type: result.item.type,
          notes: result.item.notes,
          startDate: result.item.type !== 'one-time' ? result.item.date : undefined,
        }));
        dispatch({ type: 'ADD_EXPENSES', expenses });

        const labels = autoSaved.map(
          r => `${formatCurrencyFromState(r.item.amount)} · ${r.item.name}`,
        );
        setReceiptScanToast({
          id: `receipt-scan-${Date.now()}`,
          title: autoSaved.length === 1 ? 'Expense added' : `${autoSaved.length} expenses added`,
          message:
            autoSaved.length === 1
              ? labels[0]
              : `${labels.slice(0, 2).join(' · ')}${labels.length > 2 ? '…' : ''}`,
        });
      }

      if (needsReview.length > 0) {
        openDraftFromScan(needsReview[0].item);
      }
    },
    [dispatch, formatCurrencyFromState, openDraftFromScan],
  );

  const dismissParseOverlayAfterError = useCallback((message: string) => {
    setParseStatusMessage(message);
    window.setTimeout(() => setIsParsingReceipt(false), 2200);
  }, []);

  const scanReceiptFromCamera = useCallback(
    async (file: File) => {
      setIsParsingReceipt(true);
      setParseStatusMessage('Reading receipt…');
      try {
        const result = await parseReceiptImage(file, buildReceiptParseContext());
        applyReceiptScanResults([result]);
        setIsParsingReceipt(false);
      } catch (err) {
        console.error('[receipt scan]', err);
        dismissParseOverlayAfterError(err instanceof Error ? err.message : 'Scan failed');
      }
    },
    [applyReceiptScanResults, buildReceiptParseContext, dismissParseOverlayAfterError],
  );

  const uploadReceiptDocuments = useCallback(
    async (files: File[]) => {
      setIsParsingReceipt(true);
      setParseStatusMessage(
        files.length > 1 ? `Reading ${files.length} documents…` : 'Reading document…',
      );
      try {
        const results = await parseReceiptFiles(files, buildReceiptParseContext());
        applyReceiptScanResults(results);
        setIsParsingReceipt(false);
      } catch (err) {
        console.error('[receipt upload]', err);
        dismissParseOverlayAfterError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [applyReceiptScanResults, buildReceiptParseContext, dismissParseOverlayAfterError],
  );

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
        receiptScanToast,
        clearReceiptScanToast,
        completeOnboardingAndSync,
        eraseAllData,
        importAppData,
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
