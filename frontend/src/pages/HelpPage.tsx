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
              <strong>Quick start:</strong> On the login page, click <strong>Start demo session</strong>{" "}
              to explore sample jobs, candidates, and interviews instantly.
            </p>
            <p>
              <strong>Live screening:</strong> Open any job → upload resumes or click{" "}
              <strong>Run Demo Screening</strong> to rank bundled sample resumes with AI.
            </p>
            <p>
              <strong>Production setup:</strong> Configure Supabase on the backend (
              <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_KEY</code>) and run{" "}
              <code>supabase/schema.sql</code>.
            </p>
            <p>
              <strong>Real workflow:</strong> Click <strong>Enter workspace</strong> → create a job →
              upload PDF/DOCX resumes → shortlist candidates → schedule interviews → export CSV.
            </p>
          </CardBody>
        </Card>
      </PageBody>
    </>
  );
}
