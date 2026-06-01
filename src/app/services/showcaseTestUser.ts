import type { OnboardingState } from '../context/OnboardingContext';
import { CATEGORIES } from '../data/categories';
import { focusCategoryId } from '../data/focusCategory';
import { GOAL_ONBOARDING_ALLOCATION_WEIGHTS } from '../data/primaryGoalConfig';
import {
  INITIAL_APP_STATE,
  shiftSampleExpensesToPresent,
} from '../data/sampleData';
import type { AppState, Expense } from '../data/types';
import { CURRENT_MONTH_KEY } from '../utils/periods';
import { buildAllocationsFromWeights } from '../utils/budgetAllocation';
import { ONBOARDING_STEPS } from '../theme/onboardingSteps';
import { mergeOnboardingIntoAppState } from './completeOnboarding';
import { syncPrimaryGoalTargetFromExpenses } from '../data/focusCategory';

/** Stable id — never synced to Supabase (local showcase session only). */
export const SHOWCASE_USER_ID = 'spendr_showcase_test_user';

export const SHOWCASE_USER_EMAIL = 'test@email.com';

export const SHOWCASE_PROFILE = {
  userName: 'Test user',
  userFullName: 'Test user',
  userEmail: SHOWCASE_USER_EMAIL,
  userPhone: 'test phone',
} as const;

const SHOWCASE_MONTHLY_BUDGET = 2800;

function showcaseGoalTargetDateEnd(): string {
  const year = Number(CURRENT_MONTH_KEY.slice(0, 4));
  return `${year}-12-31`;
}

function buildShowcaseGoalTarget() {
  return {
    name: 'Test savings goal',
    targetAmount: 5000,
    targetDate: showcaseGoalTargetDateEnd(),
    currentAmount: 840,
  };
}

const ONBOARDING_BUDGET_BUCKETS = [
  { id: 'housing', suggested: 28 },
  { id: 'food', suggested: 12 },
  { id: 'transportation', suggested: 10 },
  { id: 'utilities', suggested: 10 },
  { id: 'shopping', suggested: 8 },
  { id: 'entertainment', suggested: 5 },
  { id: 'savings', suggested: 27 },
] as const;

function buildShowcaseBudgetAllocations(): Record<string, number> {
  const weights = GOAL_ONBOARDING_ALLOCATION_WEIGHTS.save;
  const categories = ONBOARDING_BUDGET_BUCKETS.map((cat) => ({
    id: cat.id,
    suggested: weights[cat.id] ?? cat.suggested,
  }));
  return buildAllocationsFromWeights(SHOWCASE_MONTHLY_BUDGET, categories);
}

function createShowcaseFocusExpense(): Expense {
  return {
    id: 'showcase-focus-save',
    name: 'Saved toward goal',
    categoryId: focusCategoryId('save')!,
    amount: buildShowcaseGoalTarget().currentAmount,
    date: `${CURRENT_MONTH_KEY}-10`,
    type: 'one-time',
  };
}

export function isShowcaseUser(userId: string | null | undefined): boolean {
  return userId === SHOWCASE_USER_ID;
}

export function createShowcaseOnboarding(): OnboardingState {
  return {
    status: 'completed',
    completedSteps: ONBOARDING_STEPS.map((s) => s.id),
    lastStepId: null,
    completedAt: new Date().toISOString(),
    version: 1,
    data: {
      firstName: SHOWCASE_PROFILE.userName,
      currency: 'EUR',
      country: 'Germany',
      primaryGoal: 'save',
      primaryGoalTarget: buildShowcaseGoalTarget(),
      monthlyAmount: { value: 3200, type: 'income' },
      incomeFrequency: 'monthly',
      monthlyBudget: SHOWCASE_MONTHLY_BUDGET,
      budgetAllocationMode: 'automatic',
      budgetAllocations: buildShowcaseBudgetAllocations(),
      selectedCategoryIds: CATEGORIES.map((c) => c.id),
      notifications: {
        budgetAlerts: true,
        weeklySummary: true,
        billReminders: true,
        goalMilestones: true,
      },
    },
  };
}

export function createShowcaseAppState(): AppState {
  const onboarding = createShowcaseOnboarding();
  const shiftedExpenses = shiftSampleExpensesToPresent(INITIAL_APP_STATE.expenses);

  const merged = mergeOnboardingIntoAppState(
    {
      ...INITIAL_APP_STATE,
      ...SHOWCASE_PROFILE,
      expenses: shiftedExpenses,
    },
    onboarding.data,
  );

  return syncPrimaryGoalTargetFromExpenses({
    ...merged,
    primaryGoal: 'save',
    primaryGoalTarget: buildShowcaseGoalTarget(),
    expenses: [...merged.expenses, createShowcaseFocusExpense()],
  });
}
