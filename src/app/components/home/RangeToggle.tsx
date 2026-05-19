import { useState, type CSSProperties } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import type { HomeRange } from '../../utils/periods';
import { CURRENT_MONTH_KEY, MONTH_OPTIONS } from '../../utils/periods';

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
  gap: 4,
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

  const monthOption = MONTH_OPTIONS.find(m => m.key === monthKey);
  const monthDisplay =
    monthKey === CURRENT_MONTH_KEY
      ? 'This month'
      : monthOption?.label ?? monthKey;

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
        flex: compact ? '0 1 auto' : undefined,
        minWidth: compact ? 0 : undefined,
        maxWidth: compact ? 240 : undefined,
        zIndex: compact ? 20 : undefined,
      }}
    >
      <div
        style={{
          display: 'flex',
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
          type="button"
          onClick={handleMonthClick}
          style={{
            ...tabBtnBase,
            ...activeTabStyle(monthActive),
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {monthActive ? monthDisplay : 'Month'}
          </span>
          {monthActive && (
            <CaretDown size={12} weight="bold" color="#FFFFFF" />
          )}
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
          }}
        >
          Year
        </button>
      </div>

      {dropdownOpen && range === 'month' && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setDropdownOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: '1px solid #F0F0F5',
              zIndex: 100,
              maxHeight: 220,
              overflowY: 'auto',
              padding: 4,
            }}
          >
            {[...MONTH_OPTIONS].reverse().map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  onMonthChange(m.key);
                  onChange('month');
                  setDropdownOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: 9999,
                  background: m.key === monthKey ? '#EDEDFF' : 'transparent',
                  color: m.key === monthKey ? BRAND : '#1A1A2E',
                  fontSize: 12,
                  fontWeight: m.key === monthKey ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {m.key === CURRENT_MONTH_KEY ? `This month (${m.label})` : m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
