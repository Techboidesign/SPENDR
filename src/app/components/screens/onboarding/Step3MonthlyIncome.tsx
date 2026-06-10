import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { OnboardingAmountField } from '../../onboarding/OnboardingAmountField';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import { getCurrencySymbol } from '../../../utils/currencySymbol';
import OnboardingLayout, { useOnboardingTitleStyle } from './OnboardingLayout';

export default function Step3MonthlyIncome() {
  const navigate = useNavigate();
  const { updateData, next, skipAll, onboarding } = useOnboarding();
  const titleStyle = useOnboardingTitleStyle();

  const [amount, setAmount] = useState(onboarding.data.monthlyAmount?.value ?? 0);

  const handleNext = () => {
    if (amount > 0) {
      updateData({
        monthlyAmount: { value: amount, type: 'income' },
        incomeFrequency: 'monthly',
      });
      next('monthly-income');
      navigate('/onboarding/budget');
    }
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      showBack={false}
      onSkip={handleSkipAll}
      nextDisabled={amount <= 0}
      nextLabel="Continue"
    >
      <h1 style={titleStyle}>Monthly income</h1>

      <OnboardingAmountField
        label="How much do you earn per month?"
        value={amount}
        onChange={setAmount}
        currencySymbol={getCurrencySymbol(onboarding.data.currency ?? 'USD')}
      />
    </OnboardingLayout>
  );
}
