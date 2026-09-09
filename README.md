# AI Recruit — Automated Resume Screening & ATS Platform

> An AI-driven Applicant Tracking System that automates resume screening, ranks candidates with explainable NLP scoring, and manages the full recruitment pipeline — from job creation to interview scheduling.

**For jury presentations and viva questions, see [JURY_PRESENTATION_GUIDE.md](JURY_PRESENTATION_GUIDE.md).**

---

## Project Overview

**AI Recruit** helps recruiters screen hundreds of resumes in minutes instead of days. The system:

1. Extracts text from PDF, DOCX, and TXT resumes
2. Parses structured profile data (education, projects, internships, certifications)
3. Matches candidate skills against job requirements
4. Computes resume–job-description similarity using TF-IDF + cosine similarity
5. Calculates a weighted final score with transparent breakdown
6. Ranks candidates and generates explainable AI recommendations
7. Manages the full hiring workflow in a recruiter dashboard

This is a **full-stack ATS simulation** built with Python/FastAPI, React/Vite, and Supabase — deployable on Vercel + Render.

---

## Key Innovations

| # | Innovation | Description |
|---|-----------|-------------|
| 1 | **Multi-factor explainable scoring** | 60% skill match + 25% TF-IDF similarity + 15% profile strength — every score is broken down and auditable |
| 2 | **Structured resume intelligence** | Regex + section-aware parsing extracts education, projects, internships, certifications, and keywords from unstructured text |
| 3 | **Auto skill extraction from JD** | Paste a job description; the system auto-detects required skills from a 50+ skill dictionary |
| 4 | **AI recommendation engine** | Generates strengths, concerns, priority, and next-action recommendations for every candidate |
| 5 | **End-to-end ATS workflow** | Jobs → Upload → Screen → Rank → Shortlist → Compare → Interview → Analytics in one platform |
| 6 | **Demo + production dual mode** | Instant demo session for presentations; Supabase-backed persistence for real data |
| 7 | **Batch screening at scale** | Bulk upload with per-job limits, batch progress tracking, and automatic re-ranking |
| 8 | **Side-by-side candidate comparison** | Compare 2+ candidates across 8 metrics with best-value highlighting |
| 9 | **Cloud-ready deployment** | Vercel (frontend) + Render (backend) + Supabase (PostgreSQL) |

---

## Features

### AI Screening Engine
- Upload multiple resumes (PDF, DOCX, TXT)
- Job description input via text or file upload
- Auto-extract required skills from job description
- Manual skill override
- TF-IDF vectorization + cosine similarity scoring
- Weighted multi-factor final score
- Automatic candidate ranking
- Shortlist / Review / Not Suitable decisions
- Matched and missing skills analysis
- AI-generated recommendations with strengths and concerns
- CSV report generation
- Batch upload with progress tracking

### Recruiter Dashboard
- Pipeline overview (active jobs, candidates, screened, shortlisted, interviews)
- Job creation with templates
- Drag-and-drop resume upload zone
- Per-job candidate management with search, filter, and sort
- Candidate detail with full score breakdown and evidence
- Side-by-side candidate comparison
- Shortlisted candidates view
- Interview scheduling and tracking
- Resume library per job
- Recruitment analytics (funnel, score distribution, top skills)
- Configurable AI settings (thresholds, scoring weights, explanation style)
- Email draft generator (shortlist / interview / reject)
- Individual candidate report export
- Demo session with pre-loaded sample data

### Backend API
- `POST /screen-resumes` — upload and screen resumes
- `POST /run-demo` — run screening on bundled sample resumes
- `POST /extract-skills-from-jd` — auto-extract skills from job description
- `GET /workspace` — fetch all jobs, candidates, interviews, resumes
- `POST /workspace/jobs` — create a job
- `PATCH /workspace/candidates/{id}/status` — update candidate status
- `POST /workspace/interviews` — schedule interview
- `POST /workspace/jobs/{id}/rerank` — re-rank candidates
- `GET /health` — API and database health check

### Database (Supabase)
- Jobs with scoring weights and skill requirements
- Candidates with full screening results and AI recommendations
- Interviews linked to candidates and jobs
- Resume file records with analysis status

---

## System Workflow

```
Login / Demo Session
       ↓
Create Job (title, description, required skills)
       ↓
Upload Resumes (PDF / DOCX / TXT) or Run Demo Screening
       ↓
┌──────────────────────────────────────────┐
│         AI SCREENING PIPELINE            │
│                                          │
│  Text Extraction                         │
│       ↓                                  │
│  Text Cleaning & Preprocessing           │
│       ↓                                  │
│  Structured Profile Parsing              │
│    (education, projects, internships,    │
│     certifications, keywords)            │
│       ↓                                  │
│  Skill Extraction & Matching             │
│       ↓                                  │
│  TF-IDF Cosine Similarity (Resume ↔ JD) │
│       ↓                                  │
│  Profile Score Calculation               │
│       ↓                                  │
│  Weighted Final Score                    │
│    (60% skills + 25% similarity          │
│     + 15% profile)                       │
│       ↓                                  │
│  Rank → Decision → AI Recommendation     │
│       ↓                                  │
│  Save to Database + CSV Report           │
└──────────────────────────────────────────┘
       ↓
Review Results (ranked list, score breakdown)
       ↓
Shortlist / Compare / Schedule Interview
       ↓
Analytics & Export
```

