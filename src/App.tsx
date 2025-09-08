import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MultiTenantAuthProvider } from "@/hooks/useMultiTenant";
import { ThemeProvider } from "@/hooks/useTheme";
import { ModulesProvider } from "@/hooks/useModules";
import { AuthPage } from "@/components/auth/AuthPage";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { CompanyInactivePage } from "@/pages/CompanyInactivePage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { StartTogetherAdminLayout } from "@/components/admin/StartTogetherAdminLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { ObjectivesPageWrapper } from "@/components/objectives/ObjectivesPageWrapper";
import { ProjectsPage } from "@/components/projects/ProjectsPage";
import { IndicatorsPage } from "@/components/indicators/IndicatorsPage";
import { ReportsPage } from "@/components/reports/ReportsPage";
import { AICopilotPage } from "@/components/ai/AICopilotPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { StrategicMapPageWrapper } from "@/components/strategic-map/StrategicMapPageWrapper";
import { CompaniesPage } from "@/components/admin/CompaniesPage";
import { UserManagementPage } from "@/components/admin/UserManagementPage";
import { ModulesManagementPage } from "@/components/admin/ModulesManagementPage";
import { SystemSettingsPage } from "@/components/admin/SystemSettingsPage";
import { CreateUserPage } from "@/components/admin/CreateUserPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";
import { GoldenCirclePage } from "@/components/golden-circle/GoldenCirclePage";
import { ToolsPage } from "@/components/tools/ToolsPage";
import { StartupHubPage } from "@/components/startup-hub/StartupHubPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MultiTenantAuthProvider>
          <ThemeProvider>
            <ModulesProvider>
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
            <Route path="/golden-circle" element={<Navigate to="/app/tools" replace />} />
            <Route path="/ai-copilot" element={<Navigate to="/app/ai-copilot" replace />} />
            
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
              <Route path="strategic-map" element={<StrategicMapPageWrapper />} />
              <Route path="objectives" element={<ObjectivesPageWrapper />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="indicators" element={<IndicatorsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="ai-copilot" element={<AICopilotPage />} />
              
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            <Route path="golden-circle" element={<Navigate to="/app/tools" replace />} />
            <Route path="tools" element={<ToolsPage />} />
              <Route path="startup-hub" element={<StartupHubPage />} />
            </Route>

            {/* Admin routes - Start Together Admin */}
            <Route path="/app/admin" element={
              <AdminProtectedRoute>
                <StartTogetherAdminLayout />
              </AdminProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="users/create" element={<CreateUserPage />} />
              <Route path="modules" element={<ModulesManagementPage />} />
              <Route path="settings" element={<SystemSettingsPage />} />
            </Route>

            {/* Redirect /admin to /app/admin */}
            <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
            <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </ModulesProvider>
          </ThemeProvider>
        </MultiTenantAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;