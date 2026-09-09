-- Supabase Auth setup for AI Recruit recruiter portal
-- Run AFTER schema.sql in Supabase SQL Editor

-- Auto-create recruiter profile when a new auth user signs up
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

-- Example: after creating a user in Dashboard → Authentication → Users,
-- if profile is missing, run (replace UUID and email):
--
-- insert into recruiter_profiles (id, email, name, role, department, initials)
-- values (
--   'YOUR-USER-UUID-HERE',
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
