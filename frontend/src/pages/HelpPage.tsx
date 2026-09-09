import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

export function HelpPage() {
  return (
    <>
      <PageHeader title="Help & Support" subtitle="How to use AI Recruit" />
      <PageBody>
        <Card>
          <CardBody className="space-y-3 text-sm text-slate-700">
            <p>
              <strong>1.</strong> Configure Supabase on the backend (
              <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_KEY</code>) and run{" "}
              <code>supabase/schema.sql</code>.
            </p>
            <p>
              <strong>2.</strong> Start the FastAPI backend and Vite frontend.
            </p>
            <p>
              <strong>3.</strong> Create a job with title, description, and required skills.
            </p>
            <p>
              <strong>4.</strong> Open the job → upload real resumes (PDF/DOCX) → view ranked
              candidates with AI explanations.
            </p>
            <p>
              <strong>5.</strong> Shortlist candidates, schedule interviews, and export CSV
              reports.
            </p>
          </CardBody>
        </Card>
      </PageBody>
    </>
  );
}