---

## AI Scoring Model

```
Final Score = (0.60 × Skill Score) + (0.25 × Similarity Score) + (0.15 × Profile Score)
```

| Component | Weight | Calculation |
|-----------|--------|-------------|
| Skill Score | 60% | Matched required skills / total required skills |
| Similarity Score | 25% | TF-IDF + cosine similarity (resume vs job description) |
| Profile Score | 15% | Education (+25), Internships (+30), Projects (+25), Certifications (+20) |

| Score | Decision | Action |
|-------|----------|--------|
| ≥ 75% | Shortlisted | Proceed to technical interview |
| 45–74% | Review | Schedule HR screening call |
| < 45% | Not Suitable | Archive for future roles |

---

## Architecture

```
React Dashboard (Vite + Tailwind CSS)
              ↓ REST API
       FastAPI Backend (Python + NLP)
              ↓
   Resume Processing Pipeline
   Extract → Clean → Parse → Match → Score → Rank → Recommend
              ↓
     Supabase PostgreSQL
     (jobs, candidates, interviews, resumes)
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, Recharts, Axios |
| Backend | Python, FastAPI, Uvicorn, Pydantic, Pandas, NumPy |
| AI / NLP | scikit-learn (TF-IDF, cosine similarity), regex parsing, custom skill dictionary |
| File Processing | pdfplumber, python-docx |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Folder Structure

```
Resume_Analyzer/
├── backend/
│   ├── api/
│   │   ├── app.py              # Main FastAPI app + screening endpoints
│   │   └── workspace.py        # Jobs, candidates, interviews CRUD
│   ├── src/
│   │   ├── text_extractor.py   # PDF/DOCX/TXT extraction
│   │   ├── text_cleaner.py     # Text preprocessing
│   │   ├── resume_parser.py    # Structured profile parsing
│   │   ├── skill_matcher.py    # Skill extraction & matching
│   │   ├── matching_engine.py  # TF-IDF scoring + ranking
│   │   ├── recommendation_engine.py  # AI recommendations
│   │   ├── screening_service.py      # Screening orchestration
│   │   ├── report_generator.py     # CSV export
│   │   └── db/                 # Supabase repository
│   ├── data_skills.py          # 50+ skill dictionary
│   ├── requirements.txt
│   └── main.py                 # CLI testing helper
├── frontend/
│   ├── src/
│   │   ├── pages/              # Dashboard, Jobs, Candidates, Analytics, etc.
│   │   ├── components/         # UI components, layout, upload zone
│   │   ├── store/              # Workspace context (state management)
│   │   ├── lib/                # API client, scoring, reports
│   │   └── data/               # Seed jobs and candidates
│   ├── public/config.json      # API base URL config
│   └── package.json
├── supabase/
│   └── schema.sql              # Database schema
├── resumes/                    # Sample resumes for demo
├── start_backend.ps1
├── start_frontend.ps1
├── render.yaml                 # Render deployment blueprint
├── DEPLOY.md                   # Deployment guide
├── JURY_PRESENTATION_GUIDE.md  # Jury/viva talking points
└── README.md
```

---

## Installation & Setup

### 1. Clone and enter project

```bash
git clone <your-repo-url>
cd Resume_Analyzer
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

### 3. Run backend

```bash
uvicorn api.app:app --reload
```

Backend: `http://127.0.0.1:8000` | API docs: `http://127.0.0.1:8000/docs`

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### 5. Database setup (optional, for production mode)

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL Editor
3. Set environment variables in `backend/.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   ```

See [supabase/SETUP.md](supabase/SETUP.md) and [DEPLOY.md](DEPLOY.md) for full deployment instructions.

---

## Quick Start (Demo Mode)

1. Start backend and frontend
2. Open `http://localhost:5173`
3. Click **"Start demo session"**
4. Open any job → click **"Run Demo Screening"**
5. View ranked candidates with scores and AI recommendations

No database required for demo mode.

---

## Sample Results

| Rank | Candidate | Score | Decision |
|------|-----------|------:|----------|
| 1 | Aditi Python Developer | 76.21% | Shortlisted |
| 2 | Neha Data Analyst | 46.37% | Review |
| 3 | Rahul Frontend Developer | 9.61% | Not Suitable |

---

## Future Improvements

- Transformer-based semantic embeddings (BERT / Sentence-BERT)
- LLM-powered resume parsing
- Bias and fairness analysis
- Multi-language resume support
- PDF report generation
- Real ATS integrations (LinkedIn, Naukri)
- Multi-recruiter collaboration

---

## Author

**Vaidehi Deore**

---

## License

This project is built for educational and portfolio purposes.
