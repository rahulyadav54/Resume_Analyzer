import { Bell, HelpCircle, Menu, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Link } from "react-router-dom";

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
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          R
        </div>
      </div>
    </header>
  );
}
