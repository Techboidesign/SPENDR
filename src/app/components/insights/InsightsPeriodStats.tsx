import { ArrowDown, ArrowUp, PiggyBank, Wallet } from '@phosphor-icons/react';
import type { HomeRange } from '../../utils/periods';
import { useAppColors } from '../../context/AppearanceContext';
import { AppIconChip } from '../ui/AppIconChip';

export function InsightsPeriodStats({
  range,
  totalSpent,
  income,
  monthlyBudget,
  formatCurrency,
  embedded = false,
  compact = false,
}: {
  range: HomeRange;
  totalSpent: number;
  income: number;
  monthlyBudget: number;
  formatCurrency: (n: number) => string;
  /** Inside a parent card — no outer surface chrome. */
  embedded?: boolean;
  /** Tighter row for combined stats + chart cards. */
  compact?: boolean;
}) {
  const c = useAppColors();
  const periodIncome = range === 'year' ? income * 12 : income;
  const periodBudget = range === 'year' ? monthlyBudget * 12 : monthlyBudget;
  const remaining = periodBudget - totalSpent;
  const savingsAmt = periodIncome - totalSpent;
  const savingsRate = periodIncome > 0 ? ((savingsAmt / periodIncome) * 100).toFixed(0) : '0';
  const spentLabel = range === 'year' ? 'Spent this year' : 'Spent this month';

  const stats = [
    {
      label: spentLabel,
      value: formatCurrency(totalSpent),
      Icon: ArrowDown,
      accentColor: '#3E37FF',
      lightBg: '#EDEDFF',
    },
    {
      label: 'Remaining',
      value: formatCurrency(Math.abs(remaining)),
      Icon: remaining >= 0 ? Wallet : ArrowDown,
      accentColor: remaining >= 0 ? '#10B981' : '#EF4444',
      lightBg: remaining >= 0 ? '#D1FAE5' : '#FEE2E2',
    },
    {
      label: 'Saved',
      value: `${savingsRate}%`,
      Icon: PiggyBank,
      accentColor: '#7C3AED',
      lightBg: '#F3E8FF',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: embedded ? 'transparent' : c.surface,
        borderRadius: embedded ? 0 : 16,
        border: embedded ? 'none' : `1px solid ${c.border}`,
        overflow: 'hidden',
        boxShadow: embedded ? 'none' : c.shadowSm,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            padding: compact ? '4px 6px 6px' : '12px 8px 13px',
            textAlign: 'center',
            borderRight: i < stats.length - 1 ? `1px solid ${c.divider}` : 'none',
          }}
        >
          <div
            style={{
              margin: compact ? '0 auto 4px' : '0 auto 7px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <AppIconChip
              icon={s.Icon}
              accentColor={s.accentColor}
              lightBg={s.lightBg}
              size={compact ? 24 : 30}
              iconSize={compact ? 11 : 13}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 0 : 1, alignItems: 'center' }}>
            <p
              className="font-figure"
              style={{
                fontSize: compact ? 11 : 13,
                color: c.text,
                margin: 0,
                letterSpacing: -0.3,
                lineHeight: 1.1,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontSize: compact ? 8 : 10,
                color: c.textFaint,
                margin: 0,
                fontWeight: 500,
                lineHeight: 1.1,
              }}
            >
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
