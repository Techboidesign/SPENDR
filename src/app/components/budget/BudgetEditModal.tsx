import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { CategoryIcon } from '../CategoryIcon';
import { ModalActionBar } from '../ModalActionBar';

export type BudgetEditTarget =
  | { kind: 'income' }
  | { kind: 'budget' }
  | { kind: 'category'; categoryId: string; categoryName: string };

export function BudgetEditModal({
  open,
  target,
  initialAmount,
  formatCurrency,
  onSave,
  onClose,
}: {
  open: boolean;
  target: BudgetEditTarget | null;
  initialAmount: number;
  formatCurrency: (n: number) => string;
  onSave: (amount: number) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initialAmount.toString());

  useEffect(() => {
    if (open) setDraft(initialAmount > 0 ? initialAmount.toString() : '');
  }, [open, initialAmount]);

  if (!open || !target) return null;

  const title =
    target.kind === 'income'
      ? 'Monthly income'
      : target.kind === 'budget'
        ? 'Monthly budget'
        : target.categoryName;

  const handleSave = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed > 0) onSave(parsed);
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
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          backgroundColor: '#FFFFFF',
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
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {target.kind === 'category' && <CategoryIcon categoryId={target.categoryId} size="sm" />}
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F7F7FA',
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
            <X size={16} weight="bold" color="#6B7280" />
          </button>
        </div>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
          Amount
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F7F7FA',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: initialAmount > 0 ? 8 : 24,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 700, color: '#9CA3AF', marginRight: 6 }}>€</span>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="0"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 22,
              fontWeight: 700,
              color: '#1A1A2E',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {initialAmount > 0 && (
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 20px' }}>
            Current: {formatCurrency(initialAmount)}
          </p>
        )}

        </div>

        <ModalActionBar
          onLeft={onClose}
          leftLabel="CANCEL"
          onSave={handleSave}
          saveLabel="SAVE"
        />
      </div>
    </div>
  );
}
