import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MultiTenantAuthProvider } from "@/hooks/useMultiTenant";
import { ThemeProvider } from "@/hooks/useTheme";
import { ModulesProvider } from "@/hooks/useModules";
import { PeriodFilterProvider } from "@/contexts/PeriodFilterContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AuthStateDebugger } from "@/components/ui/AuthStateDebugger";
import { LoadingStateMonitor } from "@/components/ui/LoadingStateMonitor";
import { AuthFlowDebugger } from "@/components/ui/AuthFlowDebugger";
import { AuthPage } from "@/components/auth/AuthPage";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { MFAVerification } from "@/components/admin/MFAVerification";
import { MFAEnrollment } from "@/components/admin/MFAEnrollment";
import { CompanyInactivePage } from "@/pages/CompanyInactivePage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { MonitoringPage } from "@/components/admin/MonitoringPage";
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
import { LandingPageEditorPage } from "./components/admin/LandingPageEditorPage";
import { EmailTemplatesPage } from "./components/admin/EmailTemplatesPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { StartTogetherAdminLayout } from "./components/admin/StartTogetherAdminLayout";
import { CompanySelectionPage } from "@/pages/CompanySelectionPage";
import LandingPage from "@/pages/LandingPage";
import LandingPagePreview from "@/pages/LandingPagePreview";
import NotFound from "@/pages/NotFound";
import { GoldenCirclePage } from "@/components/golden-circle/GoldenCirclePage";
import { ToolsPage } from "@/components/tools/ToolsPage";
import { StartupHubPage } from "@/components/startup-hub/StartupHubPage";
import { ModuleBasedRedirect } from "@/components/ModuleBasedRedirect";
import { ModuleProtectedRoute } from "@/components/ui/ModuleProtectedRoute";
import AdminV2Page from "@/components/admin-v2/AdminV2Page";

