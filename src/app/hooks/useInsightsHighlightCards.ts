import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp, getCategoryTotals, getMonthExpenses, getMonthlyAmount } from '../context/AppContext';
import type { CategoryIconKey } from '../data/categoryConfig';

export type InsightPhosphorIcon = 'trend-up' | 'arrows-clockwise' | 'chart-line-up';

export type InsightCardData = {
  id: string;
  eyebrow: string;
  headline: string;
  detail: string;
  accentColor: string;
  accentBg: string;
  categoryId?: string;
  iconKey?: CategoryIconKey;
  phosphorIcon?: InsightPhosphorIcon;
  progress?: number;
  onClick: () => void;
};

type MonthlyBar = { month: string; total: number; isLast: boolean };

export function useInsightsHighlightCards(
  formatCurrency: (n: number) => string,
  monthlyBarData: MonthlyBar[],
  monthKeys: string[],
  options?: { skipCategoryAndRecurring?: boolean },
): InsightCardData[] {
  const navigate = useNavigate();
  const { state, categories } = useApp();

  return useMemo(
    () =>
      buildHighlightCards({
        expenses: state.expenses,
        categories,
        formatCurrency,
        monthlyBarData,
        monthKeys,
        navigate,
        skipCategoryAndRecurring: options?.skipCategoryAndRecurring ?? false,
      }),
    [
      state.expenses,
      categories,
      formatCurrency,
      monthlyBarData,
      monthKeys,
      navigate,
      options?.skipCategoryAndRecurring,
    ],
  );
}

function buildHighlightCards({
  expenses,
  categories,
  formatCurrency,
  monthlyBarData,
  monthKeys,
  navigate,
  skipCategoryAndRecurring,
}: {
  expenses: ReturnType<typeof useApp>['state']['expenses'];
  categories: ReturnType<typeof useApp>['categories'];
  formatCurrency: (n: number) => string;
  monthlyBarData: MonthlyBar[];
  monthKeys: string[];
  navigate: ReturnType<typeof useNavigate>;
  skipCategoryAndRecurring: boolean;
}): InsightCardData[] {
  if (monthKeys.length < 2) return [];

  const cards: InsightCardData[] = [];
  const totals: Record<string, number> = {};

  let recurring = 0;
  let oneTime = 0;

  for (const key of monthKeys) {
    const monthTotals = getCategoryTotals(expenses, key);
    for (const [id, amt] of Object.entries(monthTotals)) {
      totals[id] = (totals[id] ?? 0) + amt;
    }
    const monthExpenses = getMonthExpenses(expenses, key);
    for (const exp of monthExpenses) {
      const amount = getMonthlyAmount(exp);
      if (exp.type === 'one-time') oneTime += amount;
      else recurring += amount;
    }
  }

  const grandTotal = recurring + oneTime;
  const recurringPct =
    grandTotal > 0 ? ((recurring / grandTotal) * 100).toFixed(0) : '0';

  if (!skipCategoryAndRecurring) {
    const ranked = categories
      .map(cat => ({ cat, amount: totals[cat.id] ?? 0 }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const top = ranked[0];
    if (top) {
      const pct = grandTotal > 0 ? (top.amount / grandTotal) * 100 : 0;
      cards.push({
        id: 'top-category',
        eyebrow: 'Top category',
        headline: top.cat.name.split('/')[0].split(' & ')[0],
        detail: `${pct.toFixed(0)}% of spend`,
        accentColor: top.cat.color,
        accentBg: top.cat.bg,
        categoryId: top.cat.id,
        onClick: () => navigate('/expenses'),
      });
    }
  }

  const monthsWithSpend = monthlyBarData.filter(m => m.total > 0);
  const avg =
    monthsWithSpend.length > 0
      ? monthsWithSpend.reduce((s, m) => s + m.total, 0) / monthsWithSpend.length
      : 0;
  if (avg > 0) {
    cards.push({
      id: 'avg-month',
      eyebrow: 'Average month',
      headline: formatCurrency(avg),
      detail: `${monthsWithSpend.length} active months`,
      accentColor: '#059669',
      accentBg: '#D1FAE5',
      iconKey: 'wallet',
      onClick: () => navigate('/expenses'),
    });
  }

  const peak = [...monthlyBarData].sort((a, b) => b.total - a.total)[0];
  if (peak && peak.total > 0) {
    cards.push({
      id: 'peak-month',
      eyebrow: 'Highest month',
      headline: peak.month,
      detail: formatCurrency(peak.total),
      accentColor: '#D97706',
      accentBg: '#FEF3C7',
      phosphorIcon: 'chart-line-up',
      onClick: () => navigate('/expenses'),
    });
  }

  if (!skipCategoryAndRecurring && grandTotal > 0) {
    cards.push({
      id: 'recurring',
      eyebrow: 'Recurring',
      headline: `${recurringPct}%`,
      detail: 'Recurring spend',
      accentColor: '#7C3AED',
      accentBg: '#EDE9FE',
      phosphorIcon: 'arrows-clockwise',
      onClick: () => navigate('/expenses'),
    });
  }

  return cards;
}
