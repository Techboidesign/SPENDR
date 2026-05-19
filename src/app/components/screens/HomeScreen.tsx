import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowUp, ArrowDown, ArrowRight, CaretRight, PiggyBank, Wallet } from '@phosphor-icons/react';
import { useApp, getCategoryTotals } from '../../context/AppContext';
import type { HomeRange } from '../../utils/periods';
import { CURRENT_MONTH_KEY, YEAR_MONTH_BARS } from '../../utils/periods';
import { usePeriodInsights } from '../../hooks/usePeriodInsights';
import { RangeToggle } from '../home/RangeToggle';
import { SpendingTrendChart } from '../home/SpendingTrendChart';
import { TopExpensesCard } from '../home/TopExpensesCard';
import { HomeInsightsRail } from '../home/HomeInsightsRail';
import { useHomeInsightCards } from '../../hooks/useHomeInsightCards';
import { RecentTransactionsList } from '../home/RecentTransactionsCard';
import { SectionTitle } from '../ui/SectionTitle';
import { SurfaceCard } from '../ui/SurfaceCard';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';

/* ─── SVG donut constants ─────────────────────────────── */
const SVG_W   = 362;   // full card width
const SVG_H   = 320;
const CX      = SVG_W / 2;   // 181
const CY      = SVG_H / 2;   // 160
const R       = 128;          // ring centre-line radius
const SW      = 46;           // stroke-width  → ring from r=105 to r=151
const CIRC    = 2 * Math.PI * R;          // ≈ 804px
const GAP_PX  = 6;            // pixel gap between segments (at ring radius)
const RADIAN  = Math.PI / 180;
const FROST_R = R - SW / 2 - 8; // inner hub radius (~97)
const BUDGET_RING_R = FROST_R - 5;
const BUDGET_RING_STROKE = 7;

const BUDGET_RING_ANIM_MS = 1000;

