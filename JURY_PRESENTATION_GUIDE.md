# AI Recruit — Jury Presentation Guide

Use this document when judges ask **“What is new or innovative here?”** and **“How does the system work?”**

---

## 30-Second Elevator Pitch

> **AI Recruit** is an end-to-end Applicant Tracking System (ATS) that automates first-round resume screening using NLP. Recruiters create a job, upload resumes (PDF/DOCX/TXT), and the system extracts skills, compares each resume against the job description using TF-IDF cosine similarity, scores candidates with a transparent weighted model, ranks them, and generates explainable AI recommendations — all inside a full recruiter dashboard with analytics, shortlisting, and interview scheduling.

---

## What Is the Innovation?

Traditional hiring requires recruiters to manually read hundreds of resumes. Our innovation is a **complete AI-assisted recruitment pipeline**, not just a scoring script.

| Innovation | What It Means |
|------------|---------------|
| **Multi-factor AI scoring** | Combines skill match (60%), resume–JD similarity (25%), and profile strength (15%) — not a single black-box number |
| **Explainable decisions** | Every candidate gets matched skills, missing skills, score breakdown, and a human-readable AI recommendation |
| **Structured resume intelligence** | Parses education, projects, internships, certifications, and keywords from unstructured resume text |
| **Auto skill extraction from JD** | Recruiters paste a job description; the system auto-detects required skills from a 50+ skill dictionary |
| **Full ATS workflow** | Jobs → Upload → Screen → Rank → Shortlist → Compare → Interview → Analytics — in one product |
| **Demo + production modes** | Instant demo for presentations; Supabase-backed persistence for real recruitment data |
| **Batch screening at scale** | Handles bulk uploads with per-job limits, batch processing, and automatic re-ranking |
| **Candidate comparison** | Side-by-side metric comparison to support fair, data-driven hiring decisions |
| **Cloud-ready deployment** | Frontend on Vercel + backend on Render + PostgreSQL via Supabase |

---

## One-Line Answers for Common Jury Questions

**Q: What problem does this solve?**  
A: Recruiters waste hours manually screening resumes. We automate the first screening round with consistent, explainable AI scoring.

**Q: What makes it different from a simple keyword matcher?**  
A: We use three signals — skill overlap, TF-IDF semantic similarity between resume and job description, and structured profile analysis (projects, internships, certifications) — plus an AI recommendation engine that explains *why* a candidate was shortlisted or rejected.

**Q: Is this just ChatGPT?**  
A: No. The core engine is custom NLP built with scikit-learn (TF-IDF + cosine similarity), regex-based structured parsing, and a curated skill dictionary — no external LLM API required. This makes it fast, offline-capable, and cost-free.

**Q: How do you ensure fairness / transparency?**  
A: Every score shows a matching breakdown (skill contribution, similarity contribution, profile contribution). Recruiters see matched vs missing skills and can override decisions manually.

**Q: What file formats are supported?**  
A: PDF, DOCX, and TXT resumes. Job descriptions can be typed or uploaded as a file.

**Q: Can it handle many resumes?**  
A: Yes. Batch upload with configurable limits (per request and per job), streaming file validation, and automatic re-ranking after each batch.

**Q: Is it deployable in production?**  
A: Yes. Supabase PostgreSQL stores jobs, candidates, interviews, and resumes. Deployed on Vercel (frontend) and Render (FastAPI backend).

---

