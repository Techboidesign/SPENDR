import type { OnboardingData } from '../context/OnboardingContext';
import type { AppState, BudgetGoal } from '../data/types';
import { CATEGORIES } from '../data/categories';
import { getSupabase } from '../../lib/supabase';
import { replaceAppStateOnServer } from './appDataService';
import { saveOnboarding } from './onboardingService';
import type { OnboardingState } from '../context/OnboardingContext';

/** Map onboarding budget allocation keys → app category ids */
const ALLOCATION_TO_CATEGORY: Record<string, string> = {
  housing: 'rent',
  food: 'groceries',
  transportation: 'transport',
  utilities: 'utilities',
  shopping: 'shopping',
  entertainment: 'entertainment',
  savings: 'other',
};

export function mergeOnboardingIntoAppState(
  current: AppState,
  data: Partial<OnboardingData>,
): AppState {
  const next: AppState = { ...current };

  if (data.firstName) {
    next.userName = data.firstName;
    next.userFullName = data.firstName;
  }
  if (data.currency) next.currency = data.currency;
  if (data.monthlyBudget != null) next.monthlyBudget = data.monthlyBudget;
  if (data.monthlyAmount?.type === 'income' && data.monthlyAmount.value != null) {
    next.income = data.monthlyAmount.value;
  }

  if (data.budgetAllocations) {
    const goals: BudgetGoal[] = [];
    for (const [key, amount] of Object.entries(data.budgetAllocations)) {
      const categoryId = ALLOCATION_TO_CATEGORY[key];
      if (categoryId && amount > 0) {
        goals.push({ categoryId, amount });
      }
    }
    if (goals.length > 0) next.budgetGoals = goals;
  }

  if (data.customCategories?.length) {
    next.customCategories = data.customCategories.map((c, i) => ({
      id: `custom-${Date.now()}-${i}`,
      name: c.name,
      color: c.color ?? '#3E37FF',
      bg: c.color ? `${c.color}22` : '#EDEDFF',
      iconKey: 'other',
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

  if (onboarding.data.notifications) {
    const n = onboarding.data.notifications;
    await supabase.from('user_preferences').update({
      budget_alerts: n.budgetAlerts ?? true,
      weekly_summary: n.weeklySummary ?? true,
      bill_reminders: n.billReminders ?? true,
      goal_milestones: n.goalMilestones ?? true,
    }).eq('user_id', userId);
  }

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
