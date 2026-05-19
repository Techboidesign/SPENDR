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
  categoryId?: string;
  iconKey?: CategoryIconKey;
  phosphorIcon?: FeatureCardPhosphorIcon;
};

export function FeatureCardIcon({
  accentColor,
  accentBg,
  categoryId,
  iconKey,
  phosphorIcon,
}: FeatureCardIconProps) {
  if (categoryId) {
    return <CategoryIcon categoryId={categoryId} size="sm" />;
  }

  if (iconKey) {
    return (
      <CategoryIconPreview
        iconKey={iconKey}
        color={accentColor}
        bg={accentBg}
        iconColor={accentColor}
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
          backgroundColor: accentBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={inner} weight="light" color={accentColor} aria-hidden />
      </div>
    );
  }

  return null;
}
