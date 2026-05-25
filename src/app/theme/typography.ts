import type { CSSProperties } from 'react';
import type { AppColorPalette } from './appColors';

/** Mona Sans expanded numerals — wdth 125, wght 900 (see `src/styles/fonts.css`). */
export const figureTextStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontVariationSettings: 'var(--font-figure-variation)',
  fontWeight: 900,
  fontStretch: '125%',
  letterSpacing: '-0.02em',
};

const listRowFigureVariation = "'wdth' 125, 'wght' 700";

/**
 * Uppercase gray section labels — Settings “PREFERENCES”, Home “INSIGHTS”, etc.
 * Single source of truth; tweak here to update the whole app.
 */
export function sectionTitleStyle(c: AppColorPalette): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 600,
    color: c.textFaint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    margin: 0,
  };
}

/** Primary row / card titles — Settings rows, budget featured cards, category names. */
export function listRowLabelStyle(c: AppColorPalette): CSSProperties {
  return {
    fontFamily: 'var(--font-sans)',
    fontVariationSettings: listRowFigureVariation,
    fontWeight: 700,
    fontStretch: '125%',
    fontSize: 15,
    color: c.text,
    letterSpacing: '0.01em',
    margin: 0,
  };
}
