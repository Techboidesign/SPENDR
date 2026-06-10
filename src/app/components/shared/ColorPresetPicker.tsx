import { CATEGORY_COLOR_PRESETS_BY_HUE } from '../../data/categoryConfig';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';

const SWATCH_RADIUS = 8;

export function ColorPresetPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 5,
        width: '100%',
      }}
    >
      {CATEGORY_COLOR_PRESETS_BY_HUE.map(p => {
        const selected = selectedId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-label={p.id}
            aria-pressed={selected}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              aspectRatio: '1',
              borderRadius: SWATCH_RADIUS,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: p.color,
              boxShadow: selected
                ? `0 0 0 2px ${c.modalSheet}, 0 0 0 3px ${p.color}`
                : isDark
                  ? `0 0 0 1px ${c.border}`
                  : '0 1px 3px rgba(0,0,0,0.08)',
              transform: selected ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.15s ease',
            }}
          />
        );
      })}
    </div>
  );
}
