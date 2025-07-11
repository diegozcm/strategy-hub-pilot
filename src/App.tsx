
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { ObjectivesPage } from "@/components/objectives/ObjectivesPage";
import { ProjectsPage } from "@/components/projects/ProjectsPage";
import { IndicatorsPage } from "@/components/indicators/IndicatorsPage";
import { ReportsPage } from "@/components/reports/ReportsPage";
import { AICopilotPage } from "@/components/ai/AICopilotPage";
import TeamPage from "@/components/team/TeamPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="objectives" element={<ObjectivesPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="indicators" element={<IndicatorsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="ai-copilot" element={<AICopilotPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
