import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import type { NotificationBannerVariant } from '../../services/notificationAlerts';
import { useAppColors } from '../../context/AppearanceContext';
import type { AppColorPalette } from '../../theme/appColors';

function variantPalette(
  c: AppColorPalette,
  variant: NotificationBannerVariant,
): { bg: string; border: string; accent: string } {
  switch (variant) {
    case 'warning':
      return {
        bg: c.notificationWarningBg,
        border: c.notificationWarningBorder,
        accent: c.warning,
      };
    case 'success':
      return {
        bg: c.notificationSuccessBg,
        border: c.notificationSuccessBorder,
        accent: c.success,
      };
    default:
      return {
        bg: c.notificationInfoBg,
        border: c.notificationInfoBorder,
        accent: c.accent,
      };
  }
}

export const NOTIFICATION_BANNER_DURATION_MS = 5000;

export interface NotificationBannerProps {
  title: string;
  message: string;
  variant?: NotificationBannerVariant;
  onDismiss: () => void;
  durationMs?: number;
}

export function NotificationBanner({
  title,
  message,
  variant = 'info',
  onDismiss,
  durationMs = NOTIFICATION_BANNER_DURATION_MS,
}: NotificationBannerProps) {
  const c = useAppColors();
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const palette = variantPalette(c, variant);

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(enterFrame);
  }, []);

  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = window.setTimeout(() => dismiss(), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, title, message]);

  const dismiss = () => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(onDismiss, 280);
  };

  const visible = entered && !exiting;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        width: '100%',
        pointerEvents: 'auto',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        transition:
          'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 16px',
          borderRadius: 0,
          backgroundColor: palette.bg,
          borderBottom: `1px solid ${palette.border}`,
          boxShadow: 'none',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 3,
            alignSelf: 'stretch',
            borderRadius: 0,
            backgroundColor: palette.accent,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: c.text,
              marginBottom: 2,
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.45 }}>{message}</div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notification"
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            border: 'none',
            background: c.surfaceElevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: -2,
          }}
        >
          <X size={14} color={c.textMuted} weight="bold" />
        </button>
      </div>
    </div>
  );
}
