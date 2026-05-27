import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { PencilSimple } from '@phosphor-icons/react';
import type { PrimaryGoalDefinition } from '../../data/primaryGoalConfig';
import type { PrimaryGoalTarget } from '../../data/primaryGoalTarget';
import { formatTargetDateShort, goalRequiresTargetSetup } from '../../data/primaryGoalTarget';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { getFeatureCardTokens, featureCardGradient } from '../ui/featureCard';
import { featuredBudgetIconTile, hexToRgba, lightenHex } from '../../theme/darkModeUi';
import {
  getPrimaryGoalBarColor,
  type PrimaryGoalProgressResult,
} from '../../utils/primaryGoalProgress';

const BAR_EASE = [0.32, 0.72, 0, 1] as const;

const TRACK_STRIPE = (accentColor: string) =>
  `repeating-linear-gradient(45deg, transparent, transparent 5px, ${accentColor}1A 5px, ${accentColor}1A 7px)`;

export function PrimaryGoalFocusCard({
  goal,
  target,
  progress,
  animationDelay = 0,
  onEdit,
  formatCurrency,
}: {
  goal: PrimaryGoalDefinition;
  target: PrimaryGoalTarget | null;
  progress: PrimaryGoalProgressResult;
  animationDelay?: number;
  onEdit: () => void;
  formatCurrency: (n: number) => string;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const fc = getFeatureCardTokens(c);
  const Icon = goal.Icon;
  const iconTile = featuredBudgetIconTile(goal.accentColor, goal.accentBg, isDark);
  const trackBg = isDark ? hexToRgba(goal.accentBg, 0.2) : goal.accentBg;
  const fillColor = lightenHex(goal.accentColor, 0.28);
  const barFillPercent = progress.percent;

  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    setBarPct(0);
    const t = window.setTimeout(() => setBarPct(barFillPercent), animationDelay + 40);
    return () => window.clearTimeout(t);
  }, [barFillPercent, animationDelay]);

  const barColor = getPrimaryGoalBarColor(barFillPercent, progress.invertedBar);

  const targetLine =
    target && goalRequiresTargetSetup(goal.id) && target.targetAmount > 0
      ? `${target.name ? `${target.name} · ` : ''}${formatCurrency(target.targetAmount)} by ${formatTargetDateShort(target.targetDate)}`
      : null;

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label="Edit your focus goal"
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 0,
        border: `2px solid ${hexToRgba(goal.accentColor, isDark ? 0.45 : 0.28)}`,
        borderRadius: fc.radius,
        background: featureCardGradient(goal.accentBg, c.featureCardEnd, isDark),
        boxShadow: `0 4px 20px ${hexToRgba(goal.accentColor, 0.18)}`,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ padding: '12px 14px 11px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: iconTile.iconSurfaceBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} weight="light" color={iconTile.iconGlyphColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: c.textMuted, marginBottom: 2 }}>
              {goal.shortLabel}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>
                {goal.label}
              </span>
              <PencilSimple size={16} weight="light" color={goal.accentColor} aria-hidden />
            </div>
            {targetLine ? (
              <div
                style={{
                  fontSize: 11,
                  color: c.textMuted,
                  marginTop: 4,
                  lineHeight: 1.35,
                  fontWeight: 500,
                }}
              >
                {targetLine}
              </div>
            ) : null}
          </div>
        </div>

        {progress.emptyHelper ? (
          <p style={{ fontSize: 11, color: c.textMuted, margin: '0 0 8px', lineHeight: 1.4 }}>
            {progress.emptyHelper}
          </p>
        ) : null}

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={barFillPercent}
          aria-label={`${goal.label} progress`}
          style={{
            position: 'relative',
            height: 8,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: trackBg,
            backgroundImage: TRACK_STRIPE(goal.accentColor),
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
              backgroundColor: barFillPercent > 0 ? barColor : fillColor,
              borderRadius: 999,
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 6,
            flexWrap: 'wrap',
          }}
        >
          <span className="font-figure" style={{ fontSize: 11, fontWeight: 700, color: c.text }}>
            {progress.percent}%
          </span>
          <span style={{ fontSize: 10, color: c.textMuted, fontWeight: 600 }}>
            {progress.metricLabel} ·{' '}
            <span className="font-figure" style={{ color: c.text }}>
              {progress.metricValue}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
