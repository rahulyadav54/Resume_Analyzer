import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  trend,
  hint,
}: {
  label: string;
  value: string | number;
  trend?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-white p-4 shadow-sm">
      <p className="text-[13px] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {trend && <p className="mt-1 text-xs font-medium text-emerald-600">{trend}</p>}
      {hint && !trend && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-white px-6 py-16 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/80", className)} />;
}
