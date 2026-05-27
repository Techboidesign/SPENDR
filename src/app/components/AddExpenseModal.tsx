import { useState, useEffect, type CSSProperties } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAppColors } from '../context/AppearanceContext';
import { Expense, ExpenseType } from '../data/types';
import type { ExpenseFormDraft } from '../types/expenseDraft';
import { CategoryIcon } from './CategoryIcon';
import { AppBottomSheetLayout } from './AppBottomSheetLayout';
import { ModalActionBar } from './ModalActionBar';
import { generateId } from '../utils/id';

const TYPE_OPTIONS: { value: ExpenseType; label: string }[] = [
  { value: 'one-time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const fieldLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: undefined,
  letterSpacing: 0.4,
  marginBottom: 4,
  display: 'block',
};

export function AddExpenseModal() {
  const {
    showAddModal,
    editingExpense,
    addModalDraft,
    closeAddModal,
    dispatch,
    categories,
    getCategory,
  } = useApp();
  const c = useAppColors();

  const today = new Date().toISOString().slice(0, 10);

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('other');
  const [date, setDate] = useState(today);
  const [type, setType] = useState<ExpenseType>('one-time');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setName(editingExpense.name);
      setCategoryId(editingExpense.categoryId);
      setDate(editingExpense.date);
      setType(editingExpense.type);
      setStartDate(editingExpense.startDate ?? editingExpense.date);
      setEndDate(editingExpense.endDate ?? '');
      setNotes(editingExpense.notes ?? '');
      setShowNotes(Boolean(editingExpense.notes?.trim()));
    } else if (addModalDraft) {
      setAmount(addModalDraft.amount ?? '');
      setName(addModalDraft.name ?? '');
      setCategoryId(addModalDraft.categoryId ?? 'other');
      setDate(addModalDraft.date ?? today);
      setType(addModalDraft.type ?? 'one-time');
      setStartDate(addModalDraft.startDate ?? addModalDraft.date ?? today);
      setEndDate(addModalDraft.endDate ?? '');
      setNotes(addModalDraft.notes ?? '');
      setShowNotes(Boolean(addModalDraft.notes?.trim()));
    } else {
      setAmount('');
      setName('');
      setCategoryId('other');
      setDate(today);
      setType('one-time');
      setStartDate(today);
      setEndDate('');
      setNotes('');
      setShowNotes(false);
    }
    setShowCatPicker(false);
  }, [editingExpense, addModalDraft, showAddModal, today]);

  const selectedCategory = getCategory(categoryId);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const expense: Expense = {
      id: editingExpense?.id ?? generateId(),
      name: name.trim(),
      categoryId,
      amount: parsedAmount,
      date,
      type,
      notes: notes.trim() || undefined,
      startDate: type !== 'one-time' ? startDate : undefined,
      endDate: type !== 'one-time' && endDate ? endDate : undefined,
    };

    if (editingExpense) {
      dispatch({ type: 'UPDATE_EXPENSE', expense });
    } else {
      dispatch({ type: 'ADD_EXPENSE', expense });
    }
    closeAddModal();
  };

  const handleDelete = () => {
    if (editingExpense) {
      dispatch({ type: 'DELETE_EXPENSE', id: editingExpense.id });
      closeAddModal();
    }
  };

  const title = showCatPicker
    ? 'Category'
    : editingExpense
      ? 'Edit expense'
      : addModalDraft
        ? 'Review expense'
        : 'New expense';

  const handleClose = () => {
    if (showCatPicker) {
      setShowCatPicker(false);
      return;
    }
    closeAddModal();
  };

  const inputStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    marginTop: 0,
    padding: '10px 12px',
    backgroundColor: c.inputBg,
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    color: c.text,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <AppBottomSheetLayout
      open={showAddModal}
      onClose={handleClose}
      title={title}
      footer={
        <ModalActionBar
          onLeft={showCatPicker ? () => setShowCatPicker(false) : editingExpense ? handleDelete : closeAddModal}
          leftLabel={showCatPicker ? 'BACK' : editingExpense ? 'DELETE' : 'CANCEL'}
          leftVariant={showCatPicker || !editingExpense ? 'cancel' : 'delete'}
          onSave={handleSave}
          saveLabel="SAVE"
        />
      }
    >
      {showCatPicker ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
          }}
        >
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryId(cat.id);
                setShowCatPicker(false);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '6px 2px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: categoryId === cat.id ? cat.bg : 'transparent',
                outline: categoryId === cat.id ? `2px solid ${cat.color}` : 'none',
                fontFamily: 'inherit',
              }}
            >
              <CategoryIcon categoryId={cat.id} size="xs" />
              <span
                style={{
                  fontSize: 9,
                  color: c.textMuted,
                  textAlign: 'center',
                  lineHeight: 1.15,
                }}
              >
                {cat.name.split('/')[0].split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ backgroundColor: c.inputBg, borderRadius: 14, padding: '10px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: c.textFaint, margin: '0 0 2px', fontWeight: 600 }}>AMOUNT</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: c.accent }}>€</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: c.text,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '55%',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ ...fieldLabel, color: c.textMuted }}>NAME</label>
            <input
              type="text"
              placeholder="e.g. Dinner"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ ...fieldLabel, color: c.textMuted }}>CATEGORY</label>
            <button
              type="button"
              onClick={() => setShowCatPicker(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                backgroundColor: c.inputBg,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <CategoryIcon categoryId={categoryId} size="sm" />
              <span style={{ flex: 1, fontSize: 15, color: c.text, fontWeight: 500 }}>
                {selectedCategory.name}
              </span>
              <CaretDown size={16} weight="light" color={c.textFaint} />
            </button>
          </div>

          <div>
            <label style={{ ...fieldLabel, color: c.textMuted }}>TYPE</label>
            <div
              style={{
                display: 'flex',
                backgroundColor: c.surfaceInset,
                borderRadius: 12,
                padding: 3,
                gap: 3,
              }}
            >
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 9,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: type === opt.value ? 600 : 400,
                    backgroundColor: type === opt.value ? c.surface : 'transparent',
                    color: type === opt.value ? c.chipSelectedText : c.textMuted,
                    boxShadow: type === opt.value ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={
              type !== 'one-time'
                ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }
                : undefined
            }
          >
            <div>
              <label style={{ ...fieldLabel, color: c.textMuted }}>
                {type === 'one-time' ? 'DATE' : 'START'}
              </label>
              <input
                type="date"
                value={type === 'one-time' ? date : startDate}
                onChange={e =>
                  type === 'one-time' ? setDate(e.target.value) : setStartDate(e.target.value)
                }
                style={inputStyle}
              />
            </div>
            {type !== 'one-time' ? (
              <div>
                <label style={{ ...fieldLabel, color: c.textMuted }}>END (OPT.)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
              </div>
            ) : null}
          </div>

          {showNotes ? (
            <div>
              <label style={{ ...fieldLabel, color: c.textMuted }}>NOTE</label>
              <textarea
                placeholder="Add a note..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                fontSize: 13,
                fontWeight: 600,
                color: c.accent,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              + Add note
            </button>
          )}
        </div>
      )}
    </AppBottomSheetLayout>
  );
}
