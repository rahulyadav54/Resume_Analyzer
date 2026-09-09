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
4. Confirm tables exist under **Table Editor**: `jobs`, `candidates`, `interviews`, `resumes`.

## 3. Get API credentials

1. Go to **Project Settings** → **API**.
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_KEY`

> Never put the service role key in the frontend or commit it to GitHub.

## 4. Configure Render (backend)

In your Render web service → **Environment**:

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (service_role key) |

Redeploy the backend after saving.

## 5. Verify

Open:

```
https://YOUR-RENDER-API.onrender.com/health
```

Expected:

```json
{
  "status": "ok",
  "database": { "enabled": true, "status": "ok" }
}
```

## 6. Use in the app

1. Open your Vercel app and log in.
2. Dashboard should show **Supabase connected**.
3. Create a job → data persists in Supabase.
4. Upload resumes on a job → candidates are saved to the database.

## Notes

- The frontend talks to Supabase **through the FastAPI backend** (secure).
- Without Supabase env vars, the app still works using browser local storage.
- Resume files are not stored in Supabase yet — only screening results and metadata.
