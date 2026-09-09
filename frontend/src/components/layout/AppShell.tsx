import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { PortalLoader } from "@/components/ui/PortalLoader";
import { useWorkspace } from "@/store/WorkspaceContext";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authenticated, authLoading, toasts, dismissToast } = useWorkspace();
  const location = useLocation();

  if (location.pathname === "/login") {
    if (!authLoading && authenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Outlet />;
  }

  if (authLoading) {
    return <PortalLoader />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet context={{ openSidebar: () => setSidebarOpen(true) }} />
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-lg border bg-white px-3 py-2.5 shadow-lg",
              t.type === "error" ? "border-red-200" : "border-border"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{t.title}</p>
                {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
              </div>
              <button
                className="text-xs text-slate-400 hover:text-slate-600"
                onClick={() => dismissToast(t.id)}
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type ShellOutletContext = {
  openSidebar: () => void;
};
