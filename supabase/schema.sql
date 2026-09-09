-- AI Recruit / Resume Analyzer — Supabase schema
-- Run in Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

-- Recruiter profiles linked to Supabase Auth users (auth.users)
create table if not exists recruiter_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'Senior Recruiter',
  department text not null default 'Talent Acquisition',
  initials text not null default 'R',
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null default 'Engineering',
  location text not null default 'Remote',
  employment_type text not null default 'Full Time',
  description text not null,
  required_skills jsonb not null default '[]'::jsonb,
  preferred_skills jsonb not null default '[]'::jsonb,
  experience text default '',
  education text default '',
  certifications jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  scoring_weights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_name text not null,
  email text,
  location text,
  experience_years numeric,
  file_name text,
  status text not null default 'ai_screened',
  rank integer not null default 0,
  extracted_skills jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  internships jsonb not null default '[]'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  matched_skills jsonb not null default '[]'::jsonb,
  missing_skills jsonb not null default '[]'::jsonb,
  skill_score numeric not null default 0,
  similarity_score numeric not null default 0,
  profile_score numeric not null default 0,
  final_score numeric not null default 0,
  decision text not null default '',
  explanation text not null default '',
  recommendation jsonb not null default '{}'::jsonb,
  matching_breakdown jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);

create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  interview_date timestamptz not null,
  interview_type text not null default 'Technical',
  interviewer text not null default '',
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) on delete set null,
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_name text not null,
  file_name text not null,
  status text not null default 'analyzed',
  match_score numeric,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_candidates_job_id on candidates(job_id);
create index if not exists idx_candidates_final_score on candidates(final_score desc);
create index if not exists idx_interviews_job_id on interviews(job_id);
create index if not exists idx_resumes_job_id on resumes(job_id);

alter table recruiter_profiles enable row level security;

create policy "recruiters_read_own_profile"
  on recruiter_profiles for select
  using (auth.uid() = id);

create policy "service_role_all_recruiter_profiles"
  on recruiter_profiles for all
  using (true) with check (true);

alter table jobs enable row level security;
alter table candidates enable row level security;
alter table interviews enable row level security;
alter table resumes enable row level security;

-- Backend uses service role key (bypasses RLS). For anon access later, add policies.
create policy "service_role_all_jobs" on jobs for all using (true) with check (true);
create policy "service_role_all_candidates" on candidates for all using (true) with check (true);
create policy "service_role_all_interviews" on interviews for all using (true) with check (true);
create policy "service_role_all_resumes" on resumes for all using (true) with check (true);
