import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { House, ForkKnife, Car, Lightning, ShoppingBag, FilmSlate, PiggyBank } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { AUTH_THEME } from '../../../theme/authTheme';
import {
  darkIconChip,
  onboardingDangerColor,
  onboardingRowCard,
  onboardingSuccessColor,
} from '../../../theme/onboardingDarkUi';
import { formatSliderAmountLabel } from '../../../utils/nonLinearAmountScale';
import { FormInput, FormSelect, formFieldStyleCompactDark } from '../../shared/FormFields';
import { IncomeBudgetWarning } from '../../onboarding/IncomeBudgetWarning';
import { OnboardingAmountField } from '../../onboarding/OnboardingAmountField';
import {
  GOAL_ONBOARDING_ALLOCATION_WEIGHTS,
  parsePrimaryGoal,
  resolveOnboardingGoalChoice,
} from '../../../data/primaryGoalConfig';
import {
  buildAllocationsFromWeights,
  rebalanceCategoryAllocation,
} from '../../../utils/budgetAllocation';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import { getCurrencySymbol } from '../../../utils/currencySymbol';
import OnboardingLayout, { onboardingLabelStyle, onboardingTitleStyle } from './OnboardingLayout';

const BUDGET_CATEGORIES = [
  { id: 'housing', label: 'Housing', suggested: 30, icon: House, accent: '#3E37FF' },
  { id: 'food', label: 'Food & Dining', suggested: 15, icon: ForkKnife, accent: '#8039E3' },
  { id: 'transportation', label: 'Transportation', suggested: 10, icon: Car, accent: '#1F8A4F' },
  { id: 'utilities', label: 'Utilities', suggested: 10, icon: Lightning, accent: '#4A4A58' },
  { id: 'shopping', label: 'Shopping', suggested: 10, icon: ShoppingBag, accent: '#A065FF' },
  { id: 'entertainment', label: 'Entertainment', suggested: 5, icon: FilmSlate, accent: '#4B13E8' },
  { id: 'savings', label: 'Savings', suggested: 20, icon: PiggyBank, accent: '#F7A54D' },
] as const;

type AllocationMode = 'automatic' | 'custom';

const ALLOCATION_MODE_OPTIONS: { value: AllocationMode; label: string }[] = [
  { value: 'automatic', label: 'Automatic allocation' },
  { value: 'custom', label: 'Custom allocation' },
];

