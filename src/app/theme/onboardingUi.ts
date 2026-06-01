import type { CSSProperties } from 'react';
import { APP_PRIMARY, appPrimaryDarkRgba } from './authTheme';
import type { OnboardingTheme } from './onboardingTheme';
import { darkIconChip, hexToRgba, onboardingIconGradient } from './onboardingDarkUi';

/** Tappable onboarding rows — 1px stroke (app-wide). */
export const ONBOARDING_SELECTABLE_BORDER_WIDTH = 1;

export function onboardingIconChip(
  accentColor: string,
  isLight: boolean,
): { iconBg: string; iconColor: string } {
  if (isLight) {
    return {
      iconBg: hexToRgba(accentColor, 0.14),
      iconColor: accentColor,
    };
  }
  return darkIconChip(accentColor);
}

export function onboardingSelectableCard(
  theme: OnboardingTheme,
  selected: boolean,
  isLight: boolean,
): CSSProperties {
  return {
    border: `${ONBOARDING_SELECTABLE_BORDER_WIDTH}px solid ${selected ? theme.accent : theme.surfaceBorder}`,
    backgroundColor: selected ? theme.surfaceSelected : theme.surface,
    boxShadow: 'none',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
    ...(isLight
      ? {}
      : selected
        ? { boxShadow: `0 2px 16px ${theme.selectedShadow}` }
        : {}),
  };
}

export function onboardingRowCard(theme: OnboardingTheme): CSSProperties {
  return {
    backgroundColor: theme.surface,
    border: `1px solid ${theme.surfaceBorder}`,
    borderRadius: 12,
  };
}

export function onboardingToggleTrack(theme: OnboardingTheme, enabled: boolean): CSSProperties {
  return {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: enabled ? theme.accent : theme.progressTrack,
    position: 'relative' as const,
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  };
}

export function onboardingToggleThumb(theme: OnboardingTheme, enabled: boolean): CSSProperties {
  return {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.toggleThumb,
    position: 'absolute' as const,
    top: 2,
    left: enabled ? 22 : 2,
    transition: 'left 0.2s ease',
    boxShadow: enabled ? '0 1px 4px rgba(0, 0, 0, 0.2)' : 'none',
  };
}

export const onboardingSuccessColor = '#10B981';
export const onboardingDangerColor = '#EF4444';

export function onboardingHeroGradient(theme: OnboardingTheme, isLight: boolean): string {
  if (isLight) {
    return `linear-gradient(145deg, rgba(62, 55, 255, 0.12) 0%, ${theme.surface} 55%, rgba(13, 148, 136, 0.08) 100%)`;
  }
  return `linear-gradient(145deg, ${appPrimaryDarkRgba(0.38)} 0%, ${theme.surface} 55%, rgba(94, 234, 212, 0.08) 100%)`;
}

export function onboardingStepSegmentStyle(
  stepNumber: number,
  currentStep: number,
  theme: OnboardingTheme,
  isLight: boolean,
): CSSProperties {
  const isCurrent = stepNumber === currentStep;
  const isCompleted = stepNumber < currentStep;

  if (isCurrent) {
    return {
      height: 7,
      borderRadius: 4,
      backgroundColor: isLight ? APP_PRIMARY : theme.progressActive,
      boxShadow: isLight
        ? '0 0 14px rgba(62, 55, 255, 0.35)'
        : `0 0 14px ${appPrimaryDarkRgba(0.65)}`,
    };
  }

  if (isCompleted) {
    return {
      height: 5,
      borderRadius: 4,
      backgroundColor: isLight ? APP_PRIMARY : theme.progressActive,
      opacity: isLight ? 0.45 : 0.72,
    };
  }

  return {
    height: 5,
    borderRadius: 4,
    backgroundColor: theme.progressTrack,
  };
}

export function onboardingTitleStyle(theme: OnboardingTheme): CSSProperties {
  return {
    fontSize: 26,
    fontWeight: 800,
    color: theme.textPrimary,
    margin: '0 0 16px',
    letterSpacing: -0.5,
  };
}

export function onboardingLabelStyle(theme: OnboardingTheme): CSSProperties {
  return {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: theme.textPrimary,
    marginBottom: 8,
  };
}

export { onboardingIconGradient, hexToRgba };
