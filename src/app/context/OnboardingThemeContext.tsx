import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  ONBOARDING_THEMES,
  type OnboardingTheme,
  type OnboardingThemeMode,
} from '../theme/onboardingTheme';

type OnboardingThemeContextValue = {
  mode: OnboardingThemeMode;
  theme: OnboardingTheme;
  isLight: boolean;
};

const OnboardingThemeContext = createContext<OnboardingThemeContextValue | null>(null);

/** Onboarding defaults to light; splash / welcome stay on their own dark art direction. */
export function OnboardingThemeProvider({
  children,
  mode = 'light',
}: {
  children: ReactNode;
  mode?: OnboardingThemeMode;
}) {
  const value = useMemo((): OnboardingThemeContextValue => {
    const theme = ONBOARDING_THEMES[mode];
    return { mode, theme, isLight: mode === 'light' };
  }, [mode]);

  return (
    <OnboardingThemeContext.Provider value={value}>{children}</OnboardingThemeContext.Provider>
  );
}

export function useOnboardingChrome(): OnboardingThemeContextValue {
  const ctx = useContext(OnboardingThemeContext);
  if (!ctx) {
    throw new Error('useOnboardingChrome must be used within OnboardingThemeProvider');
  }
  return ctx;
}

export function useOnboardingTheme(): OnboardingTheme {
  return useOnboardingChrome().theme;
}

/** Safe outside onboarding routes (e.g. goal form in app modals). */
export function useOnboardingChromeOptional(): OnboardingThemeContextValue | null {
  return useContext(OnboardingThemeContext);
}
