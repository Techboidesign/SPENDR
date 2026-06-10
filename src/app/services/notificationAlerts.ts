import type { AppState, NotificationPreferences } from '../data/types';
import { mergeNotificationPreferences } from '../data/notificationPreferences';
import {
  buildCanonicalRecurringMap,
  recurringAppliesToMonth,
  recurringSeriesKey,
} from '../utils/recurringExpense';
import { getMonthSpendingTotal, getMonthlyAmount } from '../context/AppContext';
import { isSpendingExpense } from '../data/focusCategory';

export type NotificationBannerVariant = 'info' | 'warning' | 'success';

export interface NotificationAlertPayload {
  /** Stable dedupe id */
  id: string;
  title: string;
  message: string;
  variant: NotificationBannerVariant;
}

type ScoredAlert = NotificationAlertPayload & { priority: number };

const SEEN_STORAGE_KEY = 'spendr:notification-seen:v1';
const SEEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function currentYearMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function weekStartKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function loadSeenIds(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    const pruned: Record<string, number> = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (now - ts < SEEN_TTL_MS) pruned[id] = ts;
    }
    return pruned;
  } catch {
    return {};
  }
}

function saveSeenIds(seen: Record<string, number>): void {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seen));
  } catch {
    /* quota / private mode */
  }
}

export function markNotificationSeen(id: string): void {
  const seen = loadSeenIds();
  seen[id] = Date.now();
  saveSeenIds(seen);
}

export function wasNotificationSeen(id: string): boolean {
  return Boolean(loadSeenIds()[id]);
}

/** Mark lower milestone bands seen when a higher band applies (avoids backlog). */
function markSupersededMilestonesSeen(
  monthKey: string,
  categoryId: string,
  usagePercent: number,
): void {
  const bands = [50, 75, 100] as const;
  for (const band of bands) {
    if (usagePercent >= band) {
      markNotificationSeen(`${monthKey}-milestone-${categoryId}-${band}`);
    }
  }
}

function monthSpendTotal(state: AppState, monthKey: string): number {
  return getMonthSpendingTotal(state.expenses, monthKey);
}

function weekSpendTotal(state: AppState, weekStart: string): number {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return state.expenses
    .filter(e => {
      if (!isSpendingExpense(e)) return false;
      const d = new Date(`${e.date}T12:00:00`);
      return d >= start && d < end;
    })
    .reduce((sum, e) => sum + getMonthlyAmount(e), 0);
}

function daysUntilRecurringCharge(
  expense: AppState['expenses'][number],
  today = new Date(),
): number | null {
  if (expense.type === 'one-time') return null;
  const anchor = expense.startDate ?? expense.date;
  const day = Number.parseInt(anchor.slice(8, 10), 10);
  if (Number.isNaN(day)) return null;

  const due = new Date(today.getFullYear(), today.getMonth(), day);
  if (due < today) {
    due.setMonth(due.getMonth() + 1);
  }
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - todayMidnight.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

function pickTopUnseenAlert(candidates: ScoredAlert[]): NotificationAlertPayload | null {
  const unseen = candidates
    .filter(a => !wasNotificationSeen(a.id))
    .sort((a, b) => b.priority - a.priority);
  if (unseen.length === 0) return null;
  const { priority: _p, ...payload } = unseen[0];
  return payload;
}

export interface EvaluateNotificationAlertsInput {
  state: AppState;
  prefs: NotificationPreferences;
  formatCurrency: (amount: number) => string;
}

/**
 * Returns at most one in-app banner — the highest-priority unseen alert for now.
 */
export function evaluateNotificationAlerts({
  state,
  prefs,
  formatCurrency,
}: EvaluateNotificationAlertsInput): NotificationAlertPayload | null {
  const resolvedPrefs = mergeNotificationPreferences(prefs);
  const candidates: ScoredAlert[] = [];
  const monthKey = currentYearMonth();
  const monthTotal = monthSpendTotal(state, monthKey);

  if (resolvedPrefs.budgetAlerts && state.monthlyBudget > 0) {
    const pct = (monthTotal / state.monthlyBudget) * 100;
    if (pct >= 100) {
      candidates.push({
        id: `${monthKey}-budget-over`,
        title: 'Over monthly budget',
        message: `You've spent ${formatCurrency(monthTotal)} of your ${formatCurrency(state.monthlyBudget)} budget.`,
        variant: 'warning',
        priority: 1000,
      });
    } else if (pct >= 80) {
      candidates.push({
        id: `${monthKey}-budget-warning`,
        title: 'Approaching budget limit',
        message: `${Math.round(pct)}% of your ${formatCurrency(state.monthlyBudget)} monthly budget is used.`,
        variant: 'warning',
        priority: 800,
      });
    }
  }

  const billPrefsOn = resolvedPrefs.billReminders || resolvedPrefs.recurringReminders;
  if (billPrefsOn) {
    const recurring = buildCanonicalRecurringMap(state.expenses);
    let soonest: { expense: AppState['expenses'][number]; days: number } | null = null;
    for (const expense of recurring.values()) {
      if (!recurringAppliesToMonth(expense, monthKey)) continue;
      const days = daysUntilRecurringCharge(expense);
      if (days === null || days > 3) continue;
      if (!soonest || days < soonest.days) {
        soonest = { expense, days };
      }
    }
    if (soonest) {
      const { expense, days } = soonest;
      const dueLabel = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
      candidates.push({
        id: `${monthKey}-bill-${recurringSeriesKey(expense)}`,
        title: 'Upcoming payment',
        message: `${expense.name} (${formatCurrency(expense.amount)}) is due ${dueLabel}.`,
        variant: 'info',
        priority: 600 - days * 10,
      });
    }
  }

  if (resolvedPrefs.goalMilestones) {
    for (const goal of state.savingsGoals) {
      if (goal.targetAmount <= 0) continue;
      const pct = (goal.currentAmount / goal.targetAmount) * 100;
      const goalKey = goal.id;

      if (pct >= 100) {
        markSupersededMilestonesSeen(monthKey, goalKey, pct);
        candidates.push({
          id: `${monthKey}-savings-${goalKey}-complete`,
          title: 'Savings goal reached',
          message: `You've hit your ${goal.name} target of ${formatCurrency(goal.targetAmount)}.`,
          variant: 'success',
          priority: 850,
        });
        continue;
      }

      if (pct >= 80) {
        markSupersededMilestonesSeen(monthKey, goalKey, pct);
        continue;
      }

      const milestone = pct >= 75 ? 75 : pct >= 50 ? 50 : null;
      if (!milestone) continue;

      candidates.push({
        id: `${monthKey}-milestone-${goalKey}-${milestone}`,
        title: 'Savings milestone',
        message: `You're ${milestone}% of the way to ${goal.name}.`,
        variant: 'info',
        priority: 300 + milestone,
      });
    }
  }

  if (resolvedPrefs.weeklySummary) {
    const weekKey = weekStartKey();
    const weekTotal = weekSpendTotal(state, weekKey);
    if (weekTotal > 0) {
      candidates.push({
        id: `${weekKey}-weekly-summary`,
        title: 'Weekly summary',
        message: `This week you've tracked ${formatCurrency(weekTotal)} in spending.`,
        variant: 'info',
        priority: 100,
      });
    }
  }

  return pickTopUnseenAlert(candidates);
}
