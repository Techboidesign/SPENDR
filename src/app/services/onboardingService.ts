import type { OnboardingState } from '../context/OnboardingContext';
import type { DbOnboardingProgress, DbProfile } from '../data/database.types';
import { getSupabase } from '../../lib/supabase';

const COMPLETED_ONBOARDING_FALLBACK: OnboardingState = {
  status: 'completed',
  completedSteps: [],
  lastStepId: null,
  data: {},
  completedAt: null,
  version: 1,
};

export function dbRowToOnboarding(row: DbOnboardingProgress): OnboardingState {
  return {
    status: row.status,
    completedSteps: row.completed_steps ?? [],
    lastStepId: row.last_step_id,
    data: (row.data ?? {}) as OnboardingState['data'],
    completedAt: row.completed_at,
    version: row.version ?? 1,
  };
}

export async function fetchOnboarding(userId: string): Promise<OnboardingState | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return dbRowToOnboarding(data as DbOnboardingProgress);
}

/**
 * Prefer onboarding_progress; if profile is marked complete but progress row lags,
 * treat onboarding as done (avoids sending returning users back into the flow).
 */
export async function resolveOnboardingForUser(userId: string): Promise<OnboardingState | null> {
  const supabase = getSupabase();
  const [progressRes, profileRes] = await Promise.all([
    supabase.from('onboarding_progress').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('onboarding_completed_at').eq('id', userId).maybeSingle(),
  ]);

  if (progressRes.error && progressRes.error.code !== 'PGRST116') throw progressRes.error;
  if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;

  const profile = profileRes.data as Pick<DbProfile, 'onboarding_completed_at'> | null;
  const progress = progressRes.data as DbOnboardingProgress | null;

  if (progress) {
    const resolved = dbRowToOnboarding(progress);
    if (resolved.status === 'completed' || resolved.status === 'skipped') {
      return resolved;
    }
    if (profile?.onboarding_completed_at) {
      return {
        ...resolved,
        status: 'completed',
        lastStepId: null,
        completedAt: profile.onboarding_completed_at,
      };
    }
    return resolved;
  }

  if (profile?.onboarding_completed_at) {
    return {
      ...COMPLETED_ONBOARDING_FALLBACK,
      completedAt: profile.onboarding_completed_at,
    };
  }

  return null;
}

export async function saveOnboarding(userId: string, state: OnboardingState): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('onboarding_progress').upsert({
    user_id: userId,
    status: state.status,
    last_step_id: state.lastStepId,
    completed_steps: state.completedSteps,
    data: state.data,
    completed_at: state.completedAt,
    version: state.version,
  });
  if (error) throw error;
}
