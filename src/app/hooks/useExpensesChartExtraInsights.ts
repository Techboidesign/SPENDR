import { useMemo } from 'react';
import {
  getCategoryTotals,
  getMonthExpenses,
  getMonthlyAmount,
  useApp,
} from '../context/AppContext';
import { getCategoryById } from '../data/categories';
import type { HomeRange } from '../utils/periods';
import { getPreviousMonthKey, monthPickerLabel, MONTH_OPTIONS } from '../utils/periods';
import type { ExpensesMonthInsight } from './useExpensesMonthInsight';

function monthsOfCalendarYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

/**
 * Four fixed insight cards for Expenses chart view (below category breakdown).
 */
export function useExpensesChartExtraInsights(
  monthKey: string,
  monthTotal: number,
  range: HomeRange = 'month',
): ExpensesMonthInsight[] {
  const { state, formatCurrency } = useApp();

  return useMemo(() => {
    if (range === 'year') return [];
    const { expenses, savingsGoals } = state;
    const cards: ExpensesMonthInsight[] = [];

    // 1) This month vs previous month
    const prevKey = getPreviousMonthKey(monthKey);
    const prevExpenses = getMonthExpenses(expenses, prevKey);
    const prevTotal = prevExpenses.reduce((s, e) => s + getMonthlyAmount(e), 0);

    if (monthTotal > 0 || prevTotal > 0) {
      if (prevTotal > 0) {
        const pctChange = ((monthTotal - prevTotal) / prevTotal) * 100;
        const spentMore = pctChange > 0;
        const absPct = Math.abs(pctChange).toFixed(0);
        cards.push({
          id: 'chart-mom',
          eyebrow: 'This month vs last',
          headline:
            pctChange === 0
              ? 'Same pace as last month'
              : spentMore
                ? `${absPct}% more than last month`
                : `${absPct}% less than last month`,
          detail: `${formatCurrency(monthTotal)} now · ${formatCurrency(prevTotal)} in ${monthPickerLabel(prevKey)}`,
          accentColor: spentMore && pctChange !== 0 ? '#DC2626' : '#059669',
          accentBg: spentMore && pctChange !== 0 ? '#FEE2E2' : '#D1FAE5',
          phosphorIcon: spentMore && pctChange !== 0 ? 'chart-line-up' : 'trend-up',
        });
      } else {
        cards.push({
          id: 'chart-mom',
          eyebrow: 'This month vs last',
          headline: 'First month of data here',
          detail: `${formatCurrency(monthTotal)} in ${monthPickerLabel(monthKey)} — compare after next month`,
          accentColor: '#3E37FF',
          accentBg: '#EDEDFF',
          phosphorIcon: 'chart-line-up',
        });
      }
    } else {
      cards.push({
        id: 'chart-mom',
        eyebrow: 'This month vs last',
        headline: 'No spend to compare yet',
        detail: 'Add expenses to see month-over-month changes',
        accentColor: '#8B8D9E',
        accentBg: '#F2F2F5',
        phosphorIcon: 'trend-up',
      });
    }

    // 2) Named savings goals progress
    const goalsWithTarget = savingsGoals.filter(g => g.targetAmount > 0);
    if (goalsWithTarget.length > 0) {
      let reached = 0;
      let totalPct = 0;
      for (const g of goalsWithTarget) {
        const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
        totalPct += pct;
        if (g.currentAmount >= g.targetAmount) reached++;
      }
      const avgPct = Math.round(totalPct / goalsWithTarget.length);
      cards.push({
        id: 'chart-goals',
        eyebrow: 'Savings goals',
        headline:
          reached === goalsWithTarget.length
            ? 'All savings goals on track'
            : `${avgPct}% average progress`,
        detail:
          reached > 0
            ? `${reached} of ${goalsWithTarget.length} goal${goalsWithTarget.length === 1 ? '' : 's'} reached — open Budget to update`
            : 'Track named goals like vacation or a big purchase in Budget',
        accentColor: avgPct >= 80 ? '#059669' : avgPct >= 50 ? '#D97706' : '#7C3AED',
        accentBg: avgPct >= 80 ? '#D1FAE5' : avgPct >= 50 ? '#FEF3C7' : '#EDE9FE',
        phosphorIcon: 'target',
      });
    } else {
      cards.push({
        id: 'chart-goals',
        eyebrow: 'Savings goals',
        headline: 'Add a savings goal',
        detail: 'Open Budget & Goals to name what you are saving for',
        accentColor: '#7C3AED',
        accentBg: '#EDE9FE',
        phosphorIcon: 'target',
      });
    }

    // 3) Top category year trend (calendar year of selected month)
    const year = parseInt(monthKey.slice(0, 4), 10);
    const yearMonths = monthsOfCalendarYear(year);
    const yearTotals: Record<string, number> = {};
    for (const mk of yearMonths) {
      const t = getCategoryTotals(expenses, mk);
      for (const [id, amt] of Object.entries(t)) {
        yearTotals[id] = (yearTotals[id] ?? 0) + amt;
      }
    }
    const topYear = Object.entries(yearTotals)
      .filter(([, a]) => a > 0)
      .sort((a, b) => b[1] - a[1])[0];

    if (topYear) {
      const [topId, topAmt] = topYear;
      const cat = getCategoryById(topId);
      const yearGrand = Object.values(yearTotals).reduce((s, v) => s + v, 0);
      const share = yearGrand > 0 ? ((topAmt / yearGrand) * 100).toFixed(0) : '0';

      let h1 = 0;
      let h2 = 0;
      for (let i = 0; i < 6; i++) {
        const t = getCategoryTotals(expenses, yearMonths[i]);
        h1 += t[topId] ?? 0;
      }
      for (let i = 6; i < 12; i++) {
        const t = getCategoryTotals(expenses, yearMonths[i]);
        h2 += t[topId] ?? 0;
      }
      let trendWord = 'Steady year split';
      if (h1 > 0 && h2 > h1 * 1.12) trendWord = 'Heavier in H2 so far';
      else if (h2 > 0 && h1 > h2 * 1.12) trendWord = 'Heavier in H1 so far';

      cards.push({
        id: 'chart-year-cat',
        eyebrow: `Top category (${year})`,
        headline: cat.name,
        detail: `${share}% of yearly spend · ${trendWord}`,
        accentColor: cat.color,
        accentBg: cat.bg,
        categoryId: topId,
      });
    } else {
      cards.push({
        id: 'chart-year-cat',
        eyebrow: `Top category (${year})`,
        headline: 'Build your year picture',
        detail: 'Log expenses across months to unlock category trends',
        accentColor: '#3E37FF',
        accentBg: '#EDEDFF',
        phosphorIcon: 'chart-line-up',
      });
    }

    // 4) Top “constant” recurring — by how many recent months it appears (not by amount)
    const scanMonths = MONTH_OPTIONS.map(m => m.key);
    const keyCounts = new Map<string, { name: string; categoryId: string; months: number }>();

    for (const mk of scanMonths) {
      const seen = new Set<string>();
      for (const e of getMonthExpenses(expenses, mk)) {
        if (e.type === 'one-time') continue;
        const k = `${e.name}|${e.categoryId}|${e.type}`;
        seen.add(k);
      }
      for (const k of seen) {
        const prev = keyCounts.get(k);
        const [name, categoryId] = k.split('|');
        if (!name || !categoryId) continue;
        if (prev) prev.months += 1;
        else keyCounts.set(k, { name, categoryId, months: 1 });
      }
    }

    let best: { name: string; categoryId: string; months: number } | null = null;
    for (const [, v] of keyCounts) {
      if (!best || v.months > best.months || (v.months === best.months && v.name < best.name)) {
        best = v;
      }
    }

    if (best && best.months > 0) {
      const cat = getCategoryById(best.categoryId);
      cards.push({
        id: 'chart-steady-recurring',
        eyebrow: 'Steady recurring',
        headline: best.name,
        detail: `Shows up in ${best.months} of ${scanMonths.length} recent months · ${cat.name}`,
        accentColor: cat.color,
        accentBg: cat.bg,
        phosphorIcon: 'arrows-clockwise',
      });
    } else {
      cards.push({
        id: 'chart-steady-recurring',
        eyebrow: 'Steady recurring',
        headline: 'No recurring pattern yet',
        detail: 'Add monthly or yearly expenses to spot your most consistent bills',
        accentColor: '#7C3AED',
        accentBg: '#EDE9FE',
        phosphorIcon: 'arrows-clockwise',
      });
    }

    return cards;
  }, [state.expenses, state.savingsGoals, monthKey, monthTotal, formatCurrency, range]);
}
