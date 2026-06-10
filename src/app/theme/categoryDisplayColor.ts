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

function mixHexToward(source: string, target: string, mix: number): string {
  const s = hexToRgb(source);
  const t = hexToRgb(target);
  const m = Math.max(0, Math.min(1, mix));
  return rgbToHex(
    s.r + (t.r - s.r) * m,
    s.g + (t.g - s.g) * m,
    s.b + (t.b - s.b) * m,
  );
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const transform = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Alpha-composite `fgHex` over `bgHex` (opaque result). */
export function compositeHexOnHex(fgHex: string, alpha: number, bgHex: string): string {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const a = Math.max(0, Math.min(1, alpha));
  return rgbToHex(
    fg.r * a + bg.r * (1 - a),
    fg.g * a + bg.g * (1 - a),
    fg.b * a + bg.b * (1 - a),
  );
}

const GLYPH_ON_DARK_TARGET = '#F2F2F7';

/**
 * Lighten a category accent (same hue family) until it meets WCAG AA (4.5:1)
 * against a dark pill or modal surface.
 */
export function categoryGlyphOnDarkBg(
  category: { id: string; color: string; iconColor?: string },
  bgHex: string,
  minRatio = 4.5,
): string {
  const accent = categoryDisplayColor(category, true);
  let mix = 0;
  let candidate = accent;

  while (mix <= 1) {
    if (contrastRatio(candidate, bgHex) >= minRatio) return candidate;
    mix += 0.06;
    candidate = mixHexToward(accent, GLYPH_ON_DARK_TARGET, mix);
  }

  return GLYPH_ON_DARK_TARGET;
}

/** Header/meta badges (expense modal summary, list rows) — WCAG-safe on dark surfaces. */
export function categorySummaryBadgeColors(
  category: { id: string; color: string; iconColor?: string; bg: string },
  isDark: boolean,
  surfaceHex: string,
): { color: string; bg: string } {
  const accent = categoryDisplayColor(category, isDark);
  if (!isDark) {
    return { color: accent, bg: category.bg };
  }
  const bg = compositeHexOnHex(accent, 0.26, surfaceHex);
  return { color: categoryGlyphOnDarkBg(category, bg), bg };
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
