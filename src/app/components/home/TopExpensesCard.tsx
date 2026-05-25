import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { TrendDown, TrendUp } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { FeatureCardIcon } from '../ui/FeatureCardIcon';
import type { AppColorPalette } from '../../theme/appColors';
import { changeBadgeColors } from '../../theme/darkModeUi';
import { featureCardGradient } from '../ui/featureCard';

export type TopExpenseItem = {
  cat: string;
  curAmt: number;
  prevAmt: number;
  pctChange: number;
  pctOfTotal: number;
};

const CAROUSEL_CARD_W = 200;
const PAGE_GUTTER = 14;
const EDGE_FADE_W = 32;

function shortCategoryName(name: string): string {
  return name.split('/')[0].split(' & ')[0];
}

function getChangeMeta(item: TopExpenseItem, c: AppColorPalette, isDark: boolean) {
  const isUp = item.pctChange > 0;
  const isDown = item.pctChange < 0;
  const isNew = item.prevAmt === 0 && item.curAmt > 0;
  const direction = isUp ? 'up' : isDown ? 'down' : 'neutral';
  const { badgeBg, badgeColor } = changeBadgeColors(direction, c, isDark);
  const monthBadge = isNew
    ? 'New'
    : isUp
      ? `${item.pctChange.toFixed(0)}% more`
      : isDown
        ? `${Math.abs(item.pctChange).toFixed(0)}% less`
        : 'No change';
  return { badgeBg, badgeColor, monthBadge, isNew, isUp, isDown };
}

function EdgeFade({
  side,
  visible,
  pageBg,
}: {
  side: 'left' | 'right';
  visible: boolean;
  pageBg: string;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        ...(side === 'left' ? { left: 0 } : { right: 0 }),
        width: EDGE_FADE_W,
        pointerEvents: 'none',
        zIndex: 2,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
        background:
          side === 'left'
            ? `linear-gradient(to right, ${pageBg} 0%, ${pageBg}88 35%, transparent 100%)`
            : `linear-gradient(to left, ${pageBg} 0%, ${pageBg}88 35%, transparent 100%)`,
      }}
    />
  );
}

export function TopExpensesCard({
  items,
  formatCurrency,
}: {
  items: TopExpenseItem[];
  formatCurrency: (n: number) => string;
}) {
  const c = useAppColors();
  const { getCategory } = useApp();
  const { isDark } = useAppearance();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setShowLeftFade(el.scrollLeft > 6);
    setShowRightFade(maxScroll > 6 && el.scrollLeft < maxScroll - 6);
  }, []);

  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items, updateFades]);

  if (items.length === 0) {
    return (
      <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '12px 0' }}>
        No expenses this month
      </p>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        marginLeft: -PAGE_GUTTER,
        marginRight: -PAGE_GUTTER,
        width: `calc(100% + ${PAGE_GUTTER * 2}px)`,
        overflow: 'visible',
        paddingBottom: 14,
      }}
    >
      <EdgeFade side="left" visible={showLeftFade} pageBg={c.canvasHome} />
      <EdgeFade side="right" visible={showRightFade} pageBg={c.canvasHome} />

      <div
        ref={scrollRef}
        onScroll={updateFades}
        className="top-expenses-scroll"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollPaddingLeft: PAGE_GUTTER,
          scrollPaddingRight: PAGE_GUTTER,
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-x',
          paddingTop: 4,
          paddingBottom: 8,
          paddingLeft: PAGE_GUTTER,
          paddingRight: PAGE_GUTTER,
          scrollbarWidth: 'none',
        }}
      >
        {items.map(item => {
          const cat = getCategory(item.cat);
          const { badgeBg, badgeColor, monthBadge, isNew, isUp, isDown } = getChangeMeta(item, c, isDark);

          return (
            <button
              key={item.cat}
              type="button"
              onClick={() => navigate('/expenses')}
              style={{
                flex: `0 0 ${CAROUSEL_CARD_W}px`,
                scrollSnapAlign: 'start',
                width: CAROUSEL_CARD_W,
                padding: '14px 14px',
                borderRadius: 16,
                border: 'none',
                background: featureCardGradient(cat.bg, c.featureCardEnd, isDark),
                boxShadow: c.shadowCard,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <FeatureCardIcon
                  accentColor={cat.color}
                  accentBg={cat.bg}
                  categoryId={item.cat}
                  categoryIconSize="md"
                />
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    lineHeight: 1,
                    padding: '4px 8px',
                    borderRadius: 20,
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {!isNew && isUp && (
                    <TrendUp size={12} weight="light" color={badgeColor} aria-hidden />
                  )}
                  {!isNew && isDown && (
                    <TrendDown size={12} weight="light" color={badgeColor} aria-hidden />
                  )}
                  {monthBadge}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: '0 0 3px' }}>
                  {shortCategoryName(cat.name)}
                </p>
                <p
                  className="font-figure"
                  style={{ fontSize: 18, color: isDark ? c.textSecondary : cat.color, margin: 0, letterSpacing: -0.5 }}
                >
                  {formatCurrency(item.curAmt)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .top-expenses-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
