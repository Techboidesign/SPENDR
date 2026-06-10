import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ChartPieSlice, SquaresFour, Wallet } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useApp } from '../../../context/AppContext';
import { CATEGORIES } from '../../../data/categories';
import { getCurrencyIcon } from '../../../data/currencyConfig';
import { APP_PRIMARY } from '../../../theme/authTheme';
import { useOnboardingChrome } from '../../../context/OnboardingThemeContext';
import { onboardingRowCard } from '../../../theme/onboardingUi';
import {
  OnboardingSummaryRow,
  useOnboardingSectionLabelStyle,
} from '../../onboarding/OnboardingSummaryRow';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import OnboardingLayout, { useOnboardingTitleStyle } from './OnboardingLayout';
import { formatErrorMessage } from '../../../utils/formatError';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';
  return `${sym}${amount.toLocaleString()}`;
}

export default function Step7Complete() {
  const navigate = useNavigate();
  const { back, onboarding, complete } = useOnboarding();
  const { completeOnboardingAndSync } = useApp();
  const { theme } = useOnboardingChrome();
  const titleStyle = useOnboardingTitleStyle();
  const sectionLabelStyle = useOnboardingSectionLabelStyle();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const data = onboarding.data;
  const firstName = data.firstName || 'there';
  const currency = data.currency || 'USD';
  const CurrencyIcon = getCurrencyIcon(currency);

  const monthlyBudget = data.monthlyBudget;
  const monthlyAmount = data.monthlyAmount;

  const selectedIds =
    data.selectedCategoryIds ??
    (data.selectedCategories
      ? data.selectedCategories
          .map(name => CATEGORIES.find(c => c.name === name)?.id)
          .filter((id): id is string => Boolean(id))
      : []);

  const customCats = data.customCategories ?? [];
  const categoryCount = selectedIds.length + customCats.length;

  const handleBack = () => {
    back();
    navigate('/onboarding/name-basics');
  };

  const handleLaunch = async () => {
    setLoading(true);
    setError('');
    try {
      await completeOnboardingAndSync();
      complete();
      navigate('/');
    } catch (err) {
      console.error('Onboarding complete failed:', err);
      setError(formatErrorMessage(err, 'Could not save your setup. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const incomeValue =
    monthlyAmount && monthlyAmount.value > 0
      ? formatMoney(monthlyAmount.value, currency)
      : 'Not set';

  const budgetValue =
    monthlyBudget != null && monthlyBudget > 0
      ? formatMoney(monthlyBudget, currency)
      : 'Not set';

  const categoryValue =
    categoryCount > 0
      ? `${categoryCount} selected${customCats.length > 0 ? ` · ${customCats.length} custom` : ''}`
      : 'None selected';

  const setupGridItems: ReactNode[] = [
    <OnboardingSummaryRow
      key="currency"
      compact
      icon={CurrencyIcon}
      accent="#3E37FF"
      iconLightBg="#EDEDFF"
      label="Currency"
      value={currency}
    />,
    <OnboardingSummaryRow
      key="income"
      compact
      icon={Wallet}
      accent="#10B981"
      iconLightBg="#D1FAE5"
      label="Monthly income"
      value={incomeValue}
    />,
    <OnboardingSummaryRow
      key="budget"
      compact
      icon={ChartPieSlice}
      accent="#0D9488"
      iconLightBg="#CCFBF1"
      label="Monthly budget"
      value={budgetValue}
    />,
    <OnboardingSummaryRow
      key="categories"
      compact
      icon={SquaresFour}
      accent="#8B5CF6"
      iconLightBg="#EDE9FE"
      label="Categories"
      value={categoryValue}
    />,
  ];

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleLaunch}
      onBack={handleBack}
      nextLabel={loading ? 'Saving…' : 'Launch Spendr'}
      nextDisabled={loading}
      showSkip={false}
    >
      <h1
        style={{
          ...titleStyle,
          margin: '0 0 14px',
        }}
      >
        You&apos;re all set, {firstName}!
      </h1>

      {error ? (
        <div
          role="alert"
          style={{
            ...onboardingRowCard(theme),
            padding: '8px 12px',
            marginBottom: 12,
            borderColor: 'rgba(252, 165, 165, 0.45)',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#FCA5A5', lineHeight: 1.4 }}>{error}</p>
        </div>
      ) : null}

      <p style={sectionLabelStyle}>Your setup</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px 12px',
          marginBottom: 12,
        }}
      >
        {setupGridItems}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: theme.textFaint,
          textAlign: 'center',
          lineHeight: 1.45,
          paddingBottom: 2,
        }}
      >
        You can change any of this later in{' '}
        <span style={{ color: APP_PRIMARY, fontWeight: 600 }}>Settings</span>
      </p>
    </OnboardingLayout>
  );
}
