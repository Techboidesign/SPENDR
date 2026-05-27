import { WarningCircle } from '@phosphor-icons/react';
import { AUTH_THEME } from '../../theme/authTheme';
import { onboardingDangerColor } from '../../theme/onboardingDarkUi';

type IncomeBudgetWarningProps = {
  message: string;
};

export function IncomeBudgetWarning({ message }: IncomeBudgetWarningProps) {
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
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        border: `1px solid rgba(239, 68, 68, 0.35)`,
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
          color: AUTH_THEME.textPrimary,
        }}
      >
        <span style={{ color: onboardingDangerColor }}>You can&apos;t spend more than you earned.</span>{' '}
        <span style={{ color: AUTH_THEME.textMuted, fontWeight: 500 }}>{message}</span>
      </p>
    </div>
  );
}
