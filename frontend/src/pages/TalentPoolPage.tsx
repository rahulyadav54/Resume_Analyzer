import { Link } from "react-router-dom";
import { Archive, Briefcase, Trash2 } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/MetricCard";
import { useWorkspace } from "@/store/WorkspaceContext";
import { formatRelativeDate } from "@/lib/utils";

export function TalentPoolPage() {
  const { talentPool, removeFromTalentPool } = useWorkspace();

  return (
    <>
      <PageHeader
        title="Talent Pool"
        subtitle="Strong candidates saved for future roles — never lose good talent to role mismatch"
      />
      <PageBody>
        {talentPool.length === 0 ? (
          <EmptyState
            title="No saved candidates yet"
            description="When you reject someone who is strong but not right for this role, save them to the talent pool from their candidate profile."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {talentPool.map((entry) => (
              <Card key={entry.id}>
                <CardBody className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{entry.candidateName}</h3>
                      <p className="text-sm text-slate-500">{entry.email ?? "No email on file"}</p>
                    </div>
                    <Badge tone="brand">{Math.round(entry.finalScore)}% match</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Briefcase className="h-3.5 w-3.5" />
                    Saved from {entry.sourceJobTitle}
                  </div>
                  {entry.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.matchedSkills.slice(0, 6).map((skill) => (
                        <Badge key={skill} tone="neutral">{skill}</Badge>
                      ))}
                    </div>
                  )}
                  {entry.notes && (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{entry.notes}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">
                      Saved {formatRelativeDate(entry.savedAt)}
                    </span>
                    <div className="flex gap-2">
                      {entry.candidateId && (
                        <Link to={`/candidates/${entry.candidateId}`}>
                          <Button size="sm" variant="secondary">View profile</Button>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => removeFromTalentPool(entry.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-6 border-brand-100 bg-brand-50/40">
          <CardBody className="flex gap-3 p-4 text-sm text-slate-600">
            <Archive className="h-5 w-5 shrink-0 text-brand-600" />
            <p>
              The talent pool solves role mismatch: candidates who scored well but were rejected for
              this specific job remain available for future openings without re-screening from scratch.
            </p>
          </CardBody>
        </Card>
      </PageBody>
    </>
  );
}
