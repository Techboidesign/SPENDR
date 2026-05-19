export type HomeRange = 'month' | 'year';

export const RANGE_LABELS: Record<HomeRange, string> = {
  month: 'Month',
  year: 'Year',
};

/** YYYY-MM in the user's local timezone (avoids UTC month drift from toISOString) */
export function toYearMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

const today = new Date();
export const CURRENT_MONTH_KEY = toYearMonthKey(today);
export const CURRENT_YEAR = today.getFullYear();

/** Last 12 calendar months ending at current month */
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
  const key = toYearMonthKey(date);
  return {
    key,
    label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  };
});

/** 12 months for bar chart (year view) */
export const YEAR_MONTH_BARS = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
  return {
    key: toYearMonthKey(date),
    label: date.toLocaleDateString('en-US', { month: 'short' }),
  };
});

export function getPreviousMonthKey(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const date = new Date(y, m - 2, 1);
  return toYearMonthKey(date);
}

export function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function momCompareLabel(yearMonth: string): string {
  const prev = getPreviousMonthKey(yearMonth);
  return `${monthLabel(yearMonth)} vs ${monthLabel(prev)}`;
}
