import React, { createContext, useContext, useReducer, useState, useEffect, useMemo, useCallback } from 'react';
import { AppState, Action, Expense, CategoryCustomization } from '../data/types';
import { resolveCategories, resolveCategory } from '../data/categoryConfig';
import { getCategoryById as getDefaultCategoryById, type Category } from '../data/categories';
import type { CategoryIconKey } from '../data/categoryConfig';
import { INITIAL_APP_STATE, INITIAL_EXPENSES } from '../data/sampleData';
import { getItem, setItem } from '../utils/storage';
import { CURRENT_MONTH_KEY } from '../utils/periods';

function hydrateState(saved: AppState | null): AppState {
  if (!saved) return INITIAL_APP_STATE;

  const withCategories: AppState = {
    ...saved,
    categoryCustomizations: saved.categoryCustomizations ?? {},
    customCategories: saved.customCategories ?? [],
  };

  const hasCurrentMonth = withCategories.expenses.some(e => e.date.startsWith(CURRENT_MONTH_KEY));
  if (hasCurrentMonth) return withCategories;

  const seedMonth = INITIAL_EXPENSES.filter(e => e.date.startsWith(CURRENT_MONTH_KEY));
  if (seedMonth.length === 0) return withCategories;

  return { ...withCategories, expenses: [...seedMonth, ...withCategories.expenses] };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.expense.id ? action.expense : e),
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
            g.categoryId === action.categoryId ? { ...g, amount: action.amount } : g
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
  openAddModal: (expense?: Expense) => void;
  closeAddModal: () => void;
  formatCurrency: (amount: number) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Load initial state from localStorage or use default
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = getItem<AppState>('appState');
    return hydrateState(saved);
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    setItem('appState', state);
  }, [state]);

  const openAddModal = (expense?: Expense) => {
    setEditingExpense(expense ?? null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingExpense(null);
  };

  const formatCurrency = (amount: number) => {
    const symbol = state.currency === 'EUR' ? '€' : state.currency === 'USD' ? '$' : state.currency === 'GBP' ? '£' : state.currency;
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
      return resolveCategory(
        getDefaultCategoryById(id),
        state.categoryCustomizations[id],
      );
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
        openAddModal,
        closeAddModal,
        formatCurrency,
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

// Helper: check if a recurring expense applies to a given month
function recurringAppliesToMonth(expense: Expense, targetYearMonth: string): boolean {
  if (expense.type === 'one-time') {
    return expense.date.startsWith(targetYearMonth);
  }

  const expenseDate = new Date(expense.date + 'T00:00:00');
  const [targetYear, targetMonth] = targetYearMonth.split('-').map(Number);
  const targetDate = new Date(targetYear, targetMonth - 1, 1);

  // Check if expense started on or before the target month
  if (expenseDate > targetDate) {
    return false;
  }

  if (expense.type === 'monthly' || expense.type === 'yearly') {
    // Both monthly and yearly expenses apply to all months from start date onwards
    return true;
  }

  return false;
}

// Helper: get the monthly equivalent amount for an expense
export function getMonthlyAmount(expense: Expense): number {
  if (expense.type === 'yearly') {
    return expense.amount / 12;
  }
  return expense.amount;
}

// Helper: get all expenses that apply to a given month (YYYY-MM), including recurring
export function getMonthExpenses(expenses: AppState['expenses'], yearMonth: string) {
  const applicable: Expense[] = [];
  const recurringKeys = new Set<string>();

  for (const expense of expenses) {
    if (expense.type === 'one-time') {
      // One-time expenses: include only if in exact month
      if (expense.date.startsWith(yearMonth)) {
        applicable.push(expense);
      }
    } else {
      // Recurring expenses: deduplicate by name+category+type
      // Only include the FIRST occurrence (earliest date) that applies to this month
      const key = `${expense.name}|${expense.categoryId}|${expense.type}`;

      if (!recurringKeys.has(key) && recurringAppliesToMonth(expense, yearMonth)) {
        recurringKeys.add(key);
        applicable.push(expense);
      }
    }
  }

  return applicable;
}

// Helper: sum of expenses by category for a month (includes recurring, with yearly prorated)
export function getCategoryTotals(expenses: AppState['expenses'], yearMonth: string) {
  const monthExp = getMonthExpenses(expenses, yearMonth);
  const totals: Record<string, number> = {};
  for (const e of monthExp) {
    const amount = getMonthlyAmount(e);
    totals[e.categoryId] = (totals[e.categoryId] ?? 0) + amount;
  }
  return totals;
}