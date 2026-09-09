import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

export function HelpPage() {
  return (
    <>
      <PageHeader title="Help & Support" subtitle="How to run screening and demos" />
      <PageBody>
        <Card>
          <CardBody className="prose-sm space-y-3 text-sm text-slate-700">
            <p>
              <strong>1.</strong> Start the FastAPI backend on port 8000 (
              <code>start_backend.ps1</code>).
            </p>
            <p>
              <strong>2.</strong> Start this app with <code>npm run dev</code> (port 5173).
            </p>
            <p>
              <strong>3.</strong> Create a job or open an existing one, then upload PDF/DOCX resumes.
            </p>
            <p>
              <strong>4.</strong> Use <em>Try Demo Data</em> on the Overview or Job page to rank
              bundled sample resumes via <code>POST /run-demo</code>.
            </p>
            <p>
              AI scores are decision support. Recruiters remain responsible for shortlist and hiring
              decisions.
            </p>
          </CardBody>
        </Card>
      </PageBody>
    </>
  );
}
