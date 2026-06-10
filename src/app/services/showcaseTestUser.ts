import type { OnboardingState } from '../context/OnboardingContext';
import { CATEGORIES } from '../data/categories';
import {
  SAVINGS_GOAL_TEMPLATES,
  savingsGoalFromTemplate,
} from '../data/savingsGoals';
import {
  INITIAL_APP_STATE,
  shiftSampleExpensesToPresent,
} from '../data/sampleData';
import type { AppState } from '../data/types';
import { ONBOARDING_STEPS } from '../theme/onboardingSteps';
import { mergeOnboardingIntoAppState } from './completeOnboarding';

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

function buildShowcaseSavingsGoals() {
  const [ps5, bahamas, motorcycle] = SAVINGS_GOAL_TEMPLATES;
  return [
    { ...savingsGoalFromTemplate(ps5), currentAmount: 180 },
    { ...savingsGoalFromTemplate(bahamas), currentAmount: 920 },
    { ...savingsGoalFromTemplate(motorcycle), currentAmount: 2400 },
  ];
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
      savingsGoals: buildShowcaseSavingsGoals(),
      monthlyAmount: { value: 3200, type: 'income' },
      incomeFrequency: 'monthly',
      monthlyBudget: SHOWCASE_MONTHLY_BUDGET,
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

  return {
    ...merged,
    savingsGoals: buildShowcaseSavingsGoals(),
  };
}
