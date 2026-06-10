import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useLocation } from 'react-router';
import { ONBOARDING_STEPS } from '../theme/onboardingSteps';
import type { Session } from '@supabase/supabase-js';
import {
  getAuthCallbackUrl,
  getSupabase,
  isSupabaseConfigured,
} from '../../lib/supabase';
import { getItem, removeItem, setItem } from '../utils/storage';
import { resolveOnboardingForUser, saveOnboarding } from '../services/onboardingService';
import { clearAllLocalUserData, clearLocalUserData } from '../services/migrateLocalStorage';
import { createEmptyAppState } from '../services/appDataService';
import type { AppState } from '../data/types';
import {
  clearShowcaseSession,
  isShowcaseSessionActive,
  loadShowcaseAuth,
  loadShowcaseOnboarding,
  resolveShowcaseSession,
  saveShowcaseAuth,
  saveShowcaseOnboarding,
  saveShowcaseSession,
  setShowcaseSessionActive,
} from '../services/showcaseSession';
import { isShowcaseUser } from '../services/showcaseTestUser';
import { AppProvider } from './AppContext';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface OnboardingData {
  firstName?: string;
  currency?: string;
  savingsGoals?: import('../data/types').SavingsGoal[];
  monthlyAmount?: {
    value: number;
    type: 'income' | 'available_to_spend';
  };
  incomeFrequency?: 'monthly' | 'bi-weekly' | 'weekly' | 'irregular';
  monthlyBudget?: number;
  /** automatic = rebalance to monthly total; custom = free-edit category amounts */
  budgetAllocationMode?: 'automatic' | 'custom';
  budgetAllocations?: Record<string, number>;
  /** @deprecated Use selectedCategoryIds */
  selectedCategories?: string[];
  selectedCategoryIds?: string[];
  customCategories?: Array<{
    id: string;
    name: string;
    color: string;
    bg: string;
    iconKey: string;
    iconColor?: string;
  }>;
  notifications?: {
    budgetAlerts?: boolean;
    weeklySummary?: boolean;
    billReminders?: boolean;
    goalMilestones?: boolean;
  };
}

export interface OnboardingState {
  status: OnboardingStatus;
  completedSteps: string[];
  lastStepId: string | null;
  data: Partial<OnboardingData>;
  completedAt: string | null;
  version: 1;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  method: 'email' | 'google' | 'apple' | null;
  email: string | null;
}

interface OnboardingContextType {
  onboarding: OnboardingState;
  auth: AuthState;
  authLoading: boolean;
  /** True until onboarding_progress (and profile fallback) is loaded for the signed-in user. */
  onboardingLoading: boolean;
  currentStep: string | null;
  updateData: (data: Partial<OnboardingData>) => void;
  next: (stepId: string) => void;
  goToStep: (stepId: string) => void;
  back: () => void;
  skip: (stepId: string) => void;
  skipAll: () => void;
  complete: () => void;
  setAuth: (auth: Partial<AuthState>) => void;
  logout: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Local showcase session with bundled sample data (portfolio / demos). */
  signInAsTestUser: (options?: { forceFresh?: boolean }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshOnboarding: () => Promise<void>;
}

const INITIAL_ONBOARDING: OnboardingState = {
  status: 'not_started',
  completedSteps: [],
  lastStepId: null,
  data: {},
  completedAt: null,
  version: 1,
};

const INITIAL_AUTH: AuthState = {
  isAuthenticated: false,
  userId: null,
  method: null,
  email: null,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

function sessionToAuth(session: Session | null): AuthState {
  if (!session?.user) return INITIAL_AUTH;
  const provider = session.user.app_metadata?.provider;
  const method =
    provider === 'google' ? 'google' : provider === 'apple' ? 'apple' : 'email';
  return {
    isAuthenticated: true,
    userId: session.user.id,
    method,
    email: session.user.email ?? null,
  };
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  /** Bumps on Test user sign-in so AppProvider reloads persisted demo state. */
  const [appSessionKey, setAppSessionKey] = useState(0);
  const [showcaseBootstrap, setShowcaseBootstrap] = useState<AppState | null>(null);

  const [onboarding, setOnboarding] = useState<OnboardingState>(() => {
    if (!isSupabaseConfigured) {
      return getItem<OnboardingState>('onboarding') ?? INITIAL_ONBOARDING;
    }
    return loadShowcaseOnboarding() ?? INITIAL_ONBOARDING;
  });

  const [auth, setAuthState] = useState<AuthState>(() => {
    if (!isSupabaseConfigured) {
      return getItem<AuthState>('auth') ?? INITIAL_AUTH;
    }
    return loadShowcaseAuth() ?? INITIAL_AUTH;
  });

  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [onboardingLoading, setOnboardingLoading] = useState(isSupabaseConfigured);
  const onboardingHydratedForUserRef = useRef<string | null>(null);
  const onboardingRef = useRef(onboarding);
  onboardingRef.current = onboarding;

  // Keep lastStepId in sync when user taps the stepper (or deep-links)
  useEffect(() => {
    const step = ONBOARDING_STEPS.find((s) => location.pathname === s.route);
    if (!step) return;
    setOnboarding((prev) => {
      if (prev.status === 'completed' || prev.status === 'skipped') return prev;
      if (prev.lastStepId === step.id) return prev;
      return { ...prev, lastStepId: step.id, status: 'in_progress' };
    });
  }, [location.pathname]);

  const loadOnboardingForUser = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    setOnboardingLoading(true);
    onboardingHydratedForUserRef.current = null;
    try {
      const remote = await resolveOnboardingForUser(userId);
      if (remote) {
        setOnboarding(remote);
      }
      onboardingHydratedForUserRef.current = userId;
    } catch (err) {
      console.error('Failed to load onboarding:', err);
      onboardingHydratedForUserRef.current = userId;
    } finally {
      setOnboardingLoading(false);
    }
  }, []);

