import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppearance } from '../../context/AppearanceContext';
import { MONTH_PICKER_MAX_KEY, MONTH_PICKER_MIN_KEY } from '../../utils/periods';
import { MonthYearPill } from '../shared/MonthYearPill';

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
