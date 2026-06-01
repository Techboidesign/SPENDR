import type { Category } from './categories';
import type { CategoryIconKey } from './categoryConfig';
import {
  getPrimaryGoalDefinition,
  parsePrimaryGoal,
  type PrimaryGoalId,
} from './primaryGoalConfig';
import type { AppState, Expense } from './types';
import { goalRequiresTargetSetup } from './primaryGoalTarget';
import { generateId } from '../utils/id';
import { buildCanonicalRecurringMap, recurringAppliesToMonth } from '../utils/recurringExpense';
import { CURRENT_MONTH_KEY } from '../utils/periods';

export const FOCUS_CATEGORY_PREFIX = 'focus-';

/** Short picker / expense labels per focus type. */
export const FOCUS_CATEGORY_LABEL: Record<
  Exclude<PrimaryGoalId, 'track'>,
  string
> = {
  save: 'Goal',
  debt: 'Debt',
  emergency: 'Emergency',
};

const FOCUS_ICON_KEY: Record<Exclude<PrimaryGoalId, 'track'>, CategoryIconKey> = {
  save: 'piggy',
  debt: 'card',
  emergency: 'bank',
};

export function focusCategoryId(goalId: PrimaryGoalId): string | null {
  if (goalId === 'track') return null;
  return `${FOCUS_CATEGORY_PREFIX}${goalId}`;
}

export function isFocusCategoryId(categoryId: string): boolean {
  return categoryId.startsWith(FOCUS_CATEGORY_PREFIX);
}

export function focusGoalIdFromCategoryId(
  categoryId: string,
): Exclude<PrimaryGoalId, 'track'> | null {
  if (!isFocusCategoryId(categoryId)) return null;
  const suffix = categoryId.slice(FOCUS_CATEGORY_PREFIX.length);
  if (suffix === 'save' || suffix === 'debt' || suffix === 'emergency') return suffix;
  return null;
}

export function getActiveFocusCategoryId(
  primaryGoal: PrimaryGoalId | null | undefined,
): string | null {
  return focusCategoryId(primaryGoal ?? 'track');
}

export function buildFocusCategory(
  goalId: Exclude<PrimaryGoalId, 'track'>,
): Category & { iconKey: CategoryIconKey } {
  const def = getPrimaryGoalDefinition(goalId);
  return {
    id: focusCategoryId(goalId)!,
    name: FOCUS_CATEGORY_LABEL[goalId],
    color: def.accentColor,
    bg: def.accentBg,
    iconColor: def.accentColor,
    iconKey: FOCUS_ICON_KEY[goalId],
  };
}

function incrementMonthKey(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export type FocusGoalId = Exclude<PrimaryGoalId, 'track'>;

const FOCUS_ADJUSTMENT_NAME: Record<FocusGoalId, { add: string; remove: string }> = {
  save: { add: 'Saved toward goal', remove: 'Goal progress adjustment' },
  debt: { add: 'Debt payment', remove: 'Debt payment adjustment' },
  emergency: { add: 'Emergency fund contribution', remove: 'Emergency fund adjustment' },
};

/** Goal progress entries are not monthly spending. */
export function isSpendingExpense(expense: Expense): boolean {
  return !isFocusCategoryId(expense.categoryId);
}

/** Label for a slider- or form-driven progress adjustment expense. */
export function focusGoalAdjustmentExpenseName(goalId: FocusGoalId, delta: number): string {
  const copy = FOCUS_ADJUSTMENT_NAME[goalId];
  return delta >= 0 ? copy.add : copy.remove;
}

/** One-time registry row when goal progress changes (delta may be negative). */
export function createFocusGoalAdjustmentExpense(
  focusCategoryIdValue: string,
  goalId: FocusGoalId,
  delta: number,
): Expense | null {
  if (delta === 0 || !isFocusCategoryId(focusCategoryIdValue)) return null;
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: generateId(),
    name: focusGoalAdjustmentExpenseName(goalId, delta),
    categoryId: focusCategoryIdValue,
    amount: delta,
    date: today,
    type: 'one-time',
  };
}

/** Keep `primaryGoalTarget.currentAmount` aligned with focus-category expenses (source of truth). */
export function syncPrimaryGoalTargetFromExpenses(state: AppState): AppState {
  const goalId = parsePrimaryGoal(state.primaryGoal ?? undefined);
  if (!goalRequiresTargetSetup(goalId) || !state.primaryGoalTarget) return state;
  const id = focusCategoryId(goalId);
  if (!id) return state;
  const fromExpenses = sumFocusCategoryContributions(state.expenses, id);
  if (fromExpenses === state.primaryGoalTarget.currentAmount) return state;
  return {
    ...state,
    primaryGoalTarget: { ...state.primaryGoalTarget, currentAmount: fromExpenses },
  };
}

/** Cumulative contributions logged in a focus category (all time). */
export function sumFocusCategoryContributions(
  expenses: Expense[],
  focusCategoryIdValue: string,
): number {
  let total = 0;

  for (const e of expenses) {
    if (e.categoryId !== focusCategoryIdValue) continue;
    if (e.type === 'one-time') total += e.amount;
  }

  const recurring = [...buildCanonicalRecurringMap(expenses).values()].filter(
    e => e.categoryId === focusCategoryIdValue && e.type !== 'one-time',
  );
  if (recurring.length === 0) return total;

  const startYm = recurring
    .map(e => (e.startDate ?? e.date).slice(0, 7))
    .sort()[0];
  let ym = startYm;
  while (ym <= CURRENT_MONTH_KEY) {
    for (const e of recurring) {
      if (recurringAppliesToMonth(e, ym)) total += e.amount;
    }
    ym = incrementMonthKey(ym);
  }

  return total;
}
