import type { ExpensesMonthInsight } from '../../hooks/useExpensesMonthInsight';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { FeatureCardIcon } from '../ui/FeatureCardIcon';
import { getFeatureCardTokens, featureCardSurface } from '../ui/featureCard';

export function ExpensesMonthInsightCard({ insight }: { insight: ExpensesMonthInsight }) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const fc = getFeatureCardTokens(c);

  return (
    <div
      style={{
        width: '100%',
        ...featureCardSurface(insight.accentBg, c, { isDark }),
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, ...fc.eyebrow }}>{insight.eyebrow}</p>
        <p style={{ margin: '2px 0 0', ...fc.headline }}>{insight.headline}</p>
        <p style={{ margin: '2px 0 0', ...fc.detail }}>{insight.detail}</p>
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
