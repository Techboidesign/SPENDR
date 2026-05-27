import type { Icon } from '@phosphor-icons/react';
import type { CSSProperties, ReactNode } from 'react';
import { AUTH_THEME } from '../../theme/authTheme';
import { darkIconChip, onboardingRowCard } from '../../theme/onboardingDarkUi';

export function OnboardingSummaryRow({
  icon: IconComp,
  accent,
  label,
  value,
  detail,
  trailing,
  compact = false,
}: {
  icon: Icon;
  accent: string;
  label: string;
  value: ReactNode;
  detail?: string;
  trailing?: ReactNode;
  /** Tighter card for 2-column setup grid */
  compact?: boolean;
}) {
  const chip = darkIconChip(accent);
  const iconSize = compact ? 32 : 40;
  const glyphSize = compact ? 16 : 20;

  if (compact) {
    return (
      <div
        style={{
          ...onboardingRowCard(),
          padding: '10px 10px 9px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 8,
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: 9,
            background: chip.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComp size={glyphSize} weight="light" color={chip.iconColor} />
        </div>
        <div style={{ width: '100%', minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: AUTH_THEME.textMuted,
              letterSpacing: 0.02,
              marginBottom: 2,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: AUTH_THEME.textPrimary,
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
          {detail ? (
            <div
              style={{
                fontSize: 11,
                color: AUTH_THEME.textFaint,
                marginTop: 2,
                lineHeight: 1.3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {detail}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...onboardingRowCard(),
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 10,
          background: chip.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconComp size={glyphSize} weight="light" color={chip.iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: AUTH_THEME.textMuted,
            letterSpacing: 0.02,
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: AUTH_THEME.textPrimary,
            lineHeight: 1.25,
          }}
        >
          {value}
        </div>
        {detail ? (
          <div
            style={{
              fontSize: 12,
              color: AUTH_THEME.textFaint,
              marginTop: 3,
              lineHeight: 1.35,
            }}
          >
            {detail}
          </div>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

export function onboardingSectionLabelStyle(): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.08,
    textTransform: 'uppercase',
    color: AUTH_THEME.textFaint,
    margin: '0 0 6px 2px',
  };
}
