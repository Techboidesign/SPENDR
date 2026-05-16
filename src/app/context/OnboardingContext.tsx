import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';

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
  customCategories?: Array<{ name: string; emoji?: string; color?: string }>;
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
}

interface OnboardingContextType {
  onboarding: OnboardingState;
  auth: AuthState;
  currentStep: string | null;
  updateData: (data: Partial<OnboardingData>) => void;
  next: (stepId: string) => void;
  back: () => void;
  skip: (stepId: string) => void;
  skipAll: () => void;
  complete: () => void;
  setAuth: (auth: Partial<AuthState>) => void;
  logout: () => void;
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
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboarding, setOnboarding] = useState<OnboardingState>(() => {
    return getItem<OnboardingState>('onboarding') || INITIAL_ONBOARDING;
  });

  const [auth, setAuthState] = useState<AuthState>(() => {
    return getItem<AuthState>('auth') || INITIAL_AUTH;
  });

  // Persist onboarding state to localStorage
  useEffect(() => {
    setItem('onboarding', onboarding);
  }, [onboarding]);

  // Persist auth state to localStorage
  useEffect(() => {
    setItem('auth', auth);
  }, [auth]);

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

      // Go back to previous step
      const lastCompletedIndex = steps.length - 1;
      const previousStepId = steps[lastCompletedIndex - 1] || null;

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

  const logout = useCallback(() => {
    setAuthState(INITIAL_AUTH);
    // Keep onboarding state for future logins
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        onboarding,
        auth,
        currentStep: onboarding.lastStepId,
        updateData,
        next,
        back,
        skip,
        skipAll,
        complete,
        setAuth,
        logout,
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

// Routing helper - determines where user should land
export function getOnboardingRoute(auth: AuthState, onboarding: OnboardingState): string {
  // Not authenticated
  if (!auth.isAuthenticated) {
    if (onboarding.status === 'not_started') {
      return '/welcome';
    }
    if (onboarding.status === 'in_progress') {
      return '/welcome'; // Let them log in first, then resume
    }
    return '/login';
  }

  // Authenticated
  if (onboarding.status === 'completed' || onboarding.status === 'skipped') {
    return '/'; // Main app
  }

  if (onboarding.status === 'in_progress' && onboarding.lastStepId) {
    return `/onboarding/${onboarding.lastStepId}`;
  }

  // Start onboarding
  return '/onboarding/name-basics';
}
