import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWorkspace } from "@/store/WorkspaceContext";

export function LoginPage() {
  const { setAuthenticated, authenticated } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) navigate("/dashboard", { replace: true });
  }, [authenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-[12px] border border-border bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            AI
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">AI Recruit</h1>
            <p className="text-sm text-slate-500">Intelligent Candidate Screening</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-600">Sign in to your recruitment workspace.</p>

        <label className="mb-1 block text-xs font-medium text-slate-600">Work email</label>
        <Input className="mb-3" defaultValue="rahul.mehta@company.com" />
        <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
        <Input className="mb-5" type="password" defaultValue="••••••••" />

        <Button
          className="w-full"
          onClick={() => {
            setAuthenticated(true);
            navigate("/dashboard");
          }}
        >
          Enter workspace
        </Button>
        <p className="mt-3 text-center text-xs text-slate-400">
          Demo access — no password verification in this build.
        </p>
      </div>
    </div>
  );
}