## End-to-End Workflow (Explain This to the Jury)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RECRUITER WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

  1. LOGIN / DEMO
     ├── "Enter workspace" → live database mode
     └── "Start demo session" → pre-loaded sample jobs & candidates

  2. CREATE JOB
     ├── Title, department, location, employment type
     ├── Job description (text or file upload)
     ├── Required skills (manual or auto-extracted from JD)
     ├── Preferred skills, experience, education, certifications
     └── Custom scoring weights (optional)

  3. UPLOAD RESUMES
     ├── Drag-and-drop zone (PDF / DOCX / TXT)
     ├── Batch upload with progress tracking
     └── Or "Run Demo Screening" with bundled sample resumes

  4. AI SCREENING PIPELINE (Backend — automatic)
     │
     ├── Text Extraction (pdfplumber / python-docx)
     ├── Text Cleaning & Preprocessing
     ├── Structured Profile Parsing
     │     ├── Education detection
     │     ├── Project extraction
     │     ├── Internship detection
     │     ├── Certification matching
     │     └── TF-IDF keyword extraction
     ├── Skill Extraction (50+ skill dictionary)
     ├── Skill Matching (matched vs missing)
     ├── TF-IDF Cosine Similarity (Resume ↔ Job Description)
     ├── Profile Score (education + projects + internships + certs)
     ├── Final Weighted Score
     ├── Decision (Shortlisted / Review / Not Suitable)
     ├── AI Recommendation Generation
     └── CSV Report + Database Persistence

  5. REVIEW RESULTS
     ├── Ranked candidate list with match scores
     ├── Candidate detail page with full breakdown
     ├── Compare 2+ candidates side-by-side
     └── Analytics dashboard (funnel, score distribution, top skills)

  6. TAKE ACTION
     ├── Shortlist / reject / move to interview
     ├── Schedule interviews
     ├── Generate email drafts (shortlist / interview / reject)
     ├── Export individual candidate reports
     └── Download CSV screening report

  7. ANALYTICS
     ├── Recruitment funnel (Applications → Screened → Shortlisted → Interview → Selected)
     ├── Score distribution histogram
     └── Top matched skills across all candidates
