import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useSearchParams } from 'react-router';
import {
  lockAppScrollElement,
  releaseAppScrollElement,
} from '../../hooks/useScrollLock';
import { useApp, getCategoryTotals, getMonthSpendingTotal } from '../../context/AppContext';
import { useAppColors } from '../../context/AppearanceContext';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { CURRENT_MONTH_KEY } from '../../utils/periods';
import type { HomeRange } from '../../utils/periods';
import { AddCustomCategoryButton } from '../settings/AddCustomCategoryButton';
import { SavingsGoalsEmptyState } from '../budget/SavingsGoalsEmptyState';
import { FeaturedBudgetCard } from '../budget/FeaturedBudgetCard';
import { SavingsGoalCard } from '../budget/SavingsGoalCard';
import { SavingsGoalEditModal } from '../budget/SavingsGoalEditModal';
import { BudgetEditModal, type BudgetEditTarget } from '../budget/BudgetEditModal';
import { BudgetInsightsPanel } from '../budget/BudgetInsightsPanel';
import { SectionTitle } from '../ui/SectionTitle';
import type { SavingsGoal } from '../../data/types';
import { isFocusCategoryId } from '../../data/focusCategory';
import { createSavingsGoal, pickRandomSavingsGoalAppearance } from '../../data/savingsGoals';
import { getCurrencySymbol } from '../../utils/currencySymbol';
import { getInsightsPeriodMonthKeys } from '../insights/insightsPeriod';
import { SLIDE_EASE } from '../../theme/motion';

type BudgetViewMode = 'goals' | 'insights';

const screenTitleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  fontFamily: 'inherit',
  lineHeight: 1.2,
  margin: 0,
};

const BUDGET_SLIDE_DURATION = 0.22;
const SLIDE_MS = Math.round(BUDGET_SLIDE_DURATION * 1000) + 8;

