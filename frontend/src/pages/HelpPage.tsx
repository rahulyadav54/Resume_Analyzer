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
              <strong>Sign in:</strong> With Supabase configured, use your recruiter account from{" "}
              <strong>Supabase Authentication → Users</strong>. Without Supabase, use{" "}
              <code>ramiyaa@company.com</code> / <code>Recruit@2024</code>.
            </p>
            <p>
              <strong>Sign out:</strong> Use <strong>Sign out</strong> in the sidebar or top bar to end your session.
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
