import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { OnboardingGoalChoice } from '../../../data/types';
import { ONBOARDING_GOAL_CHOICES } from '../../../data/primaryGoalConfig';
import { AUTH_THEME } from '../../../theme/authTheme';
import { darkIconChip, onboardingSelectableCard } from '../../../theme/onboardingDarkUi';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import OnboardingLayout, { onboardingTitleStyle } from './OnboardingLayout';

export default function Step2Goal() {
  const navigate = useNavigate();
  const { updateData, next, skipAll, onboarding } = useOnboarding();

  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoalChoice | null>(
    (onboarding.data.primaryGoal as OnboardingGoalChoice | undefined) ?? null,
  );

  const handleNext = () => {
    if (selectedGoal) {
      updateData({ primaryGoal: selectedGoal });
      next('goal');
      navigate('/onboarding/goal-setup');
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
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={!selectedGoal}
    >
      <h1 style={onboardingTitleStyle}>What&apos;s your main goal?</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ONBOARDING_GOAL_CHOICES.map(goal => {
          const Icon = goal.Icon;
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
