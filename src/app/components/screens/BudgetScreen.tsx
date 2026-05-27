import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp, getCategoryTotals } from '../../context/AppContext';
import { useAppColors } from '../../context/AppearanceContext';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { CURRENT_MONTH_KEY } from '../../utils/periods';
import { FeaturedBudgetCard } from '../budget/FeaturedBudgetCard';
import { CategoryBudgetCard } from '../budget/CategoryBudgetCard';
import { PrimaryGoalFocusCard } from '../budget/PrimaryGoalFocusCard';
import { BudgetEditModal, type BudgetEditTarget } from '../budget/BudgetEditModal';
import { SectionTitle } from '../ui/SectionTitle';
import {
  getFocusCategoryId,
  getPrimaryGoalDefinition,
  parsePrimaryGoal,
  sortCategoriesForPrimaryGoal,
} from '../../data/primaryGoalConfig';
import { computePrimaryGoalProgress } from '../../utils/primaryGoalProgress';

export default function BudgetScreen() {
  const c = useAppColors();
  const { state, dispatch, formatCurrency, categories } = useApp();
  const [editTarget, setEditTarget] = useState<BudgetEditTarget | null>(null);

  const goalId = parsePrimaryGoal(state.primaryGoal ?? undefined);
  const goalDef = getPrimaryGoalDefinition(goalId);

  const categoryTotals = useMemo(
    () => getCategoryTotals(state.expenses, CURRENT_MONTH_KEY),
    [state.expenses],
  );

  const totalSpent = useMemo(
    () => Object.values(categoryTotals).reduce((s, v) => s + v, 0),
    [categoryTotals],
  );

  const budgetPct = state.monthlyBudget > 0 ? (totalSpent / state.monthlyBudget) * 100 : 0;
  const incomeUsedPct = state.income > 0 ? (totalSpent / state.income) * 100 : 0;

  const modalAmount =
    editTarget?.kind === 'income'
      ? state.income
      : editTarget?.kind === 'budget'
        ? state.monthlyBudget
        : editTarget?.kind === 'category'
          ? (state.budgetGoals.find(g => g.categoryId === editTarget.categoryId)?.amount ?? 0)
          : 0;

  const currencySymbol =
    state.currency === 'EUR'
      ? '€'
      : state.currency === 'GBP'
        ? '£'
        : state.currency === 'USD'
          ? '$'
          : state.currency;

  const categoryIds = useMemo(() => categories.map(cat => cat.id), [categories]);

  const sortedCategories = useMemo(
    () => sortCategoriesForPrimaryGoal(categories, goalId, categoryTotals),
    [categories, goalId, categoryTotals],
  );

  const focusCategoryId = useMemo(
    () => getFocusCategoryId(goalId, categoryIds),
    [goalId, categoryIds],
  );

  const goalProgress = useMemo(
    () =>
      computePrimaryGoalProgress({
        goalId,
        income: state.income,
        monthlyBudget: state.monthlyBudget,
        totalSpent,
        categoryTotals,
        budgetGoals: state.budgetGoals,
        categoryIds,
      }),
    [
      goalId,
      state.income,
      state.monthlyBudget,
      totalSpent,
      categoryTotals,
      state.budgetGoals,
      categoryIds,
    ],
  );

  const hasCategoriesWithoutBudget = useMemo(
    () =>
      state.monthlyBudget > 0 &&
      categoryIds.some(id => {
        const goal = state.budgetGoals.find(g => g.categoryId === id);
        return !goal || goal.amount <= 0;
      }),
    [state.monthlyBudget, state.budgetGoals, categoryIds],
  );

  const didAutoFillCategories = useRef(false);

  useEffect(() => {
    if (!hasCategoriesWithoutBudget || didAutoFillCategories.current) return;
    if (state.monthlyBudget < categoryIds.length) return;
    didAutoFillCategories.current = true;
    dispatch({
      type: 'SET_BUDGET',
      amount: state.monthlyBudget,
      categoryIds,
    });
  }, [hasCategoriesWithoutBudget, state.monthlyBudget, categoryIds, dispatch]);

  const handleSave = (amount: number) => {
    if (!editTarget) return;
    if (editTarget.kind === 'income') dispatch({ type: 'SET_INCOME', amount });
    else if (editTarget.kind === 'budget') {
      dispatch({ type: 'SET_BUDGET', amount, categoryIds });
    } else dispatch({ type: 'SET_CATEGORY_BUDGET', categoryId: editTarget.categoryId, amount });
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

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          backgroundColor: c.canvas,
          paddingBottom: TAB_BAR_CLEARANCE,
        }}
      >
        <div
          style={{
            backgroundColor: c.surface,
            padding: '20px 20px 16px',
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0 }}>Budget & Goals</h1>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PrimaryGoalFocusCard
            goal={goalDef}
            progress={goalProgress}
            animationDelay={0}
          />

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
            onClick={() => setEditTarget({ kind: 'income' })}
            animationDelay={120}
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
            subtitle={goalDef.budgetCardHint}
            statusMessage={budgetStatus}
            onClick={() => setEditTarget({ kind: 'budget' })}
            animationDelay={240}
          />

          <div style={{ paddingTop: 4 }}>
            <SectionTitle>{goalDef.categoriesSectionTitle}</SectionTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedCategories.map((cat, index) => {
                const goal = state.budgetGoals.find(g => g.categoryId === cat.id);
                const spent = categoryTotals[cat.id] ?? 0;
                return (
                  <CategoryBudgetCard
                    key={cat.id}
                    categoryId={cat.id}
                    spent={spent}
                    budgeted={goal?.amount ?? 0}
                    formatCurrency={formatCurrency}
                    showFocusBadge={cat.id === focusCategoryId}
                    animationDelay={400 + index * 55}
                    onClick={() =>
                      setEditTarget({
                        kind: 'category',
                        categoryId: cat.id,
                        categoryName: cat.name,
                      })
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <BudgetEditModal
        open={editTarget !== null}
        target={editTarget}
        initialAmount={modalAmount}
        formatCurrency={formatCurrency}
        currencySymbol={currencySymbol}
        onSave={handleSave}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}
