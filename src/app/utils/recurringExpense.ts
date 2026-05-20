import type { Expense } from '../data/types';

/** Stable identity for a recurring expense series (monthly/yearly). */
export function recurringSeriesKey(expense: Expense): string {
  if (expense.type === 'one-time') return expense.id;
  return `${expense.type}|${expense.categoryId}|${expense.name.trim().toLowerCase()}`;
}

function pickCanonicalRecurring(a: Expense, b: Expense): Expense {
  if (a.startDate && !b.startDate) return a;
  if (b.startDate && !a.startDate) return b;
  if (a.date > b.date) return a;
  if (b.date > a.date) return b;
  return a;
}

/** One canonical row per recurring series — prefers startDate, then latest date. */
export function buildCanonicalRecurringMap(expenses: Expense[]): Map<string, Expense> {
  const map = new Map<string, Expense>();
  for (const e of expenses) {
    if (e.type === 'one-time') continue;
    const key = recurringSeriesKey(e);
    const prev = map.get(key);
    map.set(key, prev ? pickCanonicalRecurring(e, prev) : e);
  }
  return map;
}

function recurringEffectiveStartYm(expense: Expense): string {
  return (expense.startDate ?? expense.date).slice(0, 7);
}

export function recurringAppliesToMonth(expense: Expense, targetYearMonth: string): boolean {
  if (expense.type === 'one-time') {
    return expense.date.startsWith(targetYearMonth);
  }

  if (targetYearMonth < recurringEffectiveStartYm(expense)) {
    return false;
  }

  if (expense.endDate && targetYearMonth > expense.endDate.slice(0, 7)) {
    return false;
  }

  if (expense.type === 'yearly') {
    const start = expense.startDate ?? expense.date;
    const expenseDate = new Date(start + 'T00:00:00');
    const [targetYear, targetMonth] = targetYearMonth.split('-').map(Number);
    const targetDate = new Date(targetYear, targetMonth - 1, 1);
    if (expenseDate > targetDate) return false;
    return true;
  }

  return true;
}

/** Apply recurring field updates to every row in the same series (legacy per-month duplicates). */
export function applyRecurringSeriesUpdate(
  expenses: Expense[],
  updated: Expense,
): Expense[] {
  if (updated.type === 'one-time') {
    return expenses.map(e => (e.id === updated.id ? updated : e));
  }
  const seriesKey = recurringSeriesKey(updated);
  return expenses.map(e => {
    if (e.id === updated.id) return updated;
    if (e.type !== 'one-time' && recurringSeriesKey(e) === seriesKey) {
      return {
        ...e,
        name: updated.name,
        categoryId: updated.categoryId,
        amount: updated.amount,
        type: updated.type,
        notes: updated.notes,
        startDate: updated.startDate,
        endDate: updated.endDate,
      };
    }
    return e;
  });
}
