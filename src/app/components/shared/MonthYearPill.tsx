import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useAppColors } from '../../context/AppearanceContext';
import {
  getNextMonthKey,
  getPreviousMonthKey,
  monthPickerLabel,
  MONTH_PICKER_MAX_DATE,
  MONTH_PICKER_MAX_KEY,
  MONTH_PICKER_MIN_DATE,
  MONTH_PICKER_MIN_KEY,
} from '../../utils/periods';
import { MonthYearPickerDropdown } from './MonthYearPickerDropdown';

const BRAND = '#3E37FF';

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

function MonthNavButton({
  onClick,
  disabled,
  ariaLabel,
  compact = false,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  compact?: boolean;
  children: ReactNode;
}) {
  const c = useAppColors();
  const size = compact ? 28 : 32;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        ...pillBase,
        width: size,
        minWidth: size,
        minHeight: size,
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

/** Month/year selector pill — same control as Expenses month filter. */
export function MonthYearPill({
  monthKey,
  onMonthChange,
  disabled = false,
  trailingSlot,
  variant = 'full',
  minMonthKey = MONTH_PICKER_MIN_KEY,
  maxMonthKey = MONTH_PICKER_MAX_KEY,
  minDate = MONTH_PICKER_MIN_DATE,
  maxDate = MONTH_PICKER_MAX_DATE,
  dropdownZIndex = 400,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
  disabled?: boolean;
  trailingSlot?: ReactNode;
  /** `inline` — sits beside a screen title; no calendar icon, fits content. */
  variant?: 'full' | 'inline';
  minMonthKey?: string;
  maxMonthKey?: string;
  minDate?: Date;
  maxDate?: Date;
  dropdownZIndex?: number;
}) {
  const isInline = variant === 'inline';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  const monthDisplay = monthPickerLabel(monthKey);
  const canGoPrev = monthKey > minMonthKey;
  const canGoNext = monthKey < maxMonthKey;

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
        zIndex: dropdownOpen ? dropdownZIndex : 1,
        width: isInline ? 'auto' : '100%',
        flexShrink: isInline ? 0 : undefined,
        opacity: disabled ? 0.38 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'opacity 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: isInline ? 'auto' : '100%',
          gap: trailingSlot != null ? 12 : isInline ? 4 : 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isInline ? 4 : 6,
            minWidth: 0,
            flex: isInline ? '0 1 auto' : 1,
            width: !isInline && trailingSlot == null ? '100%' : undefined,
          }}
        >
          {isInline ? (
            <>
              <button
                ref={monthBtnRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="dialog"
                style={{
                  ...pillBase,
                  flex: '0 1 auto',
                  minWidth: 0,
                  padding: '6px 10px',
                  fontSize: 11,
                  cursor: disabled ? 'default' : 'pointer',
                  backgroundColor: disabled ? '#9CA3AF' : BRAND,
                  color: '#FFFFFF',
                  boxShadow: disabled ? 'none' : '0 2px 10px rgba(62, 55, 255, 0.35)',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{monthDisplay}</span>
                <CaretDown size={10} weight="bold" color="#FFFFFF" aria-hidden />
              </button>
              <MonthNavButton
                onClick={goPrev}
                disabled={disabled || !canGoPrev}
                ariaLabel="Previous month"
                compact
              >
                <CaretLeft size={14} weight="bold" aria-hidden />
              </MonthNavButton>
              <MonthNavButton
                onClick={goNext}
                disabled={disabled || !canGoNext}
                ariaLabel="Next month"
                compact
              >
                <CaretRight size={14} weight="bold" aria-hidden />
              </MonthNavButton>
            </>
          ) : (
            <>
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
                  flex: 1,
                  minWidth: 0,
                  cursor: disabled ? 'default' : 'pointer',
                  backgroundColor: disabled ? '#9CA3AF' : BRAND,
                  color: '#FFFFFF',
                  boxShadow: disabled ? 'none' : '0 2px 10px rgba(62, 55, 255, 0.35)',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{monthDisplay}</span>
                <CaretDown size={12} weight="bold" color="#FFFFFF" aria-hidden />
              </button>
              <MonthNavButton
                onClick={goNext}
                disabled={disabled || !canGoNext}
                ariaLabel="Next month"
              >
                <CaretRight size={16} weight="bold" aria-hidden />
              </MonthNavButton>
            </>
          )}
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
          minDate={minDate}
          maxDate={maxDate}
        />
      )}
    </div>
  );
}
