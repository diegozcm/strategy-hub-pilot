import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Package, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useMultiTenant';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar 
} from '@/components/ui/sidebar';

const adminMenuItems = [
  {
    name: 'Dashboard',
    path: '/app/admin',
    icon: Package,
    description: 'Visão geral do sistema'
  },
  {
    name: 'Empresas',
    path: '/app/admin/companies',
    icon: Building2,
    description: 'Gerenciar empresas e startups'
  },
  {
    name: 'Usuários',
    path: '/app/admin/users',
    icon: Users,
    description: 'Gerenciar usuários, permissões e módulos'
  },
  {
    name: 'Módulos',
    path: '/app/admin/modules',
    icon: Package,
    description: 'Configurar módulos do sistema'
  },
  {
    name: 'Configurações',
    path: '/app/admin/settings',
    icon: Settings,
    description: 'Configurações gerais do sistema'
  }
];

const StartTogetherAdminSidebar: React.FC = () => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActiveRoute = (path: string) => {
    if (path === '/app/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarContent className="bg-background">
        {/* Header - sem padding-top em mobile para evitar sobreposição */}
        <div className="p-4 border-b border-border lg:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-sm font-semibold text-foreground">Start Together</h2>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild className="w-full">
                    <Link 
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActiveRoute(item.path)
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span className="text-sm">{item.name}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info and Logout */}
        <div className="mt-auto p-4 border-t border-border">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.first_name || 'Admin'}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {profile?.role || 'admin'}
                  </Badge>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-3 h-3 mr-2" />
                Sair
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={signOut}
              className="w-full p-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export const StartTogetherAdminLayout: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Verificação de acesso - apenas admins
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <User className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Acesso Negado</h2>
              <p className="text-sm text-muted-foreground">
                Você precisa ser administrador para acessar esta área.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Fazer Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        {/* Header global apenas para mobile */}
        <div className="lg:hidden">
          <header className="h-14 bg-background border-b border-border flex items-center px-4 relative z-50">
            <SidebarTrigger className="mr-3" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Package className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">Start Together Admin</span>
            </div>
          </header>
        </div>

        {/* Layout flex para desktop e mobile */}
        <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
          <StartTogetherAdminSidebar />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-background">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};