import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useOnboardingTheme } from '../../../context/OnboardingThemeContext';
import { FormInput, FormSelect } from '../../shared/FormFields';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import OnboardingLayout, { useOnboardingLabelStyle, useOnboardingTitleStyle } from './OnboardingLayout';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Japan',
  'Other',
];

export default function Step1NameBasics() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();
  const theme = useOnboardingTheme();
  const titleStyle = useOnboardingTitleStyle();
  const labelStyle = useOnboardingLabelStyle();

  const [firstName, setFirstName] = useState(onboarding.data.firstName || '');
  const [currency, setCurrency] = useState(onboarding.data.currency || 'USD');
  const [country, setCountry] = useState(onboarding.data.country || '');

  const handleNext = () => {
    updateData({ firstName, currency, country });
    next('name-basics');
    navigate('/onboarding/complete');
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/notifications');
  };

  const handleSkip = () => {
    skipAll();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={7}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
      nextDisabled={!firstName.trim()}
      nextLabel="Finish setup"
    >
      <h1 style={titleStyle}>Almost there</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>What&apos;s your first name?</label>
        <FormInput
          type="text"
          tone="light"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Preferred currency</label>
        <FormSelect tone="light" value={currency} onChange={e => setCurrency(e.target.value)}>
          {CURRENCIES.map(curr => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.name} ({curr.code})
            </option>
          ))}
        </FormSelect>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Country <span style={{ color: theme.textFaint, fontWeight: 400 }}>(optional)</span>
        </label>
        <FormSelect
          tone="light"
          value={country}
          onChange={e => setCountry(e.target.value)}
          style={{ color: country ? theme.textPrimary : theme.textFaint }}
        >
          <option value="">Select country</option>
          {COUNTRIES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </FormSelect>
      </div>
    </OnboardingLayout>
  );
}
