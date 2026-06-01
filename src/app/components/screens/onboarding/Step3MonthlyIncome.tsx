import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useOnboardingChrome } from '../../../context/OnboardingThemeContext';
import { FormSelect } from '../../shared/FormFields';
import { OnboardingAmountField } from '../../onboarding/OnboardingAmountField';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import { getCurrencySymbol } from '../../../utils/currencySymbol';
import { onboardingSelectableCard } from '../../../theme/onboardingUi';
import OnboardingLayout, { useOnboardingLabelStyle, useOnboardingTitleStyle } from './OnboardingLayout';

export default function Step3MonthlyIncome() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();
  const { theme, isLight } = useOnboardingChrome();
  const titleStyle = useOnboardingTitleStyle();
  const labelStyle = useOnboardingLabelStyle();

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

  const typeButtonStyle = (active: boolean) => ({
    flex: 1,
    padding: '12px',
    borderRadius: 14,
    color: active ? theme.textPrimary : theme.textMuted,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    ...onboardingSelectableCard(theme, active, isLight),
  });

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
      <h1 style={titleStyle}>Let&apos;s talk money</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>I want to enter my</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setAmountType('income')} style={typeButtonStyle(amountType === 'income')}>
            Monthly income
          </button>
          <button
            type="button"
            onClick={() => setAmountType('available_to_spend')}
            style={typeButtonStyle(amountType === 'available_to_spend')}
          >
            Available to spend
          </button>
        </div>
      </div>

      <OnboardingAmountField
        label={amountType === 'income' ? 'Monthly income' : 'Amount available to spend'}
        value={amount}
        onChange={setAmount}
        currencySymbol={getCurrencySymbol(onboarding.data.currency ?? 'USD')}
      />

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>How often do you get paid?</label>
        <FormSelect
          tone="light"
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
