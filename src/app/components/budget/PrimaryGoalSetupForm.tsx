import type { PrimaryGoalTarget } from '../../data/primaryGoalTarget';
import {
  createEmptyPrimaryGoalTarget,
  goalRequiresTargetSetup,
  isPrimaryGoalTargetValid,
  monthKeyToTargetDateEnd,
  targetDateMonthKeyForPicker,
} from '../../data/primaryGoalTarget';
import type { PrimaryGoalId } from '../../data/types';
import {
  getGoalTargetFieldCopy,
  getPrimaryGoalDefinition,
  PRIMARY_GOAL_BY_ID,
  PRIMARY_GOAL_IDS,
} from '../../data/primaryGoalConfig';
import { useEffect } from 'react';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { CurrencyAmountInput } from '../shared/CurrencyAmountInput';
import { appFormFieldStyle, FormInput } from '../shared/FormFields';
import { MonthYearFieldInput } from '../shared/MonthYearFieldInput';
import {
  GOAL_TARGET_MONTH_MAX_DATE,
  GOAL_TARGET_MONTH_MAX_KEY,
  GOAL_TARGET_MONTH_MIN_DATE,
  GOAL_TARGET_MONTH_MIN_KEY,
} from '../../utils/periods';
import { featuredBudgetIconTile } from '../../theme/darkModeUi';
import { useOnboardingChromeOptional } from '../../context/OnboardingThemeContext';
import { ONBOARDING_THEME_LIGHT } from '../../theme/onboardingTheme';
import { OnboardingOptionIconChip } from '../onboarding/OnboardingOptionIconChip';
import { onboardingSelectableCard } from '../../theme/onboardingUi';
import { Check } from '@phosphor-icons/react';

