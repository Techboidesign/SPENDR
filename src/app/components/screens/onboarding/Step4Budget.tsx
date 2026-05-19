import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { House, ForkKnife, Car, Lightning, ShoppingBag, FilmSlate, PiggyBank } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { FormInput, formFieldStyleCompact } from '../../shared/FormFields';
import OnboardingLayout from './OnboardingLayout';

const BUDGET_CATEGORIES = [
  { id: 'housing', label: 'Housing', suggested: 30, icon: House, iconBg: '#EDEDFF', iconColor: '#3E37FF' },
  { id: 'food', label: 'Food & Dining', suggested: 15, icon: ForkKnife, iconBg: '#F3EDFD', iconColor: '#8039E3' },
  { id: 'transportation', label: 'Transportation', suggested: 10, icon: Car, iconBg: '#F0FCF5', iconColor: '#1F8A4F' },
  { id: 'utilities', label: 'Utilities', suggested: 10, icon: Lightning, iconBg: '#E8E8EB', iconColor: '#0D0D17' },
  { id: 'shopping', label: 'Shopping', suggested: 10, icon: ShoppingBag, iconBg: '#F7F0FF', iconColor: '#A065FF' },
  { id: 'entertainment', label: 'Entertainment', suggested: 5, icon: FilmSlate, iconBg: '#EEEAFD', iconColor: '#4B13E8' },
  { id: 'savings', label: 'Savings', suggested: 20, icon: PiggyBank, iconBg: '#FEF5EC', iconColor: '#F7A54D' },
];

export default function Step4Budget() {
  const navigate = useNavigate();
  const { updateData, next, back, skip, skipAll, onboarding } = useOnboarding();

  const monthlyValue = onboarding.data.monthlyAmount?.value || 0;

  const [budget, setBudget] = useState(
    onboarding.data.monthlyBudget?.toString() || monthlyValue.toString()
  );
  const [allocations, setAllocations] = useState<Record<string, number>>(
    onboarding.data.budgetAllocations || {}
  );

  const budgetNum = parseFloat(budget) || 0;

  // Auto-calculate suggested allocations
  useEffect(() => {
    if (Object.keys(allocations).length === 0 && budgetNum > 0) {
      const suggested: Record<string, number> = {};
      BUDGET_CATEGORIES.forEach(cat => {
        suggested[cat.id] = Math.round((budgetNum * cat.suggested) / 100);
      });
      setAllocations(suggested);
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

  const handleSkipStep = () => {
    skip('budget');
    navigate('/onboarding/categories');
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
      currentStep={4}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={budgetNum <= 0}
      nextLabel="Continue"
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5, margin: '0 0 8px' }}>
        Set your budget
      </h1>

      {/* Monthly budget */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          Monthly budget
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            color: '#6B7280',
            fontWeight: 600,
          }}>
            $
          </span>
          <FormInput
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            style={{ paddingLeft: 32, fontSize: 16 }}
          />
        </div>
      </div>

      {/* Category allocations */}
      {budgetNum > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
              Suggested allocation
            </h2>
            <div style={{ fontSize: 12, color: remaining >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
              {remaining >= 0 ? `$${remaining} left` : `$${Math.abs(remaining)} over`}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BUDGET_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12, backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: cat.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={14} weight="light" color={cat.iconColor} />
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>
                    {cat.label}
                  </div>
                  <div style={{ position: 'relative', width: 80 }}>
                    <span style={{
                      position: 'absolute',
                      left: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 12,
                      color: '#6B7280',
                      fontWeight: 700,
                    }}>
                      $
                    </span>
                    <FormInput
                      type="number"
                      value={allocations[cat.id] || ''}
                      onChange={(e) => handleAllocationChange(cat.id, e.target.value)}
                      placeholder="0"
                      style={{
                        ...formFieldStyleCompact,
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
