import {
  ArrowsClockwise,
  ChartLineUp,
  Target,
  TrendUp,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { CategoryIconKey } from '../../data/categoryConfig';
import type { InsightPhosphorIcon } from '../../hooks/useHomeInsightCards';
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
}: FeatureCardIconProps) {
  const { isDark } = useAppearance();
  const c = useAppColors();
  const fc = getFeatureCardTokens(c);
  const themed = featureIconTile(accentColor, accentBg, isDark);
  const tileBg = iconSurfaceBg ?? themed.iconSurfaceBg;
  const glyph = iconGlyphColor ?? themed.iconGlyphColor;
  const tileIsGradient = typeof tileBg === 'string' && tileBg.includes('gradient');

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
        size="sm"
      />
    );
  }

  if (phosphorIcon) {
    const Icon = PHOSPHOR_ICONS[phosphorIcon];
    const { outer, inner, radius } = fc.icon;
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
