import { useEffect, useMemo, useState } from 'react';
import { useAppColors } from '../../context/AppearanceContext';
import { CategoryIcon } from '../CategoryIcon';
import { AppBottomSheetLayout } from '../AppBottomSheetLayout';
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

  if (!target) return null;

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

  const headerLeading =
    target.kind === 'category' ? (
      <CategoryIcon categoryId={target.categoryId} size="sm" />
    ) : undefined;

  const showCurrentLine = initialAmount > 0 || Boolean(categoryLimitError);

  return (
    <AppBottomSheetLayout
      open={open}
      onClose={onClose}
      title={title}
      headerLeading={headerLeading}
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
      {target.kind === 'category' && (
        <p style={{ fontSize: 12, color: c.textFaint, margin: '0 0 12px', lineHeight: 1.45 }}>
          Saving updates your monthly budget to match the total of all category limits.
        </p>
      )}

      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
        Amount
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: categoryLimitError ? c.dangerSoft : c.inputBg,
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: showCurrentLine ? 6 : 0,
          border: categoryLimitError ? `1px solid ${c.danger}` : '1px solid transparent',
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
        }}
      >
        <span
          style={{
            fontSize: 20,
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
            fontSize: 20,
            color: c.text,
          }}
        />
      </div>

      {showCurrentLine ? (
        <p
          id={categoryLimitError ? 'budget-limit-error' : undefined}
          style={{
            fontSize: 12,
            color: categoryLimitError ? c.danger : c.textFaint,
            margin: 0,
            lineHeight: 1.45,
            fontWeight: categoryLimitError ? 600 : 400,
          }}
        >
          {categoryLimitError ??
            (initialAmount > 0 ? `Current: ${formatCurrency(initialAmount)}` : null)}
        </p>
      ) : null}
    </AppBottomSheetLayout>
  );
}
