import { Download, Shield } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/MetricCard";
import { useWorkspace } from "@/store/WorkspaceContext";
import { formatRelativeDate } from "@/lib/utils";

const actionLabels: Record<string, string> = {
  candidate_status_changed: "Status change",
  batch_screening_completed: "Batch screening",
  talent_pool_added: "Talent pool",
  talent_pool_removed: "Talent pool",
  comparison_exported: "Comparison export",
};

export function AuditTrailPage() {
  const { auditLogs, exportAuditTrail } = useWorkspace();

  return (
    <>
      <PageHeader
        title="Audit Trail"
        subtitle="Compliance-ready log of screening, status changes, and recruiter actions"
      />
      <PageBody>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Shield className="h-4 w-4 text-brand-600" />
            {auditLogs.length} recorded event{auditLogs.length === 1 ? "" : "s"}
          </div>
          <Button size="sm" variant="secondary" onClick={() => exportAuditTrail()}>
            <Download className="h-4 w-4" />
            Export audit CSV
          </Button>
        </div>

        {auditLogs.length === 0 ? (
          <EmptyState
            title="No audit events yet"
            description="Actions like screening, shortlisting, and talent pool saves are logged automatically."
          />
        ) : (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900">Hiring activity log</h3>
            </CardHeader>
            <CardBody className="divide-y divide-border p-0">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">
                        {actionLabels[entry.action] ?? entry.action}
                      </Badge>
                      <span className="text-sm font-medium text-slate-900">{entry.target}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{entry.details}</p>
                    <p className="text-xs text-slate-400">By {entry.actor}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatRelativeDate(entry.createdAt)}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </PageBody>
    </>
  );
}
