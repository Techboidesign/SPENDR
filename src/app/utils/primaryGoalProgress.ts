import type { PrimaryGoalTarget } from '../data/primaryGoalTarget';
import { daysUntilTargetDate } from '../data/primaryGoalTarget';
import type { PrimaryGoalId } from '../data/primaryGoalConfig';
import { getPrimaryGoalDefinition } from '../data/primaryGoalConfig';
import { BUDGET_PROGRESS_COLORS } from './budgetProgress';

export interface PrimaryGoalProgressInput {
  goalId: PrimaryGoalId;
  primaryGoalTarget: PrimaryGoalTarget | null;
  categoryTotals: Record<string, number>;
  budgetGoals: { categoryId: string; amount: number }[];
  categoryIds: string[];
}

export interface PrimaryGoalProgressResult {
  percent: number;
  metricLabel: string;
  metricValue: string;
  emptyHelper?: string;
  invertedBar: boolean;
}

function clampPercent(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

function barColorForInverted(percent: number): string {
  if (percent >= 80) return BUDGET_PROGRESS_COLORS.safe;
  if (percent >= 45) return BUDGET_PROGRESS_COLORS.warning;
  return BUDGET_PROGRESS_COLORS.over;
}

export function getPrimaryGoalBarColor(percent: number, inverted: boolean): string {
  return inverted ? barColorForInverted(percent) : barColorForInverted(100 - percent);
}

function formatMoney(amount: number, symbol = '$'): string {
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

export function computePrimaryGoalProgress(
  input: PrimaryGoalProgressInput,
): PrimaryGoalProgressResult {
  const def = getPrimaryGoalDefinition(input.goalId);

  if (def.progressMode === 'target_amount') {
    const target = input.primaryGoalTarget;
    if (!target || target.targetAmount <= 0) {
      return {
        percent: 0,
        metricLabel: 'Set your target',
        metricValue: '—',
        emptyHelper: 'Tap your focus card to add amount and date.',
        invertedBar: true,
      };
    }
    const percent = clampPercent((target.currentAmount / target.targetAmount) * 100);
    const daysLeft = daysUntilTargetDate(target.targetDate);
    const daysLabel =
      daysLeft == null
        ? ''
        : daysLeft > 0
          ? `${daysLeft}d left`
          : daysLeft === 0
            ? 'Due today'
            : 'Past due';

    return {
      percent,
      metricLabel: 'Toward target',
      metricValue: `${formatMoney(target.currentAmount)} / ${formatMoney(target.targetAmount)}${daysLabel ? ` · ${daysLabel}` : ''}`,
      invertedBar: true,
    };
  }

  const { categoryTotals, budgetGoals, categoryIds } = input;
  const withBudget = categoryIds.filter(id => {
    const goal = budgetGoals.find(g => g.categoryId === id);
    return (goal?.amount ?? 0) > 0;
  });
  const tracked = withBudget.filter(id => (categoryTotals[id] ?? 0) > 0);
  const denom = Math.max(1, withBudget.length || categoryIds.length);
  const numer = withBudget.length > 0 ? tracked.length : categoryIds.filter(id => (categoryTotals[id] ?? 0) > 0).length;
  const total = withBudget.length > 0 ? withBudget.length : categoryIds.length;
  const percent = clampPercent((numer / denom) * 100);

  return {
    percent,
    metricLabel: 'Categories tracked',
    metricValue: `${numer}/${total}`,
    invertedBar: true,
  };
}
