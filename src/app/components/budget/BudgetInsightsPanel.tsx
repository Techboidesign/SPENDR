import { useMemo, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { ChartPieSlice } from '@phosphor-icons/react';
import { PieChart, Pie } from 'recharts';
import { useApp, getMonthExpenses, getMonthlyAmount } from '../../context/AppContext';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { CATEGORIES } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';
import { RankIconChip } from '../ui/RankIconChip';
import { SpendingTrendChart } from '../home/SpendingTrendChart';
import { InsightsHighlightsGrid } from '../home/HomeInsightsRail';
import { TopExpensesCard } from '../home/TopExpensesCard';
import { usePeriodInsights } from '../../hooks/usePeriodInsights';
import { useInsightsHighlightCards } from '../../hooks/useInsightsHighlightCards';
import { useInsightsTopCategories } from '../../hooks/useInsightsTopCategories';
import { hexToRgba, chartTooltipStyle } from '../../theme/darkModeUi';
import { INSIGHTS_CHOREOGRAPHY } from '../../theme/motion';
import type { HomeRange } from '../../utils/periods';
import { monthPickerLabel, YEAR_MONTH_BARS } from '../../utils/periods';
import { RangeToggle } from '../home/RangeToggle';
import { InsightsPeriodStats } from '../insights/InsightsPeriodStats';

function InsightPeriodBadge({ label }: { label: string }) {
  const c = useAppColors();
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 500,
        color: c.textMuted,
        backgroundColor: c.chipBg,
        padding: '4px 10px',
        borderRadius: 9999,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function InsightCard({
  title,
  badge,
  children,
  tightBody = false,
  stack,
}: {
  title?: string;
  badge?: string;
  children: ReactNode;
  /** Less space between header and body (stats + chart flush). */
  tightBody?: boolean;
  /** Flush stack with an adjacent insight card. */
  stack?: 'top' | 'bottom';
}) {
  const c = useAppColors();
  const hasHeader = Boolean(title || badge);
  const radius = 16;
  return (
    <div
      style={{
        backgroundColor: c.surface,
        borderRadius:
          stack === 'top'
            ? `${radius}px ${radius}px 0 0`
            : stack === 'bottom'
              ? `0 0 ${radius}px ${radius}px`
              : radius,
        padding: stack === 'top' ? '10px 12px' : 16,
        boxShadow: c.shadowCard,
        animation: INSIGHTS_CHOREOGRAPHY.sectionCard,
      }}
    >
      {hasHeader ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: tightBody ? 8 : 14,
          }}
        >
          {title ? (
            <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: 0, minWidth: 0 }}>
              {title}
            </p>
          ) : null}
          {badge ? <InsightPeriodBadge label={badge} /> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function MonthlyStackedBar({
  segments,
  formatCurrency,
}: {
  segments: Array<{ id: string; name: string; color: string; amount: number }>;
  formatCurrency: (n: number) => string;
}) {
  const c = useAppColors();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const BAR_H = 120;
  const maxVal = Math.max(...segments.map(s => s.amount), 1);
  const axisPad = 44;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, paddingLeft: axisPad }}>
        {segments.map((seg, i) => {
          const barH = Math.max((seg.amount / maxVal) * BAR_H, 4);
          const isHovered = hoveredId === seg.id;
          const dimmed = hoveredId !== null && !isHovered;

          return (
            <div
              key={seg.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
                minWidth: 0,
              }}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: barH + 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: chartTooltipStyle().backgroundColor,
                    borderRadius: 8,
                    padding: '6px 10px',
                    boxShadow: chartTooltipStyle().boxShadow,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  <p style={{ fontSize: 11, color: chartTooltipStyle().labelColor, margin: '0 0 1px' }}>
                    {seg.name}
                  </p>
                  <p className="font-figure" style={{ fontSize: 13, color: chartTooltipStyle().valueColor, margin: 0 }}>
                    {formatCurrency(seg.amount)}
                  </p>
                </div>
              )}
              <div
                style={{
                  width: '100%',
                  height: barH,
                  backgroundColor: seg.color,
                  borderRadius: '5px 5px 0 0',
                  cursor: 'default',
                  transformOrigin: 'bottom',
                  animation: INSIGHTS_CHOREOGRAPHY.barGrow(i),
                  opacity: dimmed ? 0.45 : 1,
                  transition: 'opacity 0.15s',
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: axisPad - 6,
          height: 140,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          textAlign: 'right',
          paddingRight: 4,
          boxSizing: 'border-box',
        }}
      >
        {[1, 0.5, 0].map((frac, i) => (
          <span
            key={i}
            className="font-figure"
            style={{
              fontSize: 7,
              color: c.textFaint,
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatCurrency(Math.round(maxVal * frac))}
          </span>
        ))}
      </div>

      <div style={{ marginLeft: axisPad, height: 1, backgroundColor: c.surfaceInset }} />

      <div style={{ display: 'flex', gap: 4, paddingLeft: axisPad, marginTop: 6, alignItems: 'flex-end' }}>
        {segments.map(seg => (
          <div key={`label-${seg.id}`} style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }} title={seg.name}>
            <CategoryIcon categoryId={seg.id} size="xs" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BudgetInsightsPanel({
  range,
  selectedMonthKey,
  onRangeChange,
  onMonthChange,
  periodTotal,
  income,
  monthlyBudget,
}: {
  range: HomeRange;
  selectedMonthKey: string;
  onRangeChange: (range: HomeRange) => void;
  onMonthChange: (key: string) => void;
  periodTotal: number;
  income: number;
  monthlyBudget: number;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const { state, formatCurrency } = useApp();
  const reduceMotion = useReducedMotion() ?? false;

  const periodInsights = usePeriodInsights(state.expenses, range, selectedMonthKey);

  const periodMonthKeys = useMemo(
    () => (range === 'year' ? YEAR_MONTH_BARS.map(m => m.key) : [selectedMonthKey]),
    [range, selectedMonthKey],
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const key of periodMonthKeys) {
      const monthExpenses = getMonthExpenses(state.expenses, key);
      for (const exp of monthExpenses) {
        totals[exp.categoryId] = (totals[exp.categoryId] ?? 0) + getMonthlyAmount(exp);
      }
    }
    const max = Math.max(...Object.values(totals), 1);
    return CATEGORIES
      .map(cat => ({ ...cat, amount: totals[cat.id] ?? 0 }))
      .filter(cat => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(cat => ({ ...cat, pct: (cat.amount / max) * 100 }));
  }, [state.expenses, periodMonthKeys]);

  const grandTotal = useMemo(
    () => categoryTotals.reduce((s, cat) => s + cat.amount, 0),
    [categoryTotals],
  );

  const recurringData = useMemo(() => {
    let recurring = 0;
    let oneTime = 0;
    for (const key of periodMonthKeys) {
      const monthExpenses = getMonthExpenses(state.expenses, key);
      for (const exp of monthExpenses) {
        const amount = getMonthlyAmount(exp);
        if (exp.type === 'one-time') oneTime += amount;
        else recurring += amount;
      }
    }
    return [
      { name: 'Recurring', value: recurring, color: c.accent, fill: c.accent },
      { name: 'One-time', value: oneTime, color: '#06B6D4', fill: '#06B6D4' },
    ];
  }, [state.expenses, periodMonthKeys, c.accent]);

  const top3Expenses = useMemo(() => {
    return state.expenses
      .filter(e => periodMonthKeys.some(k => e.date.startsWith(k)))
      .filter(e => e.type === 'one-time')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [state.expenses, periodMonthKeys]);

  const monthlySegments = useMemo(() => {
    const totals: Record<string, number> = {};
    const monthExpenses = getMonthExpenses(state.expenses, selectedMonthKey);
    for (const exp of monthExpenses) {
      totals[exp.categoryId] = (totals[exp.categoryId] ?? 0) + getMonthlyAmount(exp);
    }
    return CATEGORIES
      .map(cat => ({ id: cat.id, name: cat.name, color: cat.color, amount: totals[cat.id] ?? 0 }))
      .filter(cat => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [state.expenses, selectedMonthKey]);

  const monthlyTotal = useMemo(
    () => monthlySegments.reduce((s, seg) => s + seg.amount, 0),
    [monthlySegments],
  );

  const yearHighlightCards = useInsightsHighlightCards(
    formatCurrency,
    periodInsights.monthlyBarData,
    YEAR_MONTH_BARS.map(m => m.key),
    { skipCategoryAndRecurring: false },
  );

  const topCategories = useInsightsTopCategories(selectedMonthKey, 4);

  const recurringTotal = recurringData[0].value;
  const recurringPct = grandTotal > 0 ? ((recurringTotal / grandTotal) * 100).toFixed(0) : '0';

  const periodSubtitle =
    range === 'year' ? 'Last 12 months' : monthPickerLabel(selectedMonthKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
      <RangeToggle
        range={range}
        onChange={onRangeChange}
        monthKey={selectedMonthKey}
        onMonthChange={onMonthChange}
      />

      {range === 'year' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <InsightCard stack="top">
              <InsightsPeriodStats
                embedded
                compact
                range={range}
                totalSpent={periodTotal}
                income={income}
                monthlyBudget={monthlyBudget}
                formatCurrency={formatCurrency}
              />
            </InsightCard>

            <InsightCard stack="bottom" title="Spending trend" badge="Last 12 months" tightBody>
              <SpendingTrendChart
                data={periodInsights.monthlyBarData}
                formatCurrency={formatCurrency}
              />
            </InsightCard>
          </div>

          {yearHighlightCards.length > 0 && (
            <InsightCard title="At a glance">
              <InsightsHighlightsGrid cards={yearHighlightCards} />
            </InsightCard>
          )}

          <InsightCard title="Category breakdown" badge={periodSubtitle}>
            {categoryTotals.length === 0 ? (
              <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '16px 0' }}>
                No category data for this period
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categoryTotals.map(cat => {
                  const share = grandTotal > 0 ? ((cat.amount / grandTotal) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={cat.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <CategoryIcon categoryId={cat.id} size="xs" />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: c.text }}>{cat.name}</span>
                        <span style={{ fontSize: 12, color: c.textFaint }}>{share}%</span>
                        <span className="font-figure" style={{ fontSize: 13, color: c.text }}>
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                      <div style={{ height: 6, backgroundColor: c.surfaceInset, borderRadius: 3 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${cat.pct}%`,
                            backgroundColor: cat.color,
                            borderRadius: 3,
                            transformOrigin: 'left center',
                            animation: INSIGHTS_CHOREOGRAPHY.progressBar,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </InsightCard>

          <InsightCard title="Recurring vs one-time" badge={periodSubtitle}>
            {grandTotal === 0 ? (
              <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '16px 0' }}>
                No expense data for this period
              </p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                  <PieChart width={110} height={110} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={recurringData}
                      cx="50%"
                      cy="50%"
                      innerRadius={34}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={reduceMotion ? 0 : 400}
                    />
                  </PieChart>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <p className="font-figure" style={{ fontSize: 14, color: c.text, margin: 0 }}>
                          {recurringPct}%
                        </p>
                        <p style={{ fontSize: 8, color: c.textFaint, margin: 0, letterSpacing: 0.3 }}>FIXED</p>
                      </div>
                    </div>
                  </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recurringData.map(d => (
                    <div key={d.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: d.color,
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontSize: 12, color: c.textMuted }}>{d.name}</span>
                        </div>
                        <span className="font-figure" style={{ fontSize: 13, color: c.text }}>
                          {formatCurrency(d.value)}
                        </span>
                      </div>
                      <div style={{ height: 4, backgroundColor: c.surfaceInset, borderRadius: 2 }}>
                        <div
                          style={{
                            height: '100%',
                            width: grandTotal > 0 ? `${(d.value / grandTotal) * 100}%` : '0%',
                            backgroundColor: d.color,
                            borderRadius: 2,
                            transformOrigin: 'left center',
                            animation: INSIGHTS_CHOREOGRAPHY.progressBar,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </InsightCard>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <InsightCard stack="top">
              <InsightsPeriodStats
                embedded
                compact
                range={range}
                totalSpent={periodTotal}
                income={income}
                monthlyBudget={monthlyBudget}
                formatCurrency={formatCurrency}
              />
            </InsightCard>

            <InsightCard
              stack="bottom"
              title="Spending by category"
              badge={periodSubtitle}
              tightBody
            >
              {monthlyTotal === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: isDark ? c.surfaceInset : '#FAFAFA',
                      margin: '0 auto 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px dashed ${c.borderSubtle}`,
                      backgroundImage: isDark
                        ? undefined
                        : 'repeating-linear-gradient(45deg, transparent, transparent 8px, #F3F4F6 8px, #F3F4F6 10px)',
                    }}
                  >
                    <ChartPieSlice size={28} weight="light" color={c.textFaint} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: c.textMuted, margin: '0 0 4px' }}>
                    No spending data yet
                  </p>
                  <p style={{ fontSize: 11, color: c.textFaint, margin: 0 }}>
                    Add expenses to see this month&apos;s breakdown
                  </p>
                </div>
              ) : (
                <MonthlyStackedBar segments={monthlySegments} formatCurrency={formatCurrency} />
              )}
            </InsightCard>
          </div>

          <InsightCard title="Category breakdown" badge={periodSubtitle}>
            {categoryTotals.length === 0 ? (
              <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '16px 0' }}>
                No category data for this period
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categoryTotals.map(cat => {
                  const share = grandTotal > 0 ? ((cat.amount / grandTotal) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={cat.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <CategoryIcon categoryId={cat.id} size="xs" />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: c.text }}>{cat.name}</span>
                        <span style={{ fontSize: 12, color: c.textFaint }}>{share}%</span>
                        <span className="font-figure" style={{ fontSize: 13, color: c.text }}>
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                      <div style={{ height: 6, backgroundColor: c.surfaceInset, borderRadius: 3 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${cat.pct}%`,
                            backgroundColor: cat.color,
                            borderRadius: 3,
                            transformOrigin: 'left center',
                            animation: INSIGHTS_CHOREOGRAPHY.progressBar,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </InsightCard>

          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: '0 0 12px' }}>
              Top categories
            </p>
            <TopExpensesCard
              items={topCategories}
              formatCurrency={formatCurrency}
              layout="grid"
              ranked
            />
          </div>

          <InsightCard title="Recurring vs one-time" badge={periodSubtitle}>
            {grandTotal === 0 ? (
              <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '16px 0' }}>
                No expense data for this period
              </p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                  <PieChart width={110} height={110} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={recurringData}
                      cx="50%"
                      cy="50%"
                      innerRadius={34}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={reduceMotion ? 0 : 400}
                    />
                  </PieChart>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <p className="font-figure" style={{ fontSize: 14, color: c.text, margin: 0 }}>
                        {recurringPct}%
                      </p>
                      <p style={{ fontSize: 8, color: c.textFaint, margin: 0, letterSpacing: 0.3 }}>FIXED</p>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recurringData.map(d => (
                    <div key={d.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: d.color,
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontSize: 12, color: c.textMuted }}>{d.name}</span>
                        </div>
                        <span className="font-figure" style={{ fontSize: 13, color: c.text }}>
                          {formatCurrency(d.value)}
                        </span>
                      </div>
                      <div style={{ height: 4, backgroundColor: c.surfaceInset, borderRadius: 2 }}>
                        <div
                          style={{
                            height: '100%',
                            width: grandTotal > 0 ? `${(d.value / grandTotal) * 100}%` : '0%',
                            backgroundColor: d.color,
                            borderRadius: 2,
                            transformOrigin: 'left center',
                            animation: INSIGHTS_CHOREOGRAPHY.progressBar,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </InsightCard>

          <InsightCard title="Top single expenses">
            {top3Expenses.length === 0 ? (
              <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '16px 0' }}>
                No one-time expenses this month
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {top3Expenses.map((exp, i) => (
                  <div
                    key={exp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 12,
                      backgroundColor: c.surfaceMuted,
                    }}
                  >
                    <RankIconChip rank={i + 1} size={36} radius={10} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: c.text, margin: 0 }}>{exp.name}</p>
                      <p style={{ fontSize: 11, color: c.textFaint, margin: '1px 0 0' }}>
                        {new Date(exp.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className="font-figure" style={{ fontSize: 15, color: c.text }}>
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </InsightCard>
        </>
      )}
    </div>
  );
}
