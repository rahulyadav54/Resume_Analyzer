import { useNavigate } from "react-router-dom";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SkillBadge } from "@/components/candidates/StatusBadge";
import { JOB_TEMPLATES } from "@/data/templates";
import { useWorkspace } from "@/store/WorkspaceContext";

export function TemplatesPage() {
  const { addJob } = useWorkspace();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Job Templates"
        subtitle="Reuse scoring configuration and skill requirements"
      />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-2">
          {JOB_TEMPLATES.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500">{t.department}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const job = addJob({
                        title: t.name,
                        department: t.department,
                        location: "Remote · India",
                        employmentType: "Full Time",
                        description: t.description,
                        requiredSkills: t.requiredSkills,
                        preferredSkills: t.preferredSkills,
                        experience: t.experience,
                        education: t.education,
                        certifications: [],
                        status: "active",
                        scoringWeights: t.scoringWeights,
                      });
                      navigate(`/jobs/${job.id}`);
                    }}
                  >
                    Use template
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <p className="mb-3 text-sm text-slate-600">{t.description}</p>
                <p className="mb-1 text-xs font-semibold text-slate-500">Required skills</p>
                <div className="mb-3 flex flex-wrap gap-1">
                  {t.requiredSkills.map((s) => (
                    <SkillBadge key={s} skill={s} tone="brand" />
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Experience: {t.experience} · Education: {t.education}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </PageBody>
    </>
  );
}
