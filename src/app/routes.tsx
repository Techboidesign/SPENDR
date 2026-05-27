import { createBrowserRouter, Outlet, Navigate, useLocation } from 'react-router';
import { useApp } from './context/AppContext';
import { OnboardingProvider, useOnboarding, getOnboardingRoute } from './context/OnboardingContext';
import { AppearanceProvider, useAppColors } from './context/AppearanceContext';
import RootLayout from './components/RootLayout';
import SubPageLayout from './components/SubPageLayout';
import PhoneFrameLayout from './components/PhoneFrameLayout';
import HomeScreen from './components/screens/HomeScreen';
import ExpensesScreen from './components/screens/ExpensesScreen';
import BudgetScreen from './components/screens/BudgetScreen';
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
import Step2Goal from './components/screens/onboarding/Step2Goal';
import Step2GoalSetup from './components/screens/onboarding/Step2GoalSetup';
import Step3MonthlyIncome from './components/screens/onboarding/Step3MonthlyIncome';
import Step4Budget from './components/screens/onboarding/Step4Budget';
import Step5Categories from './components/screens/onboarding/Step5Categories';
import Step6Notifications from './components/screens/onboarding/Step6Notifications';
import Step7Complete from './components/screens/onboarding/Step7Complete';

/** Pathless layout route — provides OnboardingProvider (+ AppProvider) to the entire router tree */
function ProvidersLayout() {
  return (
    <OnboardingProvider>
      <AppearanceProvider>
        <AuthLoadingGate>
          <Outlet />
        </AuthLoadingGate>
      </AppearanceProvider>
    </OnboardingProvider>
  );
}

function AuthLoadingGate({ children }: { children: React.ReactNode }) {
  const { authLoading } = useOnboarding();
  const c = useAppColors();
  if (authLoading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.canvas,
          color: c.textMuted,
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}

/** Auth guard — redirects unauthenticated users to welcome/login */
function AuthGuard() {
  const { auth, onboarding } = useOnboarding();
  const { isDataLoading } = useApp();

  if (!auth.isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  if (isDataLoading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F7F7FA',
          color: '#6B7280',
          fontSize: 14,
        }}
      >
        Syncing your data…
      </div>
    );
  }

  if (onboarding.status === 'in_progress' && onboarding.lastStepId) {
    return <Navigate to={`/onboarding/${onboarding.lastStepId}`} replace />;
  }

  if (onboarding.status === 'not_started') {
    return <Navigate to="/onboarding/goal" replace />;
  }

  return <Outlet />;
}

/** Onboarding requires a signed-in account */
function OnboardingAuthGuard() {
  const { auth, authLoading } = useOnboarding();

  if (authLoading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F5FA',
          color: '#6B7280',
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
}

/** Redirect signed-in users away from welcome/login/signup (not /auth/callback). */
function GuestAuthGuard() {
  const { auth, authLoading, onboarding } = useOnboarding();
  const { pathname } = useLocation();
  const isAuthCallback = pathname === '/auth/callback';

  if (authLoading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F5FA',
          color: '#6B7280',
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
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
            Component: PhoneFrameLayout,
            children: [
          { path: 'name-basics', Component: Step1NameBasics },
          { path: 'goal', Component: Step2Goal },
          { path: 'goal-setup', Component: Step2GoalSetup },
          { path: 'monthly-income', Component: Step3MonthlyIncome },
          { path: 'budget', Component: Step4Budget },
          { path: 'categories', Component: Step5Categories },
          { path: 'notifications', Component: Step6Notifications },
          { path: 'complete', Component: Step7Complete },
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
              { path: 'insights', element: <Navigate to="/" replace /> },
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
