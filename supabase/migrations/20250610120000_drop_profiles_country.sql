-- Country is no longer collected during onboarding.
alter table public.profiles drop column if exists country;
