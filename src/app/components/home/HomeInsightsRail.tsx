import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowsClockwise, Package, Target, TrendUp } from '@phosphor-icons/react';
import type { InsightCardData } from '../../hooks/useHomeInsightCards';
import { useApp } from '../../context/AppContext';
import { CATEGORY_ICON_MAP, type CategoryIconKey } from '../../data/categoryConfig';
import { SectionTitle } from '../ui/SectionTitle';

/** Home content gutter (14px) + SectionTitle inner padding (2px) — matches Top expenses, etc. */
const HOME_GUTTER = 14;
const CARD_INSET = HOME_GUTTER + 2;
const CARD_WIDTH = 230;
const PAGE_BG = '#F5F5FA';
const CARD_SHADOW = '0 1px 6px rgba(0,0,0,0.04)';

const FLOAT_ICON = 68;
const FLOAT_ICON_INNER = 36;

function accentGradient(color: string): string {
  return `linear-gradient(
    148deg,
    color-mix(in srgb, ${color} 22%, white) 0%,
    ${color} 48%,
    color-mix(in srgb, ${color} 78%, #141428) 100%
  )`;
}

function FloatingInsightIcon({ card }: { card: InsightCardData }) {
  const { getCategory } = useApp();
  const iconProps = { size: FLOAT_ICON_INNER, weight: 'fill' as const, color: '#FFFFFF' };

  let icon = <TrendUp {...iconProps} />;
  if (card.categoryId) {
    const cat = getCategory(card.categoryId);
    const IconComp = CATEGORY_ICON_MAP[cat.iconKey as CategoryIconKey] ?? Package;
    icon = <IconComp {...iconProps} />;
  } else if (card.id.includes('budget')) {
    icon = <Target {...iconProps} />;
  } else if (card.id.includes('recurring')) {
    icon = <ArrowsClockwise {...iconProps} />;
  }

  const glow = `${card.accentColor}28`;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        right: 8,
        top: 8,
        width: FLOAT_ICON,
        height: FLOAT_ICON,
        borderRadius: 20,
        background: accentGradient(card.accentColor),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
        transform: 'perspective(520px) rotateY(-16deg) rotateX(10deg) skewY(-3deg)',
        boxShadow: `
          0 8px 18px ${glow},
          0 3px 8px rgba(26, 26, 46, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.38),
          inset 0 -1px 4px rgba(0, 0, 0, 0.08)
        `,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.35) 0%, transparent 42%)',
        }}
      />
      {icon}
    </div>
  );
}

function InsightCard({
  card,
  marginRight,
}: {
  card: InsightCardData;
  marginRight: number;
}) {
  return (
    <button
      type="button"
      onClick={card.onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        flex: `0 0 ${CARD_WIDTH}px`,
        scrollSnapAlign: 'start',
        width: CARD_WIDTH,
        marginRight,
        textAlign: 'left',
        border: 'none',
        borderRadius: 14,
        padding: '12px 14px',
        paddingTop: 10,
        paddingRight: FLOAT_ICON + 18,
        backgroundColor: '#FFFFFF',
        boxShadow: CARD_SHADOW,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minHeight: 96,
      }}
    >
      <FloatingInsightIcon card={card} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#9CA3AF',
              margin: 0,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {card.eyebrow}
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#1A1A2E',
              margin: '2px 0 0',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.headline}
          </p>
        </div>

        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 9px',
              borderRadius: 8,
              backgroundColor: card.accentBg,
              color: card.accentColor,
              lineHeight: 1.2,
            }}
          >
            {card.detail}
          </span>
          {card.progress !== undefined && (
            <div
              style={{
                marginTop: 6,
                height: 5,
                borderRadius: 999,
                backgroundColor: card.accentBg,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(card.progress, 100)}%`,
                  borderRadius: 999,
                  backgroundColor: card.accentColor,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function EdgeFade({
  side,
  visible,
}: {
  side: 'left' | 'right';
  visible: boolean;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        ...(side === 'left' ? { left: 0 } : { right: 0 }),
        width: 28,
        pointerEvents: 'none',
        zIndex: 2,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
        background:
          side === 'left'
            ? `linear-gradient(to right, ${PAGE_BG} 0%, ${PAGE_BG}88 35%, transparent 100%)`
            : `linear-gradient(to left, ${PAGE_BG} 0%, ${PAGE_BG}88 35%, transparent 100%)`,
      }}
    />
  );
}

export function HomeInsightsRail({ cards }: { cards: InsightCardData[] }) {
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
  }, [cards, updateFades]);

  if (cards.length === 0) return null;

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        paddingTop: 4,
        paddingBottom: 4,
        backgroundColor: PAGE_BG,
      }}
    >
      <div style={{ padding: `0 ${HOME_GUTTER}px`, marginBottom: 8 }}>
        <SectionTitle>Insights</SectionTitle>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <EdgeFade side="left" visible={showLeftFade} />
        <EdgeFade side="right" visible={showRightFade} />

        <div
          ref={scrollRef}
          onScroll={updateFades}
          className="home-insights-scroll"
          style={{
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: CARD_INSET,
            scrollPaddingRight: CARD_INSET,
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            overscrollBehaviorY: 'none',
            touchAction: 'pan-x',
            paddingBottom: 2,
            scrollbarWidth: 'none',
            maxWidth: '100%',
          }}
        >
          <div
            aria-hidden
            style={{ flex: `0 0 ${CARD_INSET}px`, width: CARD_INSET, scrollSnapAlign: 'none' }}
          />
          {cards.map((card, index) => (
            <InsightCard
              key={card.id}
              card={card}
              marginRight={index < cards.length - 1 ? 10 : CARD_INSET}
            />
          ))}
        </div>
      </div>

      <style>{`
        .home-insights-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
