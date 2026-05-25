import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { AUTH_THEME } from '../../../theme/authTheme';
import { FormInput, FormSelect } from '../../shared/FormFields';
import OnboardingLayout, { onboardingLabelStyle, onboardingTitleStyle } from './OnboardingLayout';

export default function Step3MonthlyIncome() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();

  const [amountType, setAmountType] = useState<'income' | 'available_to_spend'>(
    onboarding.data.monthlyAmount?.type || 'income'
  );
  const [amount, setAmount] = useState(
    onboarding.data.monthlyAmount?.value?.toString() || ''
  );
  const [frequency, setFrequency] = useState<'monthly' | 'bi-weekly' | 'weekly' | 'irregular'>(
    onboarding.data.incomeFrequency || 'monthly'
  );

  const handleNext = () => {
    const value = parseFloat(amount);
    if (!isNaN(value) && value > 0) {
      updateData({
        monthlyAmount: { value, type: amountType },
        incomeFrequency: frequency,
      });
      next('monthly-income');
      navigate('/onboarding/budget');
    }
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/goal');
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  const isValid = amount.trim() !== '' && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={!isValid}
      nextLabel="Continue"
    >
      <h1 style={onboardingTitleStyle}>Let&apos;s talk money</h1>

      {/* Amount type toggle */}
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
              backgroundColor: amountType === 'available_to_spend' ? AUTH_THEME.surfaceSelected : AUTH_THEME.surface,
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

      {/* Amount input */}
      <div style={{ marginBottom: 16 }}>
        <label style={onboardingLabelStyle}>
          {amountType === 'income' ? 'Monthly income' : 'Amount available to spend'}
        </label>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
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
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            style={{ paddingLeft: 34, fontSize: 20 }}
          />
        </div>
      </div>

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
