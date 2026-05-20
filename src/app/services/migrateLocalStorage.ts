import type { AppState } from '../data/types';
import { getItem, removeItem } from '../utils/storage';
import { replaceAppStateOnServer } from './appDataService';
import { getSupabase } from '../../lib/supabase';

/** One-time upload of legacy localStorage appState after first Supabase login. */
export async function migrateLocalStorageIfNeeded(userId: string): Promise<AppState | null> {
  const supabase = getSupabase();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('has_migrated')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (profile?.has_migrated) return null;

  const local = getItem<AppState>('appState');
  if (!local) {
    await supabase.from('profiles').update({ has_migrated: true }).eq('id', userId);
    return null;
  }

  await replaceAppStateOnServer(userId, local);
  removeItem('appState');
  return local;
}

export function clearLocalUserData(): void {
  removeItem('appState');
  removeItem('auth');
  removeItem('onboarding');
}
