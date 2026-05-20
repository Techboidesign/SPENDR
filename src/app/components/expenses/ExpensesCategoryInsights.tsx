import { useMemo } from 'react';
import { CategorySpendingChart } from '../home/CategorySpendingChart';
import { CategoryIcon } from '../CategoryIcon';
import { SurfaceCard } from '../ui/SurfaceCard';
import { getCategoryById } from '../../data/categories';
import { PCT_OF_MONTHLY_LABEL, useExpensesMonthInsight } from '../../hooks/useExpensesMonthInsight';
import { useExpensesChartExtraInsights } from '../../hooks/useExpensesChartExtraInsights';
import { ExpensesMonthInsightCard } from './ExpensesMonthInsightCard';

export type CategorySegment = {
  id: string;
  name: string;
  color: string;
  amount: number;
};

export function ExpensesCategoryInsights({
  segments,
  formatCurrency,
  monthKey,
  monthTotal,
  shuffleKey,
}: {
  segments: CategorySegment[];
  formatCurrency: (n: number) => string;
  monthKey: string;
  monthTotal: number;
  shuffleKey: string;
}) {
  const total = useMemo(
    () => segments.reduce((s, seg) => s + seg.amount, 0),
    [segments],
  );

  const insight = useExpensesMonthInsight(monthKey, monthTotal, shuffleKey);
  const extraInsights = useExpensesChartExtraInsights(monthKey, monthTotal);

  if (segments.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {insight && <ExpensesMonthInsightCard insight={insight} />}
        <SurfaceCard>
          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '24px 0' }}>
            No spending this month
          </p>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {insight && <ExpensesMonthInsightCard insight={insight} />}

      <SurfaceCard key={monthKey}>
        <CategorySpendingChart segments={segments} formatCurrency={formatCurrency} />
      </SurfaceCard>

      <SurfaceCard padding={12}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {segments.map(seg => {
            const pct = total > 0 ? (seg.amount / total) * 100 : 0;
            return (
              <div
                key={seg.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <CategoryIcon categoryId={seg.id} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#1A1A2E',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getCategoryById(seg.id).name}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: seg.color, flexShrink: 0 }}>
                      {formatCurrency(seg.amount)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: '#F3F4F6',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 999,
                        backgroundColor: seg.color,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, display: 'block' }}>
                    {pct.toFixed(0)}{PCT_OF_MONTHLY_LABEL}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SurfaceCard>

      {extraInsights.map(card => (
        <ExpensesMonthInsightCard key={card.id} insight={card} />
      ))}
    </div>
  );
}
