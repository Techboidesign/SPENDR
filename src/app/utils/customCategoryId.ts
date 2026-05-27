import { generateId } from './id';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** App-facing id (prefix marks user-created categories). */
export function toCustomCategoryAppId(dbOrAppId: string): string {
  if (dbOrAppId.startsWith('custom-')) return dbOrAppId;
  return `custom-${dbOrAppId}`;
}

/** Postgres `custom_categories.id` is uuid — strip the app prefix. */
export function toCustomCategoryDbId(appId: string): string {
  const raw = appId.startsWith('custom-') ? appId.slice('custom-'.length) : appId;
  if (UUID_RE.test(raw)) return raw;
  return generateId();
}

export function createCustomCategoryAppId(): string {
  return toCustomCategoryAppId(generateId());
}
