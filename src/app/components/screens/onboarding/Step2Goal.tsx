import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PiggyBank, ChartBar, CreditCard, ShieldCheck, TrendUp, MagnifyingGlass } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import OnboardingLayout from './OnboardingLayout';

const GOALS = [
  { id: 'save' as const, icon: PiggyBank, iconBg: '#FEF5EC', iconColor: '#F7A54D', label: 'Save for a goal', desc: 'Build savings for something specific' },
  { id: 'track' as const, icon: ChartBar, iconBg: '#F0F1FF', iconColor: '#707BFF', label: 'Track my spending', desc: 'See where my money goes' },
  { id: 'debt' as const, icon: CreditCard, iconBg: '#FEE2E2', iconColor: '#EF4444', label: 'Pay off debt', desc: 'Get out of debt faster' },
  { id: 'emergency' as const, icon: ShieldCheck, iconBg: '#EEFAEC', iconColor: '#2D7A26', label: 'Build emergency fund', desc: 'Create financial safety net' },
  { id: 'invest' as const, icon: TrendUp, iconBg: '#EDEDFF', iconColor: '#3E37FF', label: 'Start investing', desc: 'Grow wealth over time' },
  { id: 'exploring' as const, icon: MagnifyingGlass, iconBg: '#F2F2F5', iconColor: '#8B8D9E', label: 'Just exploring', desc: 'Not sure yet' },
];

export default function Step2Goal() {
  const navigate = useNavigate();
  const { updateData, next, back, skip, skipAll, onboarding } = useOnboarding();

  const [selectedGoal, setSelectedGoal] = useState<typeof GOALS[number]['id'] | null>(
    onboarding.data.primaryGoal || null
  );

  const handleNext = () => {
    if (selectedGoal) {
      updateData({ primaryGoal: selectedGoal });
      next('goal');
      navigate('/onboarding/monthly-income');
    }
  };

  const handleSkipStep = () => {
    skip('goal');
    navigate('/onboarding/monthly-income');
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/name-basics');
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={!selectedGoal}
      nextLabel="Continue"
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', margin: '0 0 8px', letterSpacing: -0.5 }}>
        What's your main goal?
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
        This helps us tailor insights for you
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GOALS.map(goal => {
          const Icon = goal.icon;
          return (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                border: `2px solid ${selectedGoal === goal.id ? '#3E37FF' : '#E5E7EB'}`,
                backgroundColor: selectedGoal === goal.id ? '#F5F3FF' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s ease',
                boxShadow: selectedGoal === goal.id ? '0 2px 12px rgba(62,55,255,0.18)' : 'none',
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: goal.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} weight="light" color={goal.iconColor} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>
                  {goal.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
