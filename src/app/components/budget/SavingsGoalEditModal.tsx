import { useEffect, useState, type RefObject } from 'react';
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_ICON_MAP,
  CATEGORY_ICON_OPTIONS,
  type CategoryIconKey,
} from '../../data/categoryConfig';
import type { SavingsGoal } from '../../data/types';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { AppBottomSheetLayout } from '../AppBottomSheetLayout';
import { ModalActionBar } from '../ModalActionBar';
import { AppIconChip } from '../ui/AppIconChip';
import { CurrencyAmountInput } from '../shared/CurrencyAmountInput';
import { appFormFieldStyle, FormInput } from '../shared/FormFields';
import { MonthYearFieldInput } from '../shared/MonthYearFieldInput';
import { ColorPresetPicker } from '../shared/ColorPresetPicker';
import {
  monthKeyToTargetDateEnd,
  targetDateMonthKeyForPicker,
} from '../../data/primaryGoalTarget';
import {
  GOAL_TARGET_MONTH_MAX_DATE,
  GOAL_TARGET_MONTH_MIN_DATE,
} from '../../utils/periods';

function findPresetForGoal(color: string, bg: string): string {
  return (
    CATEGORY_COLOR_PRESETS.find(p => p.color === color && p.bg === bg)?.id ??
    CATEGORY_COLOR_PRESETS.find(p => p.color === color)?.id ??
    'orange'
  );
}

export function SavingsGoalEditModal({
  open,
  goal,
  currencySymbol,
  scrollLockRef,
  onSave,
  onDelete,
  onClose,
  isNew = false,
}: {
  open: boolean;
  goal: SavingsGoal | null;
  currencySymbol: string;
  scrollLockRef?: RefObject<HTMLElement | null>;
  onSave: (goal: SavingsGoal) => void;
  onDelete?: () => void;
  onClose: () => void;
  isNew?: boolean;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const fieldStyle = appFormFieldStyle(c);
  const [draft, setDraft] = useState<SavingsGoal | null>(goal);
  const [colorPresetId, setColorPresetId] = useState('orange');
  const [targetAmountDraft, setTargetAmountDraft] = useState('');
  const [currentAmountDraft, setCurrentAmountDraft] = useState('');

  useEffect(() => {
    if (!open || !goal) return;
    setDraft(goal);
    setColorPresetId(findPresetForGoal(goal.accentColor, goal.accentBg));
    setTargetAmountDraft(goal.targetAmount > 0 ? String(goal.targetAmount) : '');
    setCurrentAmountDraft(goal.currentAmount > 0 ? String(goal.currentAmount) : '');
  }, [open, goal]);

  if (!draft) return null;

  const Icon = CATEGORY_ICON_MAP[draft.iconKey] ?? CATEGORY_ICON_MAP.piggy;
  const preset =
    CATEGORY_COLOR_PRESETS.find(p => p.id === colorPresetId) ?? CATEGORY_COLOR_PRESETS[0];
  const iconTileBg = isDark ? c.inputBg : '#F7F7FA';
  const mutedLabel = isDark ? c.textMuted : '#6B7280';

  const setIconKey = (iconKey: CategoryIconKey) => {
    setDraft(prev => (prev ? { ...prev, iconKey } : prev));
  };

  const setColorPreset = (presetId: string) => {
    const next =
      CATEGORY_COLOR_PRESETS.find(p => p.id === presetId) ?? CATEGORY_COLOR_PRESETS[0];
    setColorPresetId(presetId);
    setDraft(prev =>
      prev ? { ...prev, accentColor: next.color, accentBg: next.bg } : prev,
    );
  };
  const parsedTargetAmount = parseFloat(targetAmountDraft);
  const parsedCurrentAmount = parseFloat(currentAmountDraft);
  const saveDisabled =
    !draft.name.trim() || Number.isNaN(parsedTargetAmount) || parsedTargetAmount <= 0;
  const targetMonthKey = targetDateMonthKeyForPicker(draft.targetDate);

  const handleSave = () => {
    if (saveDisabled) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      targetAmount: parsedTargetAmount,
      currentAmount: Number.isNaN(parsedCurrentAmount) ? 0 : Math.max(0, parsedCurrentAmount),
    });
    onClose();
  };

  return (
    <AppBottomSheetLayout
      open={open}
      onClose={onClose}
      title={isNew ? 'Add savings goal' : 'Edit savings goal'}
      headerLeading={
        <AppIconChip
          icon={Icon}
          accentColor={draft.accentColor}
          lightBg={draft.accentBg}
        />
      }
      scrollLockRef={scrollLockRef}
      bodyScroll
      footer={
        <ModalActionBar
          onLeft={isNew ? onClose : onDelete}
          leftLabel={isNew ? 'CANCEL' : 'DELETE'}
          leftVariant={isNew ? 'cancel' : 'delete'}
          onSave={handleSave}
          saveLabel="SAVE"
          saveDisabled={saveDisabled}
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>
            Goal name
          </label>
          <FormInput
            tone={isDark ? 'dark' : 'light'}
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. PlayStation 5"
            fieldStyle={fieldStyle}
          />
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: mutedLabel, margin: '0 0 6px' }}>Icon</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: 3,
              marginBottom: 12,
            }}
          >
            {CATEGORY_ICON_OPTIONS.map(opt => {
              const selected = draft.iconKey === opt.key;
              const IconOption = opt.Icon;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setIconKey(opt.key)}
                  aria-label={opt.label}
                  aria-pressed={selected}
                  title={opt.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    aspectRatio: '1',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selected ? preset.bg : iconTileBg,
                    boxShadow: selected ? `0 0 0 1px ${preset.color}` : 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <IconOption
                    size={16}
                    weight={selected ? 'fill' : 'light'}
                    color={selected ? (preset.iconColor ?? preset.color) : c.textFaint}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: mutedLabel, margin: '0 0 6px' }}>Color</p>
          <ColorPresetPicker selectedId={colorPresetId} onSelect={setColorPreset} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>
            Target amount
          </label>
          <CurrencyAmountInput
            tone={isDark ? 'dark' : 'light'}
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
            className="font-figure"
            value={targetAmountDraft}
            onChange={e => setTargetAmountDraft(e.target.value)}
            currencySymbol={currencySymbol}
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>
            Saved so far
          </label>
          <CurrencyAmountInput
            tone={isDark ? 'dark' : 'light'}
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
            className="font-figure"
            value={currentAmountDraft}
            onChange={e => setCurrentAmountDraft(e.target.value)}
            currencySymbol={currencySymbol}
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>
            Target date
          </label>
          <MonthYearFieldInput
            monthKey={targetMonthKey}
            onMonthChange={monthKey =>
              setDraft({
                ...draft,
                targetDate: monthKey ? monthKeyToTargetDateEnd(monthKey) : '',
              })
            }
            tone={isDark ? 'dark' : 'light'}
            style={fieldStyle}
            minDate={GOAL_TARGET_MONTH_MIN_DATE}
            maxDate={GOAL_TARGET_MONTH_MAX_DATE}
          />
        </div>
      </div>
    </AppBottomSheetLayout>
  );
}
