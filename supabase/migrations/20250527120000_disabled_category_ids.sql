-- Track built-in categories the user has turned off (onboarding + settings)
alter table public.user_preferences
  add column if not exists disabled_category_ids text[] not null default '{}';
