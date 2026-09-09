import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  FileText,
  Headphones,
  Mail,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const quickGuides = [
  {
    icon: Workflow,
    title: "Recruitment Workflow",
    description: "End-to-end process from job creation to interview scheduling.",
    link: "#workflow",
  },
  {
    icon: Sparkles,
    title: "AI Screening",
    description: "How scoring, ranking, and candidate recommendations work.",
    link: "#ai-screening",
  },
  {
    icon: Shield,
    title: "Account & Access",
    description: "Sign in, sign out, sessions, and workspace permissions.",
    link: "#account",
  },
  {
    icon: FileText,
    title: "Reports & Export",
    description: "CSV exports, candidate reports, and audit-ready summaries.",
    link: "#reports",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Create a job requisition",
    detail: "Go to Jobs → Create Job. Add title, department, job description, and required skills. Use the JD quality analyzer to improve clarity before publishing.",
  },
  {
    step: "02",
    title: "Upload candidate resumes",
    detail: "Open the job and upload PDF, DOCX, or TXT files in bulk. The system parses profiles and runs AI screening automatically.",
  },
  {
    step: "03",
    title: "Review ranked results",
    detail: "Inspect match scores, skill gaps, integrity checks, and AI recommendations. Use Compare to evaluate finalists side by side.",
  },
  {
    step: "04",
    title: "Shortlist and schedule interviews",
    detail: "Move strong candidates to Shortlisted, generate interview questions, and schedule technical or HR rounds from the Interviews module.",
  },
  {
    step: "05",
    title: "Track pipeline analytics",
    detail: "Monitor funnel metrics, score distribution, and top skills from Analytics. Export results for hiring committee review.",
  },
];

const faqs = [
  {
    question: "How does AI Recruit score candidates?",
    answer:
      "Each resume is evaluated using a transparent weighted model: 60% skill match against job requirements, 25% TF-IDF semantic similarity between resume and job description, and 15% profile strength (education, projects, internships, certifications). Every score includes a full breakdown.",
  },
  {
    question: "What is bias-blind screening mode?",
    answer:
      "When enabled in AI Settings, the system anonymizes identifying details (name, contact, institution) before scoring and compares standard vs blind results. Use this for fairer first-round evaluation across diverse applicant pools.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "Resumes: PDF, DOCX, and TXT. Job descriptions can be entered as text or uploaded as a file. Batch upload supports multiple candidates per job with duplicate detection.",
  },
  {
    question: "How do I sign out securely?",
    answer:
      "Use Sign out in the sidebar footer or top navigation bar. Your session is cleared immediately and you are returned to the login screen.",
  },
  {
    question: "Can I use demo data for training?",
    answer:
      "Yes. From the login page, choose Explore demo to load sample jobs and candidates without affecting live data. Exit demo from the dashboard banner when you are ready to work in the production workspace.",
  },
  {
    question: "Who can access this portal?",
    answer:
      "Access is restricted to authorized Talent Acquisition and HR team members. Contact your HR administrator to request recruiter account provisioning.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-slate-900">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-slate-600">{answer}</p>}
    </div>
  );
}

export function HelpPage() {
  return (
    <>
      <PageHeader
        title="Help & Support"
        subtitle="Internal recruiter knowledge base and operational guidance"
      />
      <PageBody>
        <div className="mx-auto max-w-5xl space-y-6">
          <Card className="overflow-hidden border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-slate-50">
            <CardBody className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">Internal Use Only</Badge>
                  <Badge tone="neutral">Talent Acquisition</Badge>
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  AI Recruit — Recruiter Operations Center
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                  This portal supports first-round resume screening, candidate ranking, shortlisting,
                  and interview coordination. Use the guides below for day-to-day workflows and
                  platform policies.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link to="/jobs/new">
                  <Button size="sm">Create Job</Button>
                </Link>
                <Link to="/settings/ai">
                  <Button variant="secondary" size="sm">AI Settings</Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {quickGuides.map(({ icon: Icon, title, description, link }) => (
              <a key={title} href={link} className="group block">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardBody className="flex gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                  </CardBody>
                </Card>
              </a>
            ))}
          </div>

          <div id="workflow">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-slate-900">Standard Recruitment Workflow</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {workflowSteps.map(({ step, title, detail }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{detail}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div id="ai-screening">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-slate-900">AI Screening Reference</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-3 text-sm text-slate-600">
                <p>
                  <strong className="text-slate-800">Scoring model:</strong> 60% skills · 25%
                  resume–JD similarity · 15% profile strength
                </p>
                <p>
                  <strong className="text-slate-800">Decision bands:</strong> ≥75% Shortlisted ·
                  45–74% Review · &lt;45% Not Suitable
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Integrity checker flags unverified skills and keyword stuffing</li>
                  <li>Duplicate detector catches repeat applicants by email, phone, or name</li>
                  <li>Interview questions are auto-generated from skill gaps</li>
                  <li>All recommendations are explainable — no black-box scoring</li>
                </ul>
                <Link to="/settings/ai" className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
                  Configure thresholds in AI Settings →
                </Link>
              </CardBody>
            </Card>
            </div>

            <div id="account">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Account & Security</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-3 text-sm text-slate-600">
                <p>
                  Sign in with your authorized recruiter credentials. Sessions are secured with
                  token-based authentication and can be ended at any time via Sign out.
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Do not share login credentials with non-HR personnel</li>
                  <li>Use demo mode only for training — not for live hiring decisions</li>
                  <li>Candidate data is confidential and for internal hiring use only</li>
                  <li>Report access issues to HR Operations or IT Support</li>
                </ul>
              </CardBody>
            </Card>
            </div>
          </div>

          <div id="reports">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-slate-900">Reports & Documentation</h3>
              </div>
            </CardHeader>
            <CardBody className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
              <div>
                <p className="font-medium text-slate-800">Available exports</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>CSV screening results per job</li>
                  <li>Individual candidate evaluation reports</li>
                  <li>Analytics funnel and score distribution views</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-800">Best practices</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>Review AI scores alongside human judgment</li>
                  <li>Document shortlist rationale in candidate notes</li>
                  <li>Use Compare before final interview panel selection</li>
                </ul>
              </div>
            </CardBody>
          </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-slate-900">Frequently Asked Questions</h3>
              </div>
            </CardHeader>
            <CardBody className="px-6 py-2">
              {faqs.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </CardBody>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardBody className="flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Headphones className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">HR Operations Support</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    For account access, hiring policy questions, or workflow escalations.
                  </p>
                  <a
                    href="mailto:hr-operations@company.com"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    hr-operations@company.com
                  </a>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                  <Users className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Platform Administrator</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    For technical issues, database connectivity, or system configuration.
                  </p>
                  <a
                    href="mailto:it-support@company.com"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    it-support@company.com
                  </a>
                </div>
              </CardBody>
            </Card>
          </div>

          <p className="text-center text-xs text-slate-400">
            AI Recruit v1.0 · Internal Talent Acquisition Platform · Confidential
          </p>
        </div>
      </PageBody>
    </>
  );
}
