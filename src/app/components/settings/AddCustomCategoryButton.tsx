import { Plus } from '@phosphor-icons/react';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';

const BADGE_TRANSITION = 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease';

/** Lighter violet for labels and dashed strokes on dark surfaces (onboarding + dark mode). */
const ACCENT_ON_DARK_SURFACE = '#A6A3FF';

export function AddCustomCategoryButton({
  onClick,
  /** Use on auth/onboarding dark gradients (not tied to app appearance). */
  onDarkSurface = false,
  label = 'Add custom category',
  /** `chip` — compact pill under category chips; `row` — full-width block (e.g. Add goal). */
  variant = 'chip',
}: {
  onClick: () => void;
  onDarkSurface?: boolean;
  label?: string;
  variant?: 'chip' | 'row';
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();

  const onDark = onDarkSurface || isDark;
  const labelColor = onDark ? ACCENT_ON_DARK_SURFACE : c.accent;
  const strokeColor = onDark ? ACCENT_ON_DARK_SURFACE : c.borderSubtle;
  const isRow = variant === 'row';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isRow ? 'center' : undefined,
        gap: isRow ? 8 : 6,
        width: isRow ? '100%' : undefined,
        marginTop: isRow ? 0 : 10,
        padding: isRow ? '13px 16px' : '6px 12px 6px 8px',
        borderRadius: isRow ? 14 : 20,
        border: `1px dashed ${strokeColor}`,
        backgroundColor: 'transparent',
        color: labelColor,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: BADGE_TRANSITION,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = isRow ? 'translateY(-1px)' : 'translateY(-1px) scale(1.04)';
        e.currentTarget.style.borderColor = onDark ? '#C4C2FF' : c.accentBorder;
        e.currentTarget.style.backgroundColor = onDark ? c.accentSoft : '#EDEDFF';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = strokeColor;
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Plus size={isRow ? 16 : 14} weight="bold" color={labelColor} />
      <span
        style={{
          fontSize: isRow ? 13 : 12,
          fontWeight: 600,
          color: labelColor,
        }}
      >
        {label}
      </span>
    </button>
  );
}
