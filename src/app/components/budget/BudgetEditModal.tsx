import { useEffect, useMemo, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { useAppColors } from '../../context/AppearanceContext';
import { CategoryIcon } from '../CategoryIcon';
import { ModalActionBar } from '../ModalActionBar';
import { getCategoryBudgetLimitError } from '../../utils/budgetCategoryValidation';

export type BudgetEditTarget =
  | { kind: 'income' }
  | { kind: 'budget' }
  | { kind: 'category'; categoryId: string; categoryName: string };

export function BudgetEditModal({
  open,
  target,
  initialAmount,
  formatCurrency,
  currencySymbol,
  onSave,
  onClose,
}: {
  open: boolean;
  target: BudgetEditTarget | null;
  initialAmount: number;
  formatCurrency: (n: number) => string;
  currencySymbol: string;
  onSave: (amount: number) => void;
  onClose: () => void;
}) {
  const c = useAppColors();
  const [draft, setDraft] = useState(initialAmount.toString());

  useEffect(() => {
    if (open) setDraft(initialAmount > 0 ? initialAmount.toString() : '');
  }, [open, initialAmount]);

  const parsedAmount = parseFloat(draft);
  const hasValidAmount = !Number.isNaN(parsedAmount) && parsedAmount >= 0;

  const categoryLimitError = useMemo(() => {
    if (!target || target.kind !== 'category' || !hasValidAmount) return null;
    return getCategoryBudgetLimitError(parsedAmount);
  }, [target, hasValidAmount, parsedAmount]);

  const saveDisabled = !hasValidAmount || Boolean(categoryLimitError);

  if (!open || !target) return null;

  const title =
    target.kind === 'income'
      ? 'Monthly income'
      : target.kind === 'budget'
        ? 'Monthly budget'
        : target.categoryName;

  const handleSave = () => {
    if (saveDisabled) return;
    onSave(parsedAmount);
    onClose();
  };

  const showCurrentLine = initialAmount > 0 || Boolean(categoryLimitError);

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
          backgroundColor: c.modalSheet,
          borderRadius: '24px 24px 0 0',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderSubtle }} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {target.kind === 'category' && <CategoryIcon categoryId={target.categoryId} size="sm" />}
              <h2 style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0 }}>{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: c.inputBg,
                border: 'none',
                borderRadius: 10,
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} weight="bold" color={c.textMuted} />
            </button>
          </div>

          {target.kind === 'category' && (
            <p style={{ fontSize: 12, color: c.textFaint, margin: '0 0 14px', lineHeight: 1.45 }}>
              Saving updates your monthly budget to match the total of all category limits.
            </p>
          )}

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 8 }}>
            Amount
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: categoryLimitError ? c.dangerSoft : c.inputBg,
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: showCurrentLine ? 8 : 24,
              border: categoryLimitError ? `2px solid ${c.danger}` : '2px solid transparent',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: categoryLimitError ? c.danger : c.textFaint,
                marginRight: 6,
              }}
            >
              {currencySymbol}
            </span>
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !saveDisabled && handleSave()}
              placeholder="0"
              aria-invalid={Boolean(categoryLimitError)}
              aria-describedby={categoryLimitError ? 'budget-limit-error' : undefined}
              className="font-figure"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 22,
                color: c.text,
              }}
            />
          </div>

          {showCurrentLine && (
            <p
              id={categoryLimitError ? 'budget-limit-error' : undefined}
              style={{
                fontSize: 12,
                color: categoryLimitError ? c.danger : c.textFaint,
                margin: '0 0 20px',
                lineHeight: 1.45,
                fontWeight: categoryLimitError ? 600 : 400,
              }}
            >
              {categoryLimitError ??
                (initialAmount > 0 ? `Current: ${formatCurrency(initialAmount)}` : null)}
            </p>
          )}
        </div>

        <ModalActionBar
          onLeft={onClose}
          leftLabel="CANCEL"
          onSave={handleSave}
          saveLabel="SAVE"
          saveDisabled={saveDisabled}
        />
      </div>
    </div>
  );
}
