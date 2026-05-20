import {
  ArrowsClockwise,
  ChartLineUp,
  Target,
  TrendUp,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { CategoryIconKey } from '../../data/categoryConfig';
import type { InsightPhosphorIcon } from '../../hooks/useHomeInsightCards';
import { CategoryIcon, CategoryIconPreview } from '../CategoryIcon';
import { FEATURE_CARD } from './featureCard';

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
  /** When set, overrides the icon tile background (e.g. darker chip on hero cards). */
  iconSurfaceBg?: string;
  /** When set, overrides icon/glyph color (e.g. white on dark tile). */
  iconGlyphColor?: string;
  categoryId?: string;
  iconKey?: CategoryIconKey;
  phosphorIcon?: FeatureCardPhosphorIcon;
};

export function FeatureCardIcon({
  accentColor,
  accentBg,
  iconSurfaceBg,
  iconGlyphColor,
  categoryId,
  iconKey,
  phosphorIcon,
}: FeatureCardIconProps) {
  const tileBg = iconSurfaceBg ?? accentBg;
  const glyph = iconGlyphColor ?? accentColor;

  if (categoryId) {
    return <CategoryIcon categoryId={categoryId} size="sm" />;
  }

  if (iconKey) {
    return (
      <CategoryIconPreview
        iconKey={iconKey}
        color={glyph}
        bg={tileBg}
        iconColor={glyph}
        size="sm"
      />
    );
  }

  if (phosphorIcon) {
    const Icon = PHOSPHOR_ICONS[phosphorIcon];
    const { outer, inner, radius } = FEATURE_CARD.icon;
    return (
      <div
        style={{
          width: outer,
          height: outer,
          borderRadius: radius,
          backgroundColor: tileBg,
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
