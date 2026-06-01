import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useApp } from '../context/AppContext';
import { useAppColors } from '../context/AppearanceContext';
import { Expense, ExpenseType } from '../data/types';
import type { ExpenseFormDraft } from '../types/expenseDraft';
import { AppBottomSheetLayout } from './AppBottomSheetLayout';
import { ModalActionBar } from './ModalActionBar';
import {
  ExpenseAmountNumpad,
  formatNumpadAmountDisplay,
} from './expenses/ExpenseAmountNumpad';
import { ExpenseAddSummaryBadges } from './expenses/ExpenseAddSummaryBadges';
import {
  ExpenseCategoryChipStrip,
  getRecentCategoryIds,
} from './expenses/ExpenseCategoryChipStrip';
import { generateId } from '../utils/id';
import { getCurrencySymbol } from '../utils/currencySymbol';
import { getActiveFocusCategoryId, isFocusCategoryId, isSpendingExpense } from '../data/focusCategory';
import { parsePrimaryGoal } from '../data/primaryGoalConfig';

const TYPE_OPTIONS: { value: ExpenseType; label: string }[] = [
  { value: 'one-time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const fieldLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.4,
  marginBottom: 4,
  display: 'block',
};

function getLastUsedCategoryId(expenses: Expense[]): string | null {
  const spending = expenses.filter(isSpendingExpense);
  if (spending.length === 0) return null;
  const sorted = [...spending].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0]?.categoryId ?? null;
}

