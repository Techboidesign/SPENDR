import { createBrowserRouter, Outlet, Navigate } from 'react-router';
import { AppProvider } from './context/AppContext';
import { OnboardingProvider, useOnboarding, getOnboardingRoute } from './context/OnboardingContext';
import RootLayout from './components/RootLayout';
import SubPageLayout from './components/SubPageLayout';
import PhoneFrameLayout from './components/PhoneFrameLayout';
import HomeScreen from './components/screens/HomeScreen';
import ExpensesScreen from './components/screens/ExpensesScreen';
import InsightsScreen from './components/screens/InsightsScreen';
import BudgetScreen from './components/screens/BudgetScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import UserProfileScreen from './components/screens/UserProfileScreen';
import HelpScreen from './components/screens/HelpScreen';
import PrivacyScreen from './components/screens/PrivacyScreen';

// Auth screens
import WelcomeScreen from './components/screens/auth/WelcomeScreen';
import SignUpScreen from './components/screens/auth/SignUpScreen';
import LogInScreen from './components/screens/auth/LogInScreen';
import ForgotPasswordScreen from './components/screens/auth/ForgotPasswordScreen';

// Onboarding screens
import Step1NameBasics from './components/screens/onboarding/Step1NameBasics';
import Step2Goal from './components/screens/onboarding/Step2Goal';
import Step3MonthlyIncome from './components/screens/onboarding/Step3MonthlyIncome';
import Step4Budget from './components/screens/onboarding/Step4Budget';
import Step5Categories from './components/screens/onboarding/Step5Categories';
import Step6Notifications from './components/screens/onboarding/Step6Notifications';
import Step7Complete from './components/screens/onboarding/Step7Complete';

/** Pathless layout route — provides OnboardingProvider and AppProvider to the entire router tree */
function ProvidersLayout() {
  return (
    <OnboardingProvider>
      <AppProvider>
        <Outlet />
      </AppProvider>
    </OnboardingProvider>
  );
}

/** Auth guard — redirects unauthenticated users to welcome/login */
function AuthGuard() {
  const { auth, onboarding } = useOnboarding();

  if (!auth.isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // Check if onboarding is incomplete
  if (onboarding.status === 'in_progress' && onboarding.lastStepId) {
    return <Navigate to={`/onboarding/${onboarding.lastStepId}`} replace />;
  }

  if (onboarding.status === 'not_started') {
    return <Navigate to="/onboarding/name-basics" replace />;
  }

  return <Outlet />;
}

/** Root redirect — ensures users land on the right page based on auth/onboarding status */
function RootRedirect() {
  const { auth, onboarding } = useOnboarding();
  const route = getOnboardingRoute(auth, onboarding);
  return <Navigate to={route} replace />;
}

export const router = createBrowserRouter([
  {
    Component: ProvidersLayout,
    children: [
      // Public auth routes (with phone frame)
      {
        Component: PhoneFrameLayout,
        children: [
          { path: '/welcome', Component: WelcomeScreen },
          { path: '/signup', Component: SignUpScreen },
          { path: '/login', Component: LogInScreen },
          { path: '/forgot-password', Component: ForgotPasswordScreen },
        ],
      },

      // Onboarding routes (require auth, with phone frame)
      {
        path: '/onboarding',
        Component: PhoneFrameLayout,
        children: [
          { path: 'name-basics', Component: Step1NameBasics },
          { path: 'goal', Component: Step2Goal },
          { path: 'monthly-income', Component: Step3MonthlyIncome },
          { path: 'budget', Component: Step4Budget },
          { path: 'categories', Component: Step5Categories },
          { path: 'notifications', Component: Step6Notifications },
          { path: 'complete', Component: Step7Complete },
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
              { path: 'settings', Component: SettingsScreen },
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
    ],
  },
]);
