import { PiggyBank } from '@phosphor-icons/react';
import { useAppColors } from '../../context/AppearanceContext';
import { AppIconChip } from '../ui/AppIconChip';
import { AddCustomCategoryButton } from '../settings/AddCustomCategoryButton';

export function SavingsGoalsEmptyState({ onAdd }: { onAdd: () => void }) {
  const c = useAppColors();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '20px 16px 8px',
        textAlign: 'center',
      }}
    >
      <AppIconChip
        icon={PiggyBank}
        accentColor="#F7A54D"
        lightBg="#FEF5EC"
        size={48}
        iconSize={24}
        radius={14}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 280 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: 0, lineHeight: 1.3 }}>
          Save for something specific?
        </p>
        <p style={{ fontSize: 13, color: c.textFaint, margin: 0, lineHeight: 1.45 }}>
          Track a vacation, emergency fund, or big purchase — add your first goal below.
        </p>
      </div>
      <div style={{ width: '100%', marginTop: 4 }}>
        <AddCustomCategoryButton variant="row" label="Add your first goal" onClick={onAdd} />
      </div>
    </div>
  );
}
