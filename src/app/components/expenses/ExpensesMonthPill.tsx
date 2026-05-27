import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CalendarBlank, CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useAppearance, useAppColors } from '../../context/AppearanceContext';
import {
  getNextMonthKey,
  getPreviousMonthKey,
  monthPickerLabel,
  MONTH_PICKER_MAX_KEY,
  MONTH_PICKER_MIN_KEY,
} from '../../utils/periods';
import { MonthYearPickerDropdown } from '../shared/MonthYearPickerDropdown';

const BRAND = '#3E37FF';
/** Light-mode month total pill */
const TOTAL_GREEN_BG = '#D1FAE5';
const TOTAL_GREEN_FG = '#166534';
/** Dark-mode month total pill background */
const TOTAL_GREEN_BG_DARK = 'rgba(8, 38, 22, 1)';

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
  const { isDark } = useAppearance();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const pillBg = isDark ? TOTAL_GREEN_BG_DARK : TOTAL_GREEN_BG;
  const pillFg = isDark ? '#4ADE80' : TOTAL_GREEN_FG;

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
      className="font-figure"
      style={{
        ...pillBase,
        height: 32,
        minHeight: 32,
        backgroundColor: pillBg,
        color: pillFg,
        boxShadow: 'none',
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {formatted}
    </span>
  );
}

function MonthNavButton({
  onClick,
  disabled,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  const c = useAppColors();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        ...pillBase,
        width: 32,
        minWidth: 32,
        padding: 0,
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        backgroundColor: disabled ? c.surfaceInset : c.canvas,
        color: disabled ? c.textFaint : c.text,
        border: `1px solid ${c.borderSubtle}`,
        boxShadow: 'none',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
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
  const canGoPrev = monthKey > MONTH_PICKER_MIN_KEY;
  const canGoNext = monthKey < MONTH_PICKER_MAX_KEY;

  const goPrev = () => {
    if (!disabled && canGoPrev) {
      onMonthChange(getPreviousMonthKey(monthKey));
      setDropdownOpen(false);
    }
  };

  const goNext = () => {
    if (!disabled && canGoNext) {
      onMonthChange(getNextMonthKey(monthKey));
      setDropdownOpen(false);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <MonthNavButton
            onClick={goPrev}
            disabled={disabled || !canGoPrev}
            ariaLabel="Previous month"
          >
            <CaretLeft size={16} weight="bold" aria-hidden />
          </MonthNavButton>
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
          <MonthNavButton
            onClick={goNext}
            disabled={disabled || !canGoNext}
            ariaLabel="Next month"
          >
            <CaretRight size={16} weight="bold" aria-hidden />
          </MonthNavButton>
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
