
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MultiTenantAuthProvider } from "@/hooks/useMultiTenant";
import { AuthPage } from "@/components/auth/AuthPage";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CompanyInactivePage } from "@/pages/CompanyInactivePage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
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
import { StrategicMapPage } from "@/components/strategic-map/StrategicMapPage";
import { CompaniesPage } from "@/components/admin/CompaniesPage";
import { UserEditorPage } from "@/components/admin/UserEditorPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MultiTenantAuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/company-inactive" element={<CompanyInactivePage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            
            {/* Redirects for direct page access */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/strategic-map" element={<Navigate to="/app/strategic-map" replace />} />
            <Route path="/objectives" element={<Navigate to="/app/objectives" replace />} />
            <Route path="/projects" element={<Navigate to="/app/projects" replace />} />
            <Route path="/indicators" element={<Navigate to="/app/indicators" replace />} />
            <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
            <Route path="/ai-copilot" element={<Navigate to="/app/ai-copilot" replace />} />
            <Route path="/team" element={<Navigate to="/app/team" replace />} />
            <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
            <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
            
            {/* Protected app routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="strategic-map" element={<StrategicMapPage />} />
              <Route path="objectives" element={<ObjectivesPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="indicators" element={<IndicatorsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="ai-copilot" element={<AICopilotPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              
              {/* Admin routes dentro do app */}
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="user-management" element={<UserEditorPage />} />
                <Route path="settings" element={<div className="p-6 text-foreground">Configurações do Sistema</div>} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="user-management" element={<UserEditorPage />} />
              <Route path="settings" element={<div className="text-white">Configurações do Sistema</div>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MultiTenantAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
