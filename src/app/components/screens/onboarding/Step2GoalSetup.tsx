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
import { OnboardingOptionIconChip } from '../../onboarding/OnboardingOptionIconChip';
import { onboardingSelectableCard } from '../../../theme/onboardingDarkUi';
import { isGoalSetupComplete, PrimaryGoalSetupForm } from '../../budget/PrimaryGoalSetupForm';
import { getCurrencySymbol } from '../../../utils/currencySymbol';
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

  const Icon = def.Icon;
  const currencySymbol = getCurrencySymbol(onboarding.data.currency ?? 'USD');

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
          ...onboardingSelectableCard(true),
        }}
      >
        <OnboardingOptionIconChip icon={Icon} accentColor={def.accentColor} />
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
          currencySymbol={currencySymbol}
        />
      ) : null}
    </OnboardingLayout>
  );
}
