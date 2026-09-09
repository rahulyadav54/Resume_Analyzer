const LOCAL_API = "http://127.0.0.1:8000";
const PRODUCTION_PROXY = "/api";

let resolvedBase = (import.meta.env.VITE_API_BASE ?? "").trim().replace(/\/$/, "");

export function getApiBase(): string {
  if (resolvedBase) return resolvedBase;
  if (import.meta.env.PROD) return PRODUCTION_PROXY;
  return LOCAL_API;
}

export function setApiBase(url: string) {
  resolvedBase = url.trim().replace(/\/$/, "");
}

export function isUsingLocalApi(): boolean {
  const base = getApiBase();
  return base.includes("127.0.0.1") || base.includes("localhost");
}

export function getApiDisplayUrl(): string {
  const base = getApiBase();
  if (base.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${base}`;
  }
  return base;
}

export async function loadRuntimeApiConfig(): Promise<string> {
  if (import.meta.env.VITE_API_BASE?.trim()) {
    setApiBase(import.meta.env.VITE_API_BASE);
    return getApiBase();
  }

  if (import.meta.env.PROD) {
    setApiBase(PRODUCTION_PROXY);
    return getApiBase();
  }

  try {
    const response = await fetch("/config.json", { cache: "no-store" });
    if (!response.ok) return getApiBase();

    const config = (await response.json()) as { apiBase?: string };
    const apiBase = config.apiBase?.trim().replace(/\/$/, "") ?? "";

    if (apiBase && !apiBase.includes("YOUR-RENDER-API")) {
      setApiBase(apiBase);
    }
  } catch {
    /* use default */
  }

  return getApiBase();
}
