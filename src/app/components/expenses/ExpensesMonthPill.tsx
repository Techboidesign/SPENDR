import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CalendarBlank, CaretDown } from '@phosphor-icons/react';
import { monthPickerLabel } from '../../utils/periods';
import { MonthYearPickerDropdown } from '../shared/MonthYearPickerDropdown';

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

export function AnimatedMonthTotal({
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

  const formatted = formatCurrency(display);

  return (
    <span
      style={{
        ...pillBase,
        backgroundColor: TOTAL_GREEN,
        color: TOTAL_GREEN_TEXT,
        boxShadow: 'none',
        fontWeight: 500,
        gap: 4,
      }}
    >
      <span>Month&apos;s total:</span>
      <span style={{ fontWeight: 700 }}>{formatted}</span>
    </span>
  );
}

export function ExpensesMonthPill({
  monthKey,
  onMonthChange,
  disabled = false,
  trailingSlot,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
  disabled?: boolean;
  trailingSlot?: ReactNode;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  const monthDisplay = monthPickerLabel(monthKey);

  useEffect(() => {
    if (disabled) setDropdownOpen(false);
  }, [disabled]);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        zIndex: dropdownOpen ? 400 : 1,
        width: '100%',
        opacity: disabled ? 0.38 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'opacity 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <button
            ref={monthBtnRef}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="dialog"
            style={{
              ...pillBase,
              cursor: disabled ? 'default' : 'pointer',
              backgroundColor: disabled ? '#9CA3AF' : BRAND,
              color: '#FFFFFF',
              boxShadow: disabled ? 'none' : '0 2px 10px rgba(62, 55, 255, 0.35)',
            }}
          >
            <CalendarBlank size={15} weight="regular" color="#FFFFFF" aria-hidden />
            <span>{monthDisplay}</span>
            <CaretDown size={12} weight="bold" color="#FFFFFF" aria-hidden />
          </button>
        </div>

        {trailingSlot != null && (
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{trailingSlot}</div>
        )}
      </div>

      {dropdownOpen && !disabled && (
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
