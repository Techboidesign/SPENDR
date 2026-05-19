import { useState, useMemo, useRef, useCallback } from 'react';
import { MagnifyingGlass, Trash, CheckSquare, Square, CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { useApp, getMonthExpenses, getMonthlyAmount } from '../../context/AppContext';
import { getCategoryById } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';
import { Expense, ExpenseType } from '../../data/types';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { SectionTitle } from '../ui/SectionTitle';
import { toYearMonthKey } from '../../utils/periods';

const EXPENSE_CARD_SHADOW = '0 2px 10px rgba(0,0,0,0.05)';

// Generate last 6 months dynamically
const today = new Date();
const MONTHS: string[] = [];
const MONTH_NAMES: Record<string, string> = {};

for (let i = 5; i >= 0; i--) {
  const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
  const key = toYearMonthKey(date);
  const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  MONTHS.push(key);
  MONTH_NAMES[key] = label;
}

type FilterType = 'all' | 'one-time' | 'monthly' | 'yearly';

function groupByDate(expenses: Expense[]): Record<string, Expense[]> {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const groups: Record<string, Expense[]> = {};

  for (const exp of expenses) {
    let label: string;
    if (exp.date === today) label = 'Today';
    else if (exp.date === yesterday) label = 'Yesterday';
    else {
      const d = new Date(exp.date + 'T00:00:00');
      label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(exp);
  }
  return groups;
}

interface SwipeRowProps {
  expense: Expense;
  isMultiSelect: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  formatCurrency: (n: number) => string;
}

function ExpenseRow({ expense, isMultiSelect, isSelected, onSelect, onEdit, onDelete, formatCurrency }: SwipeRowProps) {
  const [swipeX, setSwipeX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const cat = getCategoryById(expense.categoryId);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setSwipeX(Math.max(dx, -80));
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    if (swipeX < -40) setSwipeX(-72);
    else setSwipeX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startX.current;
    if (dx < 0) setSwipeX(Math.max(dx, -80));
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    if (swipeX < -40) setSwipeX(-72);
    else setSwipeX(0);
  };

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 16,
        boxShadow: EXPENSE_CARD_SHADOW,
        backgroundColor: '#FFFFFF',
        outline: isMultiSelect && isSelected ? '2px solid #3E37FF' : 'none',
      }}
    >
      {/* Delete button behind */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: 72, backgroundColor: '#EF4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button
          onClick={() => onDelete(expense.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Trash size={20} weight="light" color="#FFFFFF" />
        </button>
      </div>

      {/* Row content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          transform: `translateX(${swipeX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          userSelect: 'none',
          cursor: isMultiSelect ? 'pointer' : 'default',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          if (swipeX !== 0) { setSwipeX(0); return; }
          if (isMultiSelect) onSelect(expense.id);
          else onEdit(expense);
        }}
      >
        {isMultiSelect && (
          <div style={{ flexShrink: 0 }}>
            {isSelected
              ? <CheckSquare size={20} weight="fill" color="#3E37FF" />
              : <Square size={20} weight="light" color="#D1D5DB" />}
          </div>
        )}
        <CategoryIcon categoryId={expense.categoryId} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {expense.name}
          </p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>{cat.name}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
            -{formatCurrency(expense.amount)}
          </p>
          {expense.type !== 'one-time' && (
            <span style={{
              display: 'inline-block', marginTop: 2,
              fontSize: 9, fontWeight: 600,
              color: expense.type === 'monthly' ? '#D97706' : '#7C3AED',
              backgroundColor: expense.type === 'monthly' ? '#FEF3C7' : '#EDE9FE',
              padding: '2px 6px', borderRadius: 4,
            }}>
              {expense.type === 'monthly' ? 'Monthly' : 'Yearly'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExpensesScreen() {
  const { state, dispatch, openAddModal, formatCurrency } = useApp();
  const [monthIdx, setMonthIdx] = useState(MONTHS.length - 1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const currentMonth = MONTHS[monthIdx];

  // Get all expenses for this month (including recurring)
  const monthExpenses = useMemo(() =>
    getMonthExpenses(state.expenses, currentMonth),
    [state.expenses, currentMonth]
  );

  const monthTotal = useMemo(() => {
    return monthExpenses.reduce((s, e) => s + getMonthlyAmount(e), 0);
  }, [monthExpenses]);

  const filtered = useMemo(() => {
    return monthExpenses
      .filter(e => {
        if (filter !== 'all' && e.type !== filter) return false;
        if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [monthExpenses, filter, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const groupKeys = Object.keys(grouped);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map(e => e.id)));
  };

  const handleLongPress = useCallback(() => {
    setIsMultiSelect(true);
  }, []);

  const handleRowTouchStart = (expenseId: string) => {
    longPressTimer.current = setTimeout(() => {
      setIsMultiSelect(true);
      setSelected(new Set([expenseId]));
    }, 500);
  };

  const handleRowTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const exitMultiSelect = () => {
    setIsMultiSelect(false);
    setSelected(new Set());
  };

  const bulkDelete = () => {
    dispatch({ type: 'DELETE_EXPENSES', ids: Array.from(selected) });
    exitMultiSelect();
  };

  const FILTERS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'one-time', label: 'One-time' },
    { value: 'monthly', label: 'Recurring' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F7F7FA' }}>
      {/* Multi-select header */}
      {isMultiSelect ? (
        <div style={{
          backgroundColor: '#3E37FF', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button onClick={exitMultiSelect} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={20} weight="light" color="#FFFFFF" />
          </button>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>
            {selected.size} selected
          </span>
          <button onClick={selectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit' }}>
            Select All
          </button>
          {selected.size > 0 && (
            <button onClick={bulkDelete} style={{
              background: '#EF4444', border: 'none', cursor: 'pointer',
              borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Trash size={14} weight="light" color="#FFFFFF" />
              <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600, fontFamily: 'inherit' }}>Delete</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Month selector */}
          <div style={{
            backgroundColor: '#FFFFFF', padding: '16px 20px 0',
            borderBottom: '1px solid #F0F0F5',
            animation: 'fadeIn 0.5s ease-out both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button
                onClick={() => setMonthIdx(i => Math.max(0, i - 1))}
                disabled={monthIdx === 0}
                style={{ background: 'none', border: 'none', cursor: monthIdx === 0 ? 'default' : 'pointer', opacity: monthIdx === 0 ? 0.3 : 1 }}
              >
                <CaretLeft size={20} weight="light" color="#6B7280" />
              </button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
                  {MONTH_NAMES[currentMonth]}
                </p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>
                  {formatCurrency(monthTotal)} total
                </p>
              </div>
              <button
                onClick={() => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1))}
                disabled={monthIdx === MONTHS.length - 1}
                style={{ background: 'none', border: 'none', cursor: monthIdx === MONTHS.length - 1 ? 'default' : 'pointer', opacity: monthIdx === MONTHS.length - 1 ? 0.3 : 1 }}
              >
                <CaretRight size={20} weight="light" color="#6B7280" />
              </button>
            </div>

            {/* Filter chips */}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 12, overflowX: 'auto' }}>
              {FILTERS.map((f, i) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: filter === f.value ? 600 : 400,
                    backgroundColor: filter === f.value ? '#EDEDFF' : '#F7F7FA',
                    color: filter === f.value ? '#3E37FF' : '#6B7280',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    animation: `fadeIn 0.4s ease-out ${0.1 + i * 0.05}s both`,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 16px', borderBottom: '1px solid #F0F0F5',
            animation: 'fadeIn 0.5s ease-out 0.1s both' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              backgroundColor: '#F7F7FA', borderRadius: 12, padding: '10px 14px',
            }}>
              <MagnifyingGlass size={16} weight="light" color="#9CA3AF" />
              <input
                type="text"
                placeholder="Search expenses…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  fontSize: 14, color: '#1A1A2E', fontFamily: 'inherit',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <X size={14} weight="light" color="#9CA3AF" />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Expense list */}
      <div
        data-app-scroll
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          paddingBottom: TAB_BAR_CLEARANCE,
        }}
      >
        {groupKeys.length === 0 ? (
          <div style={{ padding: '48px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>📭</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', margin: 0 }}>No expenses found</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {groupKeys.map((dateLabel, groupIdx) => (
              <section
                key={dateLabel}
                style={{ animation: `fadeSlideUp 0.5s ease-out ${0.2 + groupIdx * 0.08}s both` }}
              >
                <SectionTitle>{dateLabel}</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {grouped[dateLabel].map(exp => (
                    <div
                      key={exp.id}
                      onTouchStart={() => !isMultiSelect && handleRowTouchStart(exp.id)}
                      onTouchEnd={handleRowTouchEnd}
                      onMouseDown={() => !isMultiSelect && handleRowTouchStart(exp.id)}
                      onMouseUp={handleRowTouchEnd}
                    >
                      <ExpenseRow
                        expense={exp}
                        isMultiSelect={isMultiSelect}
                        isSelected={selected.has(exp.id)}
                        onSelect={toggleSelect}
                        onEdit={openAddModal}
                        onDelete={id => dispatch({ type: 'DELETE_EXPENSE', id })}
                        formatCurrency={formatCurrency}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}