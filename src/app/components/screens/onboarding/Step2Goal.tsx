import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PiggyBank, ChartBar, CreditCard, ShieldCheck, TrendUp, MagnifyingGlass } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { AUTH_THEME } from '../../../theme/authTheme';
import { darkIconChip, onboardingSelectableCard } from '../../../theme/onboardingDarkUi';
import OnboardingLayout, { onboardingTitleStyle } from './OnboardingLayout';

const GOALS = [
  { id: 'save' as const, icon: PiggyBank, accent: '#F7A54D', label: 'Save for a goal', desc: 'Build savings for something specific' },
  { id: 'track' as const, icon: ChartBar, accent: '#707BFF', label: 'Track my spending', desc: 'See where my money goes' },
  { id: 'debt' as const, icon: CreditCard, accent: '#EF4444', label: 'Pay off debt', desc: 'Get out of debt faster' },
  { id: 'emergency' as const, icon: ShieldCheck, accent: '#2D7A26', label: 'Build emergency fund', desc: 'Create financial safety net' },
  { id: 'invest' as const, icon: TrendUp, accent: '#3E37FF', label: 'Start investing', desc: 'Grow wealth over time' },
  { id: 'exploring' as const, icon: MagnifyingGlass, accent: '#8B8D9E', label: 'Just exploring', desc: 'Not sure yet' },
];

export default function Step2Goal() {
  const navigate = useNavigate();
  const { updateData, next, skipAll, onboarding } = useOnboarding();

  const [selectedGoal, setSelectedGoal] = useState<typeof GOALS[number]['id'] | null>(
    onboarding.data.primaryGoal || null,
  );

  const handleNext = () => {
    if (selectedGoal) {
      updateData({ primaryGoal: selectedGoal });
      next('goal');
      navigate('/onboarding/monthly-income');
    }
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/welcome');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={!selectedGoal}
    >
      <h1 style={onboardingTitleStyle}>What&apos;s your main goal?</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GOALS.map(goal => {
          const Icon = goal.icon;
          const selected = selectedGoal === goal.id;
          const chip = darkIconChip(goal.accent);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => setSelectedGoal(goal.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                ...onboardingSelectableCard(selected),
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: chip.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} weight="light" color={chip.iconColor} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: AUTH_THEME.textPrimary }}>
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
