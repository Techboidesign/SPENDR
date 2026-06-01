/** Dark onboarding icon chips — used by CategoryIcon tone="dark" and legacy gradients. */

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

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

/** Gradient chip + white icon (dark surfaces) */
export function darkIconChip(accentColor: string): {
  iconBg: string;
  iconColor: string;
} {
  return {
    iconBg: onboardingIconGradient(accentColor),
    iconColor: ONBOARDING_CHIP_ICON,
  };
}
