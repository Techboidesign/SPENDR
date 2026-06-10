-- Named savings goals (Budget tab) replace per-category budget limits.

create table if not exists public.savings_goals (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  target_amount numeric not null default 0 check (target_amount >= 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  target_date date,
  icon_key text not null default 'piggy',
  accent_color text not null default '#F7A54D',
  accent_bg text not null default '#FEF5EC',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists savings_goals_user_sort_idx
  on public.savings_goals (user_id, sort_order);

alter table public.savings_goals enable row level security;

create policy "savings_goals_all_own" on public.savings_goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists savings_goals_set_updated_at on public.savings_goals;
create trigger savings_goals_set_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

drop table if exists public.budget_goals cascade;
