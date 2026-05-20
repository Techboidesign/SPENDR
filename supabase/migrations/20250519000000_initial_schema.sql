-- SPENDR initial schema (run in Supabase SQL editor or via supabase db push)

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  display_name text not null default '',
  username text,
  phone text,
  avatar_url text,
  currency text not null default 'EUR',
  country text,
  primary_goal text,
  income numeric not null default 0,
  monthly_budget numeric not null default 0,
  income_frequency text,
  member_since timestamptz not null default now(),
  plan text not null default 'personal_free',
  onboarding_completed_at timestamptz,
  has_migrated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

-- User preferences
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  budget_alerts boolean not null default true,
  weekly_summary boolean not null default true,
  bill_reminders boolean not null default true,
  goal_milestones boolean not null default true,
  recurring_reminders boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Onboarding progress
create table if not exists public.onboarding_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'skipped')),
  last_step_id text,
  completed_steps text[] not null default '{}',
  data jsonb not null default '{}',
  completed_at timestamptz,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category_id text not null,
  amount numeric not null check (amount >= 0),
  date date not null,
  type text not null check (type in ('one-time', 'monthly', 'yearly')),
  notes text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses (user_id, date desc);
create index if not exists expenses_user_category_idx on public.expenses (user_id, category_id);

-- Budget goals per category
create table if not exists public.budget_goals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null,
  amount numeric not null check (amount >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

-- Built-in category overrides
create table if not exists public.category_customizations (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null,
  name text,
  icon_key text,
  color text,
  bg text,
  icon_color text,
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

-- User-created categories
create table if not exists public.custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  color text not null,
  bg text not null,
  icon_key text not null,
  icon_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_categories_user_idx on public.custom_categories (user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists expenses_updated_at on public.expenses;
create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- New user bootstrap
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1), 'User'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  insert into public.user_preferences (user_id) values (new.id);
  insert into public.onboarding_progress (user_id, status)
  values (new.id, 'not_started');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.expenses enable row level security;
alter table public.budget_goals enable row level security;
alter table public.category_customizations enable row level security;
alter table public.custom_categories enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- User preferences
create policy "prefs_all_own" on public.user_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Onboarding
create policy "onboarding_all_own" on public.onboarding_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Expenses
create policy "expenses_all_own" on public.expenses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Budget goals
create policy "budget_goals_all_own" on public.budget_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Category customizations
create policy "cat_custom_all_own" on public.category_customizations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Custom categories
create policy "custom_cat_all_own" on public.custom_categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Avatars storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_read_public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
