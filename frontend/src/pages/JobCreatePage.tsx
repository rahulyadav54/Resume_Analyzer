import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useWorkspace } from "@/store/WorkspaceContext";
import { analyzeJobDescription, extractSkillsFromJd } from "@/lib/api";
import type { JdQuality } from "@/types";
import { DEFAULT_WEIGHTS, weightsTotal } from "@/lib/scoring";
import type { ScoringWeights } from "@/types";
import { Wand2 } from "lucide-react";

export function JobCreatePage() {
  const { addJob, aiSettings } = useWorkspace();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full Time");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [experience, setExperience] = useState("1–3 years");
  const [education, setEducation] = useState("Bachelor's degree");
  const [certifications, setCertifications] = useState("");
  const [weights, setWeights] = useState<ScoringWeights>({
    ...aiSettings.defaultWeights,
  });

  const [jdQuality, setJdQuality] = useState<JdQuality | null>(null);

  const extractMutation = useMutation({
    mutationFn: () => extractSkillsFromJd(description),
    onSuccess: (data) => setRequiredSkills(data.required_skills),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeJobDescription(description, requiredSkills),
    onSuccess: (data) => setJdQuality(data),
  });

  const total = weightsTotal(weights);

  const submit = async () => {
    if (!title.trim() || !description.trim()) return;
    const job = await addJob({
      title: title.trim(),
      department,
      location: location || "Remote",
      employmentType,
      description,
      requiredSkills: requiredSkills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      preferredSkills: preferredSkills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      experience,
      education,
      certifications: certifications.split(",").map((s) => s.trim()).filter(Boolean),
      status: "active",
      scoringWeights: weights,
    });
    navigate(`/jobs/${job.id}`);
  };

  const weightFields: { key: keyof ScoringWeights; label: string }[] = [
    { key: "requiredSkills", label: "Required Skills" },
    { key: "experience", label: "Experience" },
    { key: "projects", label: "Projects" },
    { key: "education", label: "Education" },
    { key: "certifications", label: "Certifications" },
    { key: "preferredSkills", label: "Preferred Skills" },
    { key: "keywords", label: "Keywords" },
  ];

  return (
    <>
      <PageHeader title="Create New Job" subtitle="Define requirements and AI matching configuration" />
      <PageBody>
        <div className="mx-auto max-w-3xl space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Basic Information</h3>
            </CardHeader>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Job Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI/ML Engineer" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Department</label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Location</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru · Hybrid" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Employment Type</label>
                <select
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option>Full Time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Job Description</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, and requirements…"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!description.trim() || analyzeMutation.isPending}
                onClick={() => analyzeMutation.mutate()}
              >
                {analyzeMutation.isPending ? "Analyzing…" : "Analyze JD quality"}
              </Button>
              {jdQuality && (
                <div className="rounded-lg border border-border bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      JD Quality: {jdQuality.jd_quality_score}%
                    </span>
                    <span className="text-xs uppercase text-slate-500">{jdQuality.clarity_rating}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{jdQuality.summary}</p>
                  {jdQuality.suggestions.length > 0 && (
                    <ul className="mt-2 list-disc pl-4 text-xs text-slate-600">
                      {jdQuality.suggestions.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Requirements</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!description.trim() || extractMutation.isPending}
                  onClick={() => extractMutation.mutate()}
                >
                  <Wand2 size={14} />
                  {extractMutation.isPending ? "Extracting…" : "Auto-extract skills"}
                </Button>
              </div>
            </CardHeader>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Required Skills</label>
                <Input
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="python, sql, machine learning"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Preferred Skills</label>
                <Input
                  value={preferredSkills}
                  onChange={(e) => setPreferredSkills(e.target.value)}
                  placeholder="docker, aws"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Experience</label>
                <Input value={experience} onChange={(e) => setExperience(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Education</label>
                <Input value={education} onChange={(e) => setEducation(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Certifications</label>
                <Input
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="AWS, Coursera ML"
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">AI Matching Configuration</h3>
                <span className={`text-xs font-medium ${total === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                  Total: {total}%
                </span>
              </div>
            </CardHeader>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {weightFields.map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                    <span>{label}</span>
                    <span>{weights[key]}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={weights[key]}
                    onChange={(e) =>
                      setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))
                    }
                    className="w-full accent-brand-600"
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-left text-xs text-brand-600 hover:underline sm:col-span-2"
                onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
              >
                Reset to defaults
              </button>
            </CardBody>
          </Card>

          <div className="flex justify-end gap-2 pb-8">
            <Button variant="secondary" onClick={() => navigate("/jobs")}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!title.trim() || !description.trim() || total !== 100}>
              Create Job & Analyze Candidates
            </Button>
          </div>
        </div>
      </PageBody>
    </>
  );
}
