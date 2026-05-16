import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { Input } from '../../ui/input';
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
        <Input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter your name"
          style={{ width: '100%', height: 50, fontSize: 15 }}
        />
      </div>

      {/* Currency */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          Preferred currency
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{
            width: '100%',
            height: 50,
            fontSize: 15,
            paddingLeft: 14,
            paddingRight: 48,
            borderRadius: 14,
            border: '2px solid #3E37FF',
            backgroundColor: '#FFFFFF',
            color: '#1A1A2E',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {CURRENCIES.map(curr => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.name} ({curr.code})
            </option>
          ))}
        </select>
      </div>

      {/* Country (optional) */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
          Country <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
        </label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{
            width: '100%',
            height: 50,
            fontSize: 15,
            paddingLeft: 14,
            paddingRight: 48,
            borderRadius: 14,
            border: '2px solid #3E37FF',
            backgroundColor: '#FFFFFF',
            color: country ? '#1A1A2E' : '#9CA3AF',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <option value="">Select country</option>
          {COUNTRIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </OnboardingLayout>
  );
}
