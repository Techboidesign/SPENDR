import { Check } from '@phosphor-icons/react';
import { CategoryIcon } from '../CategoryIcon';

/** Short label for category badges (matches onboarding + Settings pills). */
export function categoryPillLabel(name: string): string {
  return name.split('/')[0].split(' & ')[0];
}

/** Selectable category badge — onboarding-style pill with optional check when selected. */
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
  const displayColor = iconColor || color;
  const pillShadow = `0 1px 3px ${displayColor}18`;
  const solid = emphasis === 'solid';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: selected ? '2px 8px 2px 4px' : '2px 14px 2px 4px',
        borderRadius: 20,
        backgroundColor: bg,
        border: solid
          ? `1.5px solid ${selected ? displayColor : `${displayColor}66`}`
          : `1px solid ${selected ? displayColor : `${displayColor}20`}`,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: pillShadow,
        opacity: solid ? 1 : selected ? 1 : 0.55,
        transition: 'opacity 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
      }}
    >
      <CategoryIcon categoryId={categoryId} size="xs" />
      <span
        style={{
          fontSize: 11,
          fontWeight: solid ? 600 : 500,
          color: displayColor,
        }}
      >
        {categoryPillLabel(name)}
      </span>
      {selected ? (
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: displayColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden
        >
          <Check size={11} color="#FFFFFF" weight="bold" />
        </span>
      ) : null}
    </button>
  );
}
