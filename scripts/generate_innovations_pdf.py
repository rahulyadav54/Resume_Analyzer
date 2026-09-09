"""Generate AI Recruit innovations PDF for jury presentation."""

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "AI_Recruit_Innovations_and_Novelty.pdf"


class InnovationsPDF(FPDF):
    def __init__(self) -> None:
        super().__init__()
        font_dir = Path(__file__).resolve().parents[2]
        dejavu = None
        for candidate in [
            Path(__file__).resolve().parent / "fonts" / "DejaVuSans.ttf",
            Path(__file__).resolve().parents[1] / "fonts" / "DejaVuSans.ttf",
        ]:
            if candidate.exists():
                dejavu = candidate
                break

        if dejavu:
            self.add_font("DejaVu", "", str(dejavu))
            self._body_font = "DejaVu"
        else:
            self._body_font = "Helvetica"

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font(self._body_font, size=8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"AI Recruit | Innovations & Novelty | Page {self.page_no()}", align="C")

    def section_title(self, title: str) -> None:
        self.ln(4)
        self.set_font(self._body_font, size=13)
        self.set_text_color(30, 41, 59)
        self.multi_cell(0, 8, title)
        self.ln(1)
        self.set_draw_color(99, 102, 241)
        self.set_line_width(0.4)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)

    def body_text(self, text: str, size: int = 10) -> None:
        self._ensure_space(12)
        self.set_x(self.l_margin)
        self.set_font(self._body_font, size=size)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text: str, indent: int = 6) -> None:
        self._ensure_space(8)
        x = self.l_margin + indent
        self.set_x(x)
        self.set_font(self._body_font, size=10)
        self.set_text_color(51, 65, 85)
        self.multi_cell(self.w - self.r_margin - x, 5.5, f"- {text}")
        self.ln(1)

    def _ensure_space(self, height: float) -> None:
        if self.get_y() + height > self.h - 18:
            self.add_page()
        self.set_x(self.l_margin)

    def table_row(self, problem: str, solution: str, unique: str, fill: bool = False) -> None:
        if fill:
            self.set_fill_color(248, 250, 252)
        else:
            self.set_fill_color(255, 255, 255)

        col_w = (self.w - self.l_margin - self.r_margin) / 3
        y0 = self.get_y()
        x0 = self.l_margin

        self.set_font(self._body_font, size=8)
        self.set_text_color(30, 41, 59)

        h_problem = self._cell_height(col_w, problem)
        h_solution = self._cell_height(col_w, solution)
        h_unique = self._cell_height(col_w, unique)
        row_h = max(h_problem, h_solution, h_unique, 8)

        if y0 + row_h > self.h - 20:
            self.add_page()
            y0 = self.get_y()
            x0 = self.l_margin

        self.set_xy(x0, y0)
        self.multi_cell(col_w, 4.5, problem, border=1, fill=fill, align="L")
        y1 = self.get_y()

        self.set_xy(x0 + col_w, y0)
        self.multi_cell(col_w, 4.5, solution, border=1, fill=fill, align="L")
        y2 = self.get_y()

        self.set_xy(x0 + 2 * col_w, y0)
        self.multi_cell(col_w, 4.5, unique, border=1, fill=fill, align="L")
        y3 = self.get_y()

        self.set_xy(self.l_margin, max(y1, y2, y3))

    def _cell_height(self, width: float, text: str) -> float:
        lines = self.multi_cell(width, 4.5, text, dry_run=True, output="LINES")
        return max(8, len(lines) * 4.5 + 2)


