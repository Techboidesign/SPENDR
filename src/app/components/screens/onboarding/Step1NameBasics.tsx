import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { FormInput, FormSelect } from '../../shared/FormFields';
import OnboardingLayout from './OnboardingLayout';

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
  const { updateData, next, skipAll, onboarding } = useOnboarding();

  const [firstName, setFirstName] = useState(onboarding.data.firstName || '');
  const [currency, setCurrency] = useState(onboarding.data.currency || 'USD');
  const [country, setCountry] = useState(onboarding.data.country || '');

  const handleNext = () => {
    updateData({ firstName, currency, country });
    next('name-basics');
    navigate('/onboarding/goal');
  };

  const handleSkip = () => {
    skipAll();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={7}
      onNext={handleNext}
      onSkip={handleSkip}
      nextDisabled={!firstName.trim()}
      showBack={false}
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', margin: '0 0 8px', letterSpacing: -0.5 }}>
        Let's get started
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
        Help us personalize your experience
      </p>

      {/* First Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          What's your first name?
        </label>
        <FormInput
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      {/* Currency */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          Preferred currency
        </label>
        <FormSelect
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{ color: '#1A1A2E' }}
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
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          Country <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
        </label>
        <FormSelect
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{ color: country ? '#1A1A2E' : '#9CA3AF' }}
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
