import { useState, useEffect, useMemo, useRef, type CSSProperties } from 'react';
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
import { isFocusCategoryId } from '../data/focusCategory';
import {
  buildExpenseNameCategoryIndex,
  suggestCategoryFromName,
} from '../utils/suggestCategoryFromName';

const CATEGORY_SUGGEST_DEBOUNCE_MS = 280;

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
  const isNewExpenseForm = !isEditMode && !isReviewMode;

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(today);
  const [type, setType] = useState<ExpenseType>('one-time');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const recentCategoryIds = useMemo(
    () => getRecentCategoryIds(state.expenses),
    [state.expenses],
  );

  const categoryHistoryIndex = useMemo(
    () => buildExpenseNameCategoryIndex(state.expenses),
    [state.expenses],
  );

  const pickerCategoryIds = useMemo(
    () => expensePickerCategories.map(c => c.id),
    [expensePickerCategories],
  );

  const pickerCatalogNames = useMemo(
    () => expensePickerCategories.map(c => ({ id: c.id, name: c.name })),
    [expensePickerCategories],
  );

  const categoryTouchedRef = useRef(false);
  const [categoryScrollToken, setCategoryScrollToken] = useState(0);
  const [categoryAutoOrdered, setCategoryAutoOrdered] = useState(false);

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
      setCategoryId(addModalDraft.categoryId ?? '');
      setDate(addModalDraft.date ?? today);
      setType(addModalDraft.type ?? 'one-time');
      setStartDate(addModalDraft.startDate ?? addModalDraft.date ?? today);
      setEndDate(addModalDraft.endDate ?? '');
      setNotes(addModalDraft.notes ?? '');
    } else {
      setAmount('');
      setName('');
      setCategoryId('');
      setDate(today);
      setType('one-time');
      setStartDate(today);
      setEndDate('');
      setNotes('');
    }
  }, [editingExpense, addModalDraft, showAddModal, today]);

  useEffect(() => {
    categoryTouchedRef.current = false;
    setCategoryScrollToken(0);
    setCategoryAutoOrdered(false);
  }, [editingExpense, addModalDraft, showAddModal]);

  useEffect(() => {
    if (!showAddModal || !isNewExpenseForm) return;
    if (categoryTouchedRef.current) return;

    const trimmed = name.trim();

    const timer = window.setTimeout(() => {
      if (categoryTouchedRef.current) return;

      if (trimmed.length < 2) {
        setCategoryId('');
        setCategoryAutoOrdered(false);
        return;
      }

      const suggested = suggestCategoryFromName({
        name: trimmed,
        allowedCategoryIds: pickerCategoryIds,
        historyIndex: categoryHistoryIndex,
        catalogNames: pickerCatalogNames,
      });

      setCategoryId(suggested);
      setCategoryAutoOrdered(true);
      setCategoryScrollToken(t => t + 1);
    }, CATEGORY_SUGGEST_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    name,
    showAddModal,
    isNewExpenseForm,
    pickerCategoryIds,
    categoryHistoryIndex,
    pickerCatalogNames,
  ]);

  const hasValidCategory = categoryId.trim() !== '';
  const isFocusContribution = hasValidCategory && isFocusCategoryId(categoryId);

  const parsedAmount = parseFloat(amount);
  const hasValidAmount =
    amount.trim() !== '' &&
    !Number.isNaN(parsedAmount) &&
    (isFocusContribution ? parsedAmount !== 0 : parsedAmount > 0);

  const canSave = hasValidAmount && hasValidCategory;

  const previewDate = type === 'one-time' ? date : startDate;

  const handleSave = () => {
    if (!canSave) return;

    const resolvedName =
      name.trim() || (hasValidCategory ? getCategory(categoryId).name : 'Expense');

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
    fontSize: 16,
    color: c.text,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  /** iOS Safari date inputs overflow unless ancestors and inputs can shrink below min-content. */
  const dateInputStyle: CSSProperties = {
    ...inputStyle,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    border: `1px solid ${c.borderSubtle}`,
  };

  const dateFieldCellStyle: CSSProperties = {
    minWidth: 0,
    width: '100%',
  };

  const saveLabel = isEditMode ? 'SAVE' : 'ADD';

  const summaryBadges = (
    <ExpenseAddSummaryBadges
      categoryId={hasValidCategory ? categoryId : null}
      expenseType={type}
      dateLabel={formatPreviewDate(previewDate)}
      align="end"
      compact
    />
  );

  return (
    <AppBottomSheetLayout
      open={showAddModal}
      onClose={closeAddModal}
      title={title}
      headerTrailing={summaryBadges}
      showCloseButton={false}
      bodyScroll
      sheetStyle={{ maxHeight: '92vh', minHeight: 'min(82vh, 720px)' }}
      footer={
        <ModalActionBar
          onLeft={isEditMode ? handleDelete : closeAddModal}
          leftLabel={isEditMode ? 'DELETE' : 'CANCEL'}
          leftVariant={isEditMode ? 'delete' : 'cancel'}
          onSave={handleSave}
          saveLabel={saveLabel}
          saveDisabled={!canSave}
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, width: '100%' }}>
          <div>
            {!isNewExpenseForm ? (
              <label htmlFor="expense-name" style={{ ...fieldLabel, color: c.textMuted }}>
                NAME
              </label>
            ) : null}
            <input
              id="expense-name"
              type="text"
              placeholder={isNewExpenseForm ? 'Expense name (optional)' : 'Expense name'}
              value={name}
              onChange={e => {
                categoryTouchedRef.current = false;
                setCategoryAutoOrdered(false);
                setName(e.target.value);
              }}
              aria-label="Expense name"
              style={{
                ...inputStyle,
                border: `1px solid ${c.borderSubtle}`,
              }}
            />
          </div>

          <div>
            <ExpenseCategoryChipStrip
              categories={expensePickerCategories}
              selectedId={categoryId}
              onSelect={id => {
                categoryTouchedRef.current = true;
                setCategoryAutoOrdered(false);
                setCategoryId(id);
              }}
              recentIds={recentCategoryIds}
              heading={isNewExpenseForm ? 'CHOOSE A CATEGORY' : 'CATEGORY'}
              pinSelectedFirst={isNewExpenseForm && categoryAutoOrdered && Boolean(categoryId)}
              scrollToCategory={
                isNewExpenseForm && categoryId && categoryAutoOrdered
                  ? { categoryId, token: categoryScrollToken }
                  : null
              }
            />
          </div>

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

          <div
            style={
              type !== 'one-time'
                ? {
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                    gap: 8,
                    width: '100%',
                    minWidth: 0,
                  }
                : { width: '100%', minWidth: 0 }
            }
          >
            <div style={dateFieldCellStyle}>
              <label style={{ ...fieldLabel, color: c.textMuted }}>
                {type === 'one-time' ? 'DATE' : 'START'}
              </label>
              <input
                type="date"
                aria-label={type === 'one-time' ? 'Date' : 'Start date'}
                value={type === 'one-time' ? date : startDate}
                onChange={e =>
                  type === 'one-time' ? setDate(e.target.value) : setStartDate(e.target.value)
                }
                style={dateInputStyle}
              />
            </div>
            {type !== 'one-time' ? (
              <div style={dateFieldCellStyle}>
                <label style={{ ...fieldLabel, color: c.textMuted }}>END (OPT.)</label>
                <input
                  type="date"
                  aria-label="End date (optional)"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={dateInputStyle}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div>
          {!isNewExpenseForm ? (
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 11,
                fontWeight: 600,
                color: c.textMuted,
                letterSpacing: 0.4,
              }}
            >
              AMOUNT
            </p>
          ) : null}
          <div
            aria-live="polite"
            aria-atomic
            style={{
              backgroundColor: c.inputBg,
              borderRadius: 16,
              padding: '14px 16px',
              textAlign: 'center',
              border: `1px solid ${c.borderSubtle}`,
            }}
          >
            <p
              className="font-figure"
              style={{
                margin: 0,
                fontSize: 36,
                fontWeight: 800,
                color: c.text,
                lineHeight: 1.1,
                letterSpacing: -0.5,
              }}
            >
              <span style={{ color: c.accent, fontWeight: 700 }}>{currencySymbol}</span>
              {formatNumpadAmountDisplay(amount)}
            </p>
          </div>

          <div style={{ marginTop: 20 }}>
            <ExpenseAmountNumpad value={amount} onChange={setAmount} />
          </div>
        </div>
      </div>
    </AppBottomSheetLayout>
  );
}
