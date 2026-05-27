import { AUTH_THEME, appPrimaryDarkRgba } from '../../theme/authTheme';

type CategoryBulkSelectToggleProps = {
  allSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

/** Segmented control: Select all ↔ Deselect all */
export function CategoryBulkSelectToggle({
  allSelected,
  onSelectAll,
  onDeselectAll,
}: CategoryBulkSelectToggleProps) {
  return (
    <div
      role="group"
      aria-label="Category selection mode"
      style={{
        display: 'inline-flex',
        padding: 3,
        borderRadius: 999,
        backgroundColor: AUTH_THEME.surface,
        border: `1px solid ${AUTH_THEME.surfaceBorder}`,
        boxShadow: `0 2px 12px ${appPrimaryDarkRgba(0.2)}`,
      }}
    >
      {(
        [
          { key: 'all' as const, label: 'Select all', active: allSelected, onClick: onSelectAll },
          { key: 'none' as const, label: 'Deselect all', active: !allSelected, onClick: onDeselectAll },
        ] as const
      ).map(({ key, label, active, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          aria-pressed={active}
          style={{
            padding: '7px 14px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
            color: active ? AUTH_THEME.buttonPrimaryText : AUTH_THEME.textMuted,
            backgroundColor: active ? AUTH_THEME.buttonPrimary : 'transparent',
            boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