def build_pdf() -> None:
    pdf = InnovationsPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    pdf.set_font(pdf._body_font, size=22)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 12, "AI Recruit", ln=True)
    pdf.set_font(pdf._body_font, size=14)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 8, "Innovations, Novelty & Jury Presentation Guide", ln=True)
    pdf.ln(2)
    pdf.set_font(pdf._body_font, size=10)
    pdf.set_text_color(100, 116, 139)
    pdf.multi_cell(
        0,
        5.5,
        "Automated Resume Screening & Applicant Tracking System\n"
        "Author: Ramiyaa | Full-stack ATS with explainable NLP (no paid AI API required)",
    )
    pdf.ln(6)

    pdf.section_title("One-Line Summary")
    pdf.body_text(
        "AI Recruit is an end-to-end Applicant Tracking System that goes beyond simple resume "
        "keyword matching. It combines explainable multi-factor NLP scoring, ethical bias-blind "
        "screening, resume integrity verification, JD quality analysis, interview question "
        "generation, and a full recruiter workflow in one cloud-deployable platform without "
        "requiring any paid AI API."
    )

    pdf.section_title("Previous Problems vs Our Solution (with Uniqueness)")
    col_w = (pdf.w - pdf.l_margin - pdf.r_margin) / 3
    pdf.set_font(pdf._body_font, size=8)
    pdf.set_fill_color(99, 102, 241)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(col_w, 7, "Previous Problem", border=1, fill=True, align="C")
    pdf.cell(col_w, 7, "Our Solution", border=1, fill=True, align="C")
    pdf.cell(col_w, 7, "Uniqueness", border=1, fill=True, align="C")
    pdf.ln()

    rows = [
        (
            "Manual resume review takes days for hundreds of applications",
            "Batch AI screening ranks candidates in seconds",
            "Full pipeline, not a single-page upload tool",
        ),
        (
            "Inconsistent scoring between recruiters",
            "Weighted formula: 60% Skills + 25% TF-IDF + 15% Profile",
            "Same input gives same output; auditable",
        ),
        (
            "Black-box scores with no explanation",
            "Score breakdown + matched/missing skills + AI recommendation",
            "Explainable AI recruiters can trust",
        ),
        (
            "Unconscious bias from name, college, gender cues",
            "Bias-Blind Screening Mode anonymizes identity before scoring",
            "DEI-focused ethical hiring feature",
        ),
        (
            "Resume fraud and keyword stuffing",
            "Resume Integrity Checker flags unverified skills",
            "Verifies claims, not just keyword overlap",
        ),
        (
            "Poor job descriptions produce poor matches",
            "JD Quality Analyzer scores and improves JD before screening",
            "Fixes hiring accuracy at the source",
        ),
        (
            "Recruiters unsure what to ask in interviews",
            "Interview Question Generator from skill gaps and profile",
            "Screening extends to interview preparation",
        ),
        (
            "Duplicate applications waste recruiter time",
            "Duplicate Detector (email, phone, fuzzy name 88%+)",
            "Real daily recruiter problem most demos ignore",
        ),
        (
            "Unstructured PDF/DOCX resumes",
            "Structured parsing: education, projects, internships, certs",
            "Enables profile scoring and integrity checks",
        ),
        (
            "Dependence on ChatGPT or paid AI APIs",
            "Custom NLP: TF-IDF, skill dictionary, rule-based engine",
            "Zero API cost; works offline",
        ),
        (
            "Scattered tools (Excel, email, folders)",
            "Full ATS: Login to Jobs to Screen to Interview to Analytics",
            "Complete recruiter portal in one product",
        ),
        (
            "Dummy login with no real authentication",
            "Supabase Auth + recruiter profiles + session restore",
            "Production-ready secure login",
        ),
        (
            "Login page stuck or not visible",
            "Immediate login UI + session timeout + route guards",
            "Reliable auth UX for demo and production",
        ),
        (
            "Separate demo and production builds",
            "Demo mode + Live Supabase workspace in one codebase",
            "One app for jury demo and real deployment",
        ),
    ]

    for i, row in enumerate(rows):
        pdf.table_row(*row, fill=i % 2 == 0)

    pdf.add_page()
    pdf.section_title("Exact Technical Innovations (15 Points)")
    innovations = [
        "Multi-Factor Explainable Scoring: Final = 60% Skill + 25% Similarity + 15% Profile",
        "Bias-Blind Screening Mode: strips identity; compares standard vs blind score",
        "Resume Integrity Checker: integrity score 0-100% and risk level low/medium/high",
        "JD Quality Analyzer: clarity rating and improvement suggestions before screening",
        "Smart Interview Question Generator: 5-8 questions from gaps and profile",
        "Duplicate Candidate Detector: email, phone, and fuzzy name matching",
        "Structured Resume Intelligence: section-aware parsing from PDF/DOCX/TXT",
        "AI Recommendation Engine: summary, strengths, concerns, action, priority (rule-based)",
        "End-to-End ATS Workflow: dashboard, jobs, candidates, shortlist, interviews, analytics",
        "Supabase Real Authentication: email/password, JWT, recruiter_profiles with RLS",
        "Demo + Production Dual Mode: instant demo or live database workspace",
        "Batch Screening at Scale: bulk upload, progress tracking, auto re-rank, CSV export",
        "Side-by-Side Candidate Comparison: 8 metrics with best-value highlighting",
        "Zero External AI API Dependency: scikit-learn TF-IDF + custom Python logic",
        "Cloud-Ready Deployment: React + FastAPI + Supabase on Vercel + Render",
    ]
    for item in innovations:
        pdf.bullet(item)

    pdf.section_title("Scoring Model")
    pdf.body_text(
        "Final Score = (60% x Skill Match) + (25% x Resume-JD Similarity) + (15% x Profile Strength)\n\n"
        "Skill Match: 50+ skill dictionary + regex overlap with job requirements\n"
        "Similarity: TF-IDF vectorization + cosine similarity between resume and JD\n"
        "Profile: education, projects, internships, certifications from structured parsing\n\n"
        "Decisions: >= 75% Shortlisted | 45-74% Review | < 45% Not Suitable"
    )

    pdf.section_title("Novelty Statement (For Jury / Report)")
    pdf.body_text(
        "Traditional resume screening tools either rely on expensive LLM APIs or simple keyword "
        "matching, producing opaque scores with no ethical safeguards. AI Recruit introduces a "
        "transparent, multi-signal NLP pipeline combined with bias-blind screening, resume "
        "integrity verification, JD quality analysis, and interview question generation - all "
        "within a production-grade ATS workflow backed by Supabase authentication and PostgreSQL "
        "persistence, deployable without any external AI API costs."
    )

    pdf.section_title("30-Second Elevator Pitch")
    pdf.body_text(
        "AI Recruit is an end-to-end Applicant Tracking System that automates first-round resume "
        "screening using NLP. Recruiters create a job, upload resumes (PDF/DOCX/TXT), and the "
        "system extracts skills, compares each resume against the job description using TF-IDF "
        "cosine similarity, scores candidates with a transparent weighted model, ranks them, and "
        "generates explainable AI recommendations - all inside a full recruiter dashboard with "
        "analytics, shortlisting, and interview scheduling."
    )

    pdf.section_title("Quick Jury Q&A")
    qa = [
        ("What is the innovation?", "Explainable, ethical, end-to-end ATS - not just a resume scorer."),
        ("Is this just ChatGPT?", "No. Core engine is custom NLP (TF-IDF, skill dictionary, rules) - no API key."),
        ("How is it deployed?", "Frontend on Vercel, backend on Render, database and auth on Supabase."),
        ("Does login work?", "Yes. Supabase Auth with recruiter profiles; local fallback for demo."),
        ("What file formats?", "PDF, DOCX, and TXT resumes; JD via text or file upload."),
        ("How do you ensure fairness?", "Bias-blind mode + transparent score breakdown + manual override."),
    ]
    for q, a in qa:
        pdf._ensure_space(16)
        pdf.set_font(pdf._body_font, size=10)
        pdf.set_text_color(30, 41, 59)
        pdf.multi_cell(0, 5.5, f"Q: {q}")
        pdf.set_x(pdf.l_margin)
        pdf.set_text_color(71, 85, 105)
        pdf.multi_cell(0, 5.5, f"A: {a}")
        pdf.ln(2)

    pdf.section_title("Tech Stack")
    pdf.body_text(
        "Frontend: React 19, Vite, Tailwind CSS, TypeScript\n"
        "Backend: Python, FastAPI, Uvicorn, scikit-learn\n"
        "Database & Auth: Supabase (PostgreSQL + Auth)\n"
        "Deploy: Vercel (frontend) + Render (backend)"
    )

    pdf.section_title("Typical Student Project vs AI Recruit")
    comparisons = [
        "One score -> Multi-factor score + breakdown + recommendation",
        "Keyword only -> Skills + TF-IDF + profile strength",
        "No explanation -> Matched/missing skills + AI insight card",
        "No ethics -> Bias-blind screening mode",
        "No fraud check -> Resume integrity checker",
        "No interview help -> Auto-generated interview questions",
        "Single page -> Full recruiter dashboard + ATS workflow",
        "Needs OpenAI -> Custom NLP, no API key",
        "No database -> Supabase persistence + real auth",
        "Not deployed -> Vercel + Render production deployment",
    ]
    for item in comparisons:
        pdf.bullet(item)

    pdf.output(str(OUTPUT))
    print(f"PDF created: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
