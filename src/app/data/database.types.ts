import type { OnboardingData, OnboardingStatus } from '../context/OnboardingContext';
import type { ExpenseType } from './types';

export interface DbProfile {
  id: string;
  email: string | null;
  full_name: string;
  display_name: string;
  username: string | null;
  phone: string | null;
  avatar_url: string | null;
  currency: string;
  country: string | null;
  primary_goal: string | null;
  income: number;
  monthly_budget: number;
  income_frequency: string | null;
  member_since: string;
  plan: string;
  onboarding_completed_at: string | null;
  has_migrated: boolean;
}

export interface DbUserPreferences {
  user_id: string;
  budget_alerts: boolean;
  weekly_summary: boolean;
  bill_reminders: boolean;
  goal_milestones: boolean;
  recurring_reminders: boolean;
}

export interface DbOnboardingProgress {
  user_id: string;
  status: OnboardingStatus;
  last_step_id: string | null;
  completed_steps: string[];
  data: Partial<OnboardingData>;
  completed_at: string | null;
  version: number;
}

export interface DbExpense {
  id: string;
  user_id: string;
  name: string;
  category_id: string;
  amount: number;
  date: string;
  type: ExpenseType;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface DbBudgetGoal {
  user_id: string;
  category_id: string;
  amount: number;
}

export interface DbCategoryCustomization {
  user_id: string;
  category_id: string;
  name: string | null;
  icon_key: string | null;
  color: string | null;
  bg: string | null;
  icon_color: string | null;
}

export interface DbCustomCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  bg: string;
  icon_key: string;
  icon_color: string | null;
}
