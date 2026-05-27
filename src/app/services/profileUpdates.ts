import { getSupabase } from '../../lib/supabase';

const GOAL_TARGET_COLUMN_KEYS = [
  'primary_goal_name',
  'primary_goal_target_amount',
  'primary_goal_target_date',
  'primary_goal_current_amount',
] as const;

export function isMissingGoalTargetColumnError(error: {
  code?: string;
  message?: string;
}): boolean {
  const msg = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST204' ||
    msg.includes('primary_goal_name') ||
    msg.includes('primary_goal_target_amount') ||
    msg.includes('primary_goal_target_date') ||
    msg.includes('primary_goal_current_amount') ||
    (msg.includes('schema cache') && msg.includes('primary_goal'))
  );
}

export function stripGoalTargetColumns<T extends Record<string, unknown>>(payload: T): T {
  const next = { ...payload };
  for (const key of GOAL_TARGET_COLUMN_KEYS) {
    delete next[key];
  }
  return next;
}

/** Profile update that retries without goal-target columns if the migration is not applied yet. */
export async function updateProfileSafe(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabase();
  let { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error && isMissingGoalTargetColumnError(error)) {
    ({ error } = await supabase
      .from('profiles')
      .update(stripGoalTargetColumns(payload))
      .eq('id', userId));
  }
  if (error) throw error;
}
