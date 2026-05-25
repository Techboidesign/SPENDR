import { useRef, useState, type CSSProperties } from 'react';
import { CalendarBlank, CaretDown } from '@phosphor-icons/react';
import type { HomeRange } from '../../utils/periods';
import { monthPickerLabel } from '../../utils/periods';
import { MonthYearPickerDropdown } from '../shared/MonthYearPickerDropdown';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';

const tabBtnBase: CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  borderRadius: 9999,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'inherit',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minWidth: 0,
};

export function RangeToggle({
  range,
  onChange,
  monthKey,
  onMonthChange,
  compact = false,
}: {
  range: HomeRange;
  onChange: (r: HomeRange) => void;
  monthKey: string;
  onMonthChange: (key: string) => void;
  compact?: boolean;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  const monthDisplay = monthPickerLabel(monthKey);

  const activeTabStyle = (isActive: boolean): CSSProperties => {
    if (isActive) {
      return {
        fontWeight: 600,
        backgroundColor: c.accent,
        color: c.onAccent,
        boxShadow: '0 2px 10px rgba(62, 55, 255, 0.35)',
      };
    }
    return {
      fontWeight: 500,
      backgroundColor: 'transparent',
      color: c.textMuted,
      boxShadow: 'none',
    };
  };

  const handleMonthClick = () => {
    if (range === 'year') {
      onChange('month');
      return;
    }
    setDropdownOpen(o => !o);
  };

  const monthActive = range === 'month';
  const yearActive = range === 'year';

  return (
    <div
      style={{
        position: 'relative',
        flex: compact ? '0 0 auto' : undefined,
        width: compact ? 'fit-content' : undefined,
        zIndex: dropdownOpen ? 400 : compact ? 20 : undefined,
      }}
    >
      <div
        style={{
          display: compact ? 'inline-flex' : 'flex',
          width: compact ? 'fit-content' : undefined,
          backgroundColor: compact
            ? isDark
              ? c.surfaceElevated
              : c.surface
            : isDark
              ? c.surfaceElevated
              : c.chipBg,
          borderRadius: 9999,
          padding: 4,
          gap: 4,
          backdropFilter: compact && isDark ? 'blur(12px)' : undefined,
          WebkitBackdropFilter: compact && isDark ? 'blur(12px)' : undefined,
          boxShadow: compact ? (isDark ? c.shadowSm : '0 2px 10px rgba(15, 23, 42, 0.08)') : undefined,
          border: compact
            ? isDark
              ? `1px solid ${c.borderSubtle}`
              : `1px solid ${c.border}`
            : isDark
              ? `1px solid ${c.borderSubtle}`
              : undefined,
        }}
      >
        <button
          ref={monthBtnRef}
          type="button"
          onClick={handleMonthClick}
          aria-expanded={dropdownOpen && monthActive}
          aria-haspopup="dialog"
          style={{
            ...tabBtnBase,
            ...activeTabStyle(monthActive),
            flex: compact || monthActive ? '0 0 auto' : 1,
            padding: monthActive ? '8px 12px' : tabBtnBase.padding,
            whiteSpace: 'nowrap',
          }}
        >
          {monthActive && (
            <CalendarBlank size={15} weight="regular" color={c.onAccent} aria-hidden />
          )}
          <span>{monthActive ? monthDisplay : 'Month'}</span>
          {monthActive && <CaretDown size={12} weight="bold" color={c.onAccent} aria-hidden />}
        </button>

        <button
          type="button"
          onClick={() => {
            setDropdownOpen(false);
            onChange('year');
          }}
          style={{
            ...tabBtnBase,
            ...activeTabStyle(yearActive),
            flex: compact ? '0 0 auto' : tabBtnBase.flex,
            padding: '8px 40px',
          }}
        >
          Year
        </button>
      </div>

      {dropdownOpen && monthActive && (
        <MonthYearPickerDropdown
          monthKey={monthKey}
          onChange={key => {
            onMonthChange(key);
            onChange('month');
          }}
          onClose={() => setDropdownOpen(false)}
          anchorRect={monthBtnRef.current?.getBoundingClientRect() ?? null}
        />
      )}
    </div>
  );
}
