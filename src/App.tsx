
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
              <Route path="projects" element={<div className="p-8 text-center text-gray-500">Projetos - Em desenvolvimento</div>} />
              <Route path="indicators" element={<div className="p-8 text-center text-gray-500">Indicadores - Em desenvolvimento</div>} />
              <Route path="reports" element={<div className="p-8 text-center text-gray-500">Relatórios - Em desenvolvimento</div>} />
              <Route path="team" element={<div className="p-8 text-center text-gray-500">Equipe - Em desenvolvimento</div>} />
              <Route path="settings" element={<div className="p-8 text-center text-gray-500">Configurações - Em desenvolvimento</div>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
