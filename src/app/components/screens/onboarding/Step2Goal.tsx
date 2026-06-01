import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useOnboardingChrome } from '../../../context/OnboardingThemeContext';
import type { OnboardingGoalChoice } from '../../../data/types';
import { ONBOARDING_GOAL_CHOICES } from '../../../data/primaryGoalConfig';
import { OnboardingOptionIconChip } from '../../onboarding/OnboardingOptionIconChip';
import { onboardingSelectableCard } from '../../../theme/onboardingUi';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import OnboardingLayout, { useOnboardingTitleStyle } from './OnboardingLayout';

export default function Step2Goal() {
  const navigate = useNavigate();
  const { updateData, next, skipAll, onboarding } = useOnboarding();
  const { theme, isLight } = useOnboardingChrome();
  const titleStyle = useOnboardingTitleStyle();

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
      <h1 style={titleStyle}>What&apos;s your main goal?</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ONBOARDING_GOAL_CHOICES.map(goal => {
          const Icon = goal.Icon;
          const selected = selectedGoal === goal.id;
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
                ...onboardingSelectableCard(theme, selected, isLight),
              }}
            >
              <OnboardingOptionIconChip icon={Icon} accentColor={goal.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>
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