// Admin V2 Page Imports
import {
  DashboardOverviewPage,
  SystemStatsPage,
  ActiveUsersStatsPage,
  RegisteredCompaniesPage,
  RecentLoginsPage,
  RecentActivity24hPage,
  RecentActivityWeekPage,
  RecentActivityMonthPage,
  UsersByCompanyPage,
  SystemStatusPage,
  NewCompanyPage,
  FilterCompaniesPage,
  AllCompaniesPage,
  ActiveCompaniesPage,
  InactiveCompaniesPage,
  StartupsPage,
  ActiveStartupsPage,
  LinkedMentorsPage,
  ArchivedCompaniesPage,
  CreateUserPage as CreateUserPageV2,
  FilterUsersPage,
  AllUsersPage,
  ActiveUsersPage,
  InactiveUsersPage,
  PendingApprovalPage,
  FirstLoginPage,
  SystemAdminsPage,
  AvailableModulesPage,
  StrategicPlanningModulePage,
  StartupHubModulePage,
  AICopilotModulePage,
  ModulesByCompanyPage,
  RolesPermissionsPage,
  AdminRolePage,
  ManagerRolePage,
  MemberRolePage,
  SystemHealthPage,
  PerformancePage,
  AlertsPage,
  CriticalErrorsPage,
  WarningsPage,
  InfoLogsPage,
  AccessLogsPage,
  DatabaseLogsPage,
  GeneralSettingsPage,
  SecurityPage,
  PasswordPoliciesPage,
  MFASettingsPage,
  ActiveSessionsPage,
  NotificationsSettingsPage,
  BackupPage,
  CreateBackupPage,
  RestoreBackupPage,
  BackupSchedulesPage,
  DataCleanupPage,
  SystemAdminsSettingsPage,
  EditLandingPage,
  PreviewLandingPage,
  PublishLandingPage,
  AllEmailTemplatesPage,
  WelcomeTemplatePage,
  CredentialsTemplatePage,
  PasswordRecoveryTemplatePage,
  NotificationTemplatePage,
  NewTemplatePage,
  PreviewEmailPage,
} from "@/components/admin-v2/pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 3, // 3 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MultiTenantAuthProvider>
            <LoadingStateMonitor>
              <AuthStateDebugger>
                <AuthFlowDebugger />
                <ThemeProvider>
                  <ModulesProvider>
                <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/company-selection" element={<CompanySelectionPage />} />
                <Route path="/company-inactive" element={<CompanyInactivePage />} />
                <Route path="/admin-login" element={<AdminLoginPage />} />
                <Route path="/admin-mfa-verify" element={<MFAVerification />} />
                <Route path="/admin-mfa-setup" element={<MFAEnrollment />} />
                
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
                    <PeriodFilterProvider>
                      <AppLayout />
                    </PeriodFilterProvider>
                  </ProtectedRoute>
                }>
                  <Route index element={<ModuleBasedRedirect />} />
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
                  <Route path="monitoring" element={<MonitoringPage />} />
                  <Route path="landing-page" element={<LandingPageEditorPage />} />
                  <Route path="landing-preview" element={<LandingPagePreview />} />
                  <Route path="email-templates" element={<EmailTemplatesPage />} />
                </Route>

                {/* Admin V2 - Nova versão em desenvolvimento (acesso via URL direta) */}
                <Route path="/app/admin-v2" element={
                  <AdminProtectedRoute>
                    <AdminV2Page />
                  </AdminProtectedRoute>
                }>
                  {/* Dashboard */}
                  <Route index element={<DashboardOverviewPage />} />
                  <Route path="dashboard/stats" element={<SystemStatsPage />} />
                  <Route path="dashboard/stats/active-users" element={<ActiveUsersStatsPage />} />
                  <Route path="dashboard/stats/companies" element={<RegisteredCompaniesPage />} />
                  <Route path="dashboard/stats/logins" element={<RecentLoginsPage />} />
                  <Route path="dashboard/activity" element={<RecentActivity24hPage />} />
                  <Route path="dashboard/activity/24h" element={<RecentActivity24hPage />} />
                  <Route path="dashboard/activity/week" element={<RecentActivityWeekPage />} />
                  <Route path="dashboard/activity/month" element={<RecentActivityMonthPage />} />
                  <Route path="dashboard/users-by-company" element={<UsersByCompanyPage />} />
                  <Route path="dashboard/system-status" element={<SystemStatusPage />} />

                  {/* Companies */}
                  <Route path="companies" element={<AllCompaniesPage />} />
                  <Route path="companies/new" element={<NewCompanyPage />} />
                  <Route path="companies/filter" element={<FilterCompaniesPage />} />
                  <Route path="companies/active" element={<ActiveCompaniesPage />} />
                  <Route path="companies/inactive" element={<InactiveCompaniesPage />} />
                  <Route path="companies/startups" element={<StartupsPage />} />
                  <Route path="companies/startups/active" element={<ActiveStartupsPage />} />
                  <Route path="companies/startups/mentors" element={<LinkedMentorsPage />} />
                  <Route path="companies/archived" element={<ArchivedCompaniesPage />} />

                  {/* Users */}
                  <Route path="users" element={<AllUsersPage />} />
                  <Route path="users/create" element={<CreateUserPageV2 />} />
                  <Route path="users/filter" element={<FilterUsersPage />} />
                  <Route path="users/active" element={<ActiveUsersPage />} />
                  <Route path="users/inactive" element={<InactiveUsersPage />} />
                  <Route path="users/pending" element={<PendingApprovalPage />} />
                  <Route path="users/pending/approval" element={<PendingApprovalPage />} />
                  <Route path="users/pending/first-login" element={<FirstLoginPage />} />
                  <Route path="users/admins" element={<SystemAdminsPage />} />

                  {/* Modules */}
                  <Route path="modules" element={<AvailableModulesPage />} />
                  <Route path="modules/strategic-planning" element={<StrategicPlanningModulePage />} />
                  <Route path="modules/startup-hub" element={<StartupHubModulePage />} />
                  <Route path="modules/ai-copilot" element={<AICopilotModulePage />} />
                  <Route path="modules/by-company" element={<ModulesByCompanyPage />} />
                  <Route path="modules/roles" element={<RolesPermissionsPage />} />
                  <Route path="modules/roles/admin" element={<AdminRolePage />} />
                  <Route path="modules/roles/manager" element={<ManagerRolePage />} />
                  <Route path="modules/roles/member" element={<MemberRolePage />} />

                  {/* Monitoring */}
                  <Route path="monitoring/health" element={<SystemHealthPage />} />
                  <Route path="monitoring/performance" element={<PerformancePage />} />
                  <Route path="monitoring/alerts" element={<AlertsPage />} />
                  <Route path="monitoring/alerts/critical" element={<CriticalErrorsPage />} />
                  <Route path="monitoring/alerts/warnings" element={<WarningsPage />} />
                  <Route path="monitoring/alerts/info" element={<InfoLogsPage />} />
                  <Route path="monitoring/logs/access" element={<AccessLogsPage />} />
                  <Route path="monitoring/logs/database" element={<DatabaseLogsPage />} />

                  {/* Settings */}
                  <Route path="settings/general" element={<GeneralSettingsPage />} />
                  <Route path="settings/security" element={<SecurityPage />} />
                  <Route path="settings/security/password" element={<PasswordPoliciesPage />} />
                  <Route path="settings/security/mfa" element={<MFASettingsPage />} />
                  <Route path="settings/security/sessions" element={<ActiveSessionsPage />} />
                  <Route path="settings/notifications" element={<NotificationsSettingsPage />} />
                  <Route path="settings/backup" element={<BackupPage />} />
                  <Route path="settings/backup/create" element={<CreateBackupPage />} />
                  <Route path="settings/backup/restore" element={<RestoreBackupPage />} />
                  <Route path="settings/backup/schedules" element={<BackupSchedulesPage />} />
                  <Route path="settings/cleanup" element={<DataCleanupPage />} />
                  <Route path="settings/admins" element={<SystemAdminsSettingsPage />} />

                  {/* Landing Page */}
                  <Route path="landing/edit" element={<EditLandingPage />} />
                  <Route path="landing/preview" element={<PreviewLandingPage />} />
                  <Route path="landing/publish" element={<PublishLandingPage />} />

                  {/* Email Templates */}
                  <Route path="emails" element={<AllEmailTemplatesPage />} />
                  <Route path="emails/welcome" element={<WelcomeTemplatePage />} />
                  <Route path="emails/credentials" element={<CredentialsTemplatePage />} />
                  <Route path="emails/password-recovery" element={<PasswordRecoveryTemplatePage />} />
                  <Route path="emails/notifications" element={<NotificationTemplatePage />} />
                  <Route path="emails/new" element={<NewTemplatePage />} />
                  <Route path="emails/preview" element={<PreviewEmailPage />} />
                </Route>

              {/* Redirect /admin to /app/admin */}
              <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
              <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
                  </ModulesProvider>
                </ThemeProvider>
              </AuthStateDebugger>
            </LoadingStateMonitor>
          </MultiTenantAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
