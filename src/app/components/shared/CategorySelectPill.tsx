import type { CSSProperties } from 'react';
import { useAppearance, useAppColors } from '../../context/AppearanceContext';
import type { AppColorPalette } from '../../theme/appColors';
import {
  categoryDisplayColor,
  categoryGlyphOnDarkBg,
  compositeHexOnHex,
} from '../../theme/categoryDisplayColor';
import { categoryPillStyle, hexToRgba } from '../../theme/darkModeUi';
import { CategoryIcon } from '../CategoryIcon';

/** Short label for category badges (matches onboarding + Settings pills). */
export function categoryPillLabel(name: string): string {
  return name.split('/')[0].split(' & ')[0];
}

const PILL_PADDING = '2px 14px 2px 4px';

function categorySelectPillPresentation({
  cat,
  selected,
  isDark,
  c,
  emphasis,
}: {
  cat: { id: string; bg: string; color: string; iconColor?: string };
  selected: boolean;
  isDark: boolean;
  c: AppColorPalette;
  emphasis: 'default' | 'solid';
}): {
  surface: CSSProperties;
  labelColor: string;
  labelWeight: number;
  glyphColor?: string;
  iconTone: 'light' | 'dark' | 'auto';
} {
  const displayColor = categoryDisplayColor(cat, isDark);
  const solid = emphasis === 'solid';
  const modalChipDark = isDark && solid;

  if (modalChipDark) {
    const pillBgHex = compositeHexOnHex(displayColor, selected ? 0.34 : 0.14, c.modalSheet);
    const glyphColor = categoryGlyphOnDarkBg(cat, pillBgHex);

    return {
      surface: {
        backgroundColor: selected ? pillBgHex : hexToRgba(displayColor, 0.14),
        border: `1px solid ${hexToRgba(displayColor, selected ? 0.78 : 0.35)}`,
        boxShadow: selected ? `0 0 0 1px ${hexToRgba(displayColor, 0.22)}` : 'none',
        opacity: selected ? 1 : 0.82,
      },
      labelColor: selected ? c.text : c.textSecondary,
      labelWeight: selected ? 700 : 600,
      glyphColor,
      iconTone: 'light',
    };
  }

  if (isDark) {
    const base = categoryPillStyle(cat, true, c);
    const pillBgHex = compositeHexOnHex(
      displayColor,
      selected ? 0.28 : 0.14,
      c.modalSheet,
    );

    return {
      surface: {
        ...base,
        backgroundColor: selected ? pillBgHex : base.backgroundColor,
        border: `1px solid ${hexToRgba(displayColor, selected ? 0.72 : 0.24)}`,
        boxShadow: selected ? `0 0 0 1px ${hexToRgba(displayColor, 0.18)}` : 'none',
        opacity: selected ? 1 : 0.72,
      },
      labelColor: selected ? categoryGlyphOnDarkBg(cat, pillBgHex) : (base.color as string),
      labelWeight: selected ? 700 : 500,
      glyphColor: categoryGlyphOnDarkBg(cat, pillBgHex),
      iconTone: 'light',
    };
  }

  // Light mode — onboarding + expense chip strip
  const unselectedBorder = solid
    ? hexToRgba(displayColor, 0.38)
    : hexToRgba(displayColor, 0.2);

  return {
    surface: {
      backgroundColor: cat.bg,
      border: `1px solid ${selected ? displayColor : unselectedBorder}`,
      boxShadow: selected
        ? `0 1px 8px ${hexToRgba(displayColor, solid ? 0.28 : 0.18)}`
        : solid
          ? `0 1px 3px ${hexToRgba(displayColor, 0.09)}`
          : `0 1px 3px ${hexToRgba(displayColor, 0.09)}`,
      opacity: selected ? 1 : solid ? 1 : 0.55,
    },
    labelColor: displayColor,
    labelWeight: selected ? 700 : solid ? 600 : 500,
    iconTone: 'auto',
  };
}

/** Selectable category badge — distinctive selected ring/tint, no checkmark. */
export function CategorySelectPill({
  categoryId,
  name,
  bg,
  color,
  iconColor,
  selected,
  onSelect,
  emphasis = 'default',
}: {
  categoryId: string;
  name: string;
  bg: string;
  color: string;
  iconColor?: string;
  selected: boolean;
  onSelect: () => void;
  /** `solid` — full-opacity pills for add-expense chip strip (better contrast). */
  emphasis?: 'default' | 'solid';
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const cat = { id: categoryId, bg, color, iconColor };
  const presentation = categorySelectPillPresentation({
    cat,
    selected,
    isDark,
    c,
    emphasis,
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: PILL_PADDING,
        borderRadius: 20,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition:
          'opacity 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
        ...presentation.surface,
      }}
    >
      <CategoryIcon
        categoryId={categoryId}
        size="xs"
        tone={presentation.iconTone}
        glyphColor={presentation.glyphColor}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: presentation.labelWeight,
          color: presentation.labelColor,
        }}
      >
        {categoryPillLabel(name)}
      </span>
    </button>
  );
}
