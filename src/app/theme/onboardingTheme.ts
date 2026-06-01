import { APP_PRIMARY, AUTH_THEME_DARK, appPrimaryDarkRgba } from './authTheme';

export type OnboardingTheme = {
  bgGradient: string;
  bgSolid: string;
  textPrimary: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentMint: string;
  surface: string;
  surfaceBorder: string;
  surfaceSelected: string;
  progressActive: string;
  progressTrack: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonGhost: string;
  footerBg: string;
  selectedShadow: string;
  toggleThumb: string;
};

/** Default onboarding look — matches main app light palette. */
export const ONBOARDING_THEME_LIGHT: OnboardingTheme = {
  bgGradient: 'linear-gradient(168deg, #F6F5FF 0%, #F9F9FC 42%, #FAFAFC 100%)',
  bgSolid: '#FAFAFC',
  textPrimary: '#1A1A2E',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  accent: APP_PRIMARY,
  accentMint: '#0D9488',
  surface: '#FFFFFF',
  surfaceBorder: '#E8E8EF',
  /** Selected rows stay white — accent border only (no tint, no glow). */
  surfaceSelected: '#FFFFFF',
  progressActive: APP_PRIMARY,
  progressTrack: '#E8E8EF',
  buttonPrimary: APP_PRIMARY,
  buttonPrimaryText: '#FFFFFF',
  buttonGhost: '#F7F7FA',
  footerBg: '#FFFFFF',
  selectedShadow: 'rgba(62, 55, 255, 0.18)',
  toggleThumb: '#FFFFFF',
};

/** Legacy dark onboarding (auth-adjacent flows only if re-enabled). */
export const ONBOARDING_THEME_DARK: OnboardingTheme = {
  bgGradient: AUTH_THEME_DARK.bgGradient,
  bgSolid: AUTH_THEME_DARK.bgSolid,
  textPrimary: AUTH_THEME_DARK.textPrimary,
  textMuted: AUTH_THEME_DARK.textMuted,
  textFaint: AUTH_THEME_DARK.textFaint,
  accent: AUTH_THEME_DARK.accent,
  accentMint: AUTH_THEME_DARK.accentMint,
  surface: AUTH_THEME_DARK.surface,
  surfaceBorder: AUTH_THEME_DARK.surfaceBorder,
  surfaceSelected: AUTH_THEME_DARK.surfaceSelected,
  progressActive: AUTH_THEME_DARK.progressActive,
  progressTrack: AUTH_THEME_DARK.progressTrack,
  buttonPrimary: AUTH_THEME_DARK.buttonPrimary,
  buttonPrimaryText: AUTH_THEME_DARK.buttonPrimaryText,
  buttonGhost: AUTH_THEME_DARK.buttonGhost,
  footerBg: 'rgba(0, 0, 0, 0.12)',
  selectedShadow: appPrimaryDarkRgba(0.4),
  toggleThumb: AUTH_THEME_DARK.textPrimary,
};

export type OnboardingThemeMode = 'light' | 'dark';

export const ONBOARDING_THEMES: Record<OnboardingThemeMode, OnboardingTheme> = {
  light: ONBOARDING_THEME_LIGHT,
  dark: ONBOARDING_THEME_DARK,
};
