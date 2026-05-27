import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { PrimaryGoalDefinition } from '../../data/primaryGoalConfig';
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
  progress,
  animationDelay = 0,
}: {
  goal: PrimaryGoalDefinition;
  progress: PrimaryGoalProgressResult;
  animationDelay?: number;
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

  return (
    <div
      role="region"
      aria-label="Primary goal progress"
      style={{
        width: '100%',
        background: featureCardGradient(goal.accentBg, c.featureCardEnd, isDark),
        borderRadius: fc.radius,
        boxShadow: fc.shadow,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '15px 17px 14px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: iconTile.iconSurfaceBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={20} weight="light" color={iconTile.iconGlyphColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 2 }}>
              {goal.shortLabel}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, lineHeight: 1.25 }}>
              {goal.label}
            </div>
            <p style={{ fontSize: 11, color: c.textFaint, margin: '4px 0 0', lineHeight: 1.4 }}>
              {goal.description}
            </p>
          </div>
        </div>

        {progress.emptyHelper ? (
          <p style={{ fontSize: 12, color: c.textMuted, margin: '0 0 10px', lineHeight: 1.45 }}>
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
            height: 10,
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
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          <span className="font-figure" style={{ fontSize: 12, fontWeight: 700, color: c.text }}>
            {progress.percent}%
          </span>
          <span style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>
            {progress.metricLabel} ·{' '}
            <span className="font-figure" style={{ color: c.text }}>
              {progress.metricValue}
            </span>
          </span>
        </div>

        <p
          style={{
            fontSize: 11,
            color: c.textMuted,
            margin: '10px 0 0',
            lineHeight: 1.45,
            fontWeight: 500,
          }}
        >
          {progress.statusLine}
        </p>
      </div>
    </div>
  );
}
