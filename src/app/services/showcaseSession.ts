import type { AppState } from '../data/types';
import type { AuthState, OnboardingState } from '../context/OnboardingContext';
import { isSpendingExpense } from '../data/focusCategory';
import { normalizeAppState } from '../data/notificationPreferences';
import { getItem, removeItem, setItem } from '../utils/storage';
import {
  createShowcaseAppState,
  createShowcaseOnboarding,
  isShowcaseUser,
  SHOWCASE_USER_EMAIL,
  SHOWCASE_USER_ID,
} from './showcaseTestUser';

/** Bump when bundled demo shape changes — invalidates saved showcase sessions. */
export const SHOWCASE_SESSION_VERSION = 2;

const SHOWCASE_ACTIVE_KEY = 'spendr.showcase.active';

const KEYS = {
  version: 'showcase.version',
  auth: 'showcase.auth',
  onboarding: 'showcase.onboarding',
  appState: 'showcase.appState',
} as const;

export function setShowcaseSessionActive(active: boolean): void {
  try {
    if (active) {
      sessionStorage.setItem(SHOWCASE_ACTIVE_KEY, '1');
    } else {
      sessionStorage.removeItem(SHOWCASE_ACTIVE_KEY);
    }
  } catch {
    /* sessionStorage unavailable */
  }
}

export function isShowcaseSessionActive(): boolean {
  try {
    return sessionStorage.getItem(SHOWCASE_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isShowcaseSessionVersionCurrent(): boolean {
  return getItem<number>(KEYS.version) === SHOWCASE_SESSION_VERSION;
}

export function loadShowcaseAuth(): AuthState | null {
  if (!isShowcaseSessionVersionCurrent()) return null;
  const auth = getItem<AuthState>(KEYS.auth);
  if (!auth?.isAuthenticated || !isShowcaseUser(auth.userId)) return null;
  return auth;
}

export function loadShowcaseOnboarding(): OnboardingState | null {
  if (!isShowcaseSessionVersionCurrent()) return null;
  return getItem<OnboardingState>(KEYS.onboarding);
}

export function loadShowcaseAppState(): AppState | null {
  if (!isShowcaseSessionVersionCurrent()) return null;
  const raw = getItem<AppState>(KEYS.appState);
  return raw ? normalizeAppState(raw) : null;
}

/** Saved demo must include real sample transactions (guards against wiped storage). */
export function showcaseHasDemoData(state: AppState | null | undefined): boolean {
  if (!state) return false;
  const spendingCount = state.expenses.filter(isSpendingExpense).length;
  return spendingCount >= 3 && state.monthlyBudget > 0 && state.income > 0;
}

export function hasResumableShowcaseSession(): boolean {
  const auth = loadShowcaseAuth();
  const appState = loadShowcaseAppState();
  return auth !== null && showcaseHasDemoData(appState);
}

export function saveShowcaseAuth(auth: AuthState): void {
  setItem(KEYS.version, SHOWCASE_SESSION_VERSION);
  setItem(KEYS.auth, auth);
}

export function saveShowcaseOnboarding(onboarding: OnboardingState): void {
  setItem(KEYS.version, SHOWCASE_SESSION_VERSION);
  setItem(KEYS.onboarding, onboarding);
}

export function saveShowcaseAppState(appState: AppState): void {
  const normalized = normalizeAppState(appState);
  setItem(KEYS.version, SHOWCASE_SESSION_VERSION);
  setItem(KEYS.appState, normalized);
  // Keep legacy key in sync for offline / dev paths that read `appState`
  setItem('appState', normalized);
}

export function saveShowcaseSession(payload: {
  auth: AuthState;
  onboarding: OnboardingState;
  appState: AppState;
}): void {
  setItem(KEYS.version, SHOWCASE_SESSION_VERSION);
  setItem(KEYS.auth, payload.auth);
  setItem(KEYS.onboarding, payload.onboarding);
  saveShowcaseAppState(payload.appState);
}

export function clearShowcaseSession(): void {
  setShowcaseSessionActive(false);
  removeItem(KEYS.version);
  removeItem(KEYS.auth);
  removeItem(KEYS.onboarding);
  removeItem(KEYS.appState);
}

export function createFreshShowcaseSession(): {
  auth: AuthState;
  onboarding: OnboardingState;
  appState: AppState;
} {
  const auth: AuthState = {
    isAuthenticated: true,
    userId: SHOWCASE_USER_ID,
    method: 'email',
    email: SHOWCASE_USER_EMAIL,
  };
  const onboarding = createShowcaseOnboarding();
  const appState = createShowcaseAppState();
  return { auth, onboarding, appState };
}

/** Resume saved demo or create a new bundled sample dataset. */
export function resolveShowcaseSession(options?: { forceFresh?: boolean }): {
  auth: AuthState;
  onboarding: OnboardingState;
  appState: AppState;
  resumed: boolean;
} {
  if (!options?.forceFresh && hasResumableShowcaseSession()) {
    const auth = loadShowcaseAuth()!;
    const onboarding = loadShowcaseOnboarding() ?? createShowcaseOnboarding();
    const appState = loadShowcaseAppState()!;
    return { auth, onboarding, appState, resumed: true };
  }

  const fresh = createFreshShowcaseSession();
  saveShowcaseSession(fresh);
  return { ...fresh, resumed: false };
}