export function PrimaryGoalSetupForm({
  goalId,
  target,
  onGoalIdChange,
  onTargetChange,
  variant = 'app',
  compact = false,
  showGoalPicker = false,
  excludedGoalTypes = [],
  currencySymbol = '$',
}: {
  goalId: PrimaryGoalId;
  target: PrimaryGoalTarget;
  onGoalIdChange?: (id: PrimaryGoalId) => void;
  onTargetChange: (next: PrimaryGoalTarget) => void;
  variant?: 'app' | 'onboarding';
  /** Tighter layout for bottom sheets (no inner scroll). */
  compact?: boolean;
  showGoalPicker?: boolean;
  excludedGoalTypes?: PrimaryGoalId[];
  currencySymbol?: string;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const onboardingChrome = useOnboardingChromeOptional();
  const isOnboarding = variant === 'onboarding';
  const obTheme = isOnboarding ? (onboardingChrome?.theme ?? ONBOARDING_THEME_LIGHT) : null;
  const obLight = isOnboarding ? (onboardingChrome?.isLight ?? true) : false;
  const def = getPrimaryGoalDefinition(goalId);
  const needsTarget = goalRequiresTargetSetup(goalId);
  const copy = getGoalTargetFieldCopy(goalId);

  const fieldStyle = isOnboarding ? undefined : appFormFieldStyle(c);

  const labelStyle = isOnboarding
    ? {
        display: 'block' as const,
        fontSize: 13,
        fontWeight: 700,
        color: obTheme!.textPrimary,
        marginBottom: 8,
      }
    : { display: 'block' as const, fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 };

  const stackGap = compact ? 8 : isOnboarding ? 14 : 12;
  const targetMonthKey = targetDateMonthKeyForPicker(target.targetDate);

  useEffect(() => {
    if (!needsTarget || target.targetDate) return;
    onTargetChange({
      ...target,
      targetDate: monthKeyToTargetDateEnd(GOAL_TARGET_MONTH_MIN_KEY),
    });
  }, [needsTarget, target.targetDate, onTargetChange, target]);

  const labelMb = compact ? 4 : 8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: stackGap }}>
      {showGoalPicker && onGoalIdChange ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8 }}>
          <span style={{ ...labelStyle, marginBottom: labelMb }}>Focus</span>
          <div
            style={
              compact
                ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }
                : { display: 'flex', flexDirection: 'column', gap: 8 }
            }
          >
          {PRIMARY_GOAL_IDS.filter(id => !excludedGoalTypes.includes(id)).map(id => {
            const option = PRIMARY_GOAL_BY_ID[id];
            const Icon = option.Icon;
            const selected = id === goalId;
            const iconTile = !isOnboarding
              ? featuredBudgetIconTile(option.accentColor, option.accentBg, isDark)
              : null;
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
                  padding: compact ? '8px 10px' : '10px 12px',
                  borderRadius: compact ? 12 : 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: compact ? 8 : 12,
                  fontFamily: 'inherit',
                  ...(isOnboarding
                    ? onboardingSelectableCard(obTheme!, selected, obLight)
                    : {
                        border: `1px solid ${selected ? option.accentColor : c.border}`,
                        backgroundColor: selected ? `${option.accentBg}` : c.surface,
                      }),
                }}
              >
                {isOnboarding ? (
                  <OnboardingOptionIconChip
                    icon={Icon}
                    accentColor={option.accentColor}
                    size={compact ? 'xs' : 'md'}
                  />
                ) : (
                  <div
                    style={{
                      width: compact ? 30 : 36,
                      height: compact ? 30 : 36,
                      borderRadius: compact ? 8 : 10,
                      background: iconTile!.iconSurfaceBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      size={18}
                      weight="light"
                      color={iconTile!.iconGlyphColor}
                    />
                  </div>
                )}
                <span
                  style={{
                    flex: 1,
                    fontSize: compact ? 12 : 14,
                    fontWeight: 700,
                    color: isOnboarding ? obTheme!.textPrimary : c.text,
                    lineHeight: 1.2,
                  }}
                >
                  {option.label}
                </span>
                {selected && !compact ? (
                  <Check size={16} weight="bold" color={option.accentColor} />
                ) : null}
              </button>
            );
          })}
          </div>
        </div>
      ) : null}

      {!needsTarget ? (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
            color: isOnboarding ? obTheme!.textMuted : c.textMuted,
          }}
        >
          We&apos;ll map your spending across categories so you can see where money goes each month.
        </p>
      ) : (
        <>
          <div>
            <label style={{ ...labelStyle, marginBottom: labelMb }}>{copy.nameLabel}</label>
            <FormInput
              tone={isOnboarding ? 'light' : isDark ? 'dark' : 'light'}
              placeholder={copy.namePlaceholder}
              value={target.name}
              onChange={e => onTargetChange({ ...target, name: e.target.value })}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, marginBottom: labelMb }}>{copy.dateLabel}</label>
            <MonthYearFieldInput
              monthKey={targetMonthKey}
              onMonthChange={key =>
                onTargetChange({
                  ...target,
                  targetDate: monthKeyToTargetDateEnd(key),
                })
              }
              tone={isOnboarding ? 'light' : isDark ? 'dark' : 'light'}
              style={fieldStyle}
              minDate={GOAL_TARGET_MONTH_MIN_DATE}
              maxDate={GOAL_TARGET_MONTH_MAX_DATE}
            />
          </div>
          {compact ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                alignItems: 'start',
              }}
            >
              <div>
                <label style={{ ...labelStyle, marginBottom: labelMb }}>{copy.amountLabel}</label>
                <CurrencyAmountInput
                  currencySymbol={currencySymbol}
                  tone={isOnboarding ? 'light' : isDark ? 'dark' : 'light'}
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
                <label style={{ ...labelStyle, marginBottom: labelMb }}>{copy.currentLabel}</label>
                <CurrencyAmountInput
                  currencySymbol={currencySymbol}
                  tone={isOnboarding ? 'light' : isDark ? 'dark' : 'light'}
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
              </div>
            </div>
          ) : (
            <>
              <div>
                <label style={{ ...labelStyle, marginBottom: labelMb }}>{copy.amountLabel}</label>
                <CurrencyAmountInput
                  currencySymbol={currencySymbol}
                  tone={isOnboarding ? 'light' : isDark ? 'dark' : 'light'}
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
                <label style={{ ...labelStyle, marginBottom: labelMb }}>{copy.currentLabel}</label>
                <CurrencyAmountInput
                  currencySymbol={currencySymbol}
                  tone={isOnboarding ? 'light' : isDark ? 'dark' : 'light'}
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
              </div>
            </>
          )}
          {compact ? (
            <p
              style={{
                margin: 0,
                fontSize: 10,
                color: c.textFaint,
                lineHeight: 1.35,
              }}
            >
              Also updates when you log expenses in{' '}
              {goalId === 'save' ? 'Goal' : goalId === 'debt' ? 'Debt' : 'Emergency'}.
            </p>
          ) : null}
          {!compact && target.targetAmount > 0 ? (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: isOnboarding ? obTheme!.textFaint : c.textFaint,
                lineHeight: 1.45,
              }}
            >
              Progress updates when you log expenses in your focus category (
              {goalId === 'save' ? 'Goal' : goalId === 'debt' ? 'Debt' : 'Emergency'}).
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function isGoalSetupComplete(goalId: PrimaryGoalId, target: PrimaryGoalTarget): boolean {
  if (!goalRequiresTargetSetup(goalId)) return true;
  return isPrimaryGoalTargetValid(goalId, target);
}
