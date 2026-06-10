import type { Icon } from '@phosphor-icons/react';
import type { CSSProperties, ReactNode } from 'react';
import { useOnboardingChrome } from '../../context/OnboardingThemeContext';
import type { OnboardingTheme } from '../../theme/onboardingTheme';
import { onboardingIconChip, onboardingRowCard } from '../../theme/onboardingUi';

export function OnboardingSummaryRow({
  icon: IconComp,
  accent,
  iconLightBg,
  label,
  value,
  detail,
  trailing,
  footer,
  compact = false,
}: {
  icon: Icon;
  accent: string;
  /** Solid pastel tile in light mode (improves contrast on white cards). */
  iconLightBg?: string;
  label: string;
  value: ReactNode;
  detail?: string;
  trailing?: ReactNode;
  /** Extra content below value (e.g. category icon strip) */
  footer?: ReactNode;
  /** Tighter tile for 2-column setup grid — no card chrome */
  compact?: boolean;
}) {
  const { theme, isLight } = useOnboardingChrome();
  const chip = isLight && iconLightBg
    ? { iconBg: iconLightBg, iconColor: accent }
    : onboardingIconChip(accent, isLight);
  const iconSize = compact ? 32 : 40;
  const glyphSize = compact ? 16 : 20;

  if (compact) {
    return (
      <div
        style={{
          ...onboardingRowCard(theme),
          padding: '10px 10px 9px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          minHeight: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: theme.textMuted,
            letterSpacing: 0.02,
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            minWidth: 0,
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
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              fontWeight: 700,
              color: theme.textPrimary,
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
        </div>
        {detail ? (
          <div
            style={{
              fontSize: 11,
              color: theme.textFaint,
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
        {footer ? <div style={{ width: '100%', minWidth: 0 }}>{footer}</div> : null}
      </div>
    );
  }

  return (
    <div
      style={{
        ...onboardingRowCard(theme),
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
            color: theme.textMuted,
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
            color: theme.textPrimary,
            lineHeight: 1.25,
          }}
        >
          {value}
        </div>
        {detail ? (
          <div
            style={{
              fontSize: 12,
              color: theme.textFaint,
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

export function onboardingSectionLabelStyle(theme: OnboardingTheme): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.08,
    textTransform: 'uppercase',
    color: theme.textFaint,
    margin: '0 0 6px 2px',
  };
}

export function useOnboardingSectionLabelStyle() {
  const { theme } = useOnboardingChrome();
  return onboardingSectionLabelStyle(theme);
}
