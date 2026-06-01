import { WarningCircle } from '@phosphor-icons/react';
import { useOnboardingTheme } from '../../context/OnboardingThemeContext';
import { onboardingDangerColor } from '../../theme/onboardingUi';

type IncomeBudgetWarningProps = {
  message: string;
};

export function IncomeBudgetWarning({ message }: IncomeBudgetWarningProps) {
  const theme = useOnboardingTheme();

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: -4,
        marginBottom: 16,
        padding: '12px 14px',
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.28)',
      }}
    >
      <WarningCircle
        size={20}
        weight="fill"
        color={onboardingDangerColor}
        style={{ flexShrink: 0, marginTop: 1 }}
      />
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.45,
          fontWeight: 600,
          color: theme.textPrimary,
        }}
      >
        <span style={{ color: onboardingDangerColor }}>You can&apos;t spend more than you earned.</span>{' '}
        <span style={{ color: theme.textMuted, fontWeight: 500 }}>{message}</span>
      </p>
    </div>
  );
}
