import { useMemo } from 'react';
import type { TopExpenseItem } from '../components/home/TopExpensesCard';
import { useApp, getMonthExpenses, getMonthlyAmount } from '../context/AppContext';
import { getPreviousMonthKey } from '../utils/periods';

/** Top categories by spend with month-over-month change (current month only). */
export function useInsightsTopCategories(monthKey: string, limit = 5): TopExpenseItem[] {
  const { state, categories } = useApp();

  return useMemo(() => {
    const prev = getPreviousMonthKey(monthKey);
    const curExpenses = getMonthExpenses(state.expenses, monthKey);
    const prevExpenses = getMonthExpenses(state.expenses, prev);
    const monthTotal = curExpenses.reduce((s, e) => s + getMonthlyAmount(e), 0);

    const items: TopExpenseItem[] = [];

    for (const cat of categories) {
      const curAmt = curExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((s, e) => s + getMonthlyAmount(e), 0);
      if (curAmt <= 0) continue;

      const prevAmt = prevExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((s, e) => s + getMonthlyAmount(e), 0);

      const pctChange = prevAmt > 0 ? ((curAmt - prevAmt) / prevAmt) * 100 : 100;
      const pctOfTotal = monthTotal > 0 ? (curAmt / monthTotal) * 100 : 0;

      items.push({ cat: cat.id, curAmt, prevAmt, pctChange, pctOfTotal });
    }

    return items.sort((a, b) => b.curAmt - a.curAmt).slice(0, limit);
  }, [state.expenses, monthKey, categories, limit]);
}
