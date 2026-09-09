# Deploy AI Recruit (Vercel + Render)

## 1. Deploy backend on Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect the repo — Render will read [`render.yaml`](render.yaml).
4. When prompted, set **`CORS_ORIGINS`** (you can update after Vercel deploy):
   ```
   https://YOUR-VERCEL-APP.vercel.app
   ```
5. Deploy and copy your API URL, e.g. `https://ai-recruit-api.onrender.com`.
6. Test: open `https://YOUR-API.onrender.com/health` → should return `{"status":"ok"}`.

### Render manual setup (without Blueprint)

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn api.app:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

---

## 2. Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the same GitHub repo.
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variable:**

   | Name | Value |
   |------|--------|
   | `VITE_API_BASE` | `https://YOUR-API.onrender.com` |

7. Deploy.

`vercel.json` already includes SPA rewrites for React Router.

---

## 3. Link frontend and backend

1. In **Render** → your web service → **Environment** → set:
   ```
   CORS_ORIGINS=https://YOUR-VERCEL-APP.vercel.app
   ```
   Add preview URLs if needed (comma-separated, no trailing slash).
2. Redeploy Render after changing CORS.
3. In **Vercel**, redeploy if you change `VITE_API_BASE`.

---

## 4. Verify production

1. Open your Vercel URL → log in → **Overview**.
2. Click **Try Demo Data** (calls `POST /run-demo` on Render).
3. Open a job → **Upload Resumes** → upload PDF/DOCX files.

---

## Notes

- **Free Render** services sleep after ~15 min idle; first request may take 30–60s.
- Uploaded files on Render use ephemeral disk (fine for demos; not for long-term storage).
- Demo resumes live in `/resumes` at repo root and work when the full repo is deployed.
- Never commit `.env` files with secrets.
