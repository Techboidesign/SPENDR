import { createBrowserRouter, Outlet, Navigate, useLocation } from 'react-router';
import { useApp } from './context/AppContext';
import { OnboardingProvider, useOnboarding, getOnboardingRoute } from './context/OnboardingContext';
import { OnboardingThemeProvider } from './context/OnboardingThemeContext';
import { SpendrLoadingSplash } from './components/ui/SpendrLoadingSplash';
import RootLayout from './components/RootLayout';
import SubPageLayout from './components/SubPageLayout';
import PhoneFrameLayout from './components/PhoneFrameLayout';
import HomeScreen from './components/screens/HomeScreen';
import ExpensesScreen from './components/screens/ExpensesScreen';
import BudgetScreen from './components/screens/BudgetScreen';
import InsightsScreen from './components/screens/InsightsScreen';
import UserProfileScreen from './components/screens/UserProfileScreen';
import HelpScreen from './components/screens/HelpScreen';
import PrivacyScreen from './components/screens/PrivacyScreen';

// Auth screens
import WelcomeScreen from './components/screens/auth/WelcomeScreen';
import SignUpScreen from './components/screens/auth/SignUpScreen';
import LogInScreen from './components/screens/auth/LogInScreen';
import ForgotPasswordScreen from './components/screens/auth/ForgotPasswordScreen';
import AuthCallbackScreen from './components/screens/auth/AuthCallbackScreen';

// Onboarding screens
import Step1NameBasics from './components/screens/onboarding/Step1NameBasics';
import Step3MonthlyIncome from './components/screens/onboarding/Step3MonthlyIncome';
import Step4Budget from './components/screens/onboarding/Step4Budget';
import Step5Categories from './components/screens/onboarding/Step5Categories';
import Step6Notifications from './components/screens/onboarding/Step6Notifications';
import Step7Complete from './components/screens/onboarding/Step7Complete';

/** Pathless layout route — provides OnboardingProvider (+ AppProvider) to the entire router tree */
function ProvidersLayout() {
  return (
    <OnboardingProvider>
      <AuthLoadingGate>
        <Outlet />
      </AuthLoadingGate>
    </OnboardingProvider>
  );
}

function AuthLoadingGate({ children }: { children: React.ReactNode }) {
  const { authLoading } = useOnboarding();
  if (authLoading) {
    return <SpendrLoadingSplash />;
  }
  return <>{children}</>;
}

/** Auth guard — redirects unauthenticated users to welcome/login */
function AuthGuard() {
  const { auth, onboarding, onboardingLoading } = useOnboarding();
  const { isDataLoading } = useApp();

  if (!auth.isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  if (isDataLoading || onboardingLoading) {
    return <SpendrLoadingSplash message="Syncing your data…" />;
  }

  if (onboarding.status === 'in_progress' && onboarding.lastStepId) {
    return <Navigate to={`/onboarding/${onboarding.lastStepId}`} replace />;
  }

  if (onboarding.status === 'not_started') {
    return <Navigate to="/onboarding/monthly-income" replace />;
  }

  return <Outlet />;
}

function OnboardingFlowLayout() {
  return (
    <OnboardingThemeProvider mode="light">
      <Outlet />
    </OnboardingThemeProvider>
  );
}

/** Onboarding requires a signed-in account */
function OnboardingAuthGuard() {
  const { auth, authLoading } = useOnboarding();

  if (authLoading) {
    return <SpendrLoadingSplash />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
}

/** Redirect signed-in users away from welcome/login/signup (not /auth/callback). */
function GuestAuthGuard() {
  const { auth, authLoading, onboarding, onboardingLoading } = useOnboarding();
  const { pathname } = useLocation();
  const isAuthCallback = pathname === '/auth/callback';

  if (authLoading || (auth.isAuthenticated && onboardingLoading && !isAuthCallback)) {
    return <SpendrLoadingSplash />;
  }

  if (auth.isAuthenticated && !isAuthCallback) {
    return <Navigate to={getOnboardingRoute(auth, onboarding)} replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    Component: ProvidersLayout,
    children: [
      // Public auth routes (guests only)
      {
        Component: GuestAuthGuard,
        children: [
          {
            Component: PhoneFrameLayout,
            children: [
              { path: '/welcome', Component: WelcomeScreen },
              { path: '/signup', Component: SignUpScreen },
              { path: '/login', Component: LogInScreen },
              { path: '/auth/callback', Component: AuthCallbackScreen },
              { path: '/forgot-password', Component: ForgotPasswordScreen },
            ],
          },
        ],
      },

      // Onboarding routes (require auth)
      {
        path: '/onboarding',
        Component: OnboardingAuthGuard,
        children: [
          {
            Component: OnboardingFlowLayout,
            children: [
              {
                Component: PhoneFrameLayout,
                children: [
          { path: 'name-basics', Component: Step1NameBasics },
          { path: 'goal', element: <Navigate to="/onboarding/monthly-income" replace /> },
          { path: 'goal-setup', element: <Navigate to="/onboarding/monthly-income" replace /> },
          { path: 'monthly-income', Component: Step3MonthlyIncome },
          { path: 'budget', Component: Step4Budget },
          { path: 'categories', Component: Step5Categories },
          { path: 'notifications', Component: Step6Notifications },
          { path: 'savings-goals', element: <Navigate to="/onboarding/complete" replace /> },
          { path: 'complete', Component: Step7Complete },
                ],
              },
            ],
          },
        ],
      },

      // Protected main app routes
      {
        Component: AuthGuard,
        children: [
          {
            path: '/',
            Component: RootLayout,
            children: [
              { index: true, Component: HomeScreen },
              { path: 'expenses', Component: ExpensesScreen },
              { path: 'insights', Component: InsightsScreen },
              { path: 'budget', Component: BudgetScreen },
            ],
          },
          {
            path: '/settings',
            Component: SubPageLayout,
            children: [
              { path: 'profile', Component: UserProfileScreen },
              { path: 'help', Component: HelpScreen },
              { path: 'privacy', Component: PrivacyScreen },
            ],
          },
        ],
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
