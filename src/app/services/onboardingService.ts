import type { OnboardingState } from '../context/OnboardingContext';
import type { DbOnboardingProgress } from '../data/database.types';
import { getSupabase } from '../../lib/supabase';

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
