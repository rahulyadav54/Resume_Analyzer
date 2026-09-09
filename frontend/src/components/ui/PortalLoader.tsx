import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const LOADING_STEPS = [
  "Verifying your session",
  "Preparing recruiter workspace",
  "Loading hiring pipeline",
  "Almost ready",
];

type PortalLoaderProps = {
  title?: string;
  className?: string;
  fullscreen?: boolean;
};

export function PortalLoader({
  title = "AI Recruit",
  className,
  fullscreen = true,
}: PortalLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((i) => (i + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-canvas",
        fullscreen ? "min-h-screen" : "min-h-[280px] rounded-[10px]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(79,70,229,0.1) 0%, transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <span className="portal-loader-ring absolute inset-0 rounded-full border border-brand-200/80" />
          <span className="portal-loader-ring portal-loader-ring-delay absolute inset-2 rounded-full border border-brand-300/60" />
          <span className="portal-loader-ring portal-loader-ring-delay-2 absolute inset-4 rounded-full border border-brand-400/40" />
          <div className="portal-loader-pulse relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 shadow-lg shadow-brand-600/30">
            <Zap className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">Intelligent Screening Platform</p>
        </div>

        <div className="mt-8 w-56">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
            <div className="portal-loader-bar h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500" />
          </div>
        </div>

        <p
          key={stepIndex}
          className="portal-loader-fade mt-5 min-h-[20px] text-xs font-medium tracking-wide text-brand-600"
        >
          {LOADING_STEPS[stepIndex]}…
        </p>

        <div className="mt-4 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="portal-loader-dot h-1.5 w-1.5 rounded-full bg-brand-500"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