  const refreshOnboarding = useCallback(async () => {
    if (auth.userId) await loadOnboardingForUser(auth.userId);
  }, [auth.userId, loadOnboardingForUser]);

  // Supabase session listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setOnboardingLoading(false);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isShowcaseUser(session.user.id)) {
        clearShowcaseSession();
        const nextAuth = sessionToAuth(session);
        setAuthState(nextAuth);
        void loadOnboardingForUser(nextAuth.userId);
        setAuthLoading(false);
        return;
      }

      if (isShowcaseSessionActive() || loadShowcaseAuth()) {
        const savedShowcase = loadShowcaseAuth();
        if (savedShowcase) {
          setAuthState(savedShowcase);
          setOnboarding(loadShowcaseOnboarding() ?? INITIAL_ONBOARDING);
        }
        setOnboardingLoading(false);
        setAuthLoading(false);
        return;
      }

      const nextAuth = sessionToAuth(session);
      setAuthState(nextAuth);
      if (nextAuth.userId) {
        void loadOnboardingForUser(nextAuth.userId);
      } else {
        setOnboardingLoading(false);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !isShowcaseUser(session.user.id)) {
        clearShowcaseSession();
        const nextAuth = sessionToAuth(session);
        setAuthState(nextAuth);
        void loadOnboardingForUser(nextAuth.userId);
        return;
      }

      if (isShowcaseSessionActive() || loadShowcaseAuth()) {
        const savedShowcase = loadShowcaseAuth();
        if (savedShowcase) {
          setAuthState(savedShowcase);
          setOnboarding(loadShowcaseOnboarding() ?? INITIAL_ONBOARDING);
        }
        setOnboardingLoading(false);
        return;
      }

      const nextAuth = sessionToAuth(session);
      setAuthState(nextAuth);
      if (nextAuth.userId && !isShowcaseUser(nextAuth.userId)) {
        void loadOnboardingForUser(nextAuth.userId);
      } else {
        setOnboardingLoading(false);
        if (!nextAuth.isAuthenticated) {
          setOnboarding(INITIAL_ONBOARDING);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loadOnboardingForUser]);

  // Offline persistence when Supabase is not configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setItem('onboarding', onboarding);
      return;
    }
    if (isShowcaseUser(auth.userId)) saveShowcaseOnboarding(onboarding);
  }, [onboarding, auth.userId]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setItem('auth', auth);
      return;
    }
    if (isShowcaseUser(auth.userId) && auth.isAuthenticated) saveShowcaseAuth(auth);
  }, [auth]);

  // Sync onboarding to cloud when authenticated (after remote hydrate — never overwrite with defaults)
  useEffect(() => {
    if (
      !isSupabaseConfigured ||
      !auth.userId ||
      authLoading ||
      onboardingLoading ||
      isShowcaseUser(auth.userId) ||
      onboardingHydratedForUserRef.current !== auth.userId
    ) {
      return;
    }
    saveOnboarding(auth.userId, onboarding).catch(err => {
      console.error('Failed to save onboarding:', err);
    });
  }, [onboarding, auth.userId, authLoading, onboardingLoading]);

  const updateData = useCallback((data: Partial<OnboardingData>) => {
    setOnboarding(prev => ({
      ...prev,
      data: { ...prev.data, ...data },
    }));
  }, []);

  const next = useCallback((stepId: string) => {
    setOnboarding(prev => ({
      ...prev,
      status: 'in_progress',
      lastStepId: stepId,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
    }));
  }, []);

  const goToStep = useCallback((stepId: string) => {
    setOnboarding((prev) => ({
      ...prev,
      status: 'in_progress',
      lastStepId: stepId,
    }));
  }, []);

  const back = useCallback(() => {
    setOnboarding(prev => {
      const steps = prev.completedSteps;
      if (steps.length <= 1) return prev;
      const previousStepId = steps[steps.length - 2] || null;
      return {
        ...prev,
        lastStepId: previousStepId,
        completedSteps: steps.slice(0, -1),
      };
    });
  }, []);

  const skip = useCallback((stepId: string) => {
    setOnboarding(prev => ({
      ...prev,
      lastStepId: stepId,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
    }));
  }, []);

  const skipAll = useCallback(() => {
    setOnboarding(prev => ({
      ...prev,
      status: 'skipped',
      lastStepId: null,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const complete = useCallback(() => {
    setOnboarding(prev => ({
      ...prev,
      status: 'completed',
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const setAuth = useCallback((authData: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...authData }));
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      clearAllLocalUserData();
      const userId = 'user_' + Math.random().toString(36).slice(2);
      const nextAuth: AuthState = { isAuthenticated: true, userId, method: 'email', email };
      setAuthState(nextAuth);
      setOnboarding(INITIAL_ONBOARDING);
      setItem('auth', nextAuth);
      setItem('appState', createEmptyAppState({ userEmail: email }));
      return { needsEmailConfirmation: false };
    }
    clearAllLocalUserData();
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });
    if (error) throw error;
    const needsEmailConfirmation = !data.session;
    if (data.session) {
      setAuthState(sessionToAuth(data.session));
      setOnboarding(INITIAL_ONBOARDING);
    }
    return { needsEmailConfirmation };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const userId = 'user_' + Math.random().toString(36).slice(2);
      setAuthState({ isAuthenticated: true, userId, method: 'email', email });
      return;
    }
    clearShowcaseSession();
    setShowcaseBootstrap(null);
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    setAuthState(sessionToAuth(data.session));
  }, []);

  const signInAsTestUser = useCallback(async (options?: { forceFresh?: boolean }) => {
    clearLocalUserData();

    const session = resolveShowcaseSession({ forceFresh: options?.forceFresh });
    saveShowcaseSession(session);
    setShowcaseSessionActive(true);
    setShowcaseBootstrap(session.appState);
    setAuthState(session.auth);
    setOnboarding(session.onboarding);
    setAppSessionKey(k => k + 1);

    if (isSupabaseConfigured) {
      await getSupabase().auth.signOut();
    }

    if (!isSupabaseConfigured) {
      setItem('auth', session.auth);
      setItem('onboarding', session.onboarding);
      setItem('appState', session.appState);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl(),
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabase().auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await getSupabase().auth.signOut();
    }
    setShowcaseBootstrap(null);
    setAuthState(INITIAL_AUTH);
    setOnboarding(INITIAL_ONBOARDING);
    clearAllLocalUserData();
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        onboarding,
        auth,
        authLoading,
        onboardingLoading,
        currentStep: onboarding.lastStepId,
        updateData,
        next,
        goToStep,
        back,
        skip,
        skipAll,
        complete,
        setAuth,
        logout,
        signUpWithEmail,
        signInWithEmail,
        signInAsTestUser,
        resetPassword,
        updatePassword,
        refreshOnboarding,
      }}
    >
      <AppProvider
        key={`${auth.userId ?? 'guest'}-${appSessionKey}`}
        auth={auth}
        onboarding={onboarding}
        bootstrapAppState={
          isShowcaseUser(auth.userId) ? showcaseBootstrap : null
        }
      >
        {children}
      </AppProvider>
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

export function getOnboardingRoute(auth: AuthState, onboarding: OnboardingState): string {
  if (!auth.isAuthenticated) {
    return '/welcome';
  }

  if (onboarding.status === 'completed' || onboarding.status === 'skipped') {
    return '/';
  }

  if (onboarding.status === 'in_progress' && onboarding.lastStepId) {
    return `/onboarding/${onboarding.lastStepId}`;
  }

  return '/onboarding/monthly-income';
}
