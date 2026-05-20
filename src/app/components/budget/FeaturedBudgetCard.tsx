import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Info, PencilSimple } from '@phosphor-icons/react';
import { FeatureCardIcon, type FeatureCardIconProps } from '../ui/FeatureCardIcon';
import { FEATURE_CARD, featureCardGradient } from '../ui/featureCard';

/** Mix hex toward white for lighter progress fills */
function lightenHex(hex: string, mix = 0.32): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const blend = (c: number) => Math.round(c + (255 - c) * mix);
  return `#${[blend(r), blend(g), blend(b)].map(n => n.toString(16).padStart(2, '0')).join('')}`;
}

const TRACK_STRIPE = (accentColor: string) =>
  `repeating-linear-gradient(45deg, transparent, transparent 5px, ${accentColor}1A 5px, ${accentColor}1A 7px)`;

const BAR_EASE = [0.32, 0.72, 0, 1] as const;

/** Mix hex toward black (0–1). */
function mixTowardBlack(hex: string, t: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * (1 - t));
  return `#${[mix(r), mix(g), mix(b)].map(n => n.toString(16).padStart(2, '0')).join('')}`;
}

/** Relative luminance 0–1; lower = darker. */
function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  if (h.length !== 6) return 0.5;
  const srgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = srgb.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

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
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const remaining = Math.max(limit - spent, 0);
  const isOver = spent > limit && limit > 0;
  const fillColor = lightenHex(accentColor, 0.28);

  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    setBarPct(0);
    const t = window.setTimeout(() => setBarPct(pct), animationDelay + 40);
    return () => window.clearTimeout(t);
  }, [pct, animationDelay]);

  const iconSurfaceBg = mixTowardBlack(accentColor, 0.22);
  const iconGlyphColor = relativeLuminance(iconSurfaceBg) < 0.45 ? '#FFFFFF' : accentColor;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: featureCardGradient(accentBg),
        borderRadius: FEATURE_CARD.radiusLg,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: FEATURE_CARD.shadow,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: FEATURE_CARD.paddingLg }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <FeatureCardIcon
            {...icon}
            accentColor={accentColor}
            accentBg={accentBg}
            iconSurfaceBg={iconSurfaceBg}
            iconGlyphColor={iconGlyphColor}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0, lineHeight: 1.25 }}>
              {title}
            </div>
            {subtitle && (
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>{subtitle}</p>
            )}
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden
          >
            <PencilSimple size={18} weight="light" color="#6B7280" />
          </div>
        </div>

        <p style={{ margin: '0 0 14px', lineHeight: 1.2 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5 }}>
            {formatCurrency(spent)}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#9CA3AF', marginLeft: 6 }}>
            of {formatCurrency(limit)}
          </span>
        </p>

        <div
          style={{
            position: 'relative',
            height: 14,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: accentBg,
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
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Your progress</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E' }}>
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
