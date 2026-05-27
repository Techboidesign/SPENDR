import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import type { PrimaryGoalTarget } from '../../data/primaryGoalTarget';
import { createEmptyPrimaryGoalTarget } from '../../data/primaryGoalTarget';
import type { PrimaryGoalId } from '../../data/types';
import { goalRequiresTargetSetup } from '../../data/primaryGoalTarget';
import { getPrimaryGoalDefinition } from '../../data/primaryGoalConfig';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { ModalActionBar } from '../ModalActionBar';
import { featuredBudgetIconTile } from '../../theme/darkModeUi';
import {
  isGoalSetupComplete,
  PrimaryGoalSetupForm,
} from './PrimaryGoalSetupForm';

export function PrimaryGoalSetupModal({
  open,
  goalId,
  target,
  formatCurrency,
  onSave,
  onClose,
}: {
  open: boolean;
  goalId: PrimaryGoalId;
  target: PrimaryGoalTarget | null;
  formatCurrency: (n: number) => string;
  onSave: (goalId: PrimaryGoalId, target: PrimaryGoalTarget | null) => void;
  onClose: () => void;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const def = getPrimaryGoalDefinition(goalId);

  const [draftGoalId, setDraftGoalId] = useState(goalId);
  const [draftTarget, setDraftTarget] = useState<PrimaryGoalTarget>(
    target ?? createEmptyPrimaryGoalTarget(),
  );

  useEffect(() => {
    if (!open) return;
    setDraftGoalId(goalId);
    setDraftTarget(target ?? createEmptyPrimaryGoalTarget());
  }, [open, goalId, target]);

  if (!open) return null;

  const draftDef = getPrimaryGoalDefinition(draftGoalId);
  const iconTile = featuredBudgetIconTile(draftDef.accentColor, draftDef.accentBg, isDark);
  const saveDisabled = !isGoalSetupComplete(draftGoalId, draftTarget);

  const handleSave = () => {
    if (saveDisabled) return;
    onSave(
      draftGoalId,
      goalRequiresTargetSetup(draftGoalId) ? draftTarget : null,
    );
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: c.overlay }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          backgroundColor: c.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '88%',
          overflowY: 'auto',
          padding: '16px 20px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: iconTile.iconSurfaceBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <draftDef.Icon size={20} weight="light" color={iconTile.iconGlyphColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted }}>Your focus</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{draftDef.label}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              border: `1px solid ${c.border}`,
              background: c.surfaceAlt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} color={c.text} weight="light" />
          </button>
        </div>

        <PrimaryGoalSetupForm
          goalId={draftGoalId}
          target={draftTarget}
          onGoalIdChange={setDraftGoalId}
          onTargetChange={setDraftTarget}
          showGoalPicker
          formatMoney={formatCurrency}
          variant="app"
        />

        <ModalActionBar
          primaryLabel="Save focus"
          onPrimary={handleSave}
          primaryDisabled={saveDisabled}
          onSecondary={onClose}
          secondaryLabel="Cancel"
        />
      </div>
    </div>
  );
}
