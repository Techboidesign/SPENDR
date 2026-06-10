import { useEffect, useState, type RefObject } from 'react';
import type { PrimaryGoalTarget } from '../../data/primaryGoalTarget';
import { createEmptyPrimaryGoalTarget } from '../../data/primaryGoalTarget';
import type { PrimaryGoalId } from '../../data/types';
import { goalRequiresTargetSetup } from '../../data/primaryGoalTarget';
import { getPrimaryGoalDefinition } from '../../data/primaryGoalConfig';
import { useApp } from '../../context/AppContext';
import { useAppearance } from '../../context/AppearanceContext';
import { getCurrencySymbol } from '../../utils/currencySymbol';
import { AppBottomSheetLayout } from '../AppBottomSheetLayout';
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
  scrollLockRef,
  onSave,
  onClose,
  excludedGoalTypes = [],
  title = 'Edit goal',
}: {
  open: boolean;
  goalId: PrimaryGoalId;
  target: PrimaryGoalTarget | null;
  formatCurrency: (n: number) => string;
  scrollLockRef?: RefObject<HTMLElement | null>;
  onSave: (goalId: PrimaryGoalId, target: PrimaryGoalTarget | null) => void;
  onClose: () => void;
  excludedGoalTypes?: PrimaryGoalId[];
  title?: string;
}) {
  const { state } = useApp();
  const { isDark } = useAppearance();
  const currencySymbol = getCurrencySymbol(state.currency);

  const [draftGoalId, setDraftGoalId] = useState(goalId);
  const [draftTarget, setDraftTarget] = useState<PrimaryGoalTarget>(
    target ?? createEmptyPrimaryGoalTarget(),
  );

  useEffect(() => {
    if (!open) return;
    setDraftGoalId(goalId);
    setDraftTarget(target ?? createEmptyPrimaryGoalTarget());
  }, [open, goalId, target]);

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

  const headerLeading = (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: iconTile.iconSurfaceBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <draftDef.Icon size={18} weight="light" color={iconTile.iconGlyphColor} />
    </div>
  );

  return (
    <AppBottomSheetLayout
      open={open}
      onClose={onClose}
      title={title === 'Edit goal' ? draftDef.label : title}
      headerLeading={headerLeading}
      scrollLockRef={scrollLockRef}
      bodyScroll
      footer={
        <ModalActionBar
          onLeft={onClose}
          leftLabel="CANCEL"
          onSave={handleSave}
          saveLabel="SAVE"
          saveDisabled={saveDisabled}
        />
      }
    >
      <PrimaryGoalSetupForm
        goalId={draftGoalId}
        target={draftTarget}
        onGoalIdChange={setDraftGoalId}
        onTargetChange={setDraftTarget}
        showGoalPicker
        excludedGoalTypes={excludedGoalTypes}
        compact
        currencySymbol={currencySymbol}
        variant="app"
      />
    </AppBottomSheetLayout>
  );
}
