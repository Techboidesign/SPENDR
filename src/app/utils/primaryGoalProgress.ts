import type { PrimaryGoalId } from '../data/primaryGoalConfig';
import { getPrimaryGoalDefinition } from '../data/primaryGoalConfig';
import { BUDGET_PROGRESS_COLORS, getBudgetUsagePercent } from './budgetProgress';

export interface PrimaryGoalProgressInput {
  goalId: PrimaryGoalId;
  income: number;
  monthlyBudget: number;
  totalSpent: number;
  categoryTotals: Record<string, number>;
  budgetGoals: { categoryId: string; amount: number }[];
  categoryIds: string[];
}

export interface PrimaryGoalProgressResult {
  percent: number;
  metricLabel: string;
  metricValue: string;
  statusLine: string;
  emptyHelper?: string;
  /** When true, a higher percent is healthier (bar uses green at high %). */
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

export function computePrimaryGoalProgress(
  input: PrimaryGoalProgressInput,
): PrimaryGoalProgressResult {
  const def = getPrimaryGoalDefinition(input.goalId);
  const { income, monthlyBudget, totalSpent, categoryTotals, budgetGoals, categoryIds } = input;

  const hasFinancialBaseline = income > 0 || monthlyBudget > 0;
  if (!hasFinancialBaseline) {
    return {
      percent: 0,
      metricLabel: 'Getting started',
      metricValue: '—',
      statusLine: 'Set income and budget to see progress toward your goal.',
      emptyHelper: 'Add your monthly income and budget on the cards below.',
      invertedBar: true,
    };
  }

  switch (def.progressMode) {
    case 'savings_rate': {
      const saved = Math.max(0, income - totalSpent);
      const percent =
        income > 0 ? clampPercent((saved / income) * 100) : clampPercent(100 - getBudgetUsagePercent(totalSpent, monthlyBudget));
      const overBudget = monthlyBudget > 0 && totalSpent > monthlyBudget;
      return {
        percent,
        metricLabel: 'Saved this month',
        metricValue: formatMoney(saved),
        statusLine: overBudget
          ? 'Spending is above budget—trim discretionary categories to save more.'
          : percent >= 70
            ? 'On track — most of your income is still available to save.'
            : 'Small cuts in discretionary spending can boost what you save.',
        invertedBar: true,
      };
    }

    case 'categories_tracked': {
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
        statusLine:
          numer === total
            ? 'Nice — you have spending recorded across your budget categories.'
            : 'Log expenses in more categories to complete your spending map.',
        invertedBar: true,
      };
    }

    case 'budget_adherence': {
      const remaining = Math.max(0, monthlyBudget - totalSpent);
      const percent =
        monthlyBudget > 0
          ? clampPercent((remaining / monthlyBudget) * 100)
          : clampPercent(Math.max(0, 100 - getBudgetUsagePercent(totalSpent, income)));
      const over = monthlyBudget > 0 && totalSpent > monthlyBudget;
      return {
        percent,
        metricLabel: 'Room toward payoff',
        metricValue: over ? 'Over budget' : formatMoney(remaining),
        statusLine: over
          ? 'You are over budget—focus on essentials and pause discretionary spend.'
          : 'Staying under budget frees cash to put toward debt.',
        invertedBar: true,
      };
    }

    case 'emergency_fund_proxy': {
      const unspent = Math.max(0, monthlyBudget - totalSpent);
      const target = monthlyBudget > 0 ? monthlyBudget * 0.2 : Math.max(1, income * 0.2);
      const percent = clampPercent((unspent / target) * 100);
      return {
        percent,
        metricLabel: 'Safety net progress',
        metricValue: formatMoney(unspent),
        statusLine:
          percent >= 100
            ? 'Strong month — you are building cushion beyond your monthly target.'
            : 'Aim to leave about 20% of your budget unspent this month.',
        invertedBar: true,
      };
    }

    case 'invest_readiness': {
      const usage = getBudgetUsagePercent(totalSpent, monthlyBudget > 0 ? monthlyBudget : income);
      const percent = clampPercent(100 - Math.min(usage, 100));
      const underEarn = income > 0 && totalSpent > income;
      return {
        percent,
        metricLabel: 'Ready to invest',
        metricValue: `${percent}% headroom`,
        statusLine: underEarn
          ? 'Spending exceeds income—stabilize cash flow before investing.'
          : percent >= 80
            ? 'You are living within your means — good foundation to invest.'
            : 'Tighten discretionary spend to create room for future investing.',
        invertedBar: true,
      };
    }

    case 'setup_completeness':
    default: {
      const withBudget = categoryIds.filter(id => {
        const goal = budgetGoals.find(g => g.categoryId === id);
        return (goal?.amount ?? 0) > 0;
      });
      const percent = clampPercent((withBudget.length / Math.max(1, categoryIds.length)) * 100);
      return {
        percent,
        metricLabel: 'Setup progress',
        metricValue: `${withBudget.length}/${categoryIds.length}`,
        statusLine:
          percent >= 100
            ? 'Your budget is set up — explore spending insights in Expenses.'
            : 'Add budget limits to categories below to get the most from Spendr.',
        invertedBar: true,
      };
    }
  }
}

function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  return `$${rounded.toLocaleString()}`;
}
