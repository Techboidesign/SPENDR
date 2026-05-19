import { useState, useMemo } from 'react';
import { PieChart, Pie } from 'recharts';
import { TrendUp, TrendDown, ChartPieSlice } from '@phosphor-icons/react';
import { useApp, getMonthExpenses, getMonthlyAmount } from '../../context/AppContext';
import { CATEGORIES, getCategoryById } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';

type Range = '1m' | '6m' | '1y';

const RANGE_LABELS: Record<Range, string> = {
  '1m': 'This Month',
  '6m': '6 Months',
  '1y': 'Year',
};

// Generate dynamic 12-month window ending at current month
const today = new Date();
const ALL_12_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
  return {
    key: date.toISOString().slice(0, 7),
    label: date.toLocaleDateString('en-US', { month: 'short' }),
  };
});
const CURRENT_MONTH_KEY = today.toISOString().slice(0, 7);

function getMonthsForRange(range: Range) {
  switch (range) {
    case '1m':  return ALL_12_MONTHS.slice(-1);   // Apr only
    case '6m':  return ALL_12_MONTHS.slice(-6);   // Nov–Apr
    case '1y':  return ALL_12_MONTHS;             // May 25–Apr 26
  }
}

/* ── Pure CSS bar chart ── */
function CssBarChart({ data }: { data: { month: string; total: number; isLast: boolean }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.total), 1);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, paddingLeft: 36 }}>
        {data.map((d, i) => {
          const barH = Math.max((d.total / maxVal) * 120, d.total > 0 ? 4 : 0);
          const isEmpty = d.total === 0;
          const emptyBarH = 120; // Full height for empty state

          return (
            <div
              key={`bar-${i}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && d.total > 0 && (
                <div style={{
                  position: 'absolute', bottom: barH + 8, left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#1A1A2E', borderRadius: 8, padding: '6px 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', zIndex: 10,
                }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 1px' }}>{d.month}</p>
                  <p style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700, margin: 0 }}>€{d.total.toFixed(0)}</p>
                </div>
              )}
              {isEmpty ? (
                // Empty state with diagonal stripes
                <div style={{
                  width: '100%', height: emptyBarH,
                  borderRadius: '5px 5px 0 0',
                  border: '1.5px dashed #D1D5DB',
                  backgroundColor: '#FAFAFA',
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, #E5E7EB 6px, #E5E7EB 8px)',
                  cursor: 'default',
                  transformOrigin: 'bottom',
                  animation: `barGrow 0.6s ease-out ${i * 0.05}s both`,
                }} />
              ) : (
                <div style={{
                  width: '100%', height: barH,
                  backgroundColor: d.isLast ? '#3E37FF' : '#EDEDFF',
                  borderRadius: '5px 5px 0 0',
                  cursor: 'default',
                  transformOrigin: 'bottom',
                  animation: `barGrow 0.6s ease-out ${i * 0.05}s both`,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Y-axis labels */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
        {[1, 0.5, 0].map((frac, i) => (
          <span key={i} style={{ fontSize: 9, color: '#9CA3AF' }}>€{Math.round(maxVal * frac)}</span>
        ))}
      </div>

      <div style={{ marginLeft: 36, height: 1, backgroundColor: '#F3F4F6' }} />

      {/* X-axis labels */}
      <div style={{ display: 'flex', gap: 4, paddingLeft: 36, marginTop: 6 }}>
        {data.map((d, i) => (
          <div key={`label-${i}`} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 9, color: d.isLast ? '#3E37FF' : '#9CA3AF', fontWeight: d.isLast ? 600 : 400 }}>{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Top 10 categories vertical bar chart (1m view only) ── */
function MonthlyStackedBar({
  segments,
  formatCurrency,
}: {
  segments: Array<{ id: string; name: string; color: string; amount: number }>;
  formatCurrency: (n: number) => string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const BAR_H = 120;
  const maxVal = Math.max(...segments.map(s => s.amount), 1);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, paddingLeft: 36 }}>
        {segments.map((seg, i) => {
          const barH = Math.max((seg.amount / maxVal) * BAR_H, 4);
          const isHovered = hoveredId === seg.id;
          const dimmed = hoveredId !== null && !isHovered;

          return (
            <div
              key={seg.id}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', minWidth: 0 }}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHovered && (
                <div style={{
                  position: 'absolute', bottom: barH + 8, left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#1A1A2E', borderRadius: 8, padding: '6px 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', zIndex: 10,
                }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 1px' }}>{seg.name}</p>
                  <p style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700, margin: 0 }}>{formatCurrency(seg.amount)}</p>
                </div>
              )}
              <div style={{
                width: '100%', height: barH,
                backgroundColor: seg.color,
                borderRadius: '5px 5px 0 0',
                cursor: 'default',
                transformOrigin: 'bottom',
                animation: `barGrow 0.6s ease-out ${i * 0.04}s both`,
                opacity: dimmed ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }} />
            </div>
          );
        })}
      </div>

      {/* Y-axis labels — scaled to largest category */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
        {[1, 0.5, 0].map((frac, i) => (
          <span key={i} style={{ fontSize: 9, color: '#9CA3AF' }}>€{Math.round(maxVal * frac)}</span>
        ))}
      </div>

      <div style={{ marginLeft: 36, height: 1, backgroundColor: '#F3F4F6' }} />

      {/* X-axis — category icons, left = highest spend */}
      <div style={{ display: 'flex', gap: 4, paddingLeft: 36, marginTop: 6, alignItems: 'flex-end' }}>
        {segments.map(seg => (
          <div key={`label-${seg.id}`} style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }} title={seg.name}>
            <CategoryIcon categoryId={seg.id} size="xs" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsightsScreen() {
  const { state, formatCurrency } = useApp();
  const [range, setRange] = useState<Range>('6m');

  const months = useMemo(() => getMonthsForRange(range), [range]);

  const monthlyData = useMemo(() => {
    return months.map((m, idx, arr) => {
      const monthExpenses = getMonthExpenses(state.expenses, m.key);
      const total = monthExpenses.reduce((s, e) => s + getMonthlyAmount(e), 0);
      return { month: m.label, total, isLast: idx === arr.length - 1 };
    });
  }, [state.expenses, months]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const m of months) {
      const monthExpenses = getMonthExpenses(state.expenses, m.key);
      for (const exp of monthExpenses) {
        totals[exp.categoryId] = (totals[exp.categoryId] ?? 0) + getMonthlyAmount(exp);
      }
    }
    const max = Math.max(...Object.values(totals), 1);
    return CATEGORIES
      .map(cat => ({ ...cat, amount: totals[cat.id] ?? 0 }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(c => ({ ...c, pct: (c.amount / max) * 100 }));
  }, [state.expenses, months]);

  const grandTotal = useMemo(() =>
    categoryTotals.reduce((s, c) => s + c.amount, 0),
    [categoryTotals]
  );

  const recurringData = useMemo(() => {
    let recurring = 0, oneTime = 0;
    for (const m of months) {
      const monthExpenses = getMonthExpenses(state.expenses, m.key);
      for (const exp of monthExpenses) {
        const amount = getMonthlyAmount(exp);
        if (exp.type === 'one-time') oneTime += amount;
        else recurring += amount;
      }
    }
    return [
      { name: 'Recurring', value: recurring, color: '#3E37FF', fill: '#3E37FF' },
      { name: 'One-time', value: oneTime, color: '#06B6D4', fill: '#06B6D4' },
    ];
  }, [state.expenses, months]);

  const top3Expenses = useMemo(() => {
    const monthKeys = months.map(m => m.key);
    return state.expenses
      .filter(e => monthKeys.some(k => e.date.startsWith(k)))
      .filter(e => e.type === 'one-time')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [state.expenses, months]);

  const momInsights = useMemo(() => {
    // Dynamic current and previous month
    const curDate = new Date();
    const prevDate = new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1);
    const cur = curDate.toISOString().slice(0, 7);
    const prev = prevDate.toISOString().slice(0, 7);

    const curExpenses = getMonthExpenses(state.expenses, cur);
    const prevExpenses = getMonthExpenses(state.expenses, prev);

    const insights: Array<{ cat: string; curAmt: number; prevAmt: number; pctChange: number }> = [];
    for (const cat of CATEGORIES) {
      const curAmt = curExpenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + getMonthlyAmount(e), 0);
      const prevAmt = prevExpenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + getMonthlyAmount(e), 0);
      if (curAmt > 0 || prevAmt > 0) {
        const pctChange = prevAmt > 0 ? ((curAmt - prevAmt) / prevAmt) * 100 : 0;
        insights.push({ cat: cat.id, curAmt, prevAmt, pctChange });
      }
    }
    return insights.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange)).slice(0, 4);
  }, [state.expenses]);

  const recurringTotal = recurringData[0].value;
  const recurringPct = grandTotal > 0 ? ((recurringTotal / grandTotal) * 100).toFixed(0) : '0';

  // Month-over-month comparison label
  const curDate = new Date();
  const prevDate = new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1);
  const momLabel = `${curDate.toLocaleDateString('en-US', { month: 'long' })} vs ${prevDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

  // Monthly stacked bar segments (current month only, sorted by amount)
  const monthlySegments = useMemo(() => {
    const totals: Record<string, number> = {};
    const monthExpenses = getMonthExpenses(state.expenses, CURRENT_MONTH_KEY);
    for (const exp of monthExpenses) {
      totals[exp.categoryId] = (totals[exp.categoryId] ?? 0) + getMonthlyAmount(exp);
    }
    return CATEGORIES
      .map(cat => ({ id: cat.id, name: cat.name, color: cat.color, amount: totals[cat.id] ?? 0 }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [state.expenses]);

  const monthlyTotal = useMemo(() =>
    monthlySegments.reduce((s, c) => s + c.amount, 0),
    [monthlySegments]
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#F7F7FA', paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px 20px 16px', borderBottom: '1px solid #F0F0F5',
        animation: 'fadeIn 0.5s ease-out both' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: '0 0 14px' }}>Insights</h1>
        <div style={{ display: 'flex', backgroundColor: '#F7F7FA', borderRadius: 12, padding: 4, gap: 4 }}>
          {(Object.keys(RANGE_LABELS) as Range[]).map((r, i) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              style={{
                flex: 1, padding: '8px 0',
                borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: range === r ? 600 : 400,
                backgroundColor: range === r ? '#FFFFFF' : 'transparent',
                color: range === r ? '#3E37FF' : '#6B7280',
                boxShadow: range === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                animation: `fadeIn 0.4s ease-out ${0.1 + i * 0.05}s both`,
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Spending Trend */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.6s ease-out 0.1s both' }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: '0 0 2px' }}>Spending Trend</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
              {range === '1m' ? 'This month' : range === '6m' ? 'Last 6 months' : 'Last 12 months'}
            </p>
          </div>
          <div key={range}>
            {range === '1m' ? (
              monthlyTotal === 0 ? (
                // Empty state for current month
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: '#FAFAFA', margin: '0 auto 12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed #D1D5DB',
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, #F3F4F6 8px, #F3F4F6 10px)',
                  }}>
                    <ChartPieSlice size={28} weight="light" color="#9CA3AF" />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', margin: '0 0 4px' }}>
                    No spending data yet
                  </p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                    Add expenses to see this month's breakdown
                  </p>
                </div>
              ) : (
                <MonthlyStackedBar segments={monthlySegments} formatCurrency={formatCurrency} />
              )
            ) : (
              <CssBarChart data={monthlyData} />
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.6s ease-out 0.2s both' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: '0 0 14px' }}>Category Breakdown</p>
          {categoryTotals.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                No category data for this period
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categoryTotals.map((cat, idx) => {
                const share = grandTotal > 0 ? ((cat.amount / grandTotal) * 100).toFixed(1) : '0.0';
                return (
                  <div key={`${cat.id}-${range}`} style={{ animation: `fadeSlideUp 0.5s ease-out ${idx * 0.05}s both` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <CategoryIcon categoryId={cat.id} size="xs" />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#1A1A2E' }}>{cat.name}</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{share}%</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{formatCurrency(cat.amount)}</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 }}>
                      <div style={{
                        height: '100%', width: `${cat.pct}%`,
                        backgroundColor: cat.color, borderRadius: 3,
                        animation: 'progressBarFill 0.8s ease-out both',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recurring vs One-time */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.6s ease-out 0.3s both' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: '0 0 14px' }}>Recurring vs One-time</p>
          {grandTotal === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                No expense data for this period
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Donut — center fixed with inset+flex */}
              <div key={range} style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                <PieChart width={110} height={110} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={recurringData}
                    cx="50%"
                    cy="50%"
                    innerRadius={34} outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    animationDuration={600}
                  />
                </PieChart>
                {/* Perfect center using inset + flex */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>{recurringPct}%</p>
                    <p style={{ fontSize: 8, color: '#9CA3AF', margin: 0, letterSpacing: 0.3 }}>FIXED</p>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recurringData.map(d => (
                  <div key={`${d.name}-${range}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{formatCurrency(d.value)}</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: '#F3F4F6', borderRadius: 2 }}>
                      <div style={{
                        height: '100%',
                        width: grandTotal > 0 ? `${(d.value / grandTotal) * 100}%` : '0%',
                        backgroundColor: d.color, borderRadius: 2,
                        animation: 'progressBarFill 0.8s ease-out both',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Single Expenses */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.6s ease-out 0.4s both' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: '0 0 14px' }}>Top Single Expenses</p>
          {top3Expenses.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '16px 0' }}>No one-time expenses in this period</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top3Expenses.map((exp, i) => (
                <div key={`${exp.id}-${range}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 12,
                  backgroundColor: i === 0 ? '#EDEDFF' : '#F7F7FA',
                  animation: `fadeSlideUp 0.5s ease-out ${i * 0.1}s both`,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? '#3E37FF' : '#9CA3AF', width: 20 }}>#{i + 1}</span>
                  <CategoryIcon categoryId={exp.categoryId} size="xs" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{exp.name}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>
                      {new Date(exp.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1A2E' }}>{formatCurrency(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Month-over-Month */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.6s ease-out 0.5s both' }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: '0 0 2px' }}>Month-over-Month</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{momLabel}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {momInsights.map((ins, idx) => {
              const cat = getCategoryById(ins.cat);
              const isUp = ins.pctChange > 0;
              if (Math.abs(ins.pctChange) < 5) return null;
              return (
                <div key={ins.cat} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 12,
                  backgroundColor: isUp ? '#FEF2F2' : '#F0FDF4',
                  border: `1px solid ${isUp ? '#FEE2E2' : '#D1FAE5'}`,
                  animation: `fadeSlideUp 0.5s ease-out ${idx * 0.1}s both`,
                }}>
                  <CategoryIcon categoryId={ins.cat} size="xs" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{cat.name}</p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: '1px 0 0' }}>
                      {formatCurrency(ins.prevAmt)} → {formatCurrency(ins.curAmt)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isUp
                      ? <TrendUp size={14} weight="light" color="#EF4444" />
                      : <TrendDown size={14} weight="light" color="#10B981" />
                    }
                    <span style={{ fontSize: 13, fontWeight: 700, color: isUp ? '#EF4444' : '#10B981' }}>
                      {isUp ? '+' : ''}{ins.pctChange.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progressBarFill {
          from { width: 0; }
        }

        @keyframes barGrow {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}