# Custom Domain Setup — resumeanalyzer.zayacodehub.in

Production URL: **https://resumeanalyzer.zayacodehub.in**

Architecture: custom domain → **Vercel** (frontend) → `/api` proxy → **Render** (backend) → **Supabase**

---

## Checklist

- [ ] **Step 1** — Add domain in Vercel
- [ ] **Step 2** — Add CNAME in DNS for zayacodehub.in
- [ ] **Step 3** — Update Render `CORS_ORIGINS` and redeploy
- [ ] **Step 4** — Confirm Vercel env `VITE_API_BASE=/api`
- [ ] **Step 5** — Update Supabase auth URLs (if using Supabase login)
- [ ] **Step 6** — Push latest code (includes `apiBase.ts` fix)
- [ ] **Step 7** — Test live site

---

## Step 1 — Vercel

1. Go to [vercel.com](https://vercel.com) → **Resume_Analyzer** project.
2. **Settings** → **Domains** → Add: `resumeanalyzer.zayacodehub.in`
3. Copy the DNS target Vercel shows (usually `cname.vercel-dns.com`).

---

## Step 2 — DNS (zayacodehub.in)

In your DNS panel (Cloudflare, GoDaddy, etc.):

| Field | Value |
|-------|--------|
| Type | `CNAME` |
| Name / Host | `resumeanalyzer` |
| Target | `cname.vercel-dns.com` (use exact value from Vercel) |
| TTL | Auto |

**Cloudflare:** use **DNS only** (grey cloud) until Vercel shows valid SSL.

Wait 5–30 minutes. Vercel should show **Valid Configuration**.

---

## Step 3 — Render CORS

**Render** → **ai-recruit-api** → **Environment**:

```
CORS_ORIGINS=https://resumeanalyzer.zayacodehub.in,https://resume-analyzer-lyart-kappa.vercel.app,http://localhost:5173
```

Save → **Manual Deploy** → Redeploy.

> Also updated in [`render.yaml`](render.yaml) for future blueprint deploys.

---

## Step 4 — Vercel environment

**Vercel** → **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `VITE_API_BASE` | `/api` |

Redeploy frontend after any env change.

---

## Step 5 — Supabase (if using Supabase Auth)

**Supabase** → **Authentication** → **URL Configuration**:

| Setting | Value |
|---------|--------|
| Site URL | `https://resumeanalyzer.zayacodehub.in` |
| Redirect URLs | `https://resumeanalyzer.zayacodehub.in/**` |

---

## Step 6 — Verify

1. Open https://resumeanalyzer.zayacodehub.in/login
2. Sign in or use **Explore demo**
3. Create job → upload resumes → confirm screening works
4. DevTools → Network: requests should hit `https://resumeanalyzer.zayacodehub.in/api/...`

**Health check via proxy:**

```
https://resumeanalyzer.zayacodehub.in/api/health
```

Expected: `{"status":"ok",...}`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Domain not found | Check CNAME `resumeanalyzer` → Vercel target |
| SSL pending | Wait after DNS propagates |
| Login fails on custom domain | Update Supabase Site URL + Redirect URLs |
| CORS errors | Update Render `CORS_ORIGINS`, redeploy |
| API calls localhost | Set `VITE_API_BASE=/api` on Vercel |
