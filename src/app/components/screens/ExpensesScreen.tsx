import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  MagnifyingGlass,
  Trash,
  X,
  Receipt,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import {
  useApp,
  getMonthExpenses,
} from '../../context/AppContext';
import { useAppColors } from '../../context/AppearanceContext';
import { Expense } from '../../data/types';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { SectionTitle } from '../ui/SectionTitle';
import { CURRENT_MONTH_KEY } from '../../utils/periods';
import { ExpensesMonthPill } from '../expenses/ExpensesMonthPill';
import { ExpenseSwipeRow } from '../expenses/ExpenseSwipeRow';
import { SLIDE_DURATION, SLIDE_EASE } from '../../theme/motion';

const BRAND = '#3E37FF';
const CHARCOAL = '#1A1A2E';

/** Matches Budget & Goals / Settings screen titles (h1). */
const screenTitleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  fontFamily: 'inherit',
  lineHeight: 1.2,
  margin: 0,
};
/** Close: search bounces up — then month + filter chips fade in. Open: month/filters out — search slides down. */
const SEARCH_DISSOLVE_DURATION = 0.12;
const SEARCH_SLIDE_DURATION = 0.22;
const SEARCH_EASE_OUT_BOUNCE = [0.34, 1.52, 0.64, 1] as const;
const SEARCH_EXIT_Y = -22;
/** Month + filter row — fixed height so list layout does not jump during search. */
const EXPENSES_LIST_CHROME_HEIGHT = 106;

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
  const reduceMotion = useReducedMotion();
  const { state, dispatch, openAddModal, formatCurrency } = useApp();
  const [selectedMonthKey, setSelectedMonthKey] = useState(CURRENT_MONTH_KEY);
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
  const skipListFiltersEnterRef = useRef(true);
  const [listFiltersEnterDelay, setListFiltersEnterDelay] = useState(0);

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

  useEffect(() => {
    if (!searchOpen) return;
    const delayMs = reduceMotion
      ? 0
      : Math.round((SEARCH_DISSOLVE_DURATION + SEARCH_SLIDE_DURATION * 0.45) * 1000);
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [searchOpen, reduceMotion]);

  useEffect(() => {
    skipListFiltersEnterRef.current = false;
  }, []);

  const scheduleListFiltersEnterDelayReset = useCallback(() => {
    window.setTimeout(() => setListFiltersEnterDelay(0), 800);
  }, []);

  const commitExpenseDeletes = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      if (ids.length === 1) {
        dispatch({ type: 'DELETE_EXPENSE', id: ids[0] });
      } else {
        dispatch({ type: 'DELETE_EXPENSES', ids });
      }
    },
    [dispatch],
  );

  const commitExpenseDeletesRef = useRef(commitExpenseDeletes);
  commitExpenseDeletesRef.current = commitExpenseDeletes;

  useEffect(() => {
    return () => {
      const ids: string[] = [];
      pendingDeletesRef.current.forEach(entry => {
        clearTimeout(entry.timerId);
        ids.push(entry.expense.id);
      });
      pendingDeletesRef.current.clear();
      // Leaving Expenses before the undo timer ends must commit deletes — clearing timers alone
      // would drop hiddenIds on remount and make rows look undeleted.
      if (ids.length > 0) {
        commitExpenseDeletesRef.current(ids);
      }
    };
  }, []);

  const toggleSearch = () => {
    setSearchOpen(open => {
      if (open) {
        setSearch('');
        setListFiltersEnterDelay(reduceMotion ? 0 : SEARCH_SLIDE_DURATION);
        scheduleListFiltersEnterDelayReset();
      } else {
        setListFiltersEnterDelay(0);
      }
      return !open;
    });
  };

  const monthExpenses = useMemo(
    () => getMonthExpenses(state.expenses, selectedMonthKey),
    [state.expenses, selectedMonthKey],
  );

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
        commitExpenseDeletes([id]);
        setHiddenIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setUndoSnack(current => (current?.expense.id === id ? null : current));
      });
    },
    [commitExpenseDeletes, preserveScroll],
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

  const searchDissolveTransition = reduceMotion
    ? { duration: 0 }
    : { duration: SEARCH_DISSOLVE_DURATION, ease: 'easeOut' as const };

  const searchCloseExit = reduceMotion
    ? undefined
    : {
        opacity: 0,
        y: SEARCH_EXIT_Y,
        transition: {
          y: { duration: SEARCH_SLIDE_DURATION, ease: SEARCH_EASE_OUT_BOUNCE },
          opacity: {
            duration: SEARCH_DISSOLVE_DURATION,
            ease: 'easeOut' as const,
            delay: SEARCH_SLIDE_DURATION * 0.4,
          },
        },
      };

  const listFiltersEnterTransition = reduceMotion
    ? { duration: 0 }
    : {
        duration: SEARCH_DISSOLVE_DURATION,
        ease: 'easeOut' as const,
        delay: listFiltersEnterDelay,
      };

  const showSearchBar = searchOpen;
  const listIsEmpty = groupKeys.length === 0;
  const showListChromeFilters = !searchOpen;
  const expensesChromeHeight = EXPENSES_LIST_CHROME_HEIGHT;
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
          flexShrink: 0,
          backgroundColor: c.surface,
          borderBottom: `1px solid ${c.border}`,
          padding: '20px 20px 0',
          opacity: headerLocked ? 0.38 : 1,
          pointerEvents: headerLocked ? 'none' : 'auto',
          transition: 'opacity 0.15s ease',
        }}
      >
        <h1 style={{ ...screenTitleStyle, padding: '0 0 14px', marginBottom: -1 }}>Expenses</h1>
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
          position: 'relative',
          backgroundColor: c.canvas,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            minHeight: expensesChromeHeight,
            overflow: 'hidden',
            opacity: headerLocked ? 0.38 : 1,
            pointerEvents: headerLocked ? 'none' : 'auto',
            transition: 'opacity 0.15s ease',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {showSearchBar ? (
              <motion.div
                key="expenses-search-bar"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={searchCloseExit}
                transition={searchDissolveTransition}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  padding: '16px 20px 14px',
                  boxSizing: 'border-box',
                }}
              >
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -14 }}
                  animate={
                    reduceMotion
                      ? { opacity: 1, y: 0 }
                      : {
                          opacity: 1,
                          y: 0,
                          transition: {
                            opacity: {
                              duration: SEARCH_DISSOLVE_DURATION,
                              ease: 'easeOut',
                            },
                            y: {
                              delay: SEARCH_DISSOLVE_DURATION * 0.35,
                              duration: SEARCH_SLIDE_DURATION,
                              ease: SEARCH_EASE_OUT_BOUNCE,
                            },
                          },
                        }
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: c.surface,
                    borderRadius: 14,
                    padding: '12px 14px',
                    border: `1px solid ${BRAND}30`,
                    boxShadow: c.shadowSm,
                  }}
                >
                  <MagnifyingGlass size={18} weight="light" color={BRAND} aria-hidden />
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
                      fontSize: 16,
                      color: c.text,
                      fontFamily: 'inherit',
                      minWidth: 0,
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleSearch}
                    aria-label="Close search"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    <X size={18} weight="light" color={c.textFaint} />
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="expenses-month-pill"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        opacity: {
                          duration: SEARCH_DISSOLVE_DURATION,
                          ease: 'easeOut',
                        },
                      }
                }
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  padding: '16px 20px 0',
                  boxSizing: 'border-box',
                }}
              >
                <ExpensesMonthPill
                  monthKey={selectedMonthKey}
                  onMonthChange={setSelectedMonthKey}
                  disabled={headerLocked}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {showListChromeFilters && (
            <motion.div
              key="expenses-filter-row"
              className="expenses-filter-row"
              initial={
                skipListFiltersEnterRef.current || reduceMotion
                  ? false
                  : { opacity: 0 }
              }
              animate={{
                opacity: headerLocked ? 0.42 : 1,
              }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, transition: searchDissolveTransition }
              }
              transition={listFiltersEnterTransition}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '14px 20px',
                boxSizing: 'border-box',
                filter: headerLocked ? 'grayscale(1)' : 'none',
                pointerEvents: headerLocked ? 'none' : 'auto',
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
                      disabled={headerLocked}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 9999,
                        border: 'none',
                        cursor: headerLocked ? 'default' : 'pointer',
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
                disabled={headerLocked}
                aria-label="Search expenses"
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
                  cursor: headerLocked ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  backgroundColor: headerLocked ? '#C8C8D2' : BRAND,
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
            </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            ref={scrollRef}
            data-app-scroll
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'none',
              paddingBottom: TAB_BAR_CLEARANCE,
              overflowAnchor: 'none',
            }}
          >
            {listIsEmpty ? (
              <div
                style={{
                  padding: '48px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
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
