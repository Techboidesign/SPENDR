import { CATEGORIES } from '../data/categories';
import type { BudgetGoal } from '../data/types';

/** Default % weights for all app categories (sum = 100). */
export const DEFAULT_CATEGORY_BUDGET_WEIGHTS: Record<string, number> = {
  rent: 28,
  groceries: 11,
  dining: 10,
  transport: 10,
  subscriptions: 7,
  entertainment: 7,
  health: 9,
  shopping: 9,
  utilities: 9,
  other: 10,
};

/** Split a total across weighted keys without rounding drift (largest remainder). */
export function distributeAmountByWeights(
  total: number,
  weights: Record<string, number>,
): Record<string, number> {
  const target = Math.round(total);
  if (target <= 0) return {};

  const ids = Object.keys(weights);
  const weightSum = ids.reduce((sum, id) => sum + weights[id], 0);
  if (weightSum <= 0) return {};

  const shares = ids.map(id => {
    const exact = (target * weights[id]) / weightSum;
    const base = Math.floor(exact);
    return { id, base, remainder: exact - base };
  });

  let leftover = target - shares.reduce((sum, s) => sum + s.base, 0);
  const byRemainder = [...shares].sort((a, b) => b.remainder - a.remainder);

  const out: Record<string, number> = {};
  for (const s of shares) {
    out[s.id] = s.base;
  }
  for (let i = 0; leftover > 0 && i < byRemainder.length; i++) {
    out[byRemainder[i].id]++;
    leftover--;
  }
  return out;
}

/** Assign a monthly budget across every category (fills missing goals). */
export function buildBudgetGoalsForMonthlyBudget(
  monthlyBudget: number,
  categoryIds: readonly string[],
  defaultWeights: Record<string, number> = DEFAULT_CATEGORY_BUDGET_WEIGHTS,
  existingGoals: BudgetGoal[] = [],
): BudgetGoal[] {
  if (monthlyBudget <= 0 || categoryIds.length === 0) return existingGoals;

  const weights: Record<string, number> = {};
  for (const id of categoryIds) {
    weights[id] = defaultWeights[id] ?? 1;
  }
  for (const goal of existingGoals) {
    if (categoryIds.includes(goal.categoryId) && goal.amount > 0) {
      weights[goal.categoryId] = goal.amount;
    }
  }

  const distributed = distributeAmountByWeights(monthlyBudget, weights);
  const amounts = new Map(
    categoryIds.map(id => [id, distributed[id] ?? 0]),
  );

  // Guarantee every category gets at least $1 when the monthly budget allows it
  let withoutBudget = categoryIds.filter(id => (amounts.get(id) ?? 0) <= 0);
  while (withoutBudget.length > 0) {
    const donor = [...categoryIds]
      .filter(id => (amounts.get(id) ?? 0) > 1)
      .sort((a, b) => (amounts.get(b) ?? 0) - (amounts.get(a) ?? 0))[0];
    if (!donor) break;
    amounts.set(donor, (amounts.get(donor) ?? 0) - 1);
    amounts.set(withoutBudget[0], 1);
    withoutBudget = categoryIds.filter(id => (amounts.get(id) ?? 0) <= 0);
  }

  return categoryIds
    .map(categoryId => ({
      categoryId,
      amount: amounts.get(categoryId) ?? 0,
    }))
    .filter(goal => goal.amount > 0);
}

/** @deprecated Use buildBudgetGoalsForMonthlyBudget — scales only existing goals. */
export function rescaleBudgetGoalsToTotal(
  goals: BudgetGoal[],
  targetTotal: number,
): BudgetGoal[] {
  if (goals.length === 0) return goals;
  const categoryIds = goals.map(g => g.categoryId);
  return buildBudgetGoalsForMonthlyBudget(
    targetTotal,
    categoryIds,
    DEFAULT_CATEGORY_BUDGET_WEIGHTS,
    goals,
  );
}

export function sumBudgetGoals(goals: BudgetGoal[]): number {
  return goals.reduce((sum, g) => sum + g.amount, 0);
}

export function getDefaultCategoryIds(): string[] {
  return CATEGORIES.map(c => c.id);
}