function HeroDonutBudgetRing({
  percent,
  color,
  bg,
  animationKey,
}: {
  percent: number;
  color: string;
  bg: string;
  /** Changes on month/year/range — retriggers a smooth fill from 0 */
  animationKey: string;
}) {
  const target = Number.isFinite(percent) ? Math.min(Math.max(percent, 0), 100) : 0;
  const [displayPercent, setDisplayPercent] = useState(0);
  const circumference = 2 * Math.PI * BUDGET_RING_R;
  const offset = circumference - (displayPercent / 100) * circumference;

  useEffect(() => {
    setDisplayPercent(0);
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / BUDGET_RING_ANIM_MS, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplayPercent(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animationKey, target]);

  return (
    <>
      <circle cx={CX} cy={CY} r={FROST_R} fill="#FFFFFF" fillOpacity={0.96} />
      <circle
        cx={CX}
        cy={CY}
        r={BUDGET_RING_R}
        fill="none"
        stroke={bg}
        strokeWidth={BUDGET_RING_STROKE}
      />
      <circle
        cx={CX}
        cy={CY}
        r={BUDGET_RING_R}
        fill="none"
        stroke={color}
        strokeWidth={BUDGET_RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${CX} ${CY})`}
      />
    </>
  );
}

/* ─── SVG Donut component ────────────────────────────── */
function DonutChart({
  segments,
  formatCurrency,
  budgetPercent,
  budgetColor,
  budgetBg,
  budgetRingKey,
}: {
  segments: { fill: string; amount: number; name: string }[];
  formatCurrency: (n: number) => string;
  budgetPercent: number;
  budgetColor: string;
  budgetBg: string;
  budgetRingKey: string;
}) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const total = segments.reduce((s, c) => s + c.amount, 0);
  if (total === 0) return null;

  // Donut ring dimensions
  const outerR = R + SW / 2;  // 151
  const innerR = R - SW / 2;  // 105

  // Gap calculation: 2px gap at radius R
  const gapDegrees = (2 / CIRC) * 360; // ~0.894 degrees

  // Rounded corner radius
  const cornerRadius = 6;

  // Build donut wedges (annular sectors) with gaps and rounded corners
  const wedges: { d: string; fill: string; centerX: number; centerY: number }[] = [];
  let startAngle = -90; // start at 12 o'clock

  segments.forEach(seg => {
    const fullSweep = (seg.amount / total) * 360;
    const sweep = fullSweep - gapDegrees; // reduce by gap

    // Add half gap at start
    const actualStartAngle = startAngle + gapDegrees / 2;
    const actualEndAngle = actualStartAngle + sweep;

    // Calculate center of segment for tooltip positioning
    const midAngle = ((actualStartAngle + actualEndAngle) / 2) * (Math.PI / 180);
    const midRadius = (outerR + innerR) / 2;
    const centerX = CX + midRadius * Math.cos(midAngle);
    const centerY = CY + midRadius * Math.sin(midAngle);

    // Calculate angle offset for rounded corners on arcs
    const arcCornerDegrees = (cornerRadius / outerR) * (180 / Math.PI);

    // Convert to radians (with corner offsets for arc rounding)
    const startRadOuter = ((actualStartAngle + arcCornerDegrees) * Math.PI) / 180;
    const endRadOuter = ((actualEndAngle - arcCornerDegrees) * Math.PI) / 180;
    const startRadInner = ((actualStartAngle + arcCornerDegrees) * Math.PI) / 180;
    const endRadInner = ((actualEndAngle - arcCornerDegrees) * Math.PI) / 180;

    // Actual corner points (for arc endpoints)
    const startRad = (actualStartAngle * Math.PI) / 180;
    const endRad = (actualEndAngle * Math.PI) / 180;

    // Outer arc points (offset for rounding)
    const x1OuterStart = CX + outerR * Math.cos(startRadOuter);
    const y1OuterStart = CY + outerR * Math.sin(startRadOuter);
    const x2OuterEnd = CX + outerR * Math.cos(endRadOuter);
    const y2OuterEnd = CY + outerR * Math.sin(endRadOuter);

    // Inner arc points (offset for rounding)
    const x1InnerStart = CX + innerR * Math.cos(startRadInner);
    const y1InnerStart = CY + innerR * Math.sin(startRadInner);
    const x2InnerEnd = CX + innerR * Math.cos(endRadInner);
    const y2InnerEnd = CY + innerR * Math.sin(endRadInner);

    // Radial edge points (for corners)
    const x1OuterCorner = CX + (outerR - cornerRadius) * Math.cos(startRad);
    const y1OuterCorner = CY + (outerR - cornerRadius) * Math.sin(startRad);
    const x1InnerCorner = CX + (innerR + cornerRadius) * Math.cos(startRad);
    const y1InnerCorner = CY + (innerR + cornerRadius) * Math.sin(startRad);

    const x2OuterCorner = CX + (outerR - cornerRadius) * Math.cos(endRad);
    const y2OuterCorner = CY + (outerR - cornerRadius) * Math.sin(endRad);
    const x2InnerCorner = CX + (innerR + cornerRadius) * Math.cos(endRad);
    const y2InnerCorner = CY + (innerR + cornerRadius) * Math.sin(endRad);

    const largeArc = sweep > 180 ? 1 : 0;

    // Draw annular sector with fully rounded corners
    const d = [
      `M${x1OuterStart},${y1OuterStart}`,
      `A${outerR},${outerR} 0 ${largeArc} 1 ${x2OuterEnd},${y2OuterEnd}`,
      `A${cornerRadius},${cornerRadius} 0 0 1 ${x2OuterCorner},${y2OuterCorner}`,
      `L${x2InnerCorner},${y2InnerCorner}`,
      `A${cornerRadius},${cornerRadius} 0 0 1 ${x2InnerEnd},${y2InnerEnd}`,
      `A${innerR},${innerR} 0 ${largeArc} 0 ${x1InnerStart},${y1InnerStart}`,
      `A${cornerRadius},${cornerRadius} 0 0 1 ${x1InnerCorner},${y1InnerCorner}`,
      `L${x1OuterCorner},${y1OuterCorner}`,
      `A${cornerRadius},${cornerRadius} 0 0 1 ${x1OuterStart},${y1OuterStart}`,
      'Z'
    ].join(' ');

    wedges.push({ d, fill: seg.fill, centerX, centerY });
    startAngle += fullSweep; // advance by full sweep including gap
  });

  const hoveredSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;
  const hoveredWedge = hoveredIdx !== null ? wedges[hoveredIdx] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
        {/* Background ring */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#F0EFFE"
          strokeWidth={SW}
        />

        {/* Segmented donut wedges */}
        {wedges.map((w, i) => (
          <path
            key={i}
            d={w.d}
            fill={w.fill}
            fillOpacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.4}
            style={{
              animation: `fadeIn 0.6s ease-out ${i * 0.08}s both`,
              cursor: 'pointer',
              transition: 'fill-opacity 0.2s ease',
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onTouchStart={(e) => {
              e.preventDefault();
              setHoveredIdx(i);
            }}
            onTouchEnd={() => setTimeout(() => setHoveredIdx(null), 2000)}
          />
        ))}

        {/* Budget % ring — matches badge colors */}
        <HeroDonutBudgetRing
          percent={budgetPercent}
          color={budgetColor}
          bg={budgetBg}
          animationKey={budgetRingKey}
        />
      </svg>

      {/* Tooltip positioned at segment center */}
      {hoveredSegment && hoveredWedge && (
        <div style={{
          position: 'absolute',
          left: hoveredWedge.centerX,
          top: hoveredWedge.centerY,
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#1A1A2E',
          color: '#FFFFFF',
          padding: '8px 14px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          zIndex: 100,
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
            {hoveredSegment.name}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {formatCurrency(hoveredSegment.amount)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function HomeScreen() {
  const { state, formatCurrency, categories } = useApp();
  const navigate = useNavigate();
  const [range, setRange] = useState<HomeRange>('month');
  const [selectedMonthKey, setSelectedMonthKey] = useState(CURRENT_MONTH_KEY);

  const insights = usePeriodInsights(state.expenses, range, selectedMonthKey);

  const heroCategoryTotals = useMemo(() => {
    if (range === 'month') {
      return getCategoryTotals(state.expenses, selectedMonthKey);
    }
    const totals: Record<string, number> = {};
    for (const m of YEAR_MONTH_BARS) {
      const monthTotals = getCategoryTotals(state.expenses, m.key);
      for (const [catId, amt] of Object.entries(monthTotals)) {
        totals[catId] = (totals[catId] ?? 0) + amt;
      }
    }
    return totals;
  }, [state.expenses, range, selectedMonthKey]);

  const periodBudget = range === 'year' ? state.monthlyBudget * 12 : state.monthlyBudget;
  const periodIncome = range === 'year' ? state.income * 12 : state.income;

  const totalSpent = useMemo(
    () => Object.values(heroCategoryTotals).reduce((s, v) => s + v, 0),
    [heroCategoryTotals],
  );

  const budgetPct   = Math.min((totalSpent / periodBudget) * 100, 100);
  const remaining   = periodBudget - totalSpent;
  const savingsAmt  = periodIncome - totalSpent;
  const savingsRate = ((savingsAmt / state.income) * 100).toFixed(0);

  // Animated counters
  const [animatedSpent, setAnimatedSpent] = useState(0);
  const [animatedBudgetPct, setAnimatedBudgetPct] = useState(0);

  useEffect(() => {
    const duration = 800; // 0.8 seconds
    const frames = 60;
    const increment = totalSpent / frames;
    const pctIncrement = budgetPct / frames;
    const interval = duration / frames;

    let currentFrame = 0;
    const timer = setInterval(() => {
      currentFrame++;
      if (currentFrame >= frames) {
        setAnimatedSpent(totalSpent);
        setAnimatedBudgetPct(budgetPct);
        clearInterval(timer);
      } else {
        setAnimatedSpent(increment * currentFrame);
        setAnimatedBudgetPct(pctIncrement * currentFrame);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [totalSpent, budgetPct]);

  const budgetColor = budgetPct < 60 ? '#10B981' : budgetPct < 85 ? '#F59E0B' : '#EF4444';
  const budgetBg    = budgetPct < 60 ? '#D1FAE5' : budgetPct < 85 ? '#FEF3C7' : '#FEE2E2';
  const budgetRingKey = `${range}-${selectedMonthKey}`;

  const insightCards = useHomeInsightCards(formatCurrency, insights.monthlyBarData);

  const topCategories = useMemo(() =>
    categories
      .map(cat => ({ ...cat, amount: heroCategoryTotals[cat.id] ?? 0 }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
    [heroCategoryTotals, categories],
  );

  const spentLabel = range === 'year' ? 'Spent this year' : 'Spent';

  const stats = [
    {
      label: 'Income',
      value: formatCurrency(state.income),
      icon: <ArrowUp size={13} weight="light" color="#3E37FF" />,
      bg: '#EDEDFF',
    },
    {
      label: 'Remaining',
      value: formatCurrency(Math.abs(remaining)),
      icon: remaining >= 0
        ? <Wallet    size={13} weight="light" color="#10B981" />
        : <ArrowDown size={13} weight="light" color="#EF4444" />,
      bg: remaining >= 0 ? '#D1FAE5' : '#FEE2E2',
    },
    {
      label: 'Saved',
      value: `${savingsRate}%`,
      icon: <PiggyBank size={13} weight="light" color="#7C3AED" />,
      bg: '#F3E8FF',
    },
  ];

  /* inner circle radius for absolute center overlay */
  const innerR = R - SW / 2 - 8; // ≈ 97px

  return (
    <div style={{ height: '100%', position: 'relative', overflowX: 'hidden' }}>
      <div
        className="home-screen-scroll"
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#F5F5FA',
          paddingBottom: TAB_BAR_CLEARANCE,
          overscrollBehaviorX: 'none',
        }}
      >

        {/* ╔══════════════════════════╗
            ║   GRADIENT HERO          ║
            ╚══════════════════════════╝ */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(168deg,#ECEAFF 0%,#E5E2FF 22%,#EEF0FF 52%,#F3F2FF 85%,#F5F5FA 100%)',
          paddingBottom: 28,
          marginBottom: 16,
          boxSizing: 'content-box',
        }}>
          {/* Bottom fade into page background */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 72,
              pointerEvents: 'none',
              zIndex: 4,
              background: 'linear-gradient(to bottom, rgba(245,245,250,0) 0%, #F5F5FA 88%)',
            }}
          />
          {/* Decorative blobs */}
          <div style={{ position:'absolute', width:260, height:260, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 68%)',
            top:-80, right:-50, pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(62,55,255,0.10) 0%,transparent 68%)',
            top:60, left:-60, pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:130, height:130, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)',
            bottom:80, right:20, pointerEvents:'none' }} />

          {/* Top row — period toggle (left) + avatar (right) */}
          <div style={{
            position: 'relative',
            padding: '14px 14px 16px',
            paddingRight: 62,
            zIndex: 20,
            minHeight: 48,
          }}>
            <RangeToggle
              compact
              range={range}
              onChange={setRange}
              monthKey={selectedMonthKey}
              onMonthChange={setSelectedMonthKey}
            />

            <button
              type="button"
              onClick={() => navigate('/settings')}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 40,
                height: 40,
                borderRadius: 20,
                border: '2.5px solid rgba(255,255,255,0.9)',
                cursor: 'pointer',
                overflow: 'hidden',
                padding: 0,
                background: 'none',
                boxShadow: '0 4px 14px rgba(62,55,255,0.22)',
                transition: 'transform 0.2s ease',
              }}
            >
              {state.userAvatar
                ? <img src={state.userAvatar} alt="avatar"
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                : <div style={{ width:'100%', height:'100%',
                    background:'linear-gradient(135deg,#3E37FF 0%,#7C3AED 100%)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontSize:16, fontWeight:700 }}>
                    {state.userName[0]}
                  </div>
              }
            </button>
          </div>

          {/* ── White card ── */}
          <div style={{
            margin: '0 14px',
            backgroundColor: '#FFFFFF',
            borderRadius: 22,
            boxShadow: '0 6px 28px rgba(62,55,255,0.11), 0 2px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 5,
            animation: 'slideUpFade 0.7s ease-out both',
          }}>

            {/* ══ SVG DONUT — edge-to-edge, no padding waste ══ */}
            <div style={{ position: 'relative' }}>
              {topCategories.length === 0 ? (
                // Empty state donut
                <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
                  <circle
                    cx={CX} cy={CY} r={R}
                    fill="none"
                    stroke="#F0EFFE"
                    strokeWidth={SW}
                  />
                  <HeroDonutBudgetRing
                    percent={budgetPct}
                    color={budgetColor}
                    bg={budgetBg}
                    animationKey={budgetRingKey}
                  />
                </svg>
              ) : (
                <DonutChart
                  segments={topCategories.map(cat => ({
                    fill: cat.color,
                    amount: cat.amount,
                    name: cat.name
                  }))}
                  formatCurrency={formatCurrency}
                  budgetPercent={budgetPct}
                  budgetColor={budgetColor}
                  budgetBg={budgetBg}
                  budgetRingKey={budgetRingKey}
                />
              )}

              {/* Centre overlay — perfectly pinned to SVG centre */}
              <div style={{
                position: 'absolute',
                left: CX,
                top: CY,
                transform: 'translate(-50%, -50%)',
                width: innerR * 2,
                height: innerR * 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                animation: 'fadeIn 0.8s ease-out 0.4s both',
              }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    display: 'block',
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: '#A09CC4',
                    letterSpacing: 1.8,
                    textTransform: 'uppercase' as const,
                  }}>
                    {spentLabel}
                  </span>
                  <span style={{
                    display: 'block',
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#1A1A2E',
                    letterSpacing: -1.2,
                    lineHeight: 1,
                  }}>
                    {formatCurrency(animatedSpent)}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/budget')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      backgroundColor: budgetBg,
                      borderRadius: 12,
                      padding: '4px 6px 4px 10px',
                      border: `1px solid ${budgetColor}40`,
                      boxShadow: `0 1px 2px ${budgetColor}18`,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      fontFamily: 'inherit',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.04)';
                      e.currentTarget.style.boxShadow = `0 2px 6px ${budgetColor}28`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = `0 1px 2px ${budgetColor}18`;
                    }}
                  >
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: budgetColor,
                    }}>
                      {animatedBudgetPct.toFixed(0)}% of budget
                    </span>
                    <CaretRight size={12} weight="bold" color={budgetColor} />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display:'flex', borderTop:'1px solid #F3F4F6' }}>
              {stats.map((s, i) => (
                <div key={s.label} style={{
                  flex:1, padding:'13px 8px 14px', textAlign:'center',
                  borderRight: i < 2 ? '1px solid #F3F4F6' : 'none',
                  animation: `fadeIn 0.6s ease-out ${0.7 + i * 0.1}s both`,
                }}>
                  <div style={{ width:30, height:30, borderRadius:9, backgroundColor:s.bg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto 7px' }}>
                    {s.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                    <p style={{ fontSize:13, fontWeight:800, color:'#1A1A2E',
                      margin:0, letterSpacing:-0.3, lineHeight:1.1 }}>{s.value}</p>
                    <p style={{ fontSize:10, color:'#9CA3AF', margin:0, fontWeight:500, lineHeight:1.1 }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <HomeInsightsRail cards={insightCards} />

        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {range === 'year' && (
            <section>
              <SectionTitle>Spending trend</SectionTitle>
              <SurfaceCard>
                <SpendingTrendChart data={insights.monthlyBarData} />
              </SurfaceCard>
            </section>
          )}

          {range === 'month' && (
            <section>
              <SectionTitle>Top expenses</SectionTitle>
              <TopExpensesCard
                items={insights.topExpenses}
                formatCurrency={formatCurrency}
              />
            </section>
          )}

          <section style={{ animation: 'slideUpFade 0.7s ease-out 0.3s both' }}>
            <SectionTitle
              action={
                <button
                  type="button"
                  onClick={() => navigate('/expenses')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#EDEDFF',
                    border: 'none',
                    borderRadius: 20,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#3E37FF',
                    fontFamily: 'inherit',
                  }}
                >
                  See all <ArrowRight size={11} weight="light" color="#3E37FF" />
                </button>
              }
            >
              Recent transactions
            </SectionTitle>
            <RecentTransactionsList
              range={range}
              monthKey={selectedMonthKey}
              yearLabel={insights.yearLabel}
              expenses={state.expenses}
              formatCurrency={formatCurrency}
            />
          </section>
        </div>
      </div>

      {/* Global animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeSlideLeft {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes barGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}