import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Star,
  Calendar,
  BarChart3,
  FolderOpen,
  FileStack,
  SlidersHorizontal,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/store/WorkspaceContext";

const mainNav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/shortlisted", label: "Shortlisted", icon: Star },
  { to: "/interviews", label: "Interviews", icon: Calendar },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

const workspaceNav = [
  { to: "/resumes", label: "Resume Library", icon: FolderOpen },
  { to: "/templates", label: "Job Templates", icon: FileStack },
  { to: "/settings/ai", label: "AI Settings", icon: SlidersHorizontal },
];

function NavItem({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
          isActive
            ? "bg-brand-50 text-brand-700 before:absolute before:left-0 before:h-4 before:w-0.5 before:rounded-full before:bg-brand-600"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={isActive ? "text-brand-600" : "text-slate-400"} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { recruiter, logout, demoMode } = useWorkspace();
  void location;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const content = (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-white">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-[11px] font-bold text-white">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-slate-900">AI Recruit</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Intelligent Screening</p>
          </div>
        </div>
        <button className="lg:hidden" onClick={onClose} aria-label="Close sidebar">
          <X size={18} className="text-slate-500" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} onClick={onClose} />
          ))}
        </div>

        <div className="my-3 border-t border-border" />

        <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        <div className="space-y-0.5">
          {workspaceNav.map((item) => (
            <NavItem key={item.to} {...item} onClick={onClose} />
          ))}
        </div>

        <div className="my-3 border-t border-border" />
        <NavItem to="/help" label="Help & Support" icon={HelpCircle} onClick={onClose} />
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {recruiter?.initials ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {recruiter?.name ?? "Recruiter"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {demoMode ? "Demo session" : recruiter?.role ?? "Recruiter"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut size={14} />
            {demoMode ? "Exit demo" : "Sign out"}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{content}</div>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