```

---

## AI Scoring Model (Technical Detail)

### Final Score Formula

```
Final Score = (0.60 × Skill Score) + (0.25 × Similarity Score) + (0.15 × Profile Score)
```

| Component | Weight | How It Is Calculated |
|-----------|--------|----------------------|
| **Skill Score** | 60% | `(matched required skills / total required skills) × 100` |
| **Similarity Score** | 25% | TF-IDF vectorization + cosine similarity between resume and JD |
| **Profile Score** | 15% | Education (+25), Internships (+30), Projects (+25), Certifications (+20), capped at 100 |

### Decision Thresholds

| Score Range | Decision | Recommended Action |
|-------------|----------|-------------------|
| ≥ 75% | **Shortlisted** | Proceed to technical interview (High priority) |
| 45% – 74% | **Review** | Schedule HR screening call (Medium priority) |
| < 45% | **Not Suitable** | Archive for future roles (Low priority) |

### AI Recommendation Engine Output

For each candidate, the system generates:
- **Summary** — one-line fit assessment
- **Strengths** — matched skills, projects, internships, certifications
- **Concerns** — missing skills, gaps in experience
- **Recommended action** — next step for the recruiter
- **Priority** — High / Medium / Low
- **AI explanation** — full human-readable paragraph

---

## Platform Features (Module-by-Module)

### Dashboard
- Pipeline overview: active jobs, total candidates, AI-screened count, shortlisted, scheduled interviews
- Recent activity feed
- Quick actions: create job, upload resumes, load demo data

### Jobs Management
- Create, view, and manage job postings
- Per-job tabs: Overview, Candidates, Shortlisted, Interviews, Job Description, Analytics
- Upload zone with drag-and-drop
- Run demo screening or live screening
- Bulk candidate selection, delete, export CSV

### Candidates
- Global candidate list across all jobs
- Filter by status, search by name
- Status workflow: `applied → ai_screened → shortlisted → interview → selected / rejected`

### Candidate Detail
- Match score with visual breakdown (skill / similarity / profile contributions)
- Matched and missing skills with evidence notes
- Education, projects, internships, certifications, keywords
- AI insight card with strengths and concerns
- Actions: shortlist, schedule interview, reject, delete
- Email draft generator (shortlist / interview / reject templates)
- Download candidate report (JSON / text)

### Compare Candidates
- Side-by-side comparison of 2+ candidates
- Metrics: overall match, required skills, experience, projects, education, certifications, skill gaps
- Highlights best value per row

### Shortlisted
- Dedicated view of all shortlisted candidates across jobs
- Quick access for interview scheduling

### Interviews
- Schedule and track interviews (Technical, HR, etc.)
- Link interviews to candidates and jobs

### Resume Library
- Central repository of uploaded resume files per job
- Track analysis status and match scores

### Job Templates
- Pre-built job description templates for common roles
- Speeds up job creation

### Analytics
- Recruitment funnel visualization
- Score distribution (90–100, 75–89, 60–74, <60)
- Top matched skills bar chart
- Average match score across pipeline

### AI Settings
- Configure recommendation thresholds (Strong / Good / Consider)
- Adjust default scoring weights (required skills, experience, projects, education, etc.)
- Toggle semantic matching preference
- Choose explanation style (concise / detailed)

### Help & Support
- Quick-start guide for demo and production setup

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, Recharts, Axios |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic |
| **AI / NLP** | scikit-learn (TF-IDF, cosine similarity), regex-based parsing, custom skill dictionary |
| **File Processing** | pdfplumber (PDF), python-docx (DOCX) |
| **Database** | Supabase (PostgreSQL) — jobs, candidates, interviews, resumes |
| **Deployment** | Vercel (frontend), Render (backend), Blueprint via render.yaml |

---

## System Architecture

```
┌──────────────────────┐     REST API      ┌──────────────────────┐
│   React Dashboard    │ ◄──────────────► │   FastAPI Backend     │
│   (Vite + Tailwind)  │                  │   (Python + NLP)      │
│                      │                  │                       │
│  • Dashboard         │                  │  • /screen-resumes    │
│  • Jobs & Upload     │                  │  • /run-demo          │
│  • Candidates        │                  │  • /extract-skills    │
│  • Analytics         │                  │  • /workspace/*       │
│  • Compare           │                  │                       │
│  • AI Settings       │                  │  Pipeline:            │
└──────────────────────┘                  │  Extract → Clean →     │
         │                               │  Parse → Match →      │
         │                               │  Score → Rank →       │
         ▼                               │  Recommend → Report   │
┌──────────────────────┐                  └──────────┬────────────┘
│  Supabase (PostgreSQL)│ ◄─────────────────────────┘
│  jobs, candidates,    │
│  interviews, resumes    │
└──────────────────────┘
```

---

## Live Demo Script (5 Minutes)

1. **Login** → Click **"Start demo session"** (instant sample data)
2. **Dashboard** → Show pipeline metrics (jobs, candidates, shortlisted, interviews)
3. **Open a job** → Show job description and required skills
4. **Run Demo Screening** → AI ranks sample resumes in seconds
5. **Click top candidate** → Show score breakdown, matched/missing skills, AI recommendation
6. **Compare** → Select 2 candidates → side-by-side comparison
7. **Shortlist** → Move candidate to shortlisted status
8. **Schedule interview** → Create interview entry
9. **Analytics** → Show funnel and score distribution charts
10. **Export** → Download CSV report

---

## Sample Results (For Reference)

| Rank | Candidate | Score | Decision |
|------|-----------|------:|----------|
| 1 | Aditi Python Developer | 76.21% | Shortlisted |
| 2 | Neha Data Analyst | 46.37% | Review |
| 3 | Rahul Frontend Developer | 9.61% | Not Suitable |

**Why Aditi ranked first:** Strong skill alignment (Python, FastAPI, ML, Pandas), high resume–JD similarity, and solid project/internship profile.

**Why Rahul ranked last:** Frontend-focused skills did not match a Python/ML backend role — the system correctly identified the mismatch.

---

## Future Scope (If Asked)

- Transformer-based semantic embeddings (BERT / Sentence-BERT)
- LLM-powered resume parsing
- Bias and fairness auditing
- Multi-language resume support
- PDF report generation
- Real-time collaboration for hiring teams
- Integration with LinkedIn / Naukri APIs

---

## Key Learnings (Project Outcomes)

- Built a production-style full-stack ATS from scratch
- Applied NLP techniques (TF-IDF, cosine similarity) to real HR problems
- Designed explainable AI scoring instead of opaque predictions
- Integrated cloud database (Supabase) for persistent recruitment data
- Deployed a complete SaaS-style application (Vercel + Render)