function formatPreviewDate(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (iso === today) return 'Today';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function AddExpenseModal() {
  const {
    showAddModal,
    editingExpense,
    addModalDraft,
    closeAddModal,
    dispatch,
    expensePickerCategories,
    getCategory,
    state,
  } = useApp();
  const c = useAppColors();
  const currencySymbol = getCurrencySymbol(state.currency);

  const today = new Date().toISOString().slice(0, 10);
  const isEditMode = Boolean(editingExpense);
  const isReviewMode = Boolean(addModalDraft) && !isEditMode;

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('other');
  const [date, setDate] = useState(today);
  const [type, setType] = useState<ExpenseType>('one-time');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [touched, setTouched] = useState({ amount: false });

  const recentCategoryIds = useMemo(
    () => getRecentCategoryIds(state.expenses),
    [state.expenses],
  );

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
      setShowMoreDetails(true);
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
      setShowMoreDetails(
        Boolean(
          addModalDraft.name?.trim() ||
            addModalDraft.notes?.trim() ||
            addModalDraft.type !== 'one-time',
        ),
      );
    } else {
      const lastUsed = getLastUsedCategoryId(state.expenses);
      const defaultFocusId = getActiveFocusCategoryId(
        parsePrimaryGoal(state.primaryGoal ?? undefined),
      );
      setAmount('');
      setName('');
      setCategoryId(lastUsed ?? defaultFocusId ?? 'other');
      setDate(today);
      setType('one-time');
      setStartDate(today);
      setEndDate('');
      setNotes('');
      setShowNotes(false);
      setShowMoreDetails(false);
    }
    setTouched({ amount: false });
  }, [editingExpense, addModalDraft, showAddModal, today, state.expenses, state.primaryGoal]);

  const selectedCategory = getCategory(categoryId);
  const isFocusContribution = isFocusCategoryId(categoryId);

  const parsedAmount = parseFloat(amount);
  const hasValidAmount =
    amount.trim() !== '' &&
    !Number.isNaN(parsedAmount) &&
    (isFocusContribution ? parsedAmount !== 0 : parsedAmount > 0);

  const resolvedName = name.trim() || selectedCategory.name;
  const canSave = hasValidAmount;
  const saveDisabled = !canSave;

  const amountError = useMemo(() => {
    if (hasValidAmount) return null;
    if (amount.trim() === '') return 'Enter an amount';
    if (Number.isNaN(parsedAmount)) return 'Enter a valid number';
    if (isFocusContribution) return 'Enter a non-zero amount';
    return 'Enter an amount greater than zero';
  }, [amount, hasValidAmount, isFocusContribution, parsedAmount]);

  const showAmountError = Boolean(amountError && touched.amount);

  const previewDate = type === 'one-time' ? date : startDate;

  const handleSave = () => {
    if (!canSave) {
      setTouched({ amount: true });
      return;
    }

    const expense: Expense = {
      id: editingExpense?.id ?? generateId(),
      name: resolvedName,
      categoryId,
      amount: parsedAmount,
      date: type === 'one-time' ? date : startDate,
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

  const title = editingExpense
    ? 'Edit expense'
    : addModalDraft
      ? 'Review expense'
      : 'New expense';

  const inputStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    marginTop: 0,
    padding: '10px 12px',
    backgroundColor: c.inputBg,
    border: '1px solid transparent',
    borderRadius: 12,
    fontSize: 15,
    color: c.text,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const saveLabel = isEditMode ? 'SAVE' : 'ADD';

  return (
    <AppBottomSheetLayout
      open={showAddModal}
      onClose={closeAddModal}
      title={title}
      bodyScroll={showMoreDetails}
      sheetStyle={{ maxHeight: '92vh', minHeight: 'min(82vh, 720px)' }}
      footer={
        <ModalActionBar
          onLeft={isEditMode ? handleDelete : closeAddModal}
          leftLabel={isEditMode ? 'DELETE' : 'CANCEL'}
          leftVariant={isEditMode ? 'delete' : 'cancel'}
          onSave={handleSave}
          saveLabel={saveLabel}
          saveDisabled={saveDisabled}
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ExpenseCategoryChipStrip
            categories={expensePickerCategories}
            selectedId={categoryId}
            onSelect={setCategoryId}
            recentIds={recentCategoryIds}
          />

          <div>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 11,
                fontWeight: 600,
                color: c.textMuted,
                letterSpacing: 0.4,
              }}
            >
              TYPE
            </p>
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
                    padding: '7px 0',
                    borderRadius: 9,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: type === opt.value ? 600 : 500,
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
        </div>

        <div
          aria-live="polite"
          aria-atomic
          style={{
            backgroundColor: showAmountError ? c.dangerSoft : c.inputBg,
            borderRadius: 16,
            padding: '14px 16px',
            textAlign: 'center',
            border: showAmountError ? `1px solid ${c.danger}` : `1px solid ${c.borderSubtle}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
              color: c.textMuted,
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            AMOUNT
          </p>
          <p
            className="font-figure"
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 800,
              color: showAmountError ? c.danger : c.text,
              lineHeight: 1.1,
              letterSpacing: -0.5,
            }}
          >
            <span style={{ color: c.accent, fontWeight: 700 }}>{currencySymbol}</span>
            {formatNumpadAmountDisplay(amount)}
          </p>
        </div>
        {showAmountError ? (
          <p
            style={{
              fontSize: 11,
              color: c.danger,
              margin: '-4px 0 0',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {amountError}
          </p>
        ) : null}

        <ExpenseAmountNumpad value={amount} onChange={setAmount} />

        {!isEditMode ? (
          <ExpenseAddSummaryBadges
            categoryId={categoryId}
            expenseType={type}
            dateLabel={formatPreviewDate(previewDate)}
            showMoreDetails={showMoreDetails}
            onToggleMoreDetails={() => setShowMoreDetails(prev => !prev)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowMoreDetails(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              border: 'none',
              background: 'none',
              padding: '4px 0 16px',
              fontSize: 13,
              fontWeight: 600,
              color: c.accent,
              cursor: 'pointer',
              fontFamily: 'inherit',
              width: '100%',
            }}
          >
            {showMoreDetails ? 'Less details' : 'More details'}
          </button>
        )}

        {showMoreDetails ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label htmlFor="expense-name" style={{ ...fieldLabel, color: c.textMuted }}>
                NAME
              </label>
              <input
                id="expense-name"
                type="text"
                placeholder={selectedCategory.name}
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: c.textFaint, margin: '4px 0 0' }}>
                Leave blank to use &ldquo;{selectedCategory.name}&rdquo;
              </p>
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
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={inputStyle}
                  />
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
        ) : null}

        {isReviewMode && !showMoreDetails ? (
          <p style={{ fontSize: 11, color: c.textFaint, margin: 0, textAlign: 'center' }}>
            Open more details to edit name or date before saving.
          </p>
        ) : null}
      </div>
    </AppBottomSheetLayout>
  );
}
