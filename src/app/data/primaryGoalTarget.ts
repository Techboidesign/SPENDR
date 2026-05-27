import type { PrimaryGoalId } from './types';

export interface PrimaryGoalTarget {
  /** User-facing name (e.g. vacation, emergency fund). */
  name: string;
  targetAmount: number;
  /** ISO date YYYY-MM-DD */
  targetDate: string;
  /** Amount already saved / paid toward the target. */
  currentAmount: number;
}

export function createEmptyPrimaryGoalTarget(): PrimaryGoalTarget {
  return {
    name: '',
    targetAmount: 0,
    targetDate: '',
    currentAmount: 0,
  };
}

export function goalRequiresTargetSetup(goalId: PrimaryGoalId): boolean {
  return goalId === 'save' || goalId === 'debt' || goalId === 'emergency';
}

export function targetFromProfileFields(profile: {
  primary_goal_name?: string | null;
  primary_goal_target_amount?: number | null;
  primary_goal_target_date?: string | null;
  primary_goal_current_amount?: number | null;
}): PrimaryGoalTarget | null {
  const amount = profile.primary_goal_target_amount;
  const date = profile.primary_goal_target_date;
  if (amount == null || amount <= 0 || !date) return null;
  return {
    name: profile.primary_goal_name?.trim() ?? '',
    targetAmount: Number(amount),
    targetDate: date.slice(0, 10),
    currentAmount: Math.max(0, Number(profile.primary_goal_current_amount ?? 0)),
  };
}

export function targetToProfileFields(
  target: PrimaryGoalTarget | null,
  goalId: PrimaryGoalId | null,
): {
  primary_goal_name: string | null;
  primary_goal_target_amount: number | null;
  primary_goal_target_date: string | null;
  primary_goal_current_amount: number;
} {
  if (!target || !goalId || !goalRequiresTargetSetup(goalId)) {
    return {
      primary_goal_name: null,
      primary_goal_target_amount: null,
      primary_goal_target_date: null,
      primary_goal_current_amount: 0,
    };
  }
  return {
    primary_goal_name: target.name.trim() || null,
    primary_goal_target_amount: target.targetAmount,
    primary_goal_target_date: target.targetDate || null,
    primary_goal_current_amount: Math.max(0, target.currentAmount),
  };
}

export function isPrimaryGoalTargetValid(
  goalId: PrimaryGoalId,
  target: PrimaryGoalTarget,
): boolean {
  if (!goalRequiresTargetSetup(goalId)) return true;
  if (target.targetAmount <= 0) return false;
  if (!target.targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(target.targetDate)) return false;
  const end = new Date(`${target.targetDate}T23:59:59`);
  if (Number.isNaN(end.getTime())) return false;
  if (target.currentAmount < 0 || target.currentAmount > target.targetAmount) return false;
  return true;
}

export function daysUntilTargetDate(targetDate: string): number | null {
  if (!targetDate) return null;
  const end = new Date(`${targetDate}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatTargetDateShort(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
