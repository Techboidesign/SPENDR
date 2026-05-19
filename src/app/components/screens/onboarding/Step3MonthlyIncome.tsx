import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { FormInput, FormSelect } from '../../shared/FormFields';
import OnboardingLayout from './OnboardingLayout';

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
      currentStep={3}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={!isValid}
      nextLabel="Continue"
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', margin: '0 0 8px', letterSpacing: -0.5 }}>
        Let's talk money
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
        For accurate budget recommendations
      </p>

      {/* Amount type toggle */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          I want to enter my
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setAmountType('income')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 14,
              border: `2px solid ${amountType === 'income' ? '#3E37FF' : '#E5E7EB'}`,
              backgroundColor: amountType === 'income' ? '#F5F3FF' : '#FFFFFF',
              color: amountType === 'income' ? '#3E37FF' : '#6B7280',
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
            onClick={() => setAmountType('available_to_spend')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 14,
              border: `2px solid ${amountType === 'available_to_spend' ? '#3E37FF' : '#E5E7EB'}`,
              backgroundColor: amountType === 'available_to_spend' ? '#F5F3FF' : '#FFFFFF',
              color: amountType === 'available_to_spend' ? '#3E37FF' : '#6B7280',
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
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          {amountType === 'income' ? 'Monthly income' : 'Amount available to spend'}
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            color: '#6B7280',
            fontWeight: 700,
          }}>
            $
          </span>
          <FormInput
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Frequency */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          How often do you get paid?
        </label>
        <FormSelect
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as typeof frequency)}
          style={{ color: '#1A1A2E' }}
        >
          <option value="monthly">Monthly</option>
          <option value="bi-weekly">Bi-weekly</option>
          <option value="weekly">Weekly</option>
          <option value="irregular">Irregular</option>
        </FormSelect>
      </div>

      <div style={{
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#F5F3FF',
        border: '1px solid rgba(62,55,255,0.15)',
      }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
          💡 This information helps us create a realistic budget and provide personalized insights.
        </p>
      </div>
    </OnboardingLayout>
  );
}