export default function Step4Budget() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();

  const monthlyIncome = onboarding.data.monthlyAmount?.value ?? 0;

  const [budgetAmount, setBudgetAmount] = useState(() => {
    const saved = onboarding.data.monthlyBudget ?? monthlyIncome;
    if (monthlyIncome > 0) return Math.min(saved, monthlyIncome);
    return saved;
  });
  const [showOverIncomeWarning, setShowOverIncomeWarning] = useState(false);
  const [allocationMode, setAllocationMode] = useState<AllocationMode>(
    onboarding.data.budgetAllocationMode ?? 'automatic',
  );
  const [allocations, setAllocations] = useState<Record<string, number>>(
    onboarding.data.budgetAllocations || {},
  );

  const budgetNum = budgetAmount;
  const isAutomatic = allocationMode === 'automatic';
  const incomeCap = Math.max(0, monthlyIncome);
  const primaryGoal = parsePrimaryGoal(
    resolveOnboardingGoalChoice(onboarding.data.primaryGoal ?? undefined),
  );
  const goalAllocationWeights = GOAL_ONBOARDING_ALLOCATION_WEIGHTS[primaryGoal];

  // Keep budget in sync when income cap changes (e.g. user went back and edited income)
  useEffect(() => {
    if (incomeCap <= 0) return;
    setBudgetAmount(prev => {
      if (prev <= incomeCap) return prev;
      setShowOverIncomeWarning(true);
      return incomeCap;
    });
  }, [incomeCap]);

  const handleBudgetChange = (next: number) => {
    if (incomeCap > 0 && next > incomeCap) {
      setShowOverIncomeWarning(true);
      setBudgetAmount(incomeCap);
      return;
    }
    setShowOverIncomeWarning(false);
    setBudgetAmount(next);
  };

  const budgetHelperText =
    incomeCap > 0
      ? `Based on your monthly income — your budget can go up to ${formatSliderAmountLabel(incomeCap)}.`
      : undefined;

  // Automatic mode: keep suggested % splits in sync with monthly budget (goal-aware weights)
  useEffect(() => {
    if (!isAutomatic || budgetNum <= 0) return;
    const categoriesWithGoalWeights = BUDGET_CATEGORIES.map(cat => ({
      ...cat,
      suggested: goalAllocationWeights[cat.id] ?? cat.suggested,
    }));
    setAllocations(buildAllocationsFromWeights(budgetNum, categoriesWithGoalWeights));
  }, [budgetNum, isAutomatic, primaryGoal]);

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const remaining = Math.round(budgetNum - totalAllocated);

  const allocationStatus = useMemo(() => {
    if (isAutomatic) {
      return { label: 'Fully allocated', color: onboardingSuccessColor };
    }
    if (remaining === 0) {
      return { label: 'Fully allocated', color: onboardingSuccessColor };
    }
    if (remaining > 0) {
      return { label: `$${remaining} left`, color: AUTH_THEME.textMuted };
    }
    return { label: `$${Math.abs(remaining)} over`, color: onboardingDangerColor };
  }, [isAutomatic, remaining]);

  const handleModeChange = (mode: AllocationMode) => {
    setAllocationMode(mode);
    if (mode === 'automatic' && budgetNum > 0) {
      const categoriesWithGoalWeights = BUDGET_CATEGORIES.map(cat => ({
        ...cat,
        suggested: goalAllocationWeights[cat.id] ?? cat.suggested,
      }));
      setAllocations(buildAllocationsFromWeights(budgetNum, categoriesWithGoalWeights));
    }
  };

  const handleNext = () => {
    if (budgetNum > 0) {
      updateData({
        monthlyBudget: budgetNum,
        budgetAllocationMode: allocationMode,
        budgetAllocations: allocations,
      });
      next('budget');
      navigate('/onboarding/categories');
    }
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/monthly-income');
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  const handleAllocationChange = (categoryId: string, value: string) => {
    if (value !== '' && Number.isNaN(parseFloat(value))) return;
    const num = value === '' ? 0 : parseFloat(value);

    if (isAutomatic) {
      setAllocations(prev =>
        rebalanceCategoryAllocation(
          categoryId,
          num,
          budgetNum,
          BUDGET_CATEGORIES,
          prev,
        ),
      );
      return;
    }

    setAllocations(prev => ({ ...prev, [categoryId]: num }));
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={budgetNum <= 0 || (incomeCap > 0 && budgetNum > incomeCap)}
      nextLabel="Continue"
    >
      <h1 style={onboardingTitleStyle}>Set your budget</h1>

      <p
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          lineHeight: 1.5,
          color: AUTH_THEME.textMuted,
          fontWeight: 500,
        }}
      >
        Start with what you earn each month, then choose how much you want to plan to spend.
      </p>

      <OnboardingAmountField
        label="Monthly budget"
        value={budgetAmount}
        onChange={handleBudgetChange}
        maxAmount={incomeCap > 0 ? incomeCap : undefined}
        helperText={budgetHelperText}
        currencySymbol={getCurrencySymbol(onboarding.data.currency ?? 'USD')}
      />

      {showOverIncomeWarning && incomeCap > 0 ? (
        <IncomeBudgetWarning
          message={`Adjust your budget to ${formatSliderAmountLabel(incomeCap)} or less.`}
        />
      ) : null}

      {budgetNum > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            <h2
              className="font-figure"
              style={{
                ...onboardingLabelStyle,
                marginBottom: 0,
                color: allocationStatus.color,
              }}
            >
              {allocationStatus.label}
            </h2>
            <FormSelect
              tone="dark"
              value={allocationMode}
              onChange={(e) => handleModeChange(e.target.value as AllocationMode)}
              aria-label="Allocation mode"
              style={{
                ...formFieldStyleCompactDark,
                width: 'auto',
                minWidth: 168,
                height: 34,
                fontSize: 12,
                fontWeight: 600,
                paddingTop: 0,
                paddingBottom: 0,
                flexShrink: 0,
              }}
            >
              {ALLOCATION_MODE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BUDGET_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const chip = darkIconChip(cat.accent);
              return (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 8,
                    borderRadius: 12,
                    ...onboardingRowCard(),
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: chip.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} weight="light" color={chip.iconColor} />
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: AUTH_THEME.textPrimary }}>
                    {cat.label}
                  </div>
                  <div style={{ position: 'relative', width: 80 }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 12,
                        color: AUTH_THEME.textMuted,
                        fontWeight: 700,
                      }}
                    >
                      $
                    </span>
                    <FormInput
                      type="number"
                      tone="dark"
                      className="font-figure"
                      min={0}
                      max={isAutomatic ? budgetNum : undefined}
                      value={allocations[cat.id] ?? ''}
                      onChange={(e) => handleAllocationChange(cat.id, e.target.value)}
                      placeholder="0"
                      style={{
                        ...formFieldStyleCompactDark,
                        paddingLeft: 16,
                        paddingRight: 6,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
