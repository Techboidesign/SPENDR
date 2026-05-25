/** App primary — matches `--primary` in theme.css */
export const APP_PRIMARY = '#3E37FF';

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

/** Lighter primary for dark backgrounds (reads brighter than APP_PRIMARY) */
function lightenHex(hex: string, amount = 0.2): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => c + (255 - c) * amount;
  return rgbToHex(mix(r), mix(g), mix(b));
}

/** ~2 shades lighter — use on auth / onboarding dark UI */
export const APP_PRIMARY_DARK = lightenHex(APP_PRIMARY, 0.2);

/** Brighter highlight for active stepper segment */
export const APP_PRIMARY_DARK_BRIGHT = lightenHex(APP_PRIMARY_DARK, 0.14);

const primaryDarkRgb = (() => {
  const { r, g, b } = hexToRgb(APP_PRIMARY_DARK);
  return `${r}, ${g}, ${b}`;
})();

export function appPrimaryDarkRgba(alpha: number): string {
  return `rgba(${primaryDarkRgb}, ${alpha})`;
}

/** Welcome / splash hero background */
export const AUTH_WELCOME_GRADIENT =
  'linear-gradient(179deg, #05053A 0.56%, #3E37FF 165.61%)';

/** Dark auth / onboarding visual system (splash & setup flow). */
export const AUTH_THEME = {
  bgGradient:
    'radial-gradient(ellipse 120% 80% at 50% 0%, #2a2860 0%, #1a1838 42%, #141328 100%)',
  welcomeGradient: AUTH_WELCOME_GRADIENT,
  bgSolid: '#1a1830',
  textPrimary: '#F8FAFC',
  textMuted: 'rgba(248, 250, 252, 0.65)',
  textFaint: 'rgba(248, 250, 252, 0.45)',
  accent: APP_PRIMARY_DARK,
  accentMint: '#5EEAD4',
  surface: 'rgba(255, 255, 255, 0.08)',
  surfaceBorder: 'rgba(255, 255, 255, 0.14)',
  surfaceSelected: appPrimaryDarkRgba(0.22),
  progressActive: APP_PRIMARY_DARK,
  progressTrack: 'rgba(255, 255, 255, 0.12)',
  buttonPrimary: '#F8FAFC',
  buttonPrimaryText: '#1a1830',
  buttonGhost: 'rgba(255, 255, 255, 0.12)',
} as const;

export const ONBOARDING_FIRST_STEP = 'goal';
export const ONBOARDING_LAST_PROFILE_STEP = 'name-basics';
