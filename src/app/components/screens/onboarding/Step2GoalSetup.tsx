import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { OnboardingGoalChoice } from '../../../data/types';
import {
  getPrimaryGoalDefinition,
  resolveOnboardingGoalChoice,
} from '../../../data/primaryGoalConfig';
import {
  createEmptyPrimaryGoalTarget,
  goalRequiresTargetSetup,
} from '../../../data/primaryGoalTarget';
import type { PrimaryGoalTarget } from '../../../data/primaryGoalTarget';
import { AUTH_THEME } from '../../../theme/authTheme';
import { darkIconChip } from '../../../theme/onboardingDarkUi';
import { isGoalSetupComplete, PrimaryGoalSetupForm } from '../../budget/PrimaryGoalSetupForm';
import OnboardingLayout, { onboardingTitleStyle } from './OnboardingLayout';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';

export default function Step2GoalSetup() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();

  const choice = (onboarding.data.primaryGoal ?? 'track') as OnboardingGoalChoice;
  const resolvedId = resolveOnboardingGoalChoice(choice);
  const def = getPrimaryGoalDefinition(resolvedId);
  const needsTarget = goalRequiresTargetSetup(resolvedId);
  const isExploring = choice === 'exploring';

  const [target, setTarget] = useState<PrimaryGoalTarget>(
    () => onboarding.data.primaryGoalTarget ?? createEmptyPrimaryGoalTarget(),
  );

  const chip = darkIconChip(def.accentColor);
  const Icon = def.Icon;

  const canContinue = useMemo(
    () => isGoalSetupComplete(resolvedId, target),
    [resolvedId, target],
  );

  const handleNext = () => {
    updateData({
      primaryGoal: resolvedId,
      primaryGoalTarget: needsTarget ? target : null,
    });
    next('goal-setup');
    navigate('/onboarding/monthly-income');
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/goal');
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  const title = isExploring
    ? 'Start by tracking spending'
    : needsTarget
      ? 'Set your target'
      : 'You\'re set to track';

  const subtitle = isExploring
    ? 'Just exploring works like Track my spending — you can add a savings or debt goal anytime in Budget & Goals.'
    : needsTarget
      ? `Tell us how much and when so we can measure progress on "${def.label.toLowerCase()}".`
      : 'We\'ll organize your budget around where your money goes.';

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={!canContinue}
      nextLabel="Continue"
    >
      <h1 style={onboardingTitleStyle}>{title}</h1>
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 13,
          color: AUTH_THEME.textMuted,
          lineHeight: 1.45,
        }}
      >
        {subtitle}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 14,
          marginBottom: 16,
          border: `2px solid ${AUTH_THEME.surfaceBorder}`,
          backgroundColor: AUTH_THEME.surfaceSelected,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: chip.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} weight="light" color={chip.iconColor} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: AUTH_THEME.textMuted }}>Your focus</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: AUTH_THEME.textPrimary }}>
            {isExploring ? 'Track my spending' : def.label}
          </div>
        </div>
      </div>

      {needsTarget ? (
        <PrimaryGoalSetupForm
          goalId={resolvedId}
          target={target}
          onTargetChange={setTarget}
          variant="onboarding"
        />
      ) : null}
    </OnboardingLayout>
  );
}
