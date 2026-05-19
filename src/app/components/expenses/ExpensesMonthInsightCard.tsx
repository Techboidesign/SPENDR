import type { ExpensesMonthInsight } from '../../hooks/useExpensesMonthInsight';
import { FeatureCardIcon } from '../ui/FeatureCardIcon';
import { FEATURE_CARD, featureCardSurface } from '../ui/featureCard';

export function ExpensesMonthInsightCard({ insight }: { insight: ExpensesMonthInsight }) {
  return (
    <div
      style={{
        width: '100%',
        ...featureCardSurface(insight.accentBg),
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, ...FEATURE_CARD.eyebrow }}>{insight.eyebrow}</p>
        <p style={{ margin: '2px 0 0', ...FEATURE_CARD.headline }}>{insight.headline}</p>
        <p style={{ margin: '2px 0 0', ...FEATURE_CARD.detail }}>{insight.detail}</p>
      </div>

      <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
        <FeatureCardIcon
          accentColor={insight.accentColor}
          accentBg={insight.accentBg}
          categoryId={insight.categoryId}
          iconKey={insight.iconKey}
          phosphorIcon={insight.phosphorIcon}
        />
      </div>
    </div>
  );
}
