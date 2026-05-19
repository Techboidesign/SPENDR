import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChartBar, ListBullets, MagnifyingGlass, Trash, CheckSquare, Square, X, Receipt } from '@phosphor-icons/react';
import { useApp, getCategoryTotals, getMonthExpenses, getMonthlyAmount } from '../../context/AppContext';
import { getCategoryById } from '../../data/categories';
import { ExpensesCategoryInsights } from '../expenses/ExpensesCategoryInsights';
import { CategoryIcon } from '../CategoryIcon';
import { Expense, ExpenseType } from '../../data/types';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { SectionTitle } from '../ui/SectionTitle';
import { CURRENT_MONTH_KEY } from '../../utils/periods';
import { ExpensesMonthPill } from '../expenses/ExpensesMonthPill';

const EXPENSE_CARD_SHADOW = '0 2px 10px rgba(0,0,0,0.05)';
const BRAND = '#3E37FF';

type FilterType = 'all' | 'one-time' | 'monthly' | 'yearly';
type ExpensesViewMode = 'list' | 'chart';

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
  const [selectedMonthKey, setSelectedMonthKey] = useState(CURRENT_MONTH_KEY);
  const [viewMode, setViewMode] = useState<ExpensesViewMode>('list');
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentMonth = selectedMonthKey;

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const toggleSearch = () => {
    setSearchOpen(open => {
      if (open) setSearch('');
      return !open;
    });
  };

  // Get all expenses for this month (including recurring)
  const monthExpenses = useMemo(() =>
    getMonthExpenses(state.expenses, currentMonth),
    [state.expenses, currentMonth]
  );

  const monthTotal = useMemo(() => {
    return monthExpenses.reduce((s, e) => s + getMonthlyAmount(e), 0);
  }, [monthExpenses]);

  const categorySegments = useMemo(() => {
    const totals = getCategoryTotals(state.expenses, currentMonth);
    return Object.entries(totals)
      .map(([id, amount]) => {
        const cat = getCategoryById(id);
        return { id, name: cat.name, color: cat.color, amount };
      })
      .filter(s => s.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [state.expenses, currentMonth]);

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

  const setView = (mode: ExpensesViewMode) => {
    setViewMode(mode);
    if (mode === 'chart') {
      setSearchOpen(false);
      setSearch('');
    }
  };

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
          <header
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #F0F0F5',
              animation: 'fadeIn 0.5s ease-out both',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                padding: '20px 20px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Expenses</h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 4,
                  borderRadius: 9999,
                  backgroundColor: '#F7F7FA',
                  flexShrink: 0,
                }}
              >
                {([
                  { mode: 'list' as const, icon: ListBullets, label: 'List view' },
                  { mode: 'chart' as const, icon: ChartBar, label: 'Chart view' },
                ]).map(({ mode, icon: Icon, label }) => {
                  const isActive = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setView(mode)}
                      aria-label={label}
                      aria-pressed={isActive}
                      style={{
                        width: 36,
                        height: 32,
                        borderRadius: 9999,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isActive ? BRAND : 'transparent',
                        boxShadow: isActive ? '0 2px 10px rgba(62, 55, 255, 0.35)' : 'none',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Icon
                        size={18}
                        weight="light"
                        color={isActive ? '#FFFFFF' : '#6B7280'}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '0 20px 14px', position: 'relative', zIndex: 2 }}>
              <ExpensesMonthPill
                monthKey={selectedMonthKey}
                onMonthChange={setSelectedMonthKey}
                monthTotal={monthTotal}
                formatCurrency={formatCurrency}
              />
            </div>

            {viewMode === 'list' && (
            <div
              className="expenses-filter-row"
              style={{
                padding: '0 20px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                className="expenses-filter-chips"
                style={{
                  display: 'flex',
                  flex: 1,
                  minWidth: 0,
                  gap: 6,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                }}
              >
              {FILTERS.map(f => {
                const isActive = filter === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 500,
                      backgroundColor: isActive ? '#EDEDFF' : '#F7F7FA',
                      color: isActive ? BRAND : '#6B7280',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
              </div>
              <button
                type="button"
                onClick={toggleSearch}
                aria-label={searchOpen ? 'Close search' : 'Search expenses'}
                style={{
                  width: 42,
                  height: 30,
                  flexShrink: 0,
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  borderRadius: 9999,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  backgroundColor: searchOpen ? '#2D28CC' : BRAND,
                  boxShadow: '0 2px 10px rgba(62, 55, 255, 0.35)',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <MagnifyingGlass size={16} weight="bold" color="#FFFFFF" />
              </button>
            </div>
            )}

            <AnimatePresence initial={false}>
              {viewMode === 'list' && searchOpen && (
                <motion.div
                  key="expenses-search"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 20px 14px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: '#F7F7FA',
                        borderRadius: 14,
                        padding: '11px 14px',
                        border: `1px solid ${BRAND}30`,
                      }}
                    >
                      <MagnifyingGlass size={16} weight="light" color={BRAND} />
                      <input
                        ref={searchInputRef}
                        type="search"
                        placeholder="Search expenses…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                          flex: 1,
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: 14,
                          color: '#1A1A2E',
                          fontFamily: 'inherit',
                        }}
                      />
                      <button
                        type="button"
                        onClick={toggleSearch}
                        aria-label="Close search"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <X size={16} weight="light" color="#9CA3AF" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>
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
        {viewMode === 'chart' ? (
          <ExpensesCategoryInsights
            segments={categorySegments}
            formatCurrency={formatCurrency}
            monthKey={selectedMonthKey}
            monthTotal={monthTotal}
            shuffleKey={`${selectedMonthKey}-${viewMode}`}
          />
        ) : groupKeys.length === 0 ? (
          <div style={{ padding: '48px 8px', textAlign: 'center' }}>
            <Receipt size={40} weight="light" color="#D1D5DB" style={{ marginBottom: 12 }} />
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
        .expenses-filter-row::-webkit-scrollbar { display: none; }
        .expenses-filter-chips::-webkit-scrollbar { display: none; }

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

        @keyframes barGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
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