export default function BudgetScreen() {
  const c = useAppColors();
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, dispatch, formatCurrency } = useApp();
  const [editTarget, setEditTarget] = useState<BudgetEditTarget | null>(null);
  const [savingsGoalModal, setSavingsGoalModal] = useState<
    { mode: 'edit'; goal: SavingsGoal } | { mode: 'add'; draft: SavingsGoal } | null
  >(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const insightsExitTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [viewMode, setViewMode] = useState<BudgetViewMode>('goals');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsExiting, setInsightsExiting] = useState(false);
  const [insightsRange, setInsightsRange] = useState<HomeRange>('month');
  const [selectedMonthKey, setSelectedMonthKey] = useState(CURRENT_MONTH_KEY);

  const openEditTarget = useCallback((target: BudgetEditTarget) => {
    const el = scrollRef.current;
    if (el) lockAppScrollElement(el);
    setEditTarget(target);
  }, []);

  const closeEditTarget = useCallback(() => {
    setEditTarget(null);
  }, []);

  useLayoutEffect(() => {
    if (editTarget !== null) return;
    const el = scrollRef.current;
    if (el) releaseAppScrollElement(el);
  }, [editTarget]);

  useEffect(() => {
    if (searchParams.get('tab') === 'insights') {
      setViewMode('insights');
      setInsightsExiting(false);
      setInsightsOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const categoryTotals = useMemo(
    () => getCategoryTotals(state.expenses, CURRENT_MONTH_KEY),
    [state.expenses],
  );

  const totalSpent = useMemo(
    () =>
      Object.entries(categoryTotals).reduce(
        (s, [id, v]) => (isFocusCategoryId(id) ? s : s + v),
        0,
      ),
    [categoryTotals],
  );

  const insightsPeriodKeys = useMemo(
    () => getInsightsPeriodMonthKeys(insightsRange, selectedMonthKey),
    [insightsRange, selectedMonthKey],
  );

  const insightsPeriodTotal = useMemo(
    () =>
      insightsPeriodKeys.reduce(
        (sum, key) => sum + getMonthSpendingTotal(state.expenses, key),
        0,
      ),
    [state.expenses, insightsPeriodKeys],
  );

  const budgetPct = state.monthlyBudget > 0 ? (totalSpent / state.monthlyBudget) * 100 : 0;
  const incomeUsedPct = state.income > 0 ? (totalSpent / state.income) * 100 : 0;

  const modalAmount =
    editTarget?.kind === 'income'
      ? state.income
      : state.monthlyBudget;

  const currencySymbol = getCurrencySymbol(state.currency);

  const handleSavingsGoalSave = (goal: SavingsGoal) => {
    if (!savingsGoalModal) return;
    if (savingsGoalModal.mode === 'add') {
      dispatch({ type: 'ADD_SAVINGS_GOAL', goal });
    } else {
      dispatch({ type: 'UPDATE_SAVINGS_GOAL', goal });
    }
    setSavingsGoalModal(null);
  };

  const openAddSavingsGoal = () => {
    setSavingsGoalModal({
      mode: 'add',
      draft: createSavingsGoal({ name: '', ...pickRandomSavingsGoalAppearance() }),
    });
  };

  const handleSave = (amount: number) => {
    if (!editTarget) return;
    if (editTarget.kind === 'income') dispatch({ type: 'SET_INCOME', amount });
    else dispatch({ type: 'SET_BUDGET', amount });
  };

  const budgetStatus =
    budgetPct > 100
      ? "You're over your monthly budget limit."
      : budgetPct >= 85
        ? "You're close to your budget limit — watch discretionary spending."
        : undefined;

  const incomeStatus =
    incomeUsedPct > 100
      ? 'Spending exceeds your monthly income.'
      : incomeUsedPct >= 90
        ? "You've used most of your income this month."
        : undefined;

  const slideTransition = reduceMotion
    ? { duration: 0 }
    : { duration: BUDGET_SLIDE_DURATION, ease: SLIDE_EASE };

  const setView = useCallback(
    (mode: BudgetViewMode) => {
      setViewMode(mode);
      if (insightsExitTimerRef.current) {
        clearTimeout(insightsExitTimerRef.current);
        insightsExitTimerRef.current = undefined;
      }

      if (mode === 'insights') {
        setInsightsExiting(false);
        setInsightsOpen(true);
        return;
      }

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

  useEffect(
    () => () => {
      if (insightsExitTimerRef.current) clearTimeout(insightsExitTimerRef.current);
    },
    [],
  );

  const insightsVisible = insightsOpen || insightsExiting;

  const tabSwipeRef = useRef({ x: 0, y: 0, tracking: false });
  const tabSwipeConsumedRef = useRef(false);
  const TAB_SWIPE_THRESHOLD = 44;

  const handleTabStripPointerDown = useCallback((e: React.PointerEvent) => {
    tabSwipeConsumedRef.current = false;
    tabSwipeRef.current = { x: e.clientX, y: e.clientY, tracking: true };
  }, []);

  const handleTabStripPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = tabSwipeRef.current;
      if (!start.tracking) return;
      start.tracking = false;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) < TAB_SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;

      tabSwipeConsumedRef.current = true;
      if (dx < 0 && viewMode === 'goals') setView('insights');
      else if (dx > 0 && viewMode === 'insights') setView('goals');
    },
    [setView, viewMode],
  );

  const handleTabClick = useCallback(
    (mode: BudgetViewMode) => {
      if (tabSwipeConsumedRef.current) {
        tabSwipeConsumedRef.current = false;
        return;
      }
      setView(mode);
    },
    [setView],
  );

  const tabWheelLockRef = useRef(false);

  const handleTabStripWheel = useCallback(
    (e: React.WheelEvent) => {
      if (tabWheelLockRef.current) return;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaX) < 12) return;

      e.preventDefault();
      tabWheelLockRef.current = true;
      window.setTimeout(() => {
        tabWheelLockRef.current = false;
      }, 350);

      if (e.deltaX > 0 && viewMode === 'goals') setView('insights');
      else if (e.deltaX < 0 && viewMode === 'insights') setView('goals');
    },
    [setView, viewMode],
  );

  return (
    <>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: c.canvas,
          position: 'relative',
        }}
      >
        <header
          style={{
            flexShrink: 0,
            backgroundColor: c.surface,
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div
            onPointerDown={handleTabStripPointerDown}
            onPointerUp={handleTabStripPointerUp}
            onPointerCancel={handleTabStripPointerUp}
            onWheel={handleTabStripWheel}
            style={{
              padding: '20px 20px 0',
              touchAction: 'none',
            }}
          >
            <div role="tablist" aria-label="Budget view" style={{ display: 'flex' }}>
              {([
                { mode: 'goals' as const, label: 'Goals', ariaLabel: 'Goals and budgets' },
                { mode: 'insights' as const, label: 'Insights', ariaLabel: 'Spending insights' },
              ]).map(({ mode, label, ariaLabel }) => {
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    onClick={() => handleTabClick(mode)}
                    aria-label={ariaLabel}
                    aria-selected={isActive}
                    style={{
                      ...screenTitleStyle,
                      flex: 1,
                      padding: '0 0 14px',
                      marginBottom: -1,
                      border: 'none',
                      background: 'none',
                      borderBottom: `1px solid ${isActive ? c.text : 'transparent'}`,
                      cursor: 'pointer',
                      color: isActive ? c.text : c.textFaint,
                      transition: 'color 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
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
            position: 'relative',
            backgroundColor: c.canvas,
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
                zIndex: 0,
                pointerEvents: insightsVisible ? 'none' : 'auto',
              }}
            >
              <div
                ref={scrollRef}
                data-app-scroll
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  overscrollBehavior: 'none',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  backgroundColor: c.canvas,
                  paddingBottom: TAB_BAR_CLEARANCE,
                }}
              >
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <FeaturedBudgetCard
                    layout="compact"
                    title="Monthly income"
                    icon={{ iconKey: 'wallet' }}
                    spent={totalSpent}
                    limit={state.income}
                    accentColor="#10B981"
                    accentBg="#D1FAE5"
                    formatCurrency={formatCurrency}
                    statusMessage={incomeStatus}
                    onClick={() => openEditTarget({ kind: 'income' })}
                    animationDelay={0}
                  />

                  <FeaturedBudgetCard
                    layout="compact"
                    title="Monthly budget"
                    icon={{ phosphorIcon: 'target' }}
                    spent={totalSpent}
                    limit={state.monthlyBudget}
                    accentColor="#F59E0B"
                    accentBg="#FEF3C7"
                    formatCurrency={formatCurrency}
                    statusMessage={budgetStatus}
                    onClick={() => openEditTarget({ kind: 'budget' })}
                    animationDelay={80}
                  />

                  <div>
                    <SectionTitle>Saving goals</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {state.savingsGoals.length === 0 ? (
                        <SavingsGoalsEmptyState onAdd={openAddSavingsGoal} />
                      ) : (
                        <>
                          {state.savingsGoals.map((goal, index) => (
                            <SavingsGoalCard
                              key={goal.id}
                              goal={goal}
                              formatCurrency={formatCurrency}
                              animationDelay={160 + index * 55}
                              onEdit={() => setSavingsGoalModal({ mode: 'edit', goal })}
                            />
                          ))}
                          <AddCustomCategoryButton
                            variant="row"
                            label="Add goal"
                            onClick={openAddSavingsGoal}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {insightsOpen && (
              <motion.div
                key="budget-insights-panel"
                initial={reduceMotion ? false : { x: '100%' }}
                animate={{ x: insightsExiting ? '100%' : 0 }}
                transition={slideTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  overflowY: 'auto',
                  paddingBottom: TAB_BAR_CLEARANCE,
                  willChange: 'transform',
                  backgroundColor: c.canvas,
                }}
              >
                <div style={{ padding: '0 20px 12px' }}>
                  <BudgetInsightsPanel
                    range={insightsRange}
                    selectedMonthKey={selectedMonthKey}
                    onRangeChange={setInsightsRange}
                    onMonthChange={setSelectedMonthKey}
                    periodTotal={insightsPeriodTotal}
                    income={state.income}
                    monthlyBudget={state.monthlyBudget}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <BudgetEditModal
        open={editTarget !== null}
        target={editTarget}
        initialAmount={modalAmount}
        formatCurrency={formatCurrency}
        currencySymbol={currencySymbol}
        scrollLockRef={scrollRef}
        onSave={handleSave}
        onClose={closeEditTarget}
      />

      <SavingsGoalEditModal
        open={savingsGoalModal !== null}
        goal={
          savingsGoalModal?.mode === 'edit'
            ? savingsGoalModal.goal
            : savingsGoalModal?.draft ?? null
        }
        currencySymbol={currencySymbol}
        scrollLockRef={scrollRef}
        isNew={savingsGoalModal?.mode === 'add'}
        onSave={handleSavingsGoalSave}
        onDelete={
          savingsGoalModal?.mode === 'edit'
            ? () => {
                dispatch({ type: 'DELETE_SAVINGS_GOAL', id: savingsGoalModal.goal.id });
                setSavingsGoalModal(null);
              }
            : undefined
        }
        onClose={() => setSavingsGoalModal(null)}
      />
    </>
  );
}
