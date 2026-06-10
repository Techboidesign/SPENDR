import type { OnboardingData } from '../context/OnboardingContext';
import type { AppState } from '../data/types';
import { CATEGORIES } from '../data/categories';
import { mergeNotificationPreferences } from '../data/notificationPreferences';
import { targetToProfileFields } from '../data/primaryGoalTarget';
import { createCustomCategoryAppId, toCustomCategoryAppId, toCustomCategoryDbId } from '../utils/customCategoryId';
import { replaceAppStateOnServer } from './appDataService';
import { updateProfileSafe } from './profileUpdates';
import { saveOnboarding } from './onboardingService';
import type { OnboardingState } from '../context/OnboardingContext';

export function mergeOnboardingIntoAppState(
  current: AppState,
  data: Partial<OnboardingData>,
): AppState {
  const next: AppState = { ...current };

  if (data.firstName) {
    next.userName = data.firstName;
    next.userFullName = data.firstName;
  }
  next.primaryGoal = null;
  next.primaryGoalTarget = null;
  if (data.savingsGoals?.length) {
    next.savingsGoals = data.savingsGoals;
  }
  if (data.currency) next.currency = data.currency;
  if (data.monthlyBudget != null) next.monthlyBudget = data.monthlyBudget;
  if (data.monthlyAmount?.type === 'income' && data.monthlyAmount.value != null) {
    next.income = data.monthlyAmount.value;
  }

  next.budgetGoals = [];

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

  const targetFields = targetToProfileFields(merged.primaryGoalTarget, merged.primaryGoal);
  await updateProfileSafe(userId, {
    display_name: merged.userName,
    full_name: merged.userFullName,
    currency: merged.currency,
    income: merged.income,
    monthly_budget: merged.monthlyBudget,
    primary_goal: merged.primaryGoal,
    income_frequency: onboarding.data.incomeFrequency ?? null,
    onboarding_completed_at: completed.completedAt,
    ...targetFields,
  });

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
