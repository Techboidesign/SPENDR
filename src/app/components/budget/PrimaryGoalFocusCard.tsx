import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { PencilSimple } from '@phosphor-icons/react';
import type { PrimaryGoalDefinition } from '../../data/primaryGoalConfig';
import type { PrimaryGoalTarget } from '../../data/primaryGoalTarget';
import { formatTargetDateShort, goalRequiresTargetSetup } from '../../data/primaryGoalTarget';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { getFeatureCardTokens, featureCardGradient } from '../ui/featureCard';
import { editPencilTile, featuredBudgetIconTile, hexToRgba, lightenHex } from '../../theme/darkModeUi';
import {
  computePrimaryGoalProgress,
  getPrimaryGoalBarColor,
  type PrimaryGoalProgressResult,
} from '../../utils/primaryGoalProgress';
import { GoalTargetProgressSlider } from './GoalTargetProgressSlider';

const BAR_EASE = [0.32, 0.72, 0, 1] as const;

const TRACK_STRIPE = (accentColor: string) =>
  `repeating-linear-gradient(45deg, transparent, transparent 5px, ${accentColor}1A 5px, ${accentColor}1A 7px)`;

export function PrimaryGoalFocusCard({
  goal,
  target,
  progress,
  animationDelay = 0,
  onEdit,
  onCurrentAmountChange,
  formatCurrency,
}: {
  goal: PrimaryGoalDefinition;
  target: PrimaryGoalTarget | null;
  progress: PrimaryGoalProgressResult;
  animationDelay?: number;
  onEdit: () => void;
  onCurrentAmountChange?: (amount: number) => void;
  formatCurrency: (n: number) => string;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const fc = getFeatureCardTokens(c);
  const Icon = goal.Icon;
  const iconTile = featuredBudgetIconTile(goal.accentColor, goal.accentBg, isDark);
  const pencil = editPencilTile(c, isDark);
  const trackBg = isDark ? hexToRgba(goal.accentBg, 0.2) : goal.accentBg;
  const fillColor = lightenHex(goal.accentColor, 0.28);

  const [previewAmount, setPreviewAmount] = useState<number | null>(null);

  const canDragProgress =
    goal.progressMode === 'target_amount' &&
    target != null &&
    target.targetAmount > 0 &&
    onCurrentAmountChange != null;

  const displayTarget = useMemo(() => {
    if (!target) return null;
    if (previewAmount == null) return target;
    return { ...target, currentAmount: previewAmount };
  }, [previewAmount, target]);

  const liveProgress = useMemo(
    () =>
      displayTarget && canDragProgress
        ? computePrimaryGoalProgress({
            goalId: goal.id,
            primaryGoalTarget: displayTarget,
            categoryTotals: {},
            budgetGoals: [],
            categoryIds: [],
          })
        : progress,
    [canDragProgress, displayTarget, goal.id, progress],
  );

  const barFillPercent = liveProgress.percent;

  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    if (canDragProgress) return;
    setBarPct(0);
    const t = window.setTimeout(() => setBarPct(barFillPercent), animationDelay + 40);
    return () => window.clearTimeout(t);
  }, [barFillPercent, animationDelay, canDragProgress]);

  const barColor = getPrimaryGoalBarColor(barFillPercent, liveProgress.invertedBar);

  const targetLine =
    target && goalRequiresTargetSetup(goal.id) && target.targetAmount > 0
      ? `${target.name ? `${target.name} · ` : ''}${formatCurrency(target.targetAmount)} by ${formatTargetDateShort(target.targetDate)}`
      : null;

  const cardSurface: CSSProperties = {
    width: '100%',
    textAlign: 'left',
    border: `2px solid ${hexToRgba(goal.accentColor, isDark ? 0.45 : 0.28)}`,
    borderRadius: fc.radius,
    background: featureCardGradient(goal.accentBg, c.featureCardEnd, isDark),
    boxShadow: `0 4px 20px ${hexToRgba(goal.accentColor, 0.18)}`,
    overflow: 'visible',
    fontFamily: 'inherit',
  };

  return (
    <div style={cardSurface}>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit your focus goal"
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 14px 0',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                rowGap: 4,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>
                {goal.label}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 7px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  flexShrink: 0,
                  backgroundColor: isDark
                    ? hexToRgba(goal.accentColor, 0.22)
                    : goal.accentBg,
                  color: goal.accentColor,
                }}
              >
                {goal.shortLabel}
              </span>
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
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
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
            <PencilSimple size={14} weight="light" color={pencil.iconColor} />
          </div>
        </div>
      </button>

      <div style={{ padding: '0 14px 11px', boxSizing: 'border-box' }}>
        {liveProgress.emptyHelper ? (
          <p style={{ fontSize: 11, color: c.textMuted, margin: '0 0 8px', lineHeight: 1.4 }}>
            {liveProgress.emptyHelper}
          </p>
        ) : null}

        {canDragProgress && target ? (
          <div style={{ margin: '14px 0 6px', overflow: 'visible' }}>
          <GoalTargetProgressSlider
            currentAmount={target.currentAmount}
            targetAmount={target.targetAmount}
            accentColor={goal.accentColor}
            trackBg={trackBg}
            fillColor={fillColor}
            animationDelay={animationDelay}
            onPreview={amount => setPreviewAmount(amount)}
            onCommit={amount => {
              setPreviewAmount(null);
              onCurrentAmountChange(amount);
            }}
          />
          </div>
        ) : (
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
        )}

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
            {liveProgress.percent}%
          </span>
          <span style={{ fontSize: 10, color: c.textMuted, fontWeight: 600 }}>
            {liveProgress.metricLabel} ·{' '}
            <span className="font-figure" style={{ color: c.text }}>
              {liveProgress.metricValue}
            </span>
          </span>
        </div>
        {canDragProgress ? (
          <p style={{ margin: '6px 0 0', fontSize: 10, color: c.textFaint, lineHeight: 1.35 }}>
            Drag the bar to update how much you&apos;ve saved
          </p>
        ) : null}
      </div>
    </div>
  );
}
