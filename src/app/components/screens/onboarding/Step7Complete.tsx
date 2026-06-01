import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Sparkle, Wallet } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useApp } from '../../../context/AppContext';
import { CATEGORIES } from '../../../data/categories';
import type { CategoryIconKey } from '../../../data/categoryConfig';
import {
  OnboardingCategoryPreviewStrip,
  type CategoryStripItem,
} from '../../onboarding/OnboardingCategoryPreviewStrip';
import { getCurrencyIcon } from '../../../data/currencyConfig';
import { getPrimaryGoalDefinition, parsePrimaryGoal, resolveOnboardingGoalChoice } from '../../../data/primaryGoalConfig';
import { formatTargetDateShort } from '../../../data/primaryGoalTarget';
import { APP_PRIMARY } from '../../../theme/authTheme';
import { useOnboardingChrome } from '../../../context/OnboardingThemeContext';
import { onboardingHeroGradient, onboardingRowCard } from '../../../theme/onboardingUi';
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

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  'bi-weekly': 'Every two weeks',
  weekly: 'Weekly',
  irregular: 'Varies',
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
  const goal = getPrimaryGoalDefinition(
    parsePrimaryGoal(resolveOnboardingGoalChoice(data.primaryGoal ?? undefined)),
  );
  const goalTarget = data.primaryGoalTarget;
  const GoalIcon = goal.Icon;
  const CurrencyIcon = getCurrencyIcon(currency);

  const monthlyBudget = data.monthlyBudget;
  const monthlyAmount = data.monthlyAmount;
  const incomeFrequency = data.incomeFrequency;

  const selectedIds =
    data.selectedCategoryIds ??
    (data.selectedCategories
      ? data.selectedCategories
          .map(name => CATEGORIES.find(c => c.name === name)?.id)
          .filter((id): id is string => Boolean(id))
      : []);

  const customCats = data.customCategories ?? [];
  const categoryCount = selectedIds.length + customCats.length;

  const notificationCount = useMemo(() => {
    const n = data.notifications;
    if (!n) return 0;
    return [
      n.budgetAlerts,
      n.weeklySummary,
      n.billReminders,
      n.goalMilestones,
    ].filter(Boolean).length;
  }, [data.notifications]);

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
      key="goal"
      compact
      icon={GoalIcon}
      accent={goal.accentColor}
      label="Primary goal"
      value={goal.label}
      detail={
        goalTarget && goalTarget.targetAmount > 0
          ? `${goalTarget.name ? `${goalTarget.name} · ` : ''}${formatMoney(goalTarget.targetAmount, currency)} by ${formatTargetDateShort(goalTarget.targetDate)}`
          : undefined
      }
    />,
    <OnboardingSummaryRow
      key="currency"
      compact
      icon={CurrencyIcon}
      accent="#707BFF"
      label="Currency"
      value={currency}
      detail={data.country ?? undefined}
    />,
  ];

  if (monthlyBudget != null && monthlyBudget > 0) {
    setupGridItems.push(
      <OnboardingSummaryRow
        key="budget"
        compact
        icon={Wallet}
        accent="#5EEAD4"
        label="Monthly budget"
        value={formatMoney(monthlyBudget, currency)}
        detail={
          data.budgetAllocationMode === 'custom' ? 'Custom amounts' : 'Auto-balanced'
        }
      />,
    );
  } else if (monthlyAmount && monthlyAmount.value > 0) {
    setupGridItems.push(
      <OnboardingSummaryRow
        key="income"
        compact
        icon={Wallet}
        accent="#5EEAD4"
        label={monthlyAmount.type === 'income' ? 'Monthly income' : 'Available'}
        value={formatMoney(monthlyAmount.value, currency)}
        detail={incomeFrequency ? FREQUENCY_LABELS[incomeFrequency] : undefined}
      />,
    );
  }

  if (notificationCount > 0) {
    setupGridItems.push(
      <OnboardingSummaryRow
        key="notifications"
        compact
        icon={Bell}
        accent="#F7A54D"
        label="Notifications"
        value={`${notificationCount} on`}
        detail="Alerts enabled"
      />,
    );
  }

  return (
    <OnboardingLayout
      currentStep={8}
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
              backgroundColor: hexToRgba(APP_PRIMARY, isLight ? 0.1 : 0.28),
              border: `1px solid ${hexToRgba(APP_PRIMARY, isLight ? 0.22 : 0.4)}`,
              flexShrink: 0,
            }}
          >
            <Sparkle size={11} color={theme.accentMint} weight="fill" />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: theme.accentMint,
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
          {goal.label} — we&apos;ll tailor Spendr around this.
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

            <OnboardingCategoryPreviewStrip items={categoryStripItems} />
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
