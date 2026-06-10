import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, ChartBar, Receipt, Target } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useOnboardingChrome } from '../../../context/OnboardingThemeContext';
import { OnboardingOptionIconChip } from '../../onboarding/OnboardingOptionIconChip';
import {
  onboardingSelectableCard,
  onboardingToggleThumb,
  onboardingToggleTrack,
} from '../../../theme/onboardingUi';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import OnboardingLayout, { useOnboardingTitleStyle } from './OnboardingLayout';

const NOTIFICATION_OPTIONS = [
  {
    id: 'budgetAlerts' as const,
    icon: ChartBar,
    accent: '#707BFF',
    label: 'Budget alerts',
    desc: 'Get notified when you are close to your limits',
  },
  {
    id: 'weeklySummary' as const,
    icon: Bell,
    accent: '#F7A54D',
    label: 'Weekly summary',
    desc: 'Review your spending every week',
  },
  {
    id: 'billReminders' as const,
    icon: Receipt,
    accent: '#2D7A26',
    label: 'Bill reminders',
    desc: 'Never miss a payment deadline',
  },
  {
    id: 'goalMilestones' as const,
    icon: Target,
    accent: '#A065FF',
    label: 'Goal milestones',
    desc: 'Celebrate your progress',
  },
];

export default function Step6Notifications() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();
  const { theme, isLight } = useOnboardingChrome();
  const titleStyle = useOnboardingTitleStyle();

  const [notifications, setNotifications] = useState({
    budgetAlerts: onboarding.data.notifications?.budgetAlerts ?? true,
    weeklySummary: onboarding.data.notifications?.weeklySummary ?? true,
    billReminders: onboarding.data.notifications?.billReminders ?? false,
    goalMilestones: onboarding.data.notifications?.goalMilestones ?? true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    updateData({ notifications });
    next('notifications');
    navigate('/onboarding/name-basics');
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/categories');
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextLabel="Continue"
    >
      <h1 style={titleStyle}>Stay on track</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {NOTIFICATION_OPTIONS.map(option => {
          const Icon = option.icon;
          const isEnabled = notifications[option.id];
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleNotification(option.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                ...onboardingSelectableCard(theme, isEnabled, isLight),
              }}
            >
              <OnboardingOptionIconChip icon={Icon} accentColor={option.accent} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>
                  {option.label}
                </div>
              </div>
              <div style={onboardingToggleTrack(theme, isEnabled)}>
                <div style={onboardingToggleThumb(theme, isEnabled)} />
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
