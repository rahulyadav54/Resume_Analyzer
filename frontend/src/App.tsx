import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspaceProvider, useWorkspace } from "@/store/WorkspaceContext";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { JobsPage } from "@/pages/JobsPage";
import { JobCreatePage } from "@/pages/JobCreatePage";
import { JobDetailPage } from "@/pages/JobDetailPage";
import { CandidateDetailPage } from "@/pages/CandidateDetailPage";
import { CandidatesPage } from "@/pages/CandidatesPage";
import { ShortlistedPage } from "@/pages/ShortlistedPage";
import { InterviewsPage } from "@/pages/InterviewsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { ResumeLibraryPage } from "@/pages/ResumeLibraryPage";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { AISettingsPage } from "@/pages/AISettingsPage";
import { HelpPage } from "@/pages/HelpPage";
import { ComparePage } from "@/pages/ComparePage";
import { TalentPoolPage } from "@/pages/TalentPoolPage";
import { AuditTrailPage } from "@/pages/AuditTrailPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function RootRedirect() {
  const { authenticated, authLoading } = useWorkspace();
  if (authLoading) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={authenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/new" element={<JobCreatePage />} />
              <Route path="/jobs/:jobId" element={<JobDetailPage />} />
              <Route path="/jobs/:jobId/compare" element={<ComparePage />} />
              <Route
                path="/jobs/:jobId/candidates/:candidateId"
                element={<CandidateDetailPage />}
              />
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/candidates/:candidateId" element={<CandidateDetailPage />} />
              <Route path="/shortlisted" element={<ShortlistedPage />} />
              <Route path="/interviews" element={<InterviewsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/talent-pool" element={<TalentPoolPage />} />
              <Route path="/audit-trail" element={<AuditTrailPage />} />
              <Route path="/resumes" element={<ResumeLibraryPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/settings/ai" element={<AISettingsPage />} />
              <Route path="/settings" element={<Navigate to="/settings/ai" replace />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}
