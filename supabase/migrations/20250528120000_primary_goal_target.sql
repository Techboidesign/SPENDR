-- Target amounts/dates for save, debt, and emergency focus goals
alter table public.profiles
  add column if not exists primary_goal_target_amount numeric check (primary_goal_target_amount is null or primary_goal_target_amount >= 0),
  add column if not exists primary_goal_target_date date,
  add column if not exists primary_goal_current_amount numeric not null default 0 check (primary_goal_current_amount >= 0),
  add column if not exists primary_goal_name text;
