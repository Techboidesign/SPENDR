import { useRef, useState, type CSSProperties } from 'react';
import { CalendarBlank, CaretDown } from '@phosphor-icons/react';
import type { HomeRange } from '../../utils/periods';
import { monthPickerLabel } from '../../utils/periods';
import { MonthYearPickerDropdown } from '../shared/MonthYearPickerDropdown';

const BRAND = '#3E37FF';

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

function activeTabStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      fontWeight: 600,
      backgroundColor: BRAND,
      color: '#FFFFFF',
      boxShadow: '0 2px 10px rgba(62, 55, 255, 0.35)',
    };
  }
  return {
    fontWeight: 500,
    backgroundColor: 'transparent',
    color: '#6B7280',
    boxShadow: 'none',
  };
}

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  const monthDisplay = monthPickerLabel(monthKey);

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
          backgroundColor: compact ? 'rgba(255,255,255,0.78)' : '#F7F7FA',
          borderRadius: 9999,
          padding: 4,
          gap: 4,
          backdropFilter: compact ? 'blur(12px)' : undefined,
          WebkitBackdropFilter: compact ? 'blur(12px)' : undefined,
          boxShadow: compact ? '0 2px 10px rgba(62,55,255,0.08)' : undefined,
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
            <CalendarBlank size={15} weight="regular" color="#FFFFFF" aria-hidden />
          )}
          <span>{monthActive ? monthDisplay : 'Month'}</span>
          {monthActive && <CaretDown size={12} weight="bold" color="#FFFFFF" aria-hidden />}
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
