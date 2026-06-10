import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useOnboardingChrome } from '../../../context/OnboardingThemeContext';
import { formatSliderAmountLabel } from '../../../utils/nonLinearAmountScale';
import { IncomeBudgetWarning } from '../../onboarding/IncomeBudgetWarning';
import { OnboardingAmountField } from '../../onboarding/OnboardingAmountField';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import { getCurrencySymbol } from '../../../utils/currencySymbol';
import OnboardingLayout, { useOnboardingTitleStyle } from './OnboardingLayout';

export default function Step4Budget() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();
  const { theme } = useOnboardingChrome();
  const titleStyle = useOnboardingTitleStyle();

  const monthlyIncome = onboarding.data.monthlyAmount?.value ?? 0;

  const [budgetAmount, setBudgetAmount] = useState(() => {
    const saved = onboarding.data.monthlyBudget ?? monthlyIncome;
    if (monthlyIncome > 0) return Math.min(saved, monthlyIncome);
    return saved;
  });
  const [showOverIncomeWarning, setShowOverIncomeWarning] = useState(false);

  const budgetNum = budgetAmount;
  const incomeCap = Math.max(0, monthlyIncome);

  useEffect(() => {
    if (incomeCap <= 0) return;
    setBudgetAmount(prev => {
      if (prev <= incomeCap) return prev;
      setShowOverIncomeWarning(true);
      return incomeCap;
    });
  }, [incomeCap]);

  const handleBudgetChange = (nextAmount: number) => {
    if (incomeCap > 0 && nextAmount > incomeCap) {
      setShowOverIncomeWarning(true);
      setBudgetAmount(incomeCap);
      return;
    }
    setShowOverIncomeWarning(false);
    setBudgetAmount(nextAmount);
  };

  const budgetHelperText =
    incomeCap > 0
      ? `Based on your monthly income — your budget can go up to ${formatSliderAmountLabel(incomeCap)}.`
      : undefined;

  const handleNext = () => {
    if (budgetNum > 0) {
      updateData({ monthlyBudget: budgetNum });
      next('budget');
      navigate('/onboarding/categories');
    }
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/monthly-income');
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextDisabled={budgetNum <= 0 || (incomeCap > 0 && budgetNum > incomeCap)}
      nextLabel="Continue"
    >
      <h1 style={titleStyle}>Set your budget</h1>

      <p
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          lineHeight: 1.5,
          color: theme.textMuted,
          fontWeight: 500,
        }}
      >
        Choose how much you want to plan to spend each month. You can set named savings goals later.
      </p>

      <OnboardingAmountField
        label="Monthly budget"
        value={budgetAmount}
        onChange={handleBudgetChange}
        maxAmount={incomeCap > 0 ? incomeCap : undefined}
        helperText={budgetHelperText}
        currencySymbol={getCurrencySymbol(onboarding.data.currency ?? 'USD')}
      />

      {showOverIncomeWarning && incomeCap > 0 ? (
        <IncomeBudgetWarning
          message={`Adjust your budget to ${formatSliderAmountLabel(incomeCap)} or less.`}
        />
      ) : null}
    </OnboardingLayout>
  );
}
