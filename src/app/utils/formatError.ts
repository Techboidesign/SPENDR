/** User-visible message from thrown values (Supabase Postgrest, Error, etc.). */
export function formatErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const o = err as { message?: string; details?: string; hint?: string };
    const parts = [o.message, o.details, o.hint].filter(Boolean);
    if (parts.length > 0) return parts.join(' — ');
  }
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}
