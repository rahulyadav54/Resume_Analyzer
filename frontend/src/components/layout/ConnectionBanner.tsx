import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getApiDisplayUrl, healthCheck, isUsingLocalApi } from "@/lib/api";
import { useWorkspace } from "@/store/WorkspaceContext";

type HealthState =
  | { kind: "loading"; attempt: number }
  | { kind: "ok"; dbEnabled: boolean }
  | { kind: "error"; message: string };

async function healthCheckWithRetry(maxAttempts = 4) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await healthCheck();
      return { result, attempt };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }
    }
  }
  throw lastError;
}

export function ConnectionBanner() {
  const { demoMode, dbEnabled, refreshFromDb } = useWorkspace();
  const [health, setHealth] = useState<HealthState>({ kind: "loading", attempt: 1 });
  const apiDisplay = getApiDisplayUrl();
  const usingLocalApi = isUsingLocalApi() && !import.meta.env.DEV;

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setHealth({ kind: "loading", attempt: 1 });
      try {
        const { result } = await healthCheckWithRetry();
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
            ? "Production build is still pointing at localhost. Set VITE_API_BASE=/api or redeploy."
            : "Backend is waking up or unreachable. Free Render can take up to 60 seconds on first request.",
        });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [apiDisplay, usingLocalApi]);

  if (demoMode) return null;

  if (usingLocalApi) {
    return (
      <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Backend URL not configured for production</p>
        <p className="mt-1">
          Set <code className="text-xs">VITE_API_BASE=/api</code> on Vercel and redeploy.
        </p>
      </div>
    );
  }

  if (health.kind === "loading") {
    return (
      <div className="mb-4 rounded-[10px] border border-border bg-white px-4 py-3 text-sm text-slate-600">
        Connecting to backend at <code className="text-xs">{apiDisplay}</code>…
        <span className="ml-1 text-xs text-slate-400">(first load may take ~60s on free tier)</span>
      </div>
    );
  }

  if (health.kind === "error") {
    return (
      <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Backend not reachable</p>
        <p className="mt-1">{health.message}</p>
        <p className="mt-1 text-xs">
          API: <code>{apiDisplay}</code>
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
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
            <code className="text-xs">SUPABASE_SERVICE_KEY</code> on Render, then redeploy.
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
        Connected to backend and Supabase via <code className="text-xs">{apiDisplay}</code>
      </div>
    );
  }

  return null;
}
