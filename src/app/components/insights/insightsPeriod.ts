import type { Expense } from '../../data/types';
import { getMonthExpenses } from '../../context/AppContext';
import type { HomeRange } from '../../utils/periods';
import { YEAR_MONTH_BARS } from '../../utils/periods';

export function getInsightsPeriodMonthKeys(range: HomeRange, selectedMonthKey: string): string[] {
  return range === 'year' ? YEAR_MONTH_BARS.map(m => m.key) : [selectedMonthKey];
}

/** Expenses applicable to the selected period (month = that month only). */
export function getPeriodExpenses(
  expenses: Expense[],
  range: HomeRange,
  selectedMonthKey: string,
): Expense[] {
  const keys = getInsightsPeriodMonthKeys(range, selectedMonthKey);
  if (range === 'month') {
    return getMonthExpenses(expenses, selectedMonthKey);
  }

  const oneTime = expenses.filter(
    e => e.type === 'one-time' && keys.some(k => e.date.startsWith(k)),
  );
  const recurringById = new Map<string, Expense>();
  for (const key of keys) {
    for (const e of getMonthExpenses(expenses, key)) {
      if (e.type !== 'one-time') recurringById.set(e.id, e);
    }
  }
  return [...oneTime, ...recurringById.values()];
}

export const PCT_OF_PERIOD_LABEL: Record<HomeRange, string> = {
  month: '% of monthly expenses',
  year: '% of yearly expenses',
};
