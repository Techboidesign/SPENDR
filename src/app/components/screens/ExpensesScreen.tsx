import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChartPie,
  ListBullets,
  MagnifyingGlass,
  Trash,
  X,
  Receipt,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { useApp, getCategoryTotals, getMonthExpenses, getMonthlyAmount } from '../../context/AppContext';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { activePillForeground } from '../../theme/darkModeUi';
import { getCategoryById } from '../../data/categories';
import { ExpensesCategoryInsights } from '../expenses/ExpensesCategoryInsights';
import { Expense } from '../../data/types';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { SectionTitle } from '../ui/SectionTitle';
import { CURRENT_MONTH_KEY } from '../../utils/periods';
import { AnimatedMonthTotal, ExpensesMonthPill } from '../expenses/ExpensesMonthPill';
import { ExpenseSwipeRow } from '../expenses/ExpenseSwipeRow';

const BRAND = '#3E37FF';
const CHARCOAL = '#1A1A2E';
/** Same slide feel as Settings → Profile (SubPageLayout). */
const SLIDE_EASE = [0.32, 0.72, 0, 1] as const;
const SLIDE_DURATION = 0.32;
const SLIDE_MS = Math.round(SLIDE_DURATION * 1000) + 16;

const UNDO_DURATION_MS = 10_000;
const TOP_ACTION_BAR_HEIGHT = 60;

const topActionBarStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 200,
  minHeight: TOP_ACTION_BAR_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: 0,
  boxSizing: 'border-box',
};

type FilterType = 'all' | 'one-time' | 'monthly' | 'yearly';
type ExpensesViewMode = 'list' | 'chart';

type PendingDeleteEntry = {
  expense: Expense;
  timerId: ReturnType<typeof setTimeout>;
};

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

