import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, getSiteUrl, isSupabaseConfigured } from '../../lib/supabase';
import { getItem, setItem } from '../utils/storage';
import { fetchOnboarding, saveOnboarding } from '../services/onboardingService';
import { clearLocalUserData } from '../services/migrateLocalStorage';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface OnboardingData {
  firstName?: string;
  currency?: string;
  country?: string;
  primaryGoal?: 'save' | 'track' | 'debt' | 'emergency' | 'invest' | 'exploring';
  monthlyAmount?: {
    value: number;
    type: 'income' | 'available_to_spend';
  };
  incomeFrequency?: 'monthly' | 'bi-weekly' | 'weekly' | 'irregular';
  monthlyBudget?: number;
  budgetAllocations?: Record<string, number>;
  selectedCategories?: string[];
  customCategories?: Array<{ name: string; color?: string }>;
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
  currentStep: string | null;
  updateData: (data: Partial<OnboardingData>) => void;
  next: (stepId: string) => void;
  back: () => void;
  skip: (stepId: string) => void;
  skipAll: () => void;
  complete: () => void;
  setAuth: (auth: Partial<AuthState>) => void;
  logout: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
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
  const [onboarding, setOnboarding] = useState<OnboardingState>(() => {
    if (!isSupabaseConfigured) {
      return getItem<OnboardingState>('onboarding') ?? INITIAL_ONBOARDING;
    }
    return INITIAL_ONBOARDING;
  });

  const [auth, setAuthState] = useState<AuthState>(() => {
    if (!isSupabaseConfigured) {
      return getItem<AuthState>('auth') ?? INITIAL_AUTH;
    }
    return INITIAL_AUTH;
  });

  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const onboardingRef = useRef(onboarding);
  onboardingRef.current = onboarding;

  const loadOnboardingForUser = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const remote = await fetchOnboarding(userId);
      if (remote) setOnboarding(remote);
    } catch (err) {
      console.error('Failed to load onboarding:', err);
    }
  }, []);

  const refreshOnboarding = useCallback(async () => {
    if (auth.userId) await loadOnboardingForUser(auth.userId);
  }, [auth.userId, loadOnboardingForUser]);

  // Supabase session listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const nextAuth = sessionToAuth(session);
      setAuthState(nextAuth);
      if (nextAuth.userId) void loadOnboardingForUser(nextAuth.userId);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextAuth = sessionToAuth(session);
      setAuthState(nextAuth);
      if (nextAuth.userId) {
        void loadOnboardingForUser(nextAuth.userId);
      } else {
        setOnboarding(INITIAL_ONBOARDING);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadOnboardingForUser]);

  // Offline persistence when Supabase is not configured
  useEffect(() => {
    if (!isSupabaseConfigured) setItem('onboarding', onboarding);
  }, [onboarding]);

  useEffect(() => {
    if (!isSupabaseConfigured) setItem('auth', auth);
  }, [auth]);

  // Sync onboarding to cloud when authenticated
  useEffect(() => {
    if (!isSupabaseConfigured || !auth.userId || authLoading) return;
    saveOnboarding(auth.userId, onboarding).catch(err => {
      console.error('Failed to save onboarding:', err);
    });
  }, [onboarding, auth.userId, authLoading]);

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
      const userId = 'user_' + Math.random().toString(36).slice(2);
      setAuthState({ isAuthenticated: true, userId, method: 'email', email });
      return { needsEmailConfirmation: false };
    }
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    if (error) throw error;
    const needsEmailConfirmation = !data.session;
    if (data.session) {
      setAuthState(sessionToAuth(data.session));
    }
    return { needsEmailConfirmation };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const userId = 'user_' + Math.random().toString(36).slice(2);
      setAuthState({ isAuthenticated: true, userId, method: 'email', email });
      return;
    }
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    setAuthState(sessionToAuth(data.session));
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/login`,
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
    setAuthState(INITIAL_AUTH);
    setOnboarding(INITIAL_ONBOARDING);
    clearLocalUserData();
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        onboarding,
        auth,
        authLoading,
        currentStep: onboarding.lastStepId,
        updateData,
        next,
        back,
        skip,
        skipAll,
        complete,
        setAuth,
        logout,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        updatePassword,
        refreshOnboarding,
      }}
    >
      {children}
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
    if (onboarding.status === 'not_started') {
      return '/welcome';
    }
  }

  if (!auth.isAuthenticated) {
    return '/login';
  }

  if (onboarding.status === 'completed' || onboarding.status === 'skipped') {
    return '/';
  }

  if (onboarding.status === 'in_progress' && onboarding.lastStepId) {
    return `/onboarding/${onboarding.lastStepId}`;
  }

  return '/onboarding/name-basics';
}
