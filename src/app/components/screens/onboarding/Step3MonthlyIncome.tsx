import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { AUTH_THEME } from '../../../theme/authTheme';
import { FormSelect } from '../../shared/FormFields';
import { OnboardingAmountField } from '../../onboarding/OnboardingAmountField';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import OnboardingLayout, { onboardingLabelStyle, onboardingTitleStyle } from './OnboardingLayout';

export default function Step3MonthlyIncome() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();

  const [amountType, setAmountType] = useState<'income' | 'available_to_spend'>(
    onboarding.data.monthlyAmount?.type || 'income',
  );
  const [amount, setAmount] = useState(onboarding.data.monthlyAmount?.value ?? 0);
  const [frequency, setFrequency] = useState<'monthly' | 'bi-weekly' | 'weekly' | 'irregular'>(
    onboarding.data.incomeFrequency || 'monthly',
  );

  const handleNext = () => {
    if (amount > 0) {
      updateData({
        monthlyAmount: { value: amount, type: amountType },
        incomeFrequency: frequency,
      });
      next('monthly-income');
      navigate('/onboarding/budget');
    }
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/goal-setup');
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={amount <= 0}
      nextLabel="Continue"
    >
      <h1 style={onboardingTitleStyle}>Let&apos;s talk money</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={onboardingLabelStyle}>I want to enter my</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setAmountType('income')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 14,
              border: `2px solid ${amountType === 'income' ? AUTH_THEME.accent : AUTH_THEME.surfaceBorder}`,
              backgroundColor: amountType === 'income' ? AUTH_THEME.surfaceSelected : AUTH_THEME.surface,
              color: amountType === 'income' ? AUTH_THEME.textPrimary : AUTH_THEME.textMuted,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            Monthly income
          </button>
          <button
            type="button"
            onClick={() => setAmountType('available_to_spend')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 14,
              border: `2px solid ${amountType === 'available_to_spend' ? AUTH_THEME.accent : AUTH_THEME.surfaceBorder}`,
              backgroundColor:
                amountType === 'available_to_spend' ? AUTH_THEME.surfaceSelected : AUTH_THEME.surface,
              color: amountType === 'available_to_spend' ? AUTH_THEME.textPrimary : AUTH_THEME.textMuted,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            Available to spend
          </button>
        </div>
      </div>

      <OnboardingAmountField
        label={amountType === 'income' ? 'Monthly income' : 'Amount available to spend'}
        value={amount}
        onChange={setAmount}
      />

      <div style={{ marginBottom: 16 }}>
        <label style={onboardingLabelStyle}>How often do you get paid?</label>
        <FormSelect
          tone="dark"
          value={frequency}
          onChange={e => setFrequency(e.target.value as typeof frequency)}
        >
          <option value="monthly">Monthly</option>
          <option value="bi-weekly">Bi-weekly</option>
          <option value="weekly">Weekly</option>
          <option value="irregular">Irregular</option>
        </FormSelect>
      </div>
    </OnboardingLayout>
  );
}
