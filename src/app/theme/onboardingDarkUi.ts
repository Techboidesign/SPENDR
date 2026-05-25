import type { CSSProperties } from 'react';
import { AUTH_THEME, appPrimaryDarkRgba } from './authTheme';

/** Icon stroke on gradient chips in dark onboarding */
export const ONBOARDING_CHIP_ICON = '#FFFFFF';

function normalizeHex(hex: string): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length === 3) {
    return raw
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return raw.length === 6 ? raw : '3E37FF';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = normalizeHex(hex);
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

/** ~2× darker: half brightness per channel */
export function darkenHex(hex: string, factor = 0.5): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

/** Base accent for chips — near-black accents become visible charcoal */
export function onboardingSolidIconBg(accentColor: string): string {
  if (accentColor === '#0D0D17') return '#4A4A58';
  if (accentColor === '#8B8D9E') return '#6B7280';
  return accentColor;
}

/** Upper-left (darker) → lower-right (accent), 135deg */
export function onboardingIconGradient(accentColor: string): string {
  const base = onboardingSolidIconBg(accentColor);
  const dark = darkenHex(base, 0.5);
  return `linear-gradient(135deg, ${dark} 0%, ${base} 100%)`;
}

/** Gradient chip + white icon */
export function darkIconChip(accentColor: string): {
  iconBg: string;
  iconColor: string;
} {
  return {
    iconBg: onboardingIconGradient(accentColor),
    iconColor: ONBOARDING_CHIP_ICON,
  };
}

export function onboardingSelectableCard(selected: boolean): CSSProperties {
  return {
    border: `2px solid ${selected ? AUTH_THEME.accent : AUTH_THEME.surfaceBorder}`,
    backgroundColor: selected ? AUTH_THEME.surfaceSelected : AUTH_THEME.surface,
    boxShadow: selected ? `0 2px 16px ${appPrimaryDarkRgba(0.4)}` : 'none',
    transition: 'all 0.2s ease',
  };
}

export function onboardingRowCard(): CSSProperties {
  return {
    backgroundColor: AUTH_THEME.surface,
    border: `2px solid ${AUTH_THEME.surfaceBorder}`,
    borderRadius: 12,
  };
}

export function onboardingToggleTrack(enabled: boolean): CSSProperties {
  return {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: enabled ? AUTH_THEME.accent : AUTH_THEME.progressTrack,
    position: 'relative' as const,
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  };
}

export function onboardingToggleThumb(enabled: boolean): CSSProperties {
  return {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AUTH_THEME.textPrimary,
    position: 'absolute' as const,
    top: 2,
    left: enabled ? 22 : 2,
    transition: 'left 0.2s ease',
  };
}

export const onboardingSuccessColor = '#6EE7B7';
export const onboardingDangerColor = '#FCA5A5';
