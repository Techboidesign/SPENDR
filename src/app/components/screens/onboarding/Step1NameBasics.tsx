import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { FormInput, FormSelect } from '../../shared/FormFields';
import { AUTH_THEME } from '../../../theme/authTheme';
import OnboardingLayout, { onboardingLabelStyle, onboardingTitleStyle } from './OnboardingLayout';

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
      currentStep={6}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
      nextDisabled={!firstName.trim()}
      nextLabel="Finish setup"
    >
      <h1 style={onboardingTitleStyle}>Almost there</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={onboardingLabelStyle}>What&apos;s your first name?</label>
        <FormInput
          type="text"
          tone="dark"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={onboardingLabelStyle}>Preferred currency</label>
        <FormSelect
          tone="dark"
          value={currency}
          onChange={e => setCurrency(e.target.value)}
        >
          {CURRENCIES.map(curr => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.name} ({curr.code})
            </option>
          ))}
        </FormSelect>
      </div>

      {/* Country (optional) */}
      <div style={{ marginBottom: 16 }}>
        <label style={onboardingLabelStyle}>
          Country <span style={{ color: AUTH_THEME.textFaint, fontWeight: 400 }}>(optional)</span>
        </label>
        <FormSelect
          tone="dark"
          value={country}
          onChange={e => setCountry(e.target.value)}
          style={{ color: country ? AUTH_THEME.textPrimary : AUTH_THEME.textFaint }}
        >
          <option value="">Select country</option>
          {COUNTRIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </FormSelect>
      </div>
    </OnboardingLayout>
  );
}
