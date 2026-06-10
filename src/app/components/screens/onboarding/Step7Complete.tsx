import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Sparkle, Wallet } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useApp } from '../../../context/AppContext';
import { CATEGORIES } from '../../../data/categories';
import type { CategoryIconKey } from '../../../data/categoryConfig';
import {
  OnboardingCategoryPreviewStrip,
  type CategoryStripItem,
} from '../../onboarding/OnboardingCategoryPreviewStrip';
import { getCurrencyIcon } from '../../../data/currencyConfig';
import { APP_PRIMARY } from '../../../theme/authTheme';
import { useOnboardingChrome } from '../../../context/OnboardingThemeContext';
import {
  onboardingHeroGradient,
  onboardingRowCard,
  onboardingSuccessColor,
} from '../../../theme/onboardingUi';
import { hexToRgba } from '../../../theme/onboardingDarkUi';
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
  const { theme, isLight } = useOnboardingChrome();
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

  const categoryStripItems = useMemo((): CategoryStripItem[] => {
    const builtIn: CategoryStripItem[] = selectedIds
      .map(id => {
        const cat = CATEGORIES.find(c => c.id === id);
        if (!cat) return null;
        return { kind: 'builtin' as const, id: cat.id, name: cat.name };
      })
      .filter((item): item is CategoryStripItem => item !== null);

    const custom: CategoryStripItem[] = customCats.map(cat => ({
      kind: 'custom' as const,
      id: cat.id,
      name: cat.name,
      iconKey: cat.iconKey as CategoryIconKey,
      color: cat.color,
      bg: cat.bg,
      iconColor: cat.iconColor,
    }));

    return [...builtIn, ...custom];
  }, [selectedIds, customCats]);

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

  const setupGridItems: ReactNode[] = [
    <OnboardingSummaryRow
      key="currency"
      compact
      icon={CurrencyIcon}
      accent="#3E37FF"
      iconLightBg="#EDEDFF"
      label="Currency"
      value={currency}
      detail={data.country ?? undefined}
    />,
  ];

  if (monthlyAmount && monthlyAmount.value > 0) {
    setupGridItems.push(
      <OnboardingSummaryRow
        key="income"
        compact
        icon={Wallet}
        accent="#10B981"
        iconLightBg="#D1FAE5"
        label="Monthly income"
        value={formatMoney(monthlyAmount.value, currency)}
      />,
    );
  }

  if (monthlyBudget != null && monthlyBudget > 0) {
    setupGridItems.push(
      <OnboardingSummaryRow
        key="budget"
        compact
        icon={Wallet}
        accent="#0D9488"
        iconLightBg="#CCFBF1"
        label="Monthly budget"
        value={formatMoney(monthlyBudget, currency)}
      />,
    );
  }

  const readyBadgeBg = isLight
    ? hexToRgba(onboardingSuccessColor, 0.14)
    : hexToRgba(onboardingSuccessColor, 0.22);
  const readyBadgeBorder = isLight
    ? hexToRgba(onboardingSuccessColor, 0.38)
    : hexToRgba(onboardingSuccessColor, 0.5);

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
      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          padding: '12px 14px',
          marginBottom: 14,
          overflow: 'hidden',
          border: `1px solid ${theme.surfaceBorder}`,
          background: onboardingHeroGradient(theme, isLight),
          boxShadow: isLight
            ? '0 4px 20px rgba(62, 55, 255, 0.12)'
            : `0 4px 20px ${hexToRgba(APP_PRIMARY, 0.28)}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <h1
            style={{
              ...titleStyle,
              margin: 0,
              fontSize: 20,
              lineHeight: 1.2,
              flex: 1,
              minWidth: 0,
            }}
          >
            You&apos;re all set, {firstName}!
          </h1>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 20,
              backgroundColor: readyBadgeBg,
              border: `1px solid ${readyBadgeBorder}`,
              flexShrink: 0,
            }}
          >
            <Sparkle size={11} color={onboardingSuccessColor} weight="fill" />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: onboardingSuccessColor,
                letterSpacing: 0.03,
                whiteSpace: 'nowrap',
              }}
            >
              Ready to go
            </span>
          </div>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: theme.textMuted,
            lineHeight: 1.4,
          }}
        >
          Add saving goals anytime under Budget when you&apos;re ready.
        </p>
      </div>

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
          gap: 8,
          marginBottom: 12,
        }}
      >
        {setupGridItems}

        {categoryCount > 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              ...onboardingRowCard(theme),
              padding: '10px 12px 11px',
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: theme.textMuted,
                  marginBottom: 2,
                }}
              >
                Categories
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>
                {categoryCount} selected
                {customCats.length > 0 ? (
                  <span style={{ fontWeight: 600, color: theme.textFaint }}>
                    {' '}
                    · {customCats.length} custom
                  </span>
                ) : null}
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: isLight ? '#F4F4F8' : hexToRgba(APP_PRIMARY, 0.08),
                border: `1px solid ${isLight ? '#EBEBF0' : theme.surfaceBorder}`,
              }}
            >
              <OnboardingCategoryPreviewStrip items={categoryStripItems} />
            </div>
          </div>
        ) : null}
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
