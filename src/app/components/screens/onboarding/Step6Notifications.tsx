import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, ChartBar, Receipt, Target } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import OnboardingLayout from './OnboardingLayout';

const NOTIFICATION_OPTIONS = [
  {
    id: 'budgetAlerts' as const,
    icon: ChartBar,
    iconBg: '#F0F1FF',
    iconColor: '#707BFF',
    label: 'Budget alerts',
    desc: 'Get notified when you are close to your limits',
  },
  {
    id: 'weeklySummary' as const,
    icon: Bell,
    iconBg: '#FEF5EC',
    iconColor: '#F7A54D',
    label: 'Weekly summary',
    desc: 'Review your spending every week',
  },
  {
    id: 'billReminders' as const,
    icon: Receipt,
    iconBg: '#EEFAEC',
    iconColor: '#2D7A26',
    label: 'Bill reminders',
    desc: 'Never miss a payment deadline',
  },
  {
    id: 'goalMilestones' as const,
    icon: Target,
    iconBg: '#F7F0FF',
    iconColor: '#A065FF',
    label: 'Goal milestones',
    desc: 'Celebrate your progress',
  },
];

export default function Step6Notifications() {
  const navigate = useNavigate();
  const { updateData, next, back, skip, skipAll, onboarding } = useOnboarding();

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
    navigate('/onboarding/complete');
  };

  const handleSkipStep = () => {
    skip('notifications');
    navigate('/onboarding/complete');
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
      currentStep={6}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextLabel="Continue"
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5, margin: '0 0 8px' }}>
        Stay on track
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
        Choose notifications you'd like
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {NOTIFICATION_OPTIONS.map(option => {
          const Icon = option.icon;
          const isEnabled = notifications[option.id];
          return (
            <button
              key={option.id}
              onClick={() => toggleNotification(option.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                border: `2px solid ${isEnabled ? '#3E37FF' : '#E5E7EB'}`,
                backgroundColor: isEnabled ? '#F5F3FF' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s ease',
                boxShadow: isEnabled ? '0 2px 12px rgba(62,55,255,0.18)' : 'none',
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: option.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={16} color={option.iconColor} weight="light" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>
                  {option.label}
                </div>
              </div>
              <div style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                backgroundColor: isEnabled ? '#3E37FF' : '#E5E7EB',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  position: 'absolute',
                  top: 2,
                  left: isEnabled ? 22 : 2,
                  transition: 'left 0.2s ease',
                }} />
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
