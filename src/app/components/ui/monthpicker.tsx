import * as React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { buttonVariants } from './button';
import { cn } from './utils';

type Month = {
  number: number;
  name: string;
};

const MONTHS: Month[][] = [
  [
    { number: 0, name: 'Jan' },
    { number: 1, name: 'Feb' },
    { number: 2, name: 'Mar' },
    { number: 3, name: 'Apr' },
  ],
  [
    { number: 4, name: 'May' },
    { number: 5, name: 'Jun' },
    { number: 6, name: 'Jul' },
    { number: 7, name: 'Aug' },
  ],
  [
    { number: 8, name: 'Sep' },
    { number: 9, name: 'Oct' },
    { number: 10, name: 'Nov' },
    { number: 11, name: 'Dec' },
  ],
];

type MonthCalProps = {
  selectedMonth?: Date;
  onMonthSelect?: (date: Date) => void;
  onYearForward?: () => void;
  onYearBackward?: () => void;
  callbacks?: {
    yearLabel?: (year: number) => string;
    monthLabel?: (month: Month) => string;
  };
  variant?: {
    calendar?: {
      main?: ButtonVariant;
      selected?: ButtonVariant;
    };
    chevrons?: ButtonVariant;
  };
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
};

type ButtonVariant =
  | 'default'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'destructive'
  | 'secondary'
  | null
  | undefined;

function MonthPicker({
  onMonthSelect,
  selectedMonth,
  minDate,
  maxDate,
  disabledDates,
  callbacks,
  onYearBackward,
  onYearForward,
  variant,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & MonthCalProps) {
  return (
    <div className={cn('min-w-[200px] w-full p-3', className)} {...props}>
      <MonthCal
        onMonthSelect={onMonthSelect}
        callbacks={callbacks}
        selectedMonth={selectedMonth}
        onYearBackward={onYearBackward}
        onYearForward={onYearForward}
        variant={variant}
        minDate={minDate}
        maxDate={maxDate}
        disabledDates={disabledDates}
      />
    </div>
  );
}

function MonthCal({
  selectedMonth,
  onMonthSelect,
  callbacks,
  variant,
  minDate,
  maxDate,
  disabledDates,
  onYearBackward,
  onYearForward,
}: MonthCalProps) {
  const selectedYear = selectedMonth?.getFullYear() ?? new Date().getFullYear();
  const selectedMonthIndex = selectedMonth?.getMonth() ?? new Date().getMonth();

  const [menuYear, setMenuYear] = React.useState(selectedYear);

  React.useEffect(() => {
    setMenuYear(selectedYear);
  }, [selectedYear]);

  const minYear = minDate?.getFullYear();
  const maxYear = maxDate?.getFullYear();
  const canGoBack = minYear == null || menuYear > minYear;
  const canGoForward = maxYear == null || menuYear < maxYear;

  const disabledDatesMapped = disabledDates?.map(d => ({
    year: d.getFullYear(),
    month: d.getMonth(),
  }));

  const isMonthDisabled = (m: Month) => {
    if (
      maxDate &&
      (menuYear > maxDate.getFullYear() ||
        (menuYear === maxDate.getFullYear() && m.number > maxDate.getMonth()))
    ) {
      return true;
    }
    if (
      minDate &&
      (menuYear < minDate.getFullYear() ||
        (menuYear === minDate.getFullYear() && m.number < minDate.getMonth()))
    ) {
      return true;
    }
    return disabledDatesMapped?.some(d => d.year === menuYear && d.month === m.number) ?? false;
  };

  return (
    <>
      <div className="relative flex items-center justify-center pt-1">
        <div className="text-sm font-semibold text-[#1A1A2E]">
          {callbacks?.yearLabel ? callbacks.yearLabel(menuYear) : menuYear}
        </div>
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => {
            setMenuYear(y => y - 1);
            onYearBackward?.();
          }}
          className={cn(
            buttonVariants({ variant: variant?.chevrons ?? 'outline' }),
            'absolute left-0 inline-flex h-7 w-7 items-center justify-center p-0',
          )}
          aria-label="Previous year"
        >
          <CaretLeft size={16} weight="bold" className="opacity-70" />
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => {
            setMenuYear(y => y + 1);
            onYearForward?.();
          }}
          className={cn(
            buttonVariants({ variant: variant?.chevrons ?? 'outline' }),
            'absolute right-0 inline-flex h-7 w-7 items-center justify-center p-0',
          )}
          aria-label="Next year"
        >
          <CaretRight size={16} weight="bold" className="opacity-70" />
        </button>
      </div>
      <table className="mt-2 w-full border-collapse">
        <tbody>
          {MONTHS.map((monthRow, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="mt-2 flex w-full">
              {monthRow.map(m => {
                const disabled = isMonthDisabled(m);
                const isSelected =
                  selectedMonth != null &&
                  menuYear === selectedYear &&
                  m.number === selectedMonthIndex;

                return (
                  <td key={m.number} className="relative h-10 w-1/4 p-0 text-center text-sm">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        onMonthSelect?.(new Date(menuYear, m.number, 1));
                      }}
                      className={cn(
                        buttonVariants({
                          variant: isSelected
                            ? (variant?.calendar?.selected ?? 'default')
                            : (variant?.calendar?.main ?? 'ghost'),
                        }),
                        'h-full w-full rounded-lg p-0 font-medium',
                        disabled &&
                          'cursor-not-allowed text-[#C4C4CF] opacity-50 hover:bg-transparent hover:text-[#C4C4CF]',
                        !disabled && !isSelected && 'text-[#1A1A2E] hover:bg-[#EDEDFF] hover:text-[#3E37FF]',
                      )}
                    >
                      {callbacks?.monthLabel ? callbacks.monthLabel(m) : m.name}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

MonthPicker.displayName = 'MonthPicker';

export { MonthPicker };
