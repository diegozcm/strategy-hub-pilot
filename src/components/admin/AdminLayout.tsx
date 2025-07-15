import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useMultiTenant';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Building, Users, BarChart3, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  const { loading, profile, signOut, isSystemAdmin } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile || (!isSystemAdmin && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-slate-300 mb-6">Você não tem permissão para acessar o painel administrativo.</p>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  const adminMenuItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: BarChart3,
      description: 'Visão geral do sistema'
    },
    {
      name: 'Empresas',
      path: '/admin/companies',
      icon: Building,
      description: 'Gerenciar empresas'
    },
    {
      name: 'Usuários',
      path: '/admin/users',
      icon: Users,
      description: 'Usuários pendentes'
    },
    {
      name: 'Configurações',
      path: '/admin/settings',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-2 rounded-lg mr-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Portal</h1>
              <p className="text-xs text-slate-400">Painel Administrativo</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {adminMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-slate-600 p-2 rounded-full mr-3">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {profile.first_name} {profile.last_name}
                </div>
                <div className="text-xs text-slate-400">
                  {profile.role === 'admin' ? 'Administrador' : 'Sistema'}
                </div>
              </div>
            </div>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};