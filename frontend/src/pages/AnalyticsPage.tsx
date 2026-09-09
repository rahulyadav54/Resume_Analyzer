import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useWorkspace } from "@/store/WorkspaceContext";

export function AnalyticsPage() {
  const { candidates, jobs, interviews } = useWorkspace();
  const screened = candidates.filter((c) => c.status !== "applied").length;
  const shortlisted = candidates.filter((c) =>
    ["shortlisted", "interview", "selected"].includes(c.status)
  ).length;
  const interviewCount = interviews.length;
  const avgMatch = candidates.length
    ? Math.round(candidates.reduce((a, c) => a + c.final_score, 0) / candidates.length)
    : 0;

  const pipeline = [
    { stage: "Applications", count: candidates.length },
    { stage: "AI Screened", count: screened },
    { stage: "Shortlisted", count: shortlisted },
    { stage: "Interview", count: interviewCount },
    {
      stage: "Selected",
      count: candidates.filter((c) => c.status === "selected").length,
    },
  ];

  const scoreBuckets = [
    { range: "90–100", count: candidates.filter((c) => c.final_score >= 90).length },
    { range: "75–89", count: candidates.filter((c) => c.final_score >= 75 && c.final_score < 90).length },
    { range: "60–74", count: candidates.filter((c) => c.final_score >= 60 && c.final_score < 75).length },
    { range: "<60", count: candidates.filter((c) => c.final_score < 60).length },
  ];

  const skillCounts: Record<string, number> = {};
  candidates.forEach((c) => {
    c.matched_skills.forEach((s) => {
      skillCounts[s] = (skillCounts[s] ?? 0) + 1;
    });
  });
  const skillsDist = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  return (
    <>
      <PageHeader title="Analytics" subtitle="Recruitment funnel and screening quality" />
      <PageBody>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Applications" value={candidates.length} />
          <MetricCard
            label="AI Screening Rate"
            value={`${candidates.length ? Math.round((screened / candidates.length) * 100) : 0}%`}
          />
          <MetricCard
            label="Shortlist Rate"
            value={`${candidates.length ? Math.round((shortlisted / candidates.length) * 100) : 0}%`}
          />
          <MetricCard
            label="Interview Rate"
            value={`${candidates.length ? Math.round((interviewCount / candidates.length) * 100) : 0}%`}
          />
          <MetricCard label="Avg Match Score" value={`${avgMatch}%`} />
          <MetricCard
            label="Est. Time Saved"
            value={`${Math.max(1, Math.round(candidates.length * 0.18))}h`}
            hint="vs manual screen"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Candidate Pipeline</h3>
            </CardHeader>
            <CardBody className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Match Score Distribution</h3>
            </CardHeader>
            <CardBody className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-sm font-semibold">Skills Distribution (matched)</h3>
            </CardHeader>
            <CardBody className="h-64">
              {skillsDist.length === 0 ? (
                <p className="text-sm text-slate-500">No skill data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsDist} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4338CA" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Active jobs tracked: {jobs.filter((j) => j.status === "active").length}
        </p>
      </PageBody>
    </>
  );
}
