import type { OnboardingData } from '../context/OnboardingContext';
import type { AppState, BudgetGoal } from '../data/types';
import { CATEGORIES } from '../data/categories';
import { mergeNotificationPreferences } from '../data/notificationPreferences';
import {
  buildBudgetGoalsForMonthlyBudget,
  DEFAULT_CATEGORY_BUDGET_WEIGHTS,
} from '../utils/budgetAllocation';
import { getSupabase } from '../../lib/supabase';
import { createCustomCategoryAppId, toCustomCategoryAppId, toCustomCategoryDbId } from '../utils/customCategoryId';
import { replaceAppStateOnServer } from './appDataService';
import { saveOnboarding } from './onboardingService';
import type { OnboardingState } from '../context/OnboardingContext';

/** Map onboarding budget allocation keys → app category ids */
export const ALLOCATION_TO_CATEGORY: Record<string, string> = {
  housing: 'rent',
  food: 'groceries',
  transportation: 'transport',
  utilities: 'utilities',
  shopping: 'shopping',
  entertainment: 'entertainment',
  savings: 'other',
};

export function budgetAllocationsToGoals(
  allocations: Record<string, number>,
): BudgetGoal[] {
  const goals: BudgetGoal[] = [];
  for (const [key, amount] of Object.entries(allocations)) {
    const categoryId = ALLOCATION_TO_CATEGORY[key];
    if (categoryId && amount > 0) {
      goals.push({ categoryId, amount: Math.round(amount) });
    }
  }
  return goals;
}

export function mergeOnboardingIntoAppState(
  current: AppState,
  data: Partial<OnboardingData>,
): AppState {
  const next: AppState = { ...current };

  if (data.firstName) {
    next.userName = data.firstName;
    next.userFullName = data.firstName;
  }
  if (data.primaryGoal) {
    next.primaryGoal = data.primaryGoal;
  }
  if (data.currency) next.currency = data.currency;
  if (data.monthlyBudget != null) next.monthlyBudget = data.monthlyBudget;
  if (data.monthlyAmount?.type === 'income' && data.monthlyAmount.value != null) {
    next.income = data.monthlyAmount.value;
  }

  if (data.budgetAllocations && Object.keys(data.budgetAllocations).length > 0) {
    const goals = budgetAllocationsToGoals(data.budgetAllocations);
    if (goals.length > 0) next.budgetGoals = goals;
  } else if (data.monthlyBudget != null && data.monthlyBudget > 0) {
    next.budgetGoals = buildBudgetGoalsForMonthlyBudget(
      data.monthlyBudget,
      CATEGORIES.map(c => c.id),
      DEFAULT_CATEGORY_BUDGET_WEIGHTS,
    );
  }

  if (data.notifications) {
    next.notificationPreferences = mergeNotificationPreferences({
      budgetAlerts: data.notifications.budgetAlerts,
      weeklySummary: data.notifications.weeklySummary,
      billReminders: data.notifications.billReminders,
      goalMilestones: data.notifications.goalMilestones,
      recurringReminders: data.notifications.billReminders,
    });
  }

  const allBuiltInIds = CATEGORIES.map(c => c.id);
  const selectedIds =
    data.selectedCategoryIds ??
    (data.selectedCategories
      ? data.selectedCategories
          .map(name => CATEGORIES.find(c => c.name === name)?.id)
          .filter((id): id is string => Boolean(id))
      : allBuiltInIds);
  next.disabledCategoryIds = allBuiltInIds.filter(id => !selectedIds.includes(id));

  if (data.customCategories?.length) {
    next.customCategories = data.customCategories.map(c => ({
      id: c.id
        ? toCustomCategoryAppId(toCustomCategoryDbId(c.id))
        : createCustomCategoryAppId(),
      name: c.name,
      color: c.color ?? '#3E37FF',
      bg: c.bg ?? (c.color ? `${c.color}22` : '#EDEDFF'),
      iconKey: c.iconKey ?? 'other',
      iconColor: c.iconColor,
    }));
  }

  return next;
}

/** Mark onboarding complete, merge data into profile + financial tables. */
export async function completeOnboardingOnServer(
  userId: string,
  onboarding: OnboardingState,
  appState: AppState,
): Promise<AppState> {
  const merged = mergeOnboardingIntoAppState(appState, onboarding.data);
  const completed: OnboardingState = {
    ...onboarding,
    status: 'completed',
    completedAt: new Date().toISOString(),
  };

  const supabase = getSupabase();
  const { error: profileErr } = await supabase.from('profiles').update({
    display_name: merged.userName,
    full_name: merged.userFullName,
    currency: merged.currency,
    income: merged.income,
    monthly_budget: merged.monthlyBudget,
    country: onboarding.data.country ?? null,
    primary_goal: onboarding.data.primaryGoal ?? null,
    income_frequency: onboarding.data.incomeFrequency ?? null,
    onboarding_completed_at: completed.completedAt,
  }).eq('id', userId);
  if (profileErr) throw profileErr;

  await replaceAppStateOnServer(userId, merged);
  await saveOnboarding(userId, completed);

  return merged;
}

/** Resolve selected category names from onboarding to ids (for future filtering). */
export function selectedCategoryNamesToIds(names: string[]): string[] {
  return names
    .map(name => CATEGORIES.find(c => c.name === name)?.id)
    .filter((id): id is string => Boolean(id));
}