export default function ExpensesScreen() {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const reduceMotion = useReducedMotion();
  const { state, dispatch, openAddModal, formatCurrency } = useApp();
  const [selectedMonthKey, setSelectedMonthKey] = useState(CURRENT_MONTH_KEY);
  const [viewMode, setViewMode] = useState<ExpensesViewMode>('list');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsExiting, setInsightsExiting] = useState(false);
  const [barsReady, setBarsReady] = useState(true);
  const [barAnimGeneration, setBarAnimGeneration] = useState(0);
  const insightsExitTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [undoSnack, setUndoSnack] = useState<{ expense: Expense; expiresAt: number } | null>(null);
  const pendingDeletesRef = useRef<Map<string, PendingDeleteEntry>>(new Map());
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<number | null>(null);

  const preserveScroll = useCallback((action: () => void) => {
    const el = scrollRef.current;
    if (el) pendingScrollRef.current = el.scrollTop;
    action();
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const top = pendingScrollRef.current;
    if (el != null && top != null) {
      el.scrollTop = top;
      pendingScrollRef.current = null;
    }
  });

  const currentMonth = selectedMonthKey;

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    return () => {
      pendingDeletesRef.current.forEach(entry => clearTimeout(entry.timerId));
      pendingDeletesRef.current.clear();
    };
  }, []);

  const toggleSearch = () => {
    setSearchOpen(open => {
      if (open) setSearch('');
      return !open;
    });
  };

  const monthExpenses = useMemo(
    () => getMonthExpenses(state.expenses, currentMonth),
    [state.expenses, currentMonth],
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
        if (hiddenIds.has(e.id)) return false;
        if (filter !== 'all' && e.type !== filter) return false;
        if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [monthExpenses, filter, search, hiddenIds]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const groupKeys = Object.keys(grouped);

  const toggleSelect = (id: string) => {
    preserveScroll(() => {
      const next = new Set(selected);
      next.has(id) ? next.delete(id) : next.add(id);
      setSelected(next);
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map(e => e.id)));
  };

  useEffect(() => {
    if (!openRowId) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-expense-swipe-row]')) setOpenRowId(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [openRowId]);

  const handleSwipeSelect = useCallback((expenseId: string) => {
    setUndoSnack(null);
    setIsMultiSelect(true);
    setSelected(prev => {
      const next = new Set(prev);
      next.add(expenseId);
      return next;
    });
    setOpenRowId(null);
  }, []);

  const enterMultiSelectWith = useCallback(
    (expenseId: string) => {
      handleSwipeSelect(expenseId);
    },
    [handleSwipeSelect],
  );

  const handleRowTouchStart = (expenseId: string) => {
    longPressTimer.current = setTimeout(() => enterMultiSelectWith(expenseId), 500);
  };

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleRowTouchEnd = () => {
    cancelLongPress();
  };

  const clearMultiSelect = useCallback(() => {
    setIsMultiSelect(false);
    setSelected(new Set());
  }, []);

  const onDeleteGestureStart = useCallback(() => {
    cancelLongPress();
    clearMultiSelect();
    setOpenRowId(null);
  }, [cancelLongPress, clearMultiSelect]);

  const exitMultiSelect = () => {
    setIsMultiSelect(false);
    setSelected(new Set());
    setOpenRowId(null);
  };

  const bulkDelete = () => {
    preserveScroll(() => {
      for (const id of selected) {
        const expense = state.expenses.find(e => e.id === id);
        if (expense) scheduleDelete(expense, { preserve: false });
      }
      setIsMultiSelect(false);
      setSelected(new Set());
      setOpenRowId(null);
    });
  };

  const finalizeDelete = useCallback(
    (id: string) => {
      const pending = pendingDeletesRef.current.get(id);
      if (!pending) return;
      clearTimeout(pending.timerId);
      pendingDeletesRef.current.delete(id);
      preserveScroll(() => {
        dispatch({ type: 'DELETE_EXPENSE', id });
        setHiddenIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setUndoSnack(current => (current?.expense.id === id ? null : current));
      });
    },
    [dispatch, preserveScroll],
  );

  const scheduleDelete = useCallback(
    (expense: Expense, options?: { preserve?: boolean }) => {
      const run = () => {
        const existing = pendingDeletesRef.current.get(expense.id);
        if (existing) {
          clearTimeout(existing.timerId);
          pendingDeletesRef.current.delete(expense.id);
        }

        setOpenRowId(null);
        setIsMultiSelect(false);
        setSelected(new Set());
        setHiddenIds(prev => new Set(prev).add(expense.id));

        const expiresAt = Date.now() + UNDO_DURATION_MS;
        const timerId = setTimeout(() => finalizeDelete(expense.id), UNDO_DURATION_MS);

        pendingDeletesRef.current.set(expense.id, { expense, timerId });
        setUndoSnack({ expense, expiresAt });
      };

      if (options?.preserve === false) run();
      else preserveScroll(run);
    },
    [finalizeDelete, preserveScroll],
  );

  const undoDelete = useCallback(() => {
    if (!undoSnack) return;
    const { expense } = undoSnack;
    const pending = pendingDeletesRef.current.get(expense.id);
    if (pending) {
      clearTimeout(pending.timerId);
      pendingDeletesRef.current.delete(expense.id);
    }
    preserveScroll(() => {
      setHiddenIds(prev => {
        const next = new Set(prev);
        next.delete(expense.id);
        return next;
      });
      setUndoSnack(null);
    });
  }, [undoSnack, preserveScroll]);

  const FILTERS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'one-time', label: 'One-time' },
    { value: 'monthly', label: 'Recurring' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const slideTransition = reduceMotion
    ? { duration: 0 }
    : { duration: SLIDE_DURATION, ease: SLIDE_EASE };

  const setView = useCallback(
    (mode: ExpensesViewMode) => {
      setViewMode(mode);
      if (insightsExitTimerRef.current) {
        clearTimeout(insightsExitTimerRef.current);
        insightsExitTimerRef.current = undefined;
      }

      if (mode === 'chart') {
        setInsightsExiting(false);
        setInsightsOpen(true);
        setBarsReady(false);
        setBarAnimGeneration(g => g + 1);
        setSearchOpen(false);
        setSearch('');
        return;
      }

      setBarsReady(true);
      setInsightsExiting(true);
      if (reduceMotion) {
        setInsightsOpen(false);
        setInsightsExiting(false);
        return;
      }
      insightsExitTimerRef.current = setTimeout(() => {
        setInsightsOpen(false);
        setInsightsExiting(false);
        insightsExitTimerRef.current = undefined;
      }, SLIDE_MS);
    },
    [reduceMotion],
  );

  const handleInsightsAnimationComplete = useCallback(() => {
    if (!insightsExiting && insightsOpen) {
      setBarsReady(true);
    }
  }, [insightsExiting, insightsOpen]);

  useEffect(() => {
    if (reduceMotion && insightsOpen && !insightsExiting) {
      setBarsReady(true);
    }
  }, [reduceMotion, insightsOpen, insightsExiting]);

  useEffect(
    () => () => {
      if (insightsExitTimerRef.current) clearTimeout(insightsExitTimerRef.current);
    },
    [],
  );

  const listIsEmpty = groupKeys.length === 0;
  const insightsVisible = insightsOpen || insightsExiting;

  const headerLocked = isMultiSelect || !!undoSnack;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: c.canvas, position: 'relative' }}>
      <AnimatePresence initial={false}>
        {isMultiSelect && !undoSnack && (
          <motion.div
            key="multi-select-bar"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            role="toolbar"
            aria-label="Selection actions"
            style={{
              ...topActionBarStyle,
              backgroundColor: CHARCOAL,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.22)',
            }}
          >
            <button
              type="button"
              onClick={exitMultiSelect}
              aria-label="Close selection"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <X size={20} weight="light" color="#FFFFFF" />
            </button>
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              {selected.size} selected
            </span>
            <button
              type="button"
              onClick={selectAll}
              style={{
                backgroundColor: c.surface,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: CHARCOAL,
                fontFamily: 'inherit',
                padding: '8px 14px',
                borderRadius: 9999,
                flexShrink: 0,
              }}
            >
              Select all
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={bulkDelete}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 9999,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <Trash size={15} weight="light" color="#FFFFFF" />
                <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600, fontFamily: 'inherit' }}>
                  Delete all
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {undoSnack && (
          <motion.div
            key={undoSnack.expense.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
            style={{
              ...topActionBarStyle,
              backgroundColor: CHARCOAL,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.22)',
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 500,
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Deleted &ldquo;{undoSnack.expense.name}&rdquo;
            </span>
            <button
              type="button"
              onClick={undoDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 9999,
                border: 'none',
                backgroundColor: BRAND,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              <ArrowCounterClockwise size={16} weight="bold" color="#FFFFFF" />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header
        style={{
          position: 'relative',
          flexShrink: 0,
          backgroundColor: c.surface,
          overflow: 'visible',
        }}
      >
            <div
              style={{
                opacity: headerLocked ? 0.38 : 1,
                pointerEvents: headerLocked ? 'none' : 'auto',
                transition: 'opacity 0.15s ease',
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
                <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0 }}>Expenses</h1>
                <AnimatedMonthTotal value={monthTotal} formatCurrency={formatCurrency} />
              </div>

              <div style={{ padding: '0 20px 14px', position: 'relative', zIndex: 2 }}>
                <ExpensesMonthPill
                  monthKey={selectedMonthKey}
                  onMonthChange={setSelectedMonthKey}
                  disabled={headerLocked}
                  trailingSlot={
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 4,
                        borderRadius: 9999,
                        backgroundColor: c.canvas,
                      }}
                    >
                      {([
                        { mode: 'list' as const, icon: ListBullets, label: 'List' },
                        { mode: 'chart' as const, icon: ChartPie, label: 'Insights' },
                      ]).map(({ mode, icon: Icon, label }) => {
                        const isActive = viewMode === mode;
                        const activeBg = isActive ? (isDark ? c.tabActiveBg : CHARCOAL) : 'transparent';
                        const activeShadow = isActive ? (isDark ? c.shadowSm : '0 2px 10px rgba(26, 26, 46, 0.25)') : 'none';
                        const activeFg = isActive ? activePillForeground(isDark, c) : c.textMuted;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setView(mode)}
                            disabled={headerLocked}
                            aria-label={label}
                            aria-pressed={isActive}
                            style={{
                              border: 'none',
                              cursor: headerLocked ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: isActive ? '6px 12px' : '6px 10px',
                              minHeight: 32,
                              borderRadius: 9999,
                              backgroundColor: activeBg,
                              boxShadow: activeShadow,
                              fontFamily: 'inherit',
                            }}
                          >
                            <Icon
                              size={18}
                              weight="light"
                              color={activeFg}
                              aria-hidden
                            />
                            {isActive && (
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: activeFg,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {label}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  }
                />
              </div>
            </div>
      </header>

      <motion.div
        initial={reduceMotion ? false : { x: '100%' }}
        animate={{ x: 0 }}
        transition={slideTransition}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          backgroundColor: c.surface,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden={insightsVisible}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 0,
              pointerEvents: insightsVisible ? 'none' : 'auto',
            }}
          >
            <div
              className="expenses-filter-row"
              aria-hidden={viewMode !== 'list'}
              style={{
                padding: '0 20px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                opacity: viewMode === 'list' ? (headerLocked ? 0.42 : 1) : 0,
                filter: headerLocked ? 'grayscale(1)' : 'none',
                transition: 'opacity 0.15s ease, filter 0.15s ease',
                pointerEvents: viewMode === 'list' ? 'auto' : 'none',
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
                      disabled={headerLocked || viewMode !== 'list'}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 9999,
                        border: 'none',
                        cursor: headerLocked || viewMode !== 'list' ? 'default' : 'pointer',
                        fontSize: 12,
                        fontWeight: isActive && !headerLocked ? 600 : 500,
                        backgroundColor: headerLocked
                          ? c.surfaceInset
                          : isActive
                            ? c.chipSelectedBg
                            : c.chipBg,
                        color: headerLocked ? c.textFaint : isActive ? c.chipSelectedText : c.textMuted,
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
                disabled={headerLocked || viewMode !== 'list'}
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
                  cursor: headerLocked || viewMode !== 'list' ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  backgroundColor: headerLocked
                    ? '#C8C8D2'
                    : searchOpen
                      ? '#2D28CC'
                      : BRAND,
                  boxShadow: headerLocked ? 'none' : '0 2px 10px rgba(62, 55, 255, 0.35)',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <MagnifyingGlass
                  size={16}
                  weight="bold"
                  color={headerLocked ? '#8E8E9A' : '#FFFFFF'}
                />
              </button>
            </div>

            <div
              style={{
                flexShrink: 0,
                overflow: 'hidden',
                maxHeight: viewMode === 'list' && searchOpen ? 80 : 0,
                opacity: viewMode === 'list' && searchOpen ? 1 : 0,
                transition: 'max-height 0.28s ease, opacity 0.2s ease',
                pointerEvents: viewMode === 'list' && searchOpen ? 'auto' : 'none',
              }}
            >
              <div style={{ padding: '0 20px 14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: c.canvas,
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
                      color: c.text,
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
            </div>

            <div
              ref={scrollRef}
              data-app-scroll
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingBottom: TAB_BAR_CLEARANCE,
                overflowAnchor: 'none',
              }}
            >
            {listIsEmpty ? (
              <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                <Receipt size={40} weight="light" color="#D1D5DB" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: c.textMuted, margin: 0 }}>No expenses found</p>
                <p style={{ fontSize: 13, color: c.textFaint, margin: '4px 0 0' }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div>
                {groupKeys.map(dateLabel => (
                  <section key={dateLabel}>
                    <SectionTitle inset>{dateLabel}</SectionTitle>
                    <div style={{ backgroundColor: c.surface }}>
                      {grouped[dateLabel].map(exp => (
                        <div
                          key={exp.id}
                          onTouchStart={() => !isMultiSelect && handleRowTouchStart(exp.id)}
                          onTouchEnd={handleRowTouchEnd}
                          onMouseDown={() => !isMultiSelect && handleRowTouchStart(exp.id)}
                          onMouseUp={handleRowTouchEnd}
                        >
                          <ExpenseSwipeRow
                            expense={exp}
                            isMultiSelect={isMultiSelect}
                            isSelected={selected.has(exp.id)}
                            isRowOpen={openRowId === exp.id}
                            onRowOpen={id => setOpenRowId(id)}
                            onRowClose={() => setOpenRowId(null)}
                            onSelect={toggleSelect}
                            onSwipeSelect={handleSwipeSelect}
                            onCancelLongPress={cancelLongPress}
                            onDeleteGestureStart={onDeleteGestureStart}
                            onEdit={openAddModal}
                            onRequestDelete={exp => scheduleDelete(exp)}
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
          </div>

          {insightsOpen && (
            <motion.div
              key="expenses-insights-panel"
              initial={reduceMotion ? false : { x: '100%' }}
              animate={{ x: insightsExiting ? '100%' : 0 }}
              transition={slideTransition}
              onAnimationComplete={handleInsightsAnimationComplete}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                overflowY: 'auto',
                paddingBottom: TAB_BAR_CLEARANCE,
                willChange: 'transform',
                backgroundColor: c.surface,
              }}
            >
              <div style={{ padding: '12px 14px' }}>
                <ExpensesCategoryInsights
                  segments={categorySegments}
                  formatCurrency={formatCurrency}
                  monthKey={selectedMonthKey}
                  monthTotal={monthTotal}
                  barAnimationKey={`${selectedMonthKey}-${barAnimGeneration}`}
                  animateBars={barsReady}
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

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
      `}</style>
    </div>
  );
}
