import { Bell, HelpCircle, LogOut, Menu, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Link, useNavigate } from "react-router-dom";
import { useWorkspace } from "@/store/WorkspaceContext";

export function TopBar({
  title,
  subtitle,
  onMenu,
  actions,
}: {
  title: string;
  subtitle?: string;
  onMenu: () => void;
  actions?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { recruiter, logout, demoMode } = useWorkspace();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:px-6">
      <button
        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="hidden max-w-xs flex-1 md:block">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search candidates, jobs..." className="pl-8" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {actions}
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Help">
          <HelpCircle size={16} />
        </button>
        <Link
          to="/settings/ai"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="ml-1 flex h-8 items-center gap-2 rounded-full bg-brand-50 px-2 pl-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
          title={demoMode ? "Exit demo" : "Sign out"}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100">
            {recruiter?.initials ?? "?"}
          </span>
          <span className="hidden pr-1 sm:inline">{demoMode ? "Exit" : "Sign out"}</span>
          <LogOut size={14} className="hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
