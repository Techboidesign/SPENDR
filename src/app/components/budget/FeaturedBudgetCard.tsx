import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Info, PencilSimple } from '@phosphor-icons/react';
import { FeatureCardIcon, type FeatureCardIconProps } from '../ui/FeatureCardIcon';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { getFeatureCardTokens, featureCardGradient } from '../ui/featureCard';
import { editPencilTile, featuredBudgetIconTile, hexToRgba, lightenHex } from '../../theme/darkModeUi';
import { CurrencyFigureAmount } from '../ui/CurrencyFigureAmount';
import { listRowLabelStyle } from '../../theme/typography';
import {
  getBudgetProgressColor,
  getBudgetRingFillPercent,
  getBudgetUsagePercent,
} from '../../utils/budgetProgress';

const TRACK_STRIPE = (accentColor: string) =>
  `repeating-linear-gradient(45deg, transparent, transparent 5px, ${accentColor}1A 5px, ${accentColor}1A 7px)`;

const BAR_EASE = [0.32, 0.72, 0, 1] as const;

export function FeaturedBudgetCard({
  title,
  subtitle,
  icon,
  spent,
  limit,
  accentColor,
  accentBg,
  formatCurrency,
  statusMessage,
  onClick,
  animationDelay = 0,
}: {
  title: ReactNode;
  subtitle?: string;
  icon: Omit<FeatureCardIconProps, 'accentColor' | 'accentBg'>;
  spent: number;
  limit: number;
  accentColor: string;
  accentBg: string;
  formatCurrency: (n: number) => string;
  statusMessage?: string;
  onClick: () => void;
  animationDelay?: number;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const fc = getFeatureCardTokens(c);
  const usagePercent = getBudgetUsagePercent(spent, limit);
  const barFillPercent = getBudgetRingFillPercent(usagePercent);
  const remaining = Math.max(limit - spent, 0);
  const isOver = spent > limit && limit > 0;
  const fillColor = isOver ? getBudgetProgressColor(usagePercent) : lightenHex(accentColor, 0.28);

  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    setBarPct(0);
    const t = window.setTimeout(() => setBarPct(barFillPercent), animationDelay + 40);
    return () => window.clearTimeout(t);
  }, [barFillPercent, animationDelay]);

  const pencil = editPencilTile(c, isDark);
  const trackBg = isDark ? hexToRgba(accentBg, 0.2) : accentBg;
  const iconTile = featuredBudgetIconTile(accentColor, accentBg, isDark);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: featureCardGradient(accentBg, c.featureCardEnd, isDark),
        borderRadius: fc.radiusLg,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: fc.shadow,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: fc.paddingLg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <FeatureCardIcon
            {...icon}
            accentColor={accentColor}
            accentBg={accentBg}
            iconSurfaceBg={iconTile.iconSurfaceBg}
            iconGlyphColor={iconTile.iconGlyphColor}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...listRowLabelStyle(c), lineHeight: 1.25 }}>
              {title}
            </div>
            {subtitle && (
              <p style={{ fontSize: 12, color: c.textFaint, margin: '4px 0 0' }}>{subtitle}</p>
            )}
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: pencil.bg,
              border: pencil.border,
              boxShadow: pencil.boxShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden
          >
            <PencilSimple size={18} weight="light" color={pencil.iconColor} />
          </div>
        </div>

        <p style={{ margin: '0 0 14px', lineHeight: 1.2 }}>
          <CurrencyFigureAmount
            formatted={formatCurrency(Math.ceil(limit))}
            color={c.text}
          />
        </p>

        <div
          style={{
            position: 'relative',
            height: 14,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: trackBg,
            backgroundImage: TRACK_STRIPE(accentColor),
          }}
        >
          <motion.div
            initial={false}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.85, ease: BAR_EASE }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              backgroundColor: fillColor,
              borderRadius: 999,
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 500 }}>
            {limit > 0 ? `${Math.round(usagePercent)}% used` : 'Your progress'}
          </span>
          <span
            className="font-figure"
            style={{
              fontSize: 12,
              color: isOver ? getBudgetProgressColor(usagePercent) : c.text,
            }}
          >
            {isOver ? `${formatCurrency(spent - limit)} over` : `${formatCurrency(remaining)} left`}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            backgroundColor: accentColor,
          }}
        >
          <Info size={16} weight="fill" color="#FFFFFF" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.35 }}>
            {statusMessage}
          </span>
        </div>
      )}
    </button>
  );
}
