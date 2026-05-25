import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useAppColors } from '../../context/AppearanceContext';
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

const AMOUNT_EASE = (t: number) => 1 - (1 - t) ** 3;

function AnimatedInsightAmount({
  value,
  formatCurrency,
  animate,
  delayMs = 0,
}: {
  value: number;
  formatCurrency: (n: number) => string;
  animate: boolean;
  delayMs?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!animate) {
      setDisplay(0);
      return;
    }

    const duration = 550;
    const startAt = performance.now() + delayMs;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startAt;
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      setDisplay(value * AMOUNT_EASE(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, value, delayMs]);

  return <span className="font-figure">{formatCurrency(display)}</span>;
}

export function ExpensesCategoryInsights({
  segments,
  formatCurrency,
  monthKey,
  monthTotal,
  barAnimationKey,
  animateBars = true,
}: {
  segments: CategorySegment[];
  formatCurrency: (n: number) => string;
  monthKey: string;
  monthTotal: number;
  /** Bumps when entering insights — retriggers bar grow-in only (insight card stays stable). */
  barAnimationKey: string;
  /** False while insights panel is sliding — bars/amounts grow after slide completes. */
  animateBars?: boolean;
}) {
  const c = useAppColors();
  const reduceMotion = useReducedMotion();
  const showBarAnimation = animateBars && !reduceMotion;
  const total = useMemo(
    () => segments.reduce((s, seg) => s + seg.amount, 0),
    [segments],
  );

  const insight = useExpensesMonthInsight(monthKey, monthTotal, monthKey);
  const extraInsights = useExpensesChartExtraInsights(monthKey, monthTotal);

  if (segments.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {insight && <ExpensesMonthInsightCard insight={insight} />}
        <SurfaceCard>
          <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '24px 0' }}>
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
        <CategorySpendingChart
          segments={segments}
          formatCurrency={formatCurrency}
          animationKey={barAnimationKey}
          animateEntry={showBarAnimation}
        />
      </SurfaceCard>

      <SurfaceCard padding={12}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {segments.map((seg, idx) => {
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
                        color: c.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getCategoryById(seg.id).name}
                    </span>
                    <span style={{ fontSize: 13, color: c.textSecondary, flexShrink: 0 }}>
                      <AnimatedInsightAmount
                        value={seg.amount}
                        formatCurrency={formatCurrency}
                        animate={showBarAnimation}
                        delayMs={idx * 40}
                      />
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: c.surfaceInset,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      key={showBarAnimation ? `${barAnimationKey}-${seg.id}` : seg.id}
                      className={showBarAnimation ? 'spendr-breakdown-bar-grow' : undefined}
                      style={{
                        height: '100%',
                        borderRadius: 999,
                        backgroundColor: seg.color,
                        width: showBarAnimation ? undefined : '0%',
                        ['--bar-target' as string]: `${pct}%`,
                        ['--bar-delay' as string]: `${idx * 40}ms`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: c.textFaint, marginTop: 3, display: 'block' }}>
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
