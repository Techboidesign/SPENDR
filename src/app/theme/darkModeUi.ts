import type { CSSProperties } from 'react';
import type { ExpenseType } from '../data/types';
import type { AppColorPalette } from './appColors';
import { categoryDisplayColor, categorySummaryBadgeColors } from './categoryDisplayColor';
import { ONBOARDING_CHIP_ICON, onboardingIconGradient } from './onboardingDarkUi';

export function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim();
  const h =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mix hex toward white (same as budget card progress bar fills). */
export function lightenHex(hex: string, mix = 0.28): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const blend = (c: number) => Math.round(c + (255 - c) * mix);
  return `#${[blend(r), blend(g), blend(b)].map(n => n.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Standard UI icon chip — light mode: soft pastel tile + accent glyph.
 * Dark mode: dark accent gradient tile + white glyph.
 */
export function uiIconChipStyle(
  accentColor: string,
  isDark: boolean,
  lightBg?: string,
): { containerStyle: CSSProperties; iconColor: string } {
  if (!isDark) {
    return {
      containerStyle: { backgroundColor: lightBg ?? hexToRgba(accentColor, 0.14) },
      iconColor: accentColor,
    };
  }
  return {
    containerStyle: { background: onboardingIconGradient(accentColor) },
    iconColor: ONBOARDING_CHIP_ICON,
  };
}

/** @deprecated Prefer AppIconChip + uiIconChipStyle. */
export function settingsIconTile(lightBg: string, accentColor: string, isDark: boolean) {
  const chip = uiIconChipStyle(accentColor, isDark, lightBg);
  return { iconBg: lightBg, iconColor: chip.iconColor, containerStyle: chip.containerStyle };
}

/** Chart / donut hover tooltips — always dark surface, light text. */
export function chartTooltipStyle() {
  return {
    backgroundColor: '#14141E',
    labelColor: 'rgba(255, 255, 255, 0.65)',
    valueColor: '#F2F2F7',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
  } as const;
}

/** Full-diagonal card gradient — accent tint is ~20% softer in dark mode. */
export function themedFeatureCardGradient(
  accentBg: string,
  surfaceEnd: string,
  isDark: boolean,
): string {
  if (isDark) {
    const tint = hexToRgba(accentBg, 0.14);
    return `linear-gradient(145deg, ${tint} 0%, ${surfaceEnd} 100%)`;
  }
  return `linear-gradient(145deg, ${accentBg} 0%, ${surfaceEnd} 100%)`;
}

export function themedFeatureCardSurface(
  accentBg: string,
  c: AppColorPalette,
  isDark: boolean,
  options?: { radius?: number; padding?: string },
): CSSProperties {
  return {
    background: themedFeatureCardGradient(accentBg, c.featureCardEnd, isDark),
    boxShadow: c.shadowCard,
    borderRadius: options?.radius ?? 16,
    padding: options?.padding ?? '10px 12px',
  };
}

/** Category pill chip in Settings. */
export function categoryPillStyle(
  cat: { id: string; bg: string; color: string; iconColor?: string },
  isDark: boolean,
  c: AppColorPalette,
): CSSProperties {
  const accent = categoryDisplayColor(cat, isDark);
  if (!isDark) {
    return {
      backgroundColor: cat.bg,
      border: `1px solid ${hexToRgba(accent, 0.125)}`,
      boxShadow: `0 1px 3px ${hexToRgba(accent, 0.09)}`,
      color: accent,
    };
  }
  return {
    backgroundColor: hexToRgba(accent, 0.14),
    border: `1px solid ${hexToRgba(accent, 0.24)}`,
    boxShadow: 'none',
    color: c.textSecondary,
  };
}

/** Feature-card phosphor / preview icon tile. */
export function featureIconTile(
  accentColor: string,
  accentBg: string,
  isDark: boolean,
): { iconSurfaceBg: string; iconGlyphColor: string } {
  const chip = uiIconChipStyle(accentColor, isDark, accentBg);
  if (!isDark) {
    return {
      iconSurfaceBg: accentBg,
      iconGlyphColor: accentColor,
    };
  }
  return {
    iconSurfaceBg: chip.containerStyle.background as string,
    iconGlyphColor: chip.iconColor,
  };
}

/** Budget featured cards + focus goal — accent gradient (dark → light) with white glyph. */
export function featuredBudgetIconTile(
  accentColor: string,
  _accentBg: string,
  _isDark: boolean,
): { iconSurfaceBg: string; iconGlyphColor: string } {
  return {
    iconSurfaceBg: onboardingIconGradient(accentColor),
    iconGlyphColor: ONBOARDING_CHIP_ICON,
  };
}

/** Pencil edit affordance on budget feature cards. */
export function editPencilTile(
  c: AppColorPalette,
  isDark: boolean,
): { bg: string; iconColor: string; border?: string; boxShadow?: string } {
  if (!isDark) {
    return {
      bg: '#FFFFFF',
      iconColor: c.textSecondary,
      border: '1px solid rgba(15, 23, 42, 0.1)',
      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
    };
  }
  return { bg: 'rgba(0,0,0,0.32)', iconColor: c.textSecondary };
}

export function progressTrackColor(c: AppColorPalette, isDark: boolean): string {
  return isDark ? c.surfaceInset : '#E8EAEF';
}

export function budgetRingTrackColor(accentBg: string, isDark: boolean, _c: AppColorPalette): string {
  if (!isDark) return accentBg;
  return hexToRgba(accentBg, 0.22);
}

export function rowHoverBg(isDark: boolean, c: AppColorPalette): string {
  return isDark ? c.tabHoverBg : '#FAFAFC';
}

export const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  'one-time': 'One-time',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function expenseTypeBadge(
  type: ExpenseType,
  c: AppColorPalette,
  isDark: boolean,
): { color: string; bg: string } {
  if (type === 'one-time') {
    return isDark
      ? { color: '#22D3EE', bg: 'rgba(6, 182, 212, 0.18)' }
      : { color: '#0891B2', bg: '#CFFAFE' };
  }
  if (type === 'monthly') {
    return isDark
      ? { color: c.warning, bg: c.warningSoft }
      : { color: '#D97706', bg: '#FEF3C7' };
  }
  return isDark
    ? { color: '#C4B5FD', bg: 'rgba(124, 58, 237, 0.18)' }
    : { color: '#7C3AED', bg: '#EDE9FE' };
}

export function categoryExpenseBadge(
  category: { id: string; color: string; bg: string; iconColor?: string },
  isDark: boolean,
  surfaceHex = '#1C1C28',
): { color: string; bg: string } {
  return categorySummaryBadgeColors(category, isDark, surfaceHex);
}

export const expenseMetaBadgeStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 9,
  fontWeight: 600,
  padding: '2px 6px',
  borderRadius: 4,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

export function changeBadgeColors(
  direction: 'up' | 'down' | 'neutral',
  c: AppColorPalette,
  isDark: boolean,
): { badgeBg: string; badgeColor: string } {
  if (direction === 'up') {
    return isDark
      ? { badgeBg: c.dangerSoft, badgeColor: c.danger }
      : { badgeBg: c.dangerSoft, badgeColor: '#991B1B' };
  }
  if (direction === 'down') {
    return isDark
      ? { badgeBg: c.successSoft, badgeColor: c.success }
      : { badgeBg: c.successSoft, badgeColor: '#166534' };
  }
  return isDark
    ? { badgeBg: c.surfaceInset, badgeColor: c.textMuted }
    : { badgeBg: '#E4E6EB', badgeColor: '#374151' };
}

/** Selected pill/tab foreground on light active background (dark mode Month/Year, List/Insights). */
export function activePillForeground(isDark: boolean, c: AppColorPalette, lightFg = '#FFFFFF'): string {
  return isDark ? c.tabActiveIcon : lightFg;
}

/** Segmented control track inside bottom-sheet modals. */
export function modalSegmentTrackStyle(c: AppColorPalette, isDark: boolean): CSSProperties {
  return {
    display: 'flex',
    backgroundColor: c.surfaceInset,
    borderRadius: 12,
    padding: 3,
    gap: 3,
    border: isDark ? `1px solid ${c.border}` : 'none',
  };
}

/** One option in a modal segmented control (e.g. expense type). */
export function modalSegmentOptionStyle(
  selected: boolean,
  c: AppColorPalette,
  isDark: boolean,
): CSSProperties {
  const base: CSSProperties = {
    flex: 1,
    padding: '7px 0',
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
  };

  if (!selected) {
    return {
      ...base,
      fontWeight: 500,
      backgroundColor: 'transparent',
      color: c.textMuted,
      boxShadow: 'none',
    };
  }

  if (isDark) {
    return {
      ...base,
      fontWeight: 700,
      backgroundColor: c.chipSelectedBg,
      color: c.chipSelectedText,
      border: `1px solid ${c.accentBorder}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
    };
  }

  return {
    ...base,
    fontWeight: 600,
    backgroundColor: c.surface,
    color: c.chipSelectedText,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  };
}
