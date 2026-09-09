import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Play,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWorkspace } from "@/store/WorkspaceContext";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Screening",
    description: "Rank candidates instantly with explainable NLP scoring.",
  },
  {
    icon: Users,
    title: "Full ATS Workflow",
    description: "Manage jobs, shortlists, interviews, and analytics in one place.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Hiring",
    description: "Compare candidates side-by-side with transparent match breakdowns.",
  },
];

export function LoginPage() {
  const { enterWorkspace, startDemoSession, authenticated } = useWorkspace();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (authenticated) navigate("/dashboard", { replace: true });
  }, [authenticated, navigate]);

  const handleEnterWorkspace = () => {
    enterWorkspace();
    navigate("/dashboard");
  };

  const handleDemoSession = () => {
    startDemoSession();
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[45%] overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-slate-900 to-slate-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(79,70,229,0.25) 0%, transparent 45%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 flex flex-col p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-white">AI Recruit</p>
              <p className="text-sm text-indigo-200/80">Intelligent Candidate Screening</p>
            </div>
          </div>

          <div className="mt-16 max-w-md">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
              Hire smarter with
              <span className="block text-indigo-300">AI-driven recruitment</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Screen hundreds of resumes in minutes. Rank, compare, and shortlist candidates
              with transparent, explainable AI scoring.
            </p>
          </div>

          <div className="mt-12 space-y-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 text-indigo-200" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 px-10 py-6 xl:px-14">
          <p className="text-xs text-slate-500">
            Trusted by recruiters for faster, fairer, data-driven hiring decisions.
          </p>
        </div>
      </div>

      {/* Login panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-canvas px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/25">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">AI Recruit</p>
            <p className="text-sm text-slate-500">Intelligent Candidate Screening</p>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to your recruitment workspace to continue.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Work email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    strokeWidth={1.75}
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    defaultValue="ramiyaa@company.com"
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    strokeWidth={1.75}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    defaultValue="password123"
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-brand-600 accent-brand-600"
                  />
                  <span className="text-xs text-slate-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-brand-600 transition hover:text-brand-700"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                size="lg"
                className="h-11 w-full text-sm font-semibold shadow-md shadow-brand-600/20"
                onClick={handleEnterWorkspace}
              >
                Enter workspace
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                  or
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="h-11 w-full border-slate-200 bg-slate-50 text-sm font-medium hover:bg-slate-100"
              onClick={handleDemoSession}
            >
              <Play className="h-4 w-4 text-brand-600" strokeWidth={2} />
              Start demo session
            </Button>

            <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
              Demo loads sample jobs and candidates instantly.
              <span className="block mt-0.5">Live workspace connects to your database.</span>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            By continuing, you agree to our{" "}
            <span className="text-slate-500">Terms of Service</span> and{" "}
            <span className="text-slate-500">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
