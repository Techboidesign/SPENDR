import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CalendarBlank, CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { monthPickerLabel } from '../../utils/periods';
import { MonthYearPickerDropdown } from '../shared/MonthYearPickerDropdown';
import { MONTH_OPTIONS } from '../../utils/periods';

const BRAND = '#3E37FF';
const TOTAL_GREEN = '#D1FAE5';
const TOTAL_GREEN_TEXT = '#166534';

const pillBase: CSSProperties = {
  flexShrink: 0,
  boxSizing: 'border-box',
  padding: '8px 12px',
  borderRadius: 9999,
  border: 'none',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'inherit',
  lineHeight: 1.2,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  whiteSpace: 'nowrap',
  minHeight: 32,
};

function AnimatedMonthTotal({
  value,
  formatCurrency,
}: {
  value: number;
  formatCurrency: (amount: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    fromRef.current = value;

    if (from === to) return;

    const duration = 600;
    const frames = 45;
    const step = (to - from) / frames;
    const interval = duration / frames;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      if (frame >= frames) {
        setDisplay(to);
        clearInterval(timer);
      } else {
        setDisplay(from + step * frame);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span
      style={{
        ...pillBase,
        backgroundColor: TOTAL_GREEN,
        color: TOTAL_GREEN_TEXT,
        boxShadow: 'none',
      }}
    >
      {formatCurrency(display)}
    </span>
  );
}

function navBtn(disabled: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 9999,
    border: 'none',
    backgroundColor: disabled ? 'transparent' : '#F7F7FA',
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    opacity: disabled ? 0.35 : 1,
    transition: 'background-color 0.15s ease',
  };
}

export function ExpensesMonthPill({
  monthKey,
  onMonthChange,
  monthTotal,
  formatCurrency,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
  monthTotal?: number;
  formatCurrency?: (amount: number) => string;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  const monthIndex = MONTH_OPTIONS.findIndex(m => m.key === monthKey);
  const safeIndex = monthIndex >= 0 ? monthIndex : MONTH_OPTIONS.length - 1;
  const canGoPrev = safeIndex > 0;
  const canGoNext = safeIndex < MONTH_OPTIONS.length - 1;

  const monthDisplay = monthPickerLabel(monthKey);

  const goPrev = () => {
    if (canGoPrev) onMonthChange(MONTH_OPTIONS[safeIndex - 1].key);
  };

  const goNext = () => {
    if (canGoNext) onMonthChange(MONTH_OPTIONS[safeIndex + 1].key);
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        zIndex: dropdownOpen ? 400 : 1,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <button
            ref={monthBtnRef}
            type="button"
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="dialog"
            style={{
              ...pillBase,
              cursor: 'pointer',
              backgroundColor: BRAND,
              color: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(62, 55, 255, 0.35)',
            }}
          >
            <CalendarBlank size={15} weight="regular" color="#FFFFFF" aria-hidden />
            <span>{monthDisplay}</span>
            <CaretDown size={12} weight="bold" color="#FFFFFF" aria-hidden />
          </button>

          {monthTotal !== undefined && formatCurrency !== undefined && (
            <AnimatedMonthTotal value={monthTotal} formatCurrency={formatCurrency} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev}
            aria-label="Previous month"
            style={navBtn(!canGoPrev)}
          >
            <CaretLeft size={16} weight="bold" color="#6B7280" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            aria-label="Next month"
            style={navBtn(!canGoNext)}
          >
            <CaretRight size={16} weight="bold" color="#6B7280" />
          </button>
        </div>
      </div>

      {dropdownOpen && (
        <MonthYearPickerDropdown
          monthKey={monthKey}
          onChange={onMonthChange}
          onClose={() => setDropdownOpen(false)}
          anchorRect={monthBtnRef.current?.getBoundingClientRect() ?? null}
        />
      )}
    </div>
  );
}
