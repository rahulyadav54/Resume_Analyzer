import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWorkspace } from "@/store/WorkspaceContext";
import { weightsTotal } from "@/lib/scoring";
import type { ScoringWeights } from "@/types";

export function AISettingsPage() {
  const { aiSettings, updateAISettings, addToast } = useWorkspace();
  const w = aiSettings.defaultWeights;
  const total = weightsTotal(w);

  const setWeight = (key: keyof ScoringWeights, value: number) => {
    updateAISettings({
      defaultWeights: { ...w, [key]: value },
    });
  };

  return (
    <>
      <PageHeader
        title="AI Settings"
        subtitle="Configure matching thresholds and scoring defaults"
      />
      <PageBody>
        <div className="mx-auto max-w-3xl space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Matching Model</h3>
            </CardHeader>
            <CardBody className="space-y-3 text-sm text-slate-600">
              <p>
                Production screening uses TF-IDF cosine similarity + skill matching via the FastAPI
                backend. Semantic aliases (ML ↔ Machine Learning, AWS ↔ Amazon Web Services) are
                handled in the skill dictionary where available.
              </p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={aiSettings.semanticMatching}
                  onChange={(e) => updateAISettings({ semanticMatching: e.target.checked })}
                />
                Enable semantic matching preference (client flag)
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/50 p-3">
                <input
                  type="checkbox"
                  checked={aiSettings.biasBlindMode}
                  onChange={(e) => updateAISettings({ biasBlindMode: e.target.checked })}
                />
                <div>
                  <span className="font-medium text-slate-800">Bias-blind screening mode</span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Anonymizes names, contact info, and institutions before scoring for fairer hiring.
                  </p>
                </div>
              </label>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Recommendation Thresholds</h3>
            </CardHeader>
            <CardBody className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Strong Match min
                </label>
                <Input
                  type="number"
                  value={aiSettings.strongMatchMin}
                  onChange={(e) =>
                    updateAISettings({ strongMatchMin: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Good Match min
                </label>
                <Input
                  type="number"
                  value={aiSettings.goodMatchMin}
                  onChange={(e) => updateAISettings({ goodMatchMin: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Consider min
                </label>
                <Input
                  type="number"
                  value={aiSettings.considerMin}
                  onChange={(e) => updateAISettings({ considerMin: Number(e.target.value) })}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Default Scoring Weights</h3>
                <span className={`text-xs ${total === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                  Total {total}%
                </span>
              </div>
            </CardHeader>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["requiredSkills", "Required Skills"],
                  ["experience", "Experience"],
                  ["projects", "Projects"],
                  ["education", "Education"],
                  ["certifications", "Certifications"],
                  ["preferredSkills", "Preferred Skills"],
                  ["keywords", "Keywords"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                    <span>{label}</span>
                    <span>{w[key]}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={w[key]}
                    onChange={(e) => setWeight(key, Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">AI Explanation Style</h3>
            </CardHeader>
            <CardBody>
              <select
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
                value={aiSettings.explanationStyle}
                onChange={(e) =>
                  updateAISettings({
                    explanationStyle: e.target.value as "concise" | "detailed",
                  })
                }
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
              </select>
              <p className="mt-3 text-xs text-slate-400">
                API keys and model secrets are never stored in the frontend. Screening runs through
                the local FastAPI service.
              </p>
            </CardBody>
          </Card>

          <Button
            onClick={() => addToast({ title: "AI settings saved", type: "success" })}
          >
            Save settings
          </Button>
        </div>
      </PageBody>
    </>
  );
}
