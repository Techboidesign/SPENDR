import type { CSSProperties } from 'react';
import type { AppColorPalette } from '../../theme/appColors';
import { figureTextStyle } from '../../theme/typography';
import { themedFeatureCardGradient, themedFeatureCardSurface } from '../../theme/darkModeUi';

/** Shared visual tokens for Feature Cards (insights, budget highlights, expense insights). */
export function getFeatureCardTokens(c: AppColorPalette) {
  return {
    shadow: c.shadowCard,
    radius: 16,
    radiusLg: 20,
    padding: '10px 12px',
    paddingLg: '16px 16px 14px',
    icon: {
      outer: 36,
      inner: 18,
      radius: 10,
    },
    eyebrow: {
      fontSize: 9,
      fontWeight: 700,
      color: c.textFaint,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    headline: {
      ...figureTextStyle,
      fontSize: 16,
      color: c.text,
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    detail: {
      fontSize: 11,
      color: c.textMuted,
      lineHeight: 1.3,
    },
  } as const;
}

/** @deprecated Use getFeatureCardTokens(colors) inside components. */
export const FEATURE_CARD = getFeatureCardTokens({
  canvas: '#F5F5FA',
  canvasHome: '#F5F5FA',
  heroGradient: '',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F7F7FA',
  surfaceInset: '#F3F4F6',
  border: '#F0F0F5',
  borderSubtle: '#E8E8EF',
  divider: '#F3F4F6',
  text: '#1A1A2E',
  textSecondary: '#C8C8D4',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  accent: '#3E37FF',
  accentSoft: '#EDEDFF',
  accentBorder: 'rgba(62, 55, 255, 0.35)',
  onAccent: '#FFFFFF',
  tabActiveBg: '#0A0A0A',
  tabActiveIcon: '#FFFFFF',
  tabInactiveIcon: '#6B7280',
  tabHoverBg: 'rgba(255, 255, 255, 0.55)',
  shadow: '0 8px 32px rgba(15, 23, 42, 0.12)',
  shadowSm: '0 2px 10px rgba(0, 0, 0, 0.05)',
  shadowCard: '0 2px 10px rgba(0, 0, 0, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.45)',
  modalSheet: '#FFFFFF',
  inputBg: '#F7F7FA',
  inputBorder: 'transparent',
  chipBg: '#F7F7FA',
  chipSelectedBg: '#EDEDFF',
  chipSelectedText: '#3E37FF',
  featureCardEnd: '#FFFFFF',
  statusBar: '#FFFFFF',
  shellOuter: '#E8E8F0',
  shellNative: '#FFFFFF',
  scrim: '',
  glass: '',
  glassBorder: '',
  glassHighlight: '',
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  fab: '#3E37FF',
  notificationInfoBg: '#FFFFFF',
  notificationInfoBorder: '#E5E7EB',
  notificationWarningBg: '#FFFBEB',
  notificationWarningBorder: '#FDE68A',
  notificationSuccessBg: '#ECFDF5',
  notificationSuccessBorder: '#A7F3D0',
});

export function featureCardGradient(
  accentBg: string,
  surfaceEnd: string,
  isDark = false,
): string {
  return themedFeatureCardGradient(accentBg, surfaceEnd, isDark);
}

export function featureCardSurface(
  accentBg: string,
  c: AppColorPalette,
  options?: { radius?: number; padding?: string; isDark?: boolean },
): CSSProperties {
  return themedFeatureCardSurface(accentBg, c, options?.isDark ?? false, options);
}
