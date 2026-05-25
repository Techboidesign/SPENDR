/** User-facing appearance (main app shell only; auth/onboarding keep their own look). */
export type AppearanceMode = 'light' | 'dark';

export interface AppColorPalette {
  canvas: string;
  canvasHome: string;
  heroGradient: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceInset: string;
  border: string;
  borderSubtle: string;
  divider: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  onAccent: string;
  tabActiveBg: string;
  tabActiveIcon: string;
  tabInactiveIcon: string;
  tabHoverBg: string;
  shadow: string;
  shadowSm: string;
  shadowCard: string;
  overlay: string;
  modalSheet: string;
  inputBg: string;
  inputBorder: string;
  chipBg: string;
  chipSelectedBg: string;
  chipSelectedText: string;
  featureCardEnd: string;
  statusBar: string;
  shellOuter: string;
  shellNative: string;
  scrim: string;
  glass: string;
  glassBorder: string;
  glassHighlight: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  fab: string;
  notificationInfoBg: string;
  notificationInfoBorder: string;
  notificationWarningBg: string;
  notificationWarningBorder: string;
  notificationSuccessBg: string;
  notificationSuccessBorder: string;
}

/** Spendr light + dark palettes — deep ink darks, soft elevation, brand violet accent. */
export const APP_COLORS: Record<AppearanceMode, AppColorPalette> = {
  light: {
    canvas: '#FAFAFC',
    canvasHome: '#FAFAFC',
    heroGradient: 'linear-gradient(168deg, #F6F5FF 0%, #F9F9FC 42%, #FAFAFC 100%)',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#F7F7FA',
    surfaceInset: '#F3F4F6',
    border: '#F0F0F5',
    borderSubtle: '#E8E8EF',
    divider: '#F3F4F6',
    text: '#1A1A2E',
    textSecondary: '#4B5563',
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
    scrim:
      'linear-gradient(to top, rgba(250, 250, 252, 0.97) 0%, rgba(250, 250, 252, 0.82) 28%, rgba(250, 250, 252, 0.45) 58%, transparent 100%)',
    glass:
      'linear-gradient(165deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 249, 252, 0.88) 45%, rgba(255, 255, 255, 0.9) 100%)',
    glassBorder: 'rgba(255, 255, 255, 0.75)',
    glassHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.95)',
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
  },
  dark: {
    canvas: '#0E0E14',
    canvasHome: '#0E0E14',
    heroGradient: 'linear-gradient(168deg, #16142A 0%, #12111C 44%, #0E0E14 100%)',
    surface: '#14141E',
    surfaceElevated: '#1C1C28',
    surfaceMuted: '#101016',
    surfaceInset: '#0E0E14',
    border: 'rgba(255, 255, 255, 0.09)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    divider: 'rgba(255, 255, 255, 0.06)',
    text: '#F2F2F7',
    textSecondary: '#C8C8D4',
    textMuted: '#9494A6',
    textFaint: '#636372',
    accent: '#7B74FF',
    accentSoft: 'rgba(99, 92, 255, 0.2)',
    accentBorder: 'rgba(123, 116, 255, 0.45)',
    onAccent: '#FFFFFF',
    tabActiveBg: '#F2F2F7',
    tabActiveIcon: '#08080E',
    tabInactiveIcon: '#9494A6',
    tabHoverBg: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
    shadowSm: '0 2px 14px rgba(0, 0, 0, 0.4)',
    shadowCard: '0 2px 16px rgba(0, 0, 0, 0.35)',
    overlay: 'rgba(0, 0, 0, 0.72)',
    modalSheet: '#181822',
    inputBg: '#1A1A26',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    chipBg: '#1A1A26',
    chipSelectedBg: 'rgba(99, 92, 255, 0.28)',
    chipSelectedText: '#B8B3FF',
    featureCardEnd: '#14141E',
    statusBar: '#0E0E14',
    shellOuter: '#08080C',
    shellNative: '#0E0E14',
    scrim:
      'linear-gradient(to top, rgba(14, 14, 20, 0.98) 0%, rgba(14, 14, 20, 0.85) 30%, rgba(14, 14, 20, 0.5) 58%, transparent 100%)',
    glass:
      'linear-gradient(165deg, rgba(36, 36, 52, 0.92) 0%, rgba(24, 24, 36, 0.9) 48%, rgba(20, 20, 30, 0.94) 100%)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    success: '#34D399',
    successSoft: 'rgba(52, 211, 153, 0.16)',
    warning: '#FBBF24',
    warningSoft: 'rgba(251, 191, 36, 0.14)',
    danger: '#F87171',
    dangerSoft: 'rgba(248, 113, 113, 0.14)',
    fab: '#7B74FF',
    notificationInfoBg: '#1C1C28',
    notificationInfoBorder: 'rgba(255, 255, 255, 0.1)',
    notificationWarningBg: 'rgba(251, 191, 36, 0.12)',
    notificationWarningBorder: 'rgba(251, 191, 36, 0.28)',
    notificationSuccessBg: 'rgba(52, 211, 153, 0.12)',
    notificationSuccessBorder: 'rgba(52, 211, 153, 0.28)',
  },
};

export const APPEARANCE_STORAGE_KEY = 'spendr:appearance:v1';
