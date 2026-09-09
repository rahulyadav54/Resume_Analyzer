import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { healthCheck, isUsingLocalApi } from "@/lib/api";
import { useWorkspace } from "@/store/WorkspaceContext";

type HealthState =
  | { kind: "loading" }
  | { kind: "ok"; dbEnabled: boolean }
  | { kind: "error"; message: string };

async function healthCheckWithRetry(maxAttempts = 4) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await healthCheck();
      return result;
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
  const [health, setHealth] = useState<HealthState>({ kind: "loading" });
  const usingLocalApi = isUsingLocalApi() && !import.meta.env.DEV;

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setHealth({ kind: "loading" });
      try {
        const result = await healthCheckWithRetry();
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
            ? "The application could not connect to the server. Please try again shortly."
            : "The server is starting up. This can take up to a minute on the first visit.",
        });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [usingLocalApi]);

  if (demoMode) return null;

  if (usingLocalApi) {
    return (
      <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Unable to connect</p>
        <p className="mt-1">Please refresh the page or try again in a moment.</p>
      </div>
    );
  }

  if (health.kind === "loading") return null;

  if (health.kind === "error") {
    return (
      <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Unable to reach the server</p>
        <p className="mt-1">{health.message}</p>
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
          <p className="font-medium">Workspace sync is temporarily unavailable</p>
          <p className="mt-1">Your session will still work, but changes may not be saved.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refreshFromDb()}>
          Retry
        </Button>
      </div>
    );
  }

  return null;
}
