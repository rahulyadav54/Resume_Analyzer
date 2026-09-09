# Supabase Setup for AI Recruit

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose organization, name (e.g. `ai-recruit`), password, region.
4. Wait for the project to finish provisioning.

## 2. Run the database schema

1. Open your project → **SQL Editor** → **New query**.
2. Copy the full contents of [`schema.sql`](./schema.sql).
3. Click **Run**.
4. Copy and run [`auth_setup.sql`](./auth_setup.sql) for recruiter profile auto-creation.
5. Confirm tables exist under **Table Editor**: `recruiter_profiles`, `jobs`, `candidates`, `interviews`, `resumes`.

## 3. Create recruiter users (Supabase Auth)

1. Go to **Authentication** → **Users** → **Add user**.
2. Create your recruiter account:
   - Email: `ramiyaa@company.com`
   - Password: `Recruit@2024` (or your own secure password)
   - Check **Auto Confirm User**
3. After creating the user, open **SQL Editor** and run (replace UUID from the Users table):

```sql
insert into recruiter_profiles (id, email, name, role, department, initials)
values (
  'PASTE-USER-UUID-HERE',
  'ramiyaa@company.com',
  'Ramiyaa',
  'Senior Recruiter',
  'Talent Acquisition',
  'R'
) on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  department = excluded.department,
  initials = excluded.initials;
```

> New users created after running `auth_setup.sql` get a profile automatically via trigger.

## 4. Get API credentials

1. Go to **Project Settings** → **API**.
2. Copy:
   - **Project URL** → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
   - **service_role** key (secret) → `SUPABASE_SERVICE_KEY`

> Never put the service role key in the frontend or commit it to GitHub.

## 5. Configure Render (backend)

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | service_role key |
| `SUPABASE_ANON_KEY` | anon public key |
| `AUTH_SECRET` | long random string (fallback local auth) |

Redeploy the backend after saving.

## 6. Configure Vercel (frontend)

| Variable | Value |
|----------|--------|
| `VITE_API_BASE` | `/api` (recommended — uses Vercel proxy to Render) |
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

Redeploy the frontend after saving.

### Custom domain (resumeanalyzer.zayacodehub.in)

In **Supabase** → **Authentication** → **URL Configuration**:

| Setting | Value |
|---------|--------|
| Site URL | `https://resumeanalyzer.zayacodehub.in` |
| Redirect URLs | `https://resumeanalyzer.zayacodehub.in/**` |

Full DNS and Vercel steps: see [`CUSTOM_DOMAIN.md`](../CUSTOM_DOMAIN.md).

## 7. Verify

**Backend health:**

```
https://YOUR-RENDER-API.onrender.com/health
```

**Auth mode:**

```
https://YOUR-RENDER-API.onrender.com/auth/status
```

Expected when Supabase Auth is configured:

```json
{ "supabase_auth": true, "mode": "supabase" }
```

## 8. Use in the app

1. Open the app → **Sign in** with your Supabase recruiter email/password.
2. Session is managed by **Supabase Auth** (auto refresh, sign out).
3. Recruiter profile loads from `recruiter_profiles` table.
4. Jobs and candidates persist in Supabase through the FastAPI backend.

## Notes

- **With Supabase env vars:** real authentication via Supabase Auth.
- **Without Supabase env vars:** falls back to local recruiter accounts (`ramiyaa@company.com` / `Recruit@2024`).
- Resume files are not stored in Supabase yet — only screening results and metadata.
