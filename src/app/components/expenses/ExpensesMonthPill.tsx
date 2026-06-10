import { MONTH_PICKER_MAX_KEY, MONTH_PICKER_MIN_KEY } from '../../utils/periods';
import { MonthYearPill } from '../shared/MonthYearPill';

export function ExpensesMonthPill({
  monthKey,
  onMonthChange,
  disabled = false,
  trailingSlot,
  variant = 'full',
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
  disabled?: boolean;
  trailingSlot?: React.ReactNode;
  variant?: 'full' | 'inline';
}) {
  return (
    <MonthYearPill
      monthKey={monthKey}
      onMonthChange={onMonthChange}
      disabled={disabled}
      trailingSlot={trailingSlot}
      variant={variant}
      minMonthKey={MONTH_PICKER_MIN_KEY}
      maxMonthKey={MONTH_PICKER_MAX_KEY}
    />
  );
}
