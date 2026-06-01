import { useMemo } from 'react';
import {
  getCategoryTotals,
  getMonthExpenses,
  getMonthlyAmount,
  getMonthSpendingTotal,
  useApp,
} from '../context/AppContext';
import type { CategoryIconKey } from '../data/categoryConfig';
import { getCategoryById } from '../data/categories';
import { getPreviousMonthKey, monthPickerLabel } from '../utils/periods';
import type { FeatureCardPhosphorIcon } from '../components/ui/FeatureCardIcon';

export const PCT_OF_MONTHLY_LABEL = '% of monthly expenses';

export type ExpensesMonthInsight = {
  id: string;
  eyebrow: string;
  headline: string;
  detail: string;
  accentColor: string;
  accentBg: string;
  categoryId?: string;
  iconKey?: CategoryIconKey;
  phosphorIcon?: FeatureCardPhosphorIcon;
};

function buildCandidates({
  monthKey,
  monthTotal,
  formatCurrency,
  income,
  monthlyBudget,
  expenses,
}: {
  monthKey: string;
  monthTotal: number;
  formatCurrency: (n: number) => string;
  income: number;
  monthlyBudget: number;
  expenses: ReturnType<typeof useApp>['state']['expenses'];
}): ExpensesMonthInsight[] {
  const cards: ExpensesMonthInsight[] = [];
  const monthLabel = monthPickerLabel(monthKey);
  const prevKey = getPreviousMonthKey(monthKey);
  const prevExpenses = getMonthExpenses(expenses, prevKey);
  const curExpenses = getMonthExpenses(expenses, monthKey);
  const prevTotal = getMonthSpendingTotal(expenses, prevKey);

  if (monthTotal > 0 && prevTotal > 0) {
    const pctChange = ((monthTotal - prevTotal) / prevTotal) * 100;
    const spentMore = pctChange > 0;
    const absPct = Math.abs(pctChange).toFixed(0);
    cards.push({
      id: 'mom-spend',
      eyebrow: 'Vs last month',
      headline: spentMore
        ? `You spent ${absPct}% more`
        : pctChange < 0
          ? `You spent ${absPct}% less`
          : 'Spending matched last month',
      detail: `${formatCurrency(monthTotal)} this month · ${formatCurrency(prevTotal)} in ${monthPickerLabel(prevKey)}`,
      accentColor: spentMore ? '#DC2626' : '#059669',
      accentBg: spentMore ? '#FEE2E2' : '#D1FAE5',
      phosphorIcon: spentMore ? 'chart-line-up' : 'trend-up',
    });
  }

  if (monthTotal > 0 && income > 0) {
    const saved = income - monthTotal;
    const savingsRate = Math.round((saved / income) * 100);
    const onTrack = saved >= 0;
    cards.push({
      id: 'savings',
      eyebrow: 'Savings',
      headline: onTrack
        ? `Saving ${formatCurrency(saved)}`
        : `Over budget by ${formatCurrency(Math.abs(saved))}`,
      detail: onTrack
        ? `${savingsRate}% of income kept after ${monthLabel} expenses`
        : `Expenses exceeded income this month`,
      accentColor: onTrack ? '#059669' : '#D97706',
      accentBg: onTrack ? '#D1FAE5' : '#FEF3C7',
      iconKey: 'piggy',
    });
  }

  const totals = getCategoryTotals(expenses, monthKey);
  const topEntry = Object.entries(totals)
    .map(([id, amount]) => ({ id, amount }))
    .filter(e => e.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];

  if (topEntry && monthTotal > 0) {
    const cat = getCategoryById(topEntry.id);
    const pct = ((topEntry.amount / monthTotal) * 100).toFixed(0);
    cards.push({
      id: 'top-category',
      eyebrow: 'Top category',
      headline: cat.name,
      detail: `${pct}${PCT_OF_MONTHLY_LABEL}`,
      accentColor: cat.color,
      accentBg: cat.bg,
      categoryId: topEntry.id,
    });
  }

  let recurring = 0;
  for (const exp of curExpenses) {
    if (exp.type !== 'one-time') recurring += getMonthlyAmount(exp);
  }
  if (monthTotal > 0 && recurring > 0) {
    const pct = ((recurring / monthTotal) * 100).toFixed(0);
    cards.push({
      id: 'recurring',
      eyebrow: 'Recurring',
      headline: `${pct}% recurring spend`,
      detail: `${formatCurrency(recurring)} · ${pct}${PCT_OF_MONTHLY_LABEL}`,
      accentColor: '#7C3AED',
      accentBg: '#EDE9FE',
      phosphorIcon: 'arrows-clockwise',
    });
  }

  if (monthlyBudget > 0 && monthTotal >= 0) {
    const budgetPct = Math.min((monthTotal / monthlyBudget) * 100, 100);
    const remaining = monthlyBudget - monthTotal;
    const over = monthTotal > monthlyBudget;
    cards.push({
      id: 'budget',
      eyebrow: 'Budget',
      headline: over
        ? `${formatCurrency(monthTotal - monthlyBudget)} over budget`
        : `${budgetPct.toFixed(0)}% of budget used`,
      detail: over
        ? `${monthLabel} spend passed your ${formatCurrency(monthlyBudget)} limit`
        : `${formatCurrency(Math.max(remaining, 0))} left for ${monthLabel}`,
      accentColor: over ? '#DC2626' : budgetPct < 85 ? '#059669' : '#D97706',
      accentBg: over ? '#FEE2E2' : budgetPct < 85 ? '#D1FAE5' : '#FEF3C7',
      phosphorIcon: 'target',
    });
  }

  if (monthTotal > 0) {
    const oneTime = monthTotal - recurring;
    if (oneTime > 0) {
      const pct = ((oneTime / monthTotal) * 100).toFixed(0);
      cards.push({
        id: 'one-time',
        eyebrow: 'One-time',
        headline: `${pct}% one-time spend`,
        detail: `${formatCurrency(oneTime)} · ${pct}${PCT_OF_MONTHLY_LABEL}`,
        accentColor: '#3E37FF',
        accentBg: '#EDEDFF',
        iconKey: 'card',
      });
    }
  }

  return cards;
}

export function useExpensesMonthInsight(
  monthKey: string,
  monthTotal: number,
  shuffleKey: string,
) {
  const { state, formatCurrency } = useApp();

  const candidates = useMemo(
    () =>
      buildCandidates({
        monthKey,
        monthTotal,
        formatCurrency,
        income: state.income,
        monthlyBudget: state.monthlyBudget,
        expenses: state.expenses,
      }),
    [monthKey, monthTotal, formatCurrency, state.income, state.monthlyBudget, state.expenses],
  );

  const pickedId = useMemo(() => {
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)].id;
    // Reshuffle only when month or view changes, not when totals update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleKey]);

  const insight = useMemo(() => {
    if (!pickedId) return null;
    return candidates.find(c => c.id === pickedId) ?? candidates[0] ?? null;
  }, [candidates, pickedId]);

  return insight;
}
