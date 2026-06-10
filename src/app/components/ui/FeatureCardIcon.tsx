import {
  ArrowsClockwise,
  ChartLineUp,
  Target,
  TrendUp,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { CategoryIconKey } from '../../data/categoryConfig';
import type { InsightPhosphorIcon } from '../../hooks/useInsightsHighlightCards';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { CategoryIcon, CategoryIconPreview } from '../CategoryIcon';
import { getFeatureCardTokens } from './featureCard';
import { featureIconTile } from '../../theme/darkModeUi';

export type FeatureCardPhosphorIcon = InsightPhosphorIcon | 'target';

const PHOSPHOR_ICONS = {
  'trend-up': TrendUp,
  'arrows-clockwise': ArrowsClockwise,
  'chart-line-up': ChartLineUp,
  target: Target,
} satisfies Record<FeatureCardPhosphorIcon, PhosphorIcon>;

export type FeatureCardIconProps = {
  accentColor: string;
  accentBg: string;
  iconSurfaceBg?: string;
  iconGlyphColor?: string;
  categoryId?: string;
  /** When `categoryId` is set — defaults to `sm` (insights). */
  categoryIconSize?: 'sm' | 'md';
  iconKey?: CategoryIconKey;
  phosphorIcon?: FeatureCardPhosphorIcon;
  /** Smaller tile for 2-column budget cards */
  compact?: boolean;
};

export function FeatureCardIcon({
  accentColor,
  accentBg,
  iconSurfaceBg,
  iconGlyphColor,
  categoryId,
  categoryIconSize = 'sm',
  iconKey,
  phosphorIcon,
  compact = false,
}: FeatureCardIconProps) {
  const { isDark } = useAppearance();
  const c = useAppColors();
  const fc = getFeatureCardTokens(c);
  const themed = featureIconTile(accentColor, accentBg, isDark);
  const tileBg = iconSurfaceBg ?? themed.iconSurfaceBg;
  const glyph = iconGlyphColor ?? themed.iconGlyphColor;
  const tileIsGradient = typeof tileBg === 'string' && tileBg.includes('gradient');
  const tile = compact ? { outer: 28, inner: 14, radius: 8 } : fc.icon;

  if (categoryId) {
    return <CategoryIcon categoryId={categoryId} size={categoryIconSize} />;
  }

  if (iconKey) {
    return (
      <CategoryIconPreview
        iconKey={iconKey}
        color={accentColor}
        bg={tileBg}
        iconColor={glyph}
        size={compact ? 'xs' : 'sm'}
      />
    );
  }

  if (phosphorIcon) {
    const Icon = PHOSPHOR_ICONS[phosphorIcon];
    const { outer, inner, radius } = tile;
    return (
      <div
        style={{
          width: outer,
          height: outer,
          borderRadius: radius,
          ...(tileIsGradient
            ? { background: tileBg }
            : tileBg && tileBg !== 'transparent'
              ? { backgroundColor: tileBg }
              : {}),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={inner} weight="light" color={glyph} aria-hidden />
      </div>
    );
  }

  return null;
}
