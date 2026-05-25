import type { InsightCardData } from '../../hooks/useHomeInsightCards';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { FeatureCardIcon } from '../ui/FeatureCardIcon';
import { getFeatureCardTokens, featureCardGradient } from '../ui/featureCard';
import { SectionTitle } from '../ui/SectionTitle';

const HOME_GUTTER = 14;

function InsightCard({ card }: { card: InsightCardData }) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const fc = getFeatureCardTokens(c);
  return (
    <button
      type="button"
      onClick={card.onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        textAlign: 'left',
        border: 'none',
        borderRadius: fc.radius,
        padding: fc.padding,
        background: featureCardGradient(card.accentBg, c.featureCardEnd, isDark),
        boxShadow: fc.shadow,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        minHeight: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, ...fc.eyebrow }}>{card.eyebrow}</p>
        <p style={{ margin: '2px 0 0', ...fc.headline }}>{card.headline}</p>
        <p style={{ margin: '2px 0 0', ...fc.detail }}>{card.detail}</p>
        {card.progress !== undefined && (
          <div
            style={{
              marginTop: 6,
              height: 4,
              borderRadius: 999,
              backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
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

      <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
        <FeatureCardIcon
          accentColor={card.accentColor}
          accentBg={card.accentBg}
          categoryId={card.categoryId}
          iconKey={card.iconKey}
          phosphorIcon={card.phosphorIcon}
        />
      </div>
    </button>
  );
}

export function HomeInsightsRail({ cards }: { cards: InsightCardData[] }) {
  const c = useAppColors();
  const visible = cards.slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <section
      style={{
        width: '100%',
        paddingTop: 4,
        paddingBottom: 4,
        backgroundColor: c.canvasHome,
      }}
    >
      <div style={{ padding: `0 ${HOME_GUTTER}px` }}>
        <SectionTitle>Insights</SectionTitle>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          padding: `0 ${HOME_GUTTER}px`,
        }}
      >
        {visible.map(card => (
          <InsightCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
