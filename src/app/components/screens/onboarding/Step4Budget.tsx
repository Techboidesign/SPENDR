import { useState, useEffect } from 'react';
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
import { FormInput, formFieldStyleCompactDark } from '../../shared/FormFields';
import { distributeAmountByWeights } from '../../../utils/budgetAllocation';
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

function buildSuggestedAllocations(
  budget: number,
  categories: ReadonlyArray<{ id: string; suggested: number }>,
): Record<string, number> {
  const weights = Object.fromEntries(categories.map(cat => [cat.id, cat.suggested]));
  return distributeAmountByWeights(budget, weights);
}

export default function Step4Budget() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();

  const monthlyValue = onboarding.data.monthlyAmount?.value || 0;

  const [budget, setBudget] = useState(
    onboarding.data.monthlyBudget?.toString() || monthlyValue.toString()
  );
  const [allocations, setAllocations] = useState<Record<string, number>>(
    onboarding.data.budgetAllocations || {}
  );

  const budgetNum = parseFloat(budget) || 0;

  useEffect(() => {
    if (Object.keys(allocations).length === 0 && budgetNum > 0) {
      setAllocations(buildSuggestedAllocations(budgetNum, BUDGET_CATEGORIES));
    }
  }, [budgetNum]);

  const handleNext = () => {
    if (budgetNum > 0) {
      updateData({
        monthlyBudget: budgetNum,
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
    const num = parseFloat(value) || 0;
    setAllocations(prev => ({ ...prev, [categoryId]: num }));
  };

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const remaining = budgetNum - totalAllocated;

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={budgetNum <= 0}
      nextLabel="Continue"
    >
      <h1 style={onboardingTitleStyle}>Set your budget</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={onboardingLabelStyle}>Monthly budget</label>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: AUTH_THEME.textMuted,
              fontWeight: 600,
            }}
          >
            $
          </span>
          <FormInput
            type="number"
            tone="dark"
            className="font-figure"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            style={{ paddingLeft: 32, fontSize: 20 }}
          />
        </div>
      </div>

      {budgetNum > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ ...onboardingLabelStyle, marginBottom: 0 }}>Suggested allocation</h2>
            <div
              className="font-figure"
              style={{
                fontSize: 12,
                color: remaining >= 0 ? onboardingSuccessColor : onboardingDangerColor,
              }}
            >
              {remaining >= 0 ? `$${remaining} left` : `$${Math.abs(remaining)} over`}
            </div>
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
                      value={allocations[cat.id] || ''}
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
