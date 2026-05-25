/** Charcoal utilities — dark grey, not pitch black. */
const UTILITIES_COLOR = '#4A4A58';
const UTILITIES_COLOR_DARK_UI = '#6B6E7A';
const RENT_DEFAULT = '#3E37FF';

/** Greys/blacks accidentally applied to Rent/Housing (bad presets or old luminance lift). */
const RENT_SALVAGE_COLORS = new Set([
  '#0D0D17',
  '#1A1A2E',
  '#4B5563',
  '#52525B',
  '#8B8D9E',
  '#C8CAD4',
  UTILITIES_COLOR,
  UTILITIES_COLOR_DARK_UI,
]);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { r: 62, g: 55, b: 255 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

/** Light-mode wheel: primary accent, slightly lifted so segments feel vivid on white. */
function vibrantChartColorLight(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;

  // Greys (utilities, other) — lighten without going silver
  if (chroma < 28) {
    return rgbToHex(r + 24, g + 24, b + 24);
  }

  // Saturated hues — small lift toward white + chroma nudge
  const avg = (r + g + b) / 3;
  return rgbToHex(
    Math.min(255, r + (r - avg) * 0.12 + 14),
    Math.min(255, g + (g - avg) * 0.12 + 14),
    Math.min(255, b + (b - avg) * 0.12 + 14),
  );
}

/** Donut / pie segment fills — vivid in light mode, unchanged in dark. */
export function categoryChartColor(
  category: { id: string; color: string; iconColor?: string },
  isDark: boolean,
): string {
  if (isDark) return categoryDisplayColor(category, isDark);

  if (category.id === 'utilities') return '#5C5D6A';
  if (category.id === 'rent' && RENT_SALVAGE_COLORS.has(category.color.toUpperCase())) {
    return RENT_DEFAULT;
  }

  return vibrantChartColorLight(category.color);
}

/** Stroke / chip accent for pills and icons (may use darker iconColor in light mode). */
export function categoryDisplayColor(
  category: { id: string; color: string; iconColor?: string },
  isDark: boolean,
): string {
  if (category.id === 'utilities') {
    return isDark ? UTILITIES_COLOR_DARK_UI : UTILITIES_COLOR;
  }

  if (category.id === 'rent' && RENT_SALVAGE_COLORS.has(category.color.toUpperCase())) {
    return RENT_DEFAULT;
  }

  const base = category.iconColor ?? category.color;

  if (!isDark) return base;

  // Legacy pitch-black utilities stored in customizations.
  if (category.color === '#0D0D17') {
    return UTILITIES_COLOR_DARK_UI;
  }

  return base;
}
