/** Semantic budget usage colors (green → yellow → red). */
export const BUDGET_PROGRESS_COLORS = {
  safe: '#10B981',
  warning: '#F59E0B',
  over: '#EF4444',
} as const;

export const BUDGET_WARN_PERCENT = 85;

/** Usage % vs limit; not capped (can exceed 100). */
export function getBudgetUsagePercent(spent: number, limit: number): number {
  if (limit <= 0) return spent > 0 ? 100 : 0;
  return (spent / limit) * 100;
}

export function getBudgetProgressColor(usagePercent: number): string {
  if (usagePercent > 100) return BUDGET_PROGRESS_COLORS.over;
  if (usagePercent >= BUDGET_WARN_PERCENT) return BUDGET_PROGRESS_COLORS.warning;
  return BUDGET_PROGRESS_COLORS.safe;
}

/** Ring arc fill (0–100 — full circle when at or over budget). */
export function getBudgetRingFillPercent(usagePercent: number): number {
  return Math.min(Math.max(usagePercent, 0), 100);
}
