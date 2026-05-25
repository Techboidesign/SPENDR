export type ExpenseType = 'one-time' | 'monthly' | 'yearly';

export interface Expense {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: ExpenseType;
  notes?: string;
  startDate?: string;
  endDate?: string;
}

export interface BudgetGoal {
  categoryId: string;
  amount: number;
}

export interface CategoryCustomization {
  name?: string;
  iconKey?: string;
  color?: string;
  bg?: string;
  iconColor?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  bg: string;
  iconColor?: string;
  iconKey: string;
}

/** User-facing light/dark for the main app shell. */
export type AppearanceMode = 'light' | 'dark';

/** In-app banner alert toggles (onboarding + Settings). */
export interface NotificationPreferences {
  budgetAlerts: boolean;
  weeklySummary: boolean;
  billReminders: boolean;
  goalMilestones: boolean;
  /** Recurring / bill-style reminders (Settings label). */
  recurringReminders: boolean;
}

export interface AppState {
  expenses: Expense[];
  income: number;
  monthlyBudget: number;
  budgetGoals: BudgetGoal[];
  currency: string;
  userName: string;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  userAvatar: string; // base64 data URL or empty string
  categoryCustomizations: Record<string, CategoryCustomization>;
  customCategories: CustomCategory[];
  notificationPreferences: NotificationPreferences;
  appearance: AppearanceMode;
}

export type Action =
  | { type: 'HYDRATE_STATE'; state: AppState }
  | { type: 'RESET_STATE' }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'ADD_EXPENSES'; expenses: Expense[] }
  | { type: 'UPDATE_EXPENSE'; expense: Expense }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'DELETE_EXPENSES'; ids: string[] }
  | { type: 'SET_INCOME'; amount: number }
  | { type: 'SET_BUDGET'; amount: number; categoryIds?: string[] }
  | { type: 'SET_CATEGORY_BUDGET'; categoryId: string; amount: number }
  | { type: 'SET_CURRENCY'; currency: string }
  | { type: 'SET_USER_NAME'; name: string }
  | { type: 'SET_USER_FULL_NAME'; fullName: string }
  | { type: 'SET_USER_EMAIL'; email: string }
  | { type: 'SET_USER_PHONE'; phone: string }
  | { type: 'SET_USER_AVATAR'; avatar: string }
  | { type: 'SET_CATEGORY_CUSTOMIZATION'; categoryId: string; customization: CategoryCustomization }
  | { type: 'ADD_CUSTOM_CATEGORY'; category: CustomCategory }
  | { type: 'UPDATE_CUSTOM_CATEGORY'; category: CustomCategory }
  | { type: 'SET_NOTIFICATION_PREFERENCES'; preferences: NotificationPreferences }
  | { type: 'SET_APPEARANCE'; mode: AppearanceMode };