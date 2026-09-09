-- Fix: create recruiter_profiles if missing, then add Ramiyaa's profile
-- Run this in Supabase → SQL Editor (replace USER UUID after creating auth user)

create extension if not exists "pgcrypto";

-- 1. Create table if it does not exist
create table if not exists recruiter_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'Senior Recruiter',
  department text not null default 'Talent Acquisition',
  initials text not null default 'R',
  created_at timestamptz not null default now()
);

-- 2. Enable RLS (safe if already enabled)
alter table recruiter_profiles enable row level security;

drop policy if exists "recruiters_read_own_profile" on recruiter_profiles;
create policy "recruiters_read_own_profile"
  on recruiter_profiles for select
  using (auth.uid() = id);

drop policy if exists "service_role_all_recruiter_profiles" on recruiter_profiles;
create policy "service_role_all_recruiter_profiles"
  on recruiter_profiles for all
  using (true) with check (true);

-- 3. Auto-create profile trigger (optional but recommended)
create or replace function public.handle_new_recruiter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.recruiter_profiles (id, email, name, role, department, initials)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', initcap(split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data->>'role', 'Senior Recruiter'),
    coalesce(new.raw_user_meta_data->>'department', 'Talent Acquisition'),
    coalesce(
      new.raw_user_meta_data->>'initials',
      upper(left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 1))
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_recruiter();

-- 4. Insert Ramiyaa profile — REPLACE the UUID below!
-- Get UUID from: Authentication → Users → click ramiyaa@company.com → copy User UID

-- insert into recruiter_profiles (id, email, name, role, department, initials)
-- values (
--   'PASTE-USER-UUID-HERE',
--   'ramiyaa@company.com',
--   'Ramiyaa',
--   'Senior Recruiter',
--   'Talent Acquisition',
--   'R'
-- ) on conflict (id) do update set
--   name = excluded.name,
--   role = excluded.role,
--   department = excluded.department,
--   initials = excluded.initials;
