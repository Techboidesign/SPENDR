import type { ReactNode } from 'react';
import { AUTH_THEME } from '../../theme/authTheme';

type AuthScreenShellProps = {
  children: ReactNode;
  /** Override shell background (welcome uses flat brand gradient). */
  background?: string;
};

/** Dark gradient shell for welcome / sign-up / log-in (logo lives in onboarding header only). */
export function AuthScreenShell({ children, background }: AuthScreenShellProps) {
  return (
    <div
      style={{
        height: '100%',
        minHeight: '100%',
        background: background ?? AUTH_THEME.bgGradient,
        color: AUTH_THEME.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
