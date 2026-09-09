import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getApiBase, healthCheck, isUsingLocalApi } from "@/lib/api";
import { useWorkspace } from "@/store/WorkspaceContext";

type HealthState =
  | { kind: "loading" }
  | { kind: "ok"; dbEnabled: boolean }
  | { kind: "error"; message: string };

export function ConnectionBanner() {
  const { demoMode, dbEnabled, refreshFromDb } = useWorkspace();
  const [health, setHealth] = useState<HealthState>({ kind: "loading" });
  const apiBase = getApiBase();
  const usingLocalApi = isUsingLocalApi() && !import.meta.env.DEV;

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setHealth({ kind: "loading" });
      try {
        const result = await healthCheck();
        if (cancelled) return;
        setHealth({
          kind: "ok",
          dbEnabled: Boolean(result.database?.enabled && result.database?.status === "ok"),
        });
      } catch {
        if (cancelled) return;
        setHealth({
          kind: "error",
          message: usingLocalApi
            ? "Production build is still pointing at localhost. Set your Render API URL."
            : "Backend is unreachable. Confirm Render is live and CORS is configured.",
        });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [apiBase, usingLocalApi]);

  if (demoMode) return null;

  if (usingLocalApi) {
    return (
      <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Backend URL not configured for production</p>
        <p className="mt-1">
          Vercel is calling <code className="text-xs">{apiBase}</code>. Set{" "}
          <code className="text-xs">VITE_API_BASE</code> in Vercel to your Render URL, or edit{" "}
          <code className="text-xs">frontend/public/config.json</code> and redeploy.
        </p>
      </div>
    );
  }

  if (health.kind === "loading") {
    return (
      <div className="mb-4 rounded-[10px] border border-border bg-white px-4 py-3 text-sm text-slate-600">
        Checking backend at <code className="text-xs">{apiBase}</code>…
      </div>
    );
  }

  if (health.kind === "error") {
    return (
      <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Backend not reachable</p>
        <p className="mt-1">{health.message}</p>
        <p className="mt-1 text-xs">
          API: <code>{apiBase}</code>
        </p>
      </div>
    );
  }

  if (!health.dbEnabled && !dbEnabled) {
    return (
      <div className="mb-4 flex flex-col gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Supabase not connected on Render</p>
          <p className="mt-1">
            Add <code className="text-xs">SUPABASE_URL</code> and{" "}
            <code className="text-xs">SUPABASE_ANON_KEY</code> (or{" "}
            <code className="text-xs">SUPABASE_SERVICE_KEY</code>) in Render → Environment, then
            redeploy.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refreshFromDb()}>
          Retry
        </Button>
      </div>
    );
  }

  if (health.dbEnabled || dbEnabled) {
    return (
      <div className="mb-4 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Connected to backend and Supabase at <code className="text-xs">{apiBase}</code>
      </div>
    );
  }

  return null;
}
