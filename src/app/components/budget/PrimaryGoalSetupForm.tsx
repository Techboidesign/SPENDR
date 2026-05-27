import type { PrimaryGoalTarget } from '../../data/primaryGoalTarget';
import {
  createEmptyPrimaryGoalTarget,
  goalRequiresTargetSetup,
  isPrimaryGoalTargetValid,
} from '../../data/primaryGoalTarget';
import type { PrimaryGoalId } from '../../data/types';
import {
  getGoalTargetFieldCopy,
  getPrimaryGoalDefinition,
  PRIMARY_GOAL_BY_ID,
  PRIMARY_GOAL_IDS,
} from '../../data/primaryGoalConfig';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { FormInput } from '../shared/FormFields';
import { featuredBudgetIconTile } from '../../theme/darkModeUi';
import { AUTH_THEME } from '../../theme/authTheme';
import { darkIconChip, onboardingSelectableCard } from '../../theme/onboardingDarkUi';
import { Check } from '@phosphor-icons/react';

export function PrimaryGoalSetupForm({
  goalId,
  target,
  onGoalIdChange,
  onTargetChange,
  variant = 'app',
  showGoalPicker = false,
  formatMoney,
}: {
  goalId: PrimaryGoalId;
  target: PrimaryGoalTarget;
  onGoalIdChange?: (id: PrimaryGoalId) => void;
  onTargetChange: (next: PrimaryGoalTarget) => void;
  variant?: 'app' | 'onboarding';
  showGoalPicker?: boolean;
  formatMoney?: (n: number) => string;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const isOnboarding = variant === 'onboarding';
  const def = getPrimaryGoalDefinition(goalId);
  const needsTarget = goalRequiresTargetSetup(goalId);
  const copy = getGoalTargetFieldCopy(goalId);
  const fmt = formatMoney ?? ((n: number) => `$${Math.round(n).toLocaleString()}`);

  const fieldStyle = isOnboarding
    ? undefined
    : {
        borderColor: c.border,
        backgroundColor: c.surfaceAlt,
        color: c.text,
      };

  const labelStyle = isOnboarding
    ? { display: 'block' as const, fontSize: 13, fontWeight: 700, color: AUTH_THEME.textPrimary, marginBottom: 8 }
    : { display: 'block' as const, fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 };

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isOnboarding ? 14 : 12 }}>
      {showGoalPicker && onGoalIdChange ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={labelStyle}>Focus</span>
          {PRIMARY_GOAL_IDS.map(id => {
            const option = PRIMARY_GOAL_BY_ID[id];
            const Icon = option.Icon;
            const selected = id === goalId;
            const chip = isOnboarding
              ? darkIconChip(option.accentColor)
              : featuredBudgetIconTile(option.accentColor, option.accentBg, isDark);
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onGoalIdChange(id);
                  if (!goalRequiresTargetSetup(id)) {
                    onTargetChange(createEmptyPrimaryGoalTarget());
                  }
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: 'inherit',
                  ...(isOnboarding
                    ? onboardingSelectableCard(selected)
                    : {
                        border: `2px solid ${selected ? option.accentColor : c.border}`,
                        backgroundColor: selected ? `${option.accentBg}` : c.surface,
                      }),
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: isOnboarding
                      ? (chip as { iconBg: string }).iconBg
                      : (chip as { iconSurfaceBg: string }).iconSurfaceBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    size={18}
                    weight="light"
                    color={
                      isOnboarding
                        ? (chip as { iconColor: string }).iconColor
                        : (chip as { iconGlyphColor: string }).iconGlyphColor
                    }
                  />
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: isOnboarding ? AUTH_THEME.textPrimary : c.text }}>
                  {option.label}
                </span>
                {selected ? <Check size={16} weight="bold" color={option.accentColor} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {!needsTarget ? (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
            color: isOnboarding ? AUTH_THEME.textMuted : c.textMuted,
          }}
        >
          We&apos;ll map your spending across categories so you can see where money goes each month.
        </p>
      ) : (
        <>
          <div>
            <label style={labelStyle}>{copy.nameLabel}</label>
            <FormInput
              tone={isOnboarding ? 'dark' : 'light'}
              placeholder={copy.namePlaceholder}
              value={target.name}
              onChange={e => onTargetChange({ ...target, name: e.target.value })}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{copy.amountLabel}</label>
            <FormInput
              tone={isOnboarding ? 'dark' : 'light'}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="0"
              value={target.targetAmount > 0 ? String(target.targetAmount) : ''}
              onChange={e => {
                const v = parseFloat(e.target.value);
                onTargetChange({
                  ...target,
                  targetAmount: Number.isNaN(v) ? 0 : Math.max(0, v),
                });
              }}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{copy.dateLabel}</label>
            <FormInput
              tone={isOnboarding ? 'dark' : 'light'}
              type="date"
              min={minDate}
              value={target.targetDate}
              onChange={e => onTargetChange({ ...target, targetDate: e.target.value })}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{copy.currentLabel}</label>
            <FormInput
              tone={isOnboarding ? 'dark' : 'light'}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="0"
              value={target.currentAmount > 0 ? String(target.currentAmount) : ''}
              onChange={e => {
                const v = parseFloat(e.target.value);
                onTargetChange({
                  ...target,
                  currentAmount: Number.isNaN(v) ? 0 : Math.max(0, v),
                });
              }}
              style={fieldStyle}
            />
            {target.targetAmount > 0 ? (
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 11,
                  color: isOnboarding ? AUTH_THEME.textFaint : c.textFaint,
                }}
              >
                {fmt(target.currentAmount)} of {fmt(target.targetAmount)} so far
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export function isGoalSetupComplete(goalId: PrimaryGoalId, target: PrimaryGoalTarget): boolean {
  if (!goalRequiresTargetSetup(goalId)) return true;
  return isPrimaryGoalTargetValid(goalId, target);
}
