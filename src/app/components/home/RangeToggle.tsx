import { useRef, useState, type CSSProperties } from 'react';
import { CalendarBlank, CaretDown } from '@phosphor-icons/react';
import type { HomeRange } from '../../utils/periods';
import { monthPickerLabel } from '../../utils/periods';
import { MonthYearPickerDropdown } from '../shared/MonthYearPickerDropdown';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';

const PILL_RADIUS = 9999;

const tabBtnBase: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '8px 12px',
  borderRadius: PILL_RADIUS,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'inherit',
  transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

export function RangeToggle({
  range,
  onChange,
  monthKey,
  onMonthChange,
}: {
  range: HomeRange;
  onChange: (r: HomeRange) => void;
  monthKey: string;
  onMonthChange: (key: string) => void;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  const monthDisplay = monthPickerLabel(monthKey);
  const monthActive = range === 'month';
  const yearActive = range === 'year';

  const activeTabStyle: CSSProperties = {
    fontWeight: 600,
    backgroundColor: c.accent,
    color: c.onAccent,
    boxShadow: '0 2px 8px rgba(62, 55, 255, 0.28)',
  };

  const inactiveTabStyle: CSSProperties = {
    fontWeight: 500,
    backgroundColor: 'transparent',
    color: c.textMuted,
    boxShadow: 'none',
  };

  const handleMonthClick = () => {
    if (range === 'year') {
      onChange('month');
      return;
    }
    setDropdownOpen(o => !o);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        zIndex: dropdownOpen ? 400 : undefined,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          backgroundColor: isDark ? c.surfaceElevated : c.chipBg,
          borderRadius: PILL_RADIUS,
          padding: 3,
          gap: 3,
          border: `1px solid ${isDark ? c.borderSubtle : c.border}`,
          boxSizing: 'border-box',
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
            ...(monthActive ? activeTabStyle : inactiveTabStyle),
          }}
        >
          {monthActive && (
            <CalendarBlank size={15} weight="regular" color={c.onAccent} aria-hidden />
          )}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {monthActive ? monthDisplay : 'Month'}
          </span>
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
            ...(yearActive ? activeTabStyle : inactiveTabStyle),
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
