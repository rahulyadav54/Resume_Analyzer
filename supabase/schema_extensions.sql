-- Run after schema.sql to enable talent pool and compliance audit trail

create table if not exists talent_pool (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid,
  candidate_name text not null,
  email text,
  source_job_id uuid,
  source_job_title text default '',
  final_score numeric not null default 0,
  matched_skills jsonb not null default '[]'::jsonb,
  notes text default '',
  saved_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor text not null default 'system',
  target text not null default '',
  details text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_talent_pool_saved_at on talent_pool(saved_at desc);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);

alter table talent_pool enable row level security;
alter table audit_logs enable row level security;

create policy "service_role_all_talent_pool"
  on talent_pool for all using (true) with check (true);

create policy "service_role_all_audit_logs"
  on audit_logs for all using (true) with check (true);
