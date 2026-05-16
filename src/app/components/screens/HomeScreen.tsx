import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, ArrowRight, ArrowUp, ArrowDown,
  Wallet, PiggyBank, ChartPieSlice,
} from '@phosphor-icons/react';
import { useApp, getCategoryTotals, getMonthlyAmount } from '../../context/AppContext';
import { CATEGORIES, getCategoryById } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';

// Dynamic date calculation
const today = new Date();
const CURRENT_MONTH = today.toISOString().slice(0, 7); // e.g., '2026-05'
const MONTH_LABEL = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const DAYS_LEFT = daysInMonth - today.getDate();

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

/* ─── SVG Donut component ────────────────────────────── */
function DonutChart({ segments, formatCurrency }: {
  segments: { fill: string; amount: number; name: string }[];
  formatCurrency: (n: number) => string;
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

  const frostR = innerR - 8; // 97

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

        {/* Frosted center for text overlay */}
        <circle cx={CX} cy={CY} r={frostR} fill="white" fillOpacity={0.92} />
        <defs>
          <radialGradient id="innerGrad2" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#F5F3FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EDE9FD" stopOpacity="0.5" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={frostR} fill="url(#innerGrad2)" />
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
  const { state, openAddModal, formatCurrency } = useApp();
  const navigate = useNavigate();

  const categoryTotals = useMemo(
    () => getCategoryTotals(state.expenses, CURRENT_MONTH),
    [state.expenses],
  );
  const totalSpent = useMemo(
    () => Object.values(categoryTotals).reduce((s, v) => s + v, 0),
    [categoryTotals],
  );

  const budgetPct   = Math.min((totalSpent / state.monthlyBudget) * 100, 100);
  const remaining   = state.monthlyBudget - totalSpent;
  const savingsAmt  = state.income - totalSpent;
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
  const budgetGrad  = budgetPct < 60
    ? 'linear-gradient(90deg,#10B981,#34D399)'
    : budgetPct < 85
    ? 'linear-gradient(90deg,#F59E0B,#FBBF24)'
    : 'linear-gradient(90deg,#EF4444,#F87171)';

  const statusText = budgetPct < 60
    ? 'On track'
    : budgetPct < 85
    ? 'Watch spending'
    : 'Over budget';

  const topCategories = useMemo(() =>
    CATEGORIES
      .map(cat => ({ ...cat, amount: categoryTotals[cat.id] ?? 0 }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount),
    [categoryTotals],
  );

  const top5Categories = useMemo(() => topCategories.slice(0, 5), [topCategories]);

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
    <div style={{ height: '100%', position: 'relative' }}>
      <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#F5F5FA', paddingBottom: 80 }}>

        {/* ╔══════════════════════════╗
            ║   GRADIENT HERO          ║
            ╚══════════════════════════╝ */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(168deg,#ECEAFF 0%,#E5E2FF 22%,#EEF0FF 52%,#F3F2FF 75%,#F7F7FA 100%)',
          paddingBottom: 20,
        }}>
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

          {/* Top row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'14px 20px 20px', position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ backgroundColor:'rgba(62,55,255,0.10)', borderRadius:20,
                padding:'5px 12px', display:'inline-flex', alignItems:'center', gap:6,
                animation: 'fadeIn 0.6s ease-out 0.1s both' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', backgroundColor:'#3E37FF',
                  animation: 'pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:12, fontWeight:600, color:'#3E37FF' }}>{MONTH_LABEL}</span>
              </div>

              <div style={{ display:'inline-flex', alignItems:'center', gap:7,
                backgroundColor:budgetBg, borderRadius:20, padding:'5px 12px',
                animation: 'fadeIn 0.6s ease-out 0.3s both' }}>
                <div style={{ width:7, height:7, borderRadius:4,
                  backgroundColor:budgetColor, flexShrink:0,
                  animation: 'pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:12, fontWeight:600, color:budgetColor }}>{statusText}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              style={{
                width:40, height:40, borderRadius:20,
                border:'2.5px solid rgba(255,255,255,0.9)',
                cursor:'pointer', flexShrink:0, overflow:'hidden',
                padding:0, background:'none',
                boxShadow:'0 4px 14px rgba(62,55,255,0.22)',
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
            position: 'relative', zIndex: 1,
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
                  <circle cx={CX} cy={CY} r={innerR} fill="white" fillOpacity={0.92} />
                  <defs>
                    <radialGradient id="innerGrad2" cx="40%" cy="35%" r="60%">
                      <stop offset="0%" stopColor="#F5F3FF" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#EDE9FD" stopOpacity="0.5" />
                    </radialGradient>
                  </defs>
                  <circle cx={CX} cy={CY} r={innerR} fill="url(#innerGrad2)" />
                </svg>
              ) : (
                <DonutChart
                  segments={topCategories.map(cat => ({
                    fill: cat.color,
                    amount: cat.amount,
                    name: cat.name
                  }))}
                  formatCurrency={formatCurrency}
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
                    Spent
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
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: budgetBg,
                    borderRadius: 12,
                    padding: '4px 10px',
                  }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: budgetColor,
                    }}>
                      {animatedBudgetPct.toFixed(0)}% of budget
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget bar */}
            <div style={{ padding: '4px 20px 12px' }}>
              <div style={{ backgroundColor:'#F3F4F6', borderRadius:6, height:5, overflow:'hidden' }}>
                <div style={{
                  height:'100%', width:`${budgetPct}%`, borderRadius:6,
                  background:budgetGrad,
                  animation: 'progressBar 1.2s ease-out 0.6s both',
                }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:500 }}>
                  {formatCurrency(totalSpent)} spent
                </span>
                <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:500 }}>
                  {formatCurrency(state.monthlyBudget)} budget
                </span>
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
                  <p style={{ fontSize:13, fontWeight:800, color:'#1A1A2E',
                    margin:'0 0 2px', letterSpacing:-0.3 }}>{s.value}</p>
                  <p style={{ fontSize:10, color:'#9CA3AF', margin:0, fontWeight:500 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ╔══════════════════════════╗
            ║   BELOW-FOLD             ║
            ╚══════════════════════════╝ */}
        <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:12 }}>

          {/* Spending Breakdown */}
          <div style={{ backgroundColor:'#FFFFFF', borderRadius:18, padding:'16px 16px 4px',
            boxShadow:'0 2px 10px rgba(0,0,0,0.06)',
            animation: 'slideUpFade 0.7s ease-out 0.2s both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <ChartPieSlice size={15} weight="light" color="#3E37FF" />
                <p style={{ fontSize:14, fontWeight:700, color:'#1A1A2E', margin:0 }}>Breakdown</p>
              </div>
              <button
                onClick={() => navigate('/insights')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#DDD9FF';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#EDEDFF';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                style={{
                  display:'flex', alignItems:'center', gap:4, backgroundColor:'#EDEDFF',
                  border:'none', borderRadius:20, padding:'5px 10px', cursor:'pointer',
                  fontSize:11, fontWeight:600, color:'#3E37FF',
                  transition: 'all 0.2s ease',
                }}
              >
                Insights <ArrowRight size={11} weight="light" color="#3E37FF" />
              </button>
            </div>

            {top5Categories.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: '#F0EFFE', margin: '0 auto 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ChartPieSlice size={24} weight="light" color="#A09CC4" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', margin: '0 0 4px' }}>
                  No expenses yet
                </p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                  Add your first expense to see breakdown
                </p>
              </div>
            ) : (
              top5Categories.map((cat, i) => {
                const pct = totalSpent > 0
                  ? ((cat.amount / totalSpent) * 100).toFixed(1) : '0.0';
                return (
                  <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'10px 0',
                    borderBottom: i < top5Categories.length - 1 ? '1px solid #F7F7FA' : 'none',
                    animation: `fadeSlideLeft 0.5s ease-out ${0.4 + i * 0.08}s both` }}>
                    <CategoryIcon categoryId={cat.id} size="sm" />
                    <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#1A1A2E' }}>
                      {cat.name}
                    </span>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:14, fontWeight:700, color:'#1A1A2E', margin:0 }}>
                        {formatCurrency(cat.amount)}
                      </p>
                      <p style={{ fontSize:10, color:'#B0B7C3', margin:'1px 0 0', fontWeight:500 }}>
                        {pct}%
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Recent Transactions */}
          <div style={{ backgroundColor:'#FFFFFF', borderRadius:18, padding:'16px 16px 4px',
            boxShadow:'0 2px 10px rgba(0,0,0,0.06)',
            animation: 'slideUpFade 0.7s ease-out 0.3s both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Wallet size={15} weight="light" color="#3E37FF" />
                <p style={{ fontSize:14, fontWeight:700, color:'#1A1A2E', margin:0 }}>
                  Recent Transactions
                </p>
              </div>
              <button
                onClick={() => navigate('/expenses')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#DDD9FF';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#EDEDFF';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                style={{
                  display:'flex', alignItems:'center', gap:4, backgroundColor:'#EDEDFF',
                  border:'none', borderRadius:20, padding:'5px 10px', cursor:'pointer',
                  fontSize:11, fontWeight:600, color:'#3E37FF',
                  transition: 'all 0.2s ease',
                }}
              >
                See all <ArrowRight size={11} weight="light" color="#3E37FF" />
              </button>
            </div>

            {state.expenses
              .filter(e => e.date.startsWith(CURRENT_MONTH))
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5).length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: '#F0EFFE', margin: '0 auto 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wallet size={24} weight="light" color="#A09CC4" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', margin: '0 0 4px' }}>
                  No transactions yet
                </p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                  Tap + to add your first expense
                </p>
              </div>
            ) : (
              state.expenses
                .filter(e => e.date.startsWith(CURRENT_MONTH))
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5)
                .map((exp, i, arr) => {
                  const cat = getCategoryById(exp.categoryId);
                  return (
                    <div key={exp.id} style={{ display:'flex', alignItems:'center', gap:12,
                      padding:'9px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid #F7F7FA' : 'none',
                      animation: `fadeSlideLeft 0.5s ease-out ${0.5 + i * 0.08}s both` }}>
                      <CategoryIcon categoryId={exp.categoryId} size="sm" />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#1A1A2E', margin:0,
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {exp.name}
                        </p>
                        <p style={{ fontSize:11, color:'#9CA3AF', margin:'1px 0 0' }}>{cat.name}</p>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <p style={{ fontSize:14, fontWeight:700, color:'#1A1A2E', margin:0 }}>
                          -{formatCurrency(exp.amount)}
                        </p>
                        {exp.type !== 'one-time' && (
                          <span style={{ fontSize:9, fontWeight:600, color:'#D97706',
                            backgroundColor:'#FEF3C7', padding:'1px 5px', borderRadius:4 }}>
                            {exp.type === 'monthly' ? 'Monthly' : 'Yearly'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => openAddModal()}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        style={{
          position:'absolute', bottom:20, right:20,
          width:56, height:56, borderRadius:28,
          backgroundColor:'#3E37FF', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 6px 22px rgba(62,55,255,0.42)', zIndex:100,
          animation: 'bounceIn 0.5s ease-out 0.3s both',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <Plus size={24} weight="bold" color="#FFFFFF" />
      </button>

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

        @keyframes progressBar {
          from { width: 0; }
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