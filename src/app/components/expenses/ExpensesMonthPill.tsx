import { MONTH_PICKER_MAX_KEY, MONTH_PICKER_MIN_KEY } from '../../utils/periods';
import { MonthYearPill } from '../shared/MonthYearPill';

export function ExpensesMonthPill({
  monthKey,
  onMonthChange,
  disabled = false,
  trailingSlot,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
  disabled?: boolean;
  trailingSlot?: React.ReactNode;
}) {
  return (
    <MonthYearPill
      monthKey={monthKey}
      onMonthChange={onMonthChange}
      disabled={disabled}
      trailingSlot={trailingSlot}
      minMonthKey={MONTH_PICKER_MIN_KEY}
      maxMonthKey={MONTH_PICKER_MAX_KEY}
    />
  );
}
