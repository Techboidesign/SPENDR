import { useMemo } from 'react';
import { AppState } from '../data/types';
import { useApp } from '../context/AppContext';
import {
  getMonthExpenses,
  getMonthlyAmount,
} from '../context/AppContext';
import type { HomeRange } from '../utils/periods';
import {
  CURRENT_YEAR,
  getPreviousMonthKey,
  YEAR_MONTH_BARS,
} from '../utils/periods';

export function usePeriodInsights(
  expenses: AppState['expenses'],
  range: HomeRange,
  monthKey: string,
) {
  const { categories } = useApp();
  const monthlyBarData = useMemo(() => {
    return YEAR_MONTH_BARS.map((m, idx, arr) => {
      const monthExpenses = getMonthExpenses(expenses, m.key);
      const total = monthExpenses.reduce((s, e) => s + getMonthlyAmount(e), 0);
      return { month: m.label, total, isLast: idx === arr.length - 1 };
    });
  }, [expenses]);

  const recurringData = useMemo(() => {
    let recurring = 0;
    let oneTime = 0;

    if (range === 'month') {
      const monthExpenses = getMonthExpenses(expenses, monthKey);
      for (const exp of monthExpenses) {
        const amount = getMonthlyAmount(exp);
        if (exp.type === 'one-time') oneTime += amount;
        else recurring += amount;
      }
    } else {
      for (const m of YEAR_MONTH_BARS) {
        const monthExpenses = getMonthExpenses(expenses, m.key);
        for (const exp of monthExpenses) {
          const amount = getMonthlyAmount(exp);
          if (exp.type === 'one-time') oneTime += amount;
          else recurring += amount;
        }
      }
    }

    return [
      { name: 'Recurring', value: recurring, color: '#3E37FF', fill: '#3E37FF' },
      { name: 'One-time', value: oneTime, color: '#06B6D4', fill: '#06B6D4' },
    ];
  }, [expenses, range, monthKey]);

  const grandTotal = useMemo(
    () => recurringData[0].value + recurringData[1].value,
    [recurringData],
  );

  const recurringPct =
    grandTotal > 0
      ? ((recurringData[0].value / grandTotal) * 100).toFixed(0)
      : '0';

  const topExpenses = useMemo(() => {
    if (range !== 'month') return [];

    const prev = getPreviousMonthKey(monthKey);
    const curExpenses = getMonthExpenses(expenses, monthKey);
    const prevExpenses = getMonthExpenses(expenses, prev);

    const monthTotal = curExpenses.reduce((s, e) => s + getMonthlyAmount(e), 0);

    const items: Array<{
      cat: string;
      curAmt: number;
      prevAmt: number;
      pctChange: number;
      pctOfTotal: number;
    }> = [];

    for (const cat of categories) {
      const curAmt = curExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((s, e) => s + getMonthlyAmount(e), 0);
      if (curAmt <= 0) continue;

      const prevAmt = prevExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((s, e) => s + getMonthlyAmount(e), 0);

      const pctChange =
        prevAmt > 0 ? ((curAmt - prevAmt) / prevAmt) * 100 : 100;
      const pctOfTotal = monthTotal > 0 ? (curAmt / monthTotal) * 100 : 0;

      items.push({ cat: cat.id, curAmt, prevAmt, pctChange, pctOfTotal });
    }

    return items.sort((a, b) => b.curAmt - a.curAmt).slice(0, 5);
  }, [expenses, range, monthKey, categories]);

  const categorySegments = useMemo(() => {
    const totals: Record<string, number> = {};
    const monthExpenses = getMonthExpenses(expenses, monthKey);
    for (const exp of monthExpenses) {
      totals[exp.categoryId] = (totals[exp.categoryId] ?? 0) + getMonthlyAmount(exp);
    }
    return categories
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        amount: totals[cat.id] ?? 0,
      }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [expenses, monthKey, categories]);

  return {
    monthlyBarData,
    recurringData,
    grandTotal,
    recurringPct,
    topExpenses,
    categorySegments,
    yearLabel: String(CURRENT_YEAR),
  };
}
