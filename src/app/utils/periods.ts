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

export function getNextMonthKey(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const date = new Date(y, m, 1);
  return toYearMonthKey(date);
}

export const MONTH_PICKER_MIN_KEY = MONTH_OPTIONS[0].key;
export const MONTH_PICKER_MAX_KEY = MONTH_OPTIONS[MONTH_OPTIONS.length - 1].key;

export function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/** Short label for month pickers, e.g. "May 2026" */
export function monthPickerLabel(yearMonth: string): string {
  return MONTH_OPTIONS.find(m => m.key === yearMonth)?.label ?? monthLabel(yearMonth);
}

export function monthKeyToDate(yearMonth: string): Date {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

/** Bounds for month pickers (last 12 calendar months). */
export const MONTH_PICKER_MIN_DATE = monthKeyToDate(MONTH_OPTIONS[0].key);
export const MONTH_PICKER_MAX_DATE = monthKeyToDate(
  MONTH_OPTIONS[MONTH_OPTIONS.length - 1].key,
);

export function momCompareLabel(yearMonth: string): string {
  const prev = getPreviousMonthKey(yearMonth);
  return `${monthLabel(yearMonth)} vs ${monthLabel(prev)}`;
}
