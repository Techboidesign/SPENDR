import { useState, useEffect } from 'react';
import { X, CaretDown } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAppColors } from '../context/AppearanceContext';
import { Expense, ExpenseType } from '../data/types';
import type { ExpenseFormDraft } from '../types/expenseDraft';
import { CategoryIcon } from './CategoryIcon';
import { ModalActionBar } from './ModalActionBar';
import { generateId } from '../utils/id';

export function AddExpenseModal() {
  const {
    showAddModal,
    editingExpense,
    addModalDraft,
    closeAddModal,
    dispatch,
    formatCurrency,
    categories,
    getCategory,
  } = useApp();
  const c = useAppColors();

  const today = new Date().toISOString().slice(0, 10);

  const [amount, setAmount]       = useState('');
  const [name, setName]           = useState('');
  const [categoryId, setCategoryId] = useState('other');
  const [date, setDate]           = useState(today);
  const [type, setType]           = useState<ExpenseType>('one-time');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState('');
  const [notes, setNotes]         = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);

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
    } else if (addModalDraft) {
      setAmount(addModalDraft.amount ?? '');
      setName(addModalDraft.name ?? '');
      setCategoryId(addModalDraft.categoryId ?? 'other');
      setDate(addModalDraft.date ?? today);
      setType(addModalDraft.type ?? 'one-time');
      setStartDate(addModalDraft.startDate ?? addModalDraft.date ?? today);
      setEndDate(addModalDraft.endDate ?? '');
      setNotes(addModalDraft.notes ?? '');
    } else {
      setAmount('');
      setName('');
      setCategoryId('other');
      setDate(today);
      setType('one-time');
      setStartDate(today);
      setEndDate('');
      setNotes('');
    }
    setShowCatPicker(false);
  }, [editingExpense, addModalDraft, showAddModal, today]);

  if (!showAddModal) return null;

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

  const TYPE_OPTIONS: { value: ExpenseType; label: string }[] = [
    { value: 'one-time', label: 'One-time' },
    { value: 'monthly',  label: 'Monthly' },
    { value: 'yearly',   label: 'Yearly' },
  ];

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
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: c.overlay }}
        onClick={closeAddModal}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'relative',
          backgroundColor: c.modalSheet,
          borderRadius: '24px 24px 0 0',
          maxHeight: '92%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderSubtle }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0 }}>
            {editingExpense ? 'Edit Expense' : addModalDraft ? 'Review scanned expense' : 'New Expense'}
          </h2>
          <button
            onClick={closeAddModal}
            style={{ background: c.inputBg, border: 'none', borderRadius: 10, padding: '6px', cursor: 'pointer', display: 'flex' }}
          >
            <X size={18} weight="light" color={c.textMuted} />
          </button>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Amount */}
          <div style={{ backgroundColor: c.inputBg, borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: c.textFaint, marginBottom: 4, fontWeight: 500 }}>AMOUNT</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: c.accent }}>€</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: c.text,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '60%',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, letterSpacing: 0.5 }}>EXPENSE NAME</label>
            <input
              type="text"
              placeholder="e.g. Dinner at restaurant"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '12px 14px',
                backgroundColor: c.inputBg,
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                color: c.text,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, letterSpacing: 0.5 }}>CATEGORY</label>
            <button
              onClick={() => setShowCatPicker(!showCatPicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                marginTop: 6,
                padding: '10px 14px',
                backgroundColor: c.inputBg,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <CategoryIcon categoryId={categoryId} size="sm" />
              <span style={{ flex: 1, fontSize: 15, color: c.text, fontFamily: 'inherit', fontWeight: 500 }}>
                {selectedCategory.name}
              </span>
              <CaretDown size={16} weight="light" color={c.textFaint} style={{ transform: showCatPicker ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
            </button>

            {showCatPicker && (
              <div style={{
                marginTop: 8,
                backgroundColor: c.inputBg,
                borderRadius: 12,
                padding: 8,
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 8,
              }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategoryId(cat.id); setShowCatPicker(false); }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '8px 4px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: categoryId === cat.id ? cat.bg : 'transparent',
                      outline: categoryId === cat.id ? `2px solid ${cat.color}` : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <CategoryIcon categoryId={cat.id} size="xs" />
                    <span style={{ fontSize: 9, color: c.textMuted, textAlign: 'center', lineHeight: 1.2, fontFamily: 'inherit' }}>
                      {cat.name.split('/')[0].split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type Toggle */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, letterSpacing: 0.5 }}>TYPE</label>
            <div style={{
              display: 'flex',
              marginTop: 6,
              backgroundColor: c.surfaceInset,
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}>
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: 9,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: type === opt.value ? 600 : 400,
                    backgroundColor: type === opt.value ? c.surface : 'transparent',
                    color: type === opt.value ? c.chipSelectedText : c.textMuted,
                    boxShadow: type === opt.value ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, letterSpacing: 0.5 }}>
              {type === 'one-time' ? 'DATE' : 'START DATE'}
            </label>
            <input
              type="date"
              value={type === 'one-time' ? date : startDate}
              onChange={e => type === 'one-time' ? setDate(e.target.value) : setStartDate(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '12px 14px',
                backgroundColor: c.inputBg,
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                color: c.text,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* End date for recurring */}
          {type !== 'one-time' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, letterSpacing: 0.5 }}>END DATE (OPTIONAL)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '12px 14px',
                  backgroundColor: c.inputBg,
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  color: c.text,
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, letterSpacing: 0.5 }}>NOTES (OPTIONAL)</label>
            <textarea
              placeholder="Add a note..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '12px 14px',
                backgroundColor: c.inputBg,
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                color: c.text,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

        </div>
        </div>

        <ModalActionBar
          onLeft={editingExpense ? handleDelete : closeAddModal}
          leftLabel={editingExpense ? 'DELETE' : 'CANCEL'}
          leftVariant={editingExpense ? 'delete' : 'cancel'}
          onSave={handleSave}
          saveLabel="SAVE"
        />
      </div>
    </div>
  );
}