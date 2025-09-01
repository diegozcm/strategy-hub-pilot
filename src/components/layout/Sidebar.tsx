
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Target, Briefcase, Users, Settings, Zap, TrendingUp, Activity, Map, Building2, UserCheck, Shield, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/components/PermissionGate';
import { useModules } from '@/hooks/useModules';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';

const getModuleNavigation = () => {
  return [
    {
      title: 'Strategy HUB',
      slug: 'strategic-planning',
      icon: Target,
      items: [
        {
          name: 'Dashboard',
          href: '/app/dashboard',
          icon: BarChart3
        },
        {
          name: 'Mapa Estratégico',
          href: '/app/strategic-map',
          icon: Map
        },
        {
          name: 'Objetivos',
          href: '/app/objectives',
          icon: Target
        },
        {
          name: 'Resultados Chave',
          href: '/app/indicators',
          icon: TrendingUp
        },
        {
          name: 'Projetos',
          href: '/app/projects',
          icon: Briefcase
        },
        {
          name: 'Relatórios',
          href: '/app/reports',
          icon: Activity
        }
      ]
    },
    {
      title: 'Startup HUB',
      slug: 'startup-hub',
      icon: Zap,
      items: [
        {
          name: 'Dashboard',
          href: '/app/startup-hub',
          icon: BarChart3
        }
      ]
    }
  ];
};

const adminNavigation = [{
  name: 'Configurações',
  href: '/app/settings',
  icon: Settings
}];

const systemAdminNavigation = [{
  name: 'Empresas',
  href: '/app/admin/companies',
  icon: Building2
}, {
  name: 'Usuários Pendentes',
  href: '/app/admin/users',
  icon: UserCheck
}];

export const Sidebar: React.FC = () => {
  const { availableModules, hasModuleAccess, loading: modulesLoading } = useModules();
  
  const moduleNavigation = getModuleNavigation();
  
  // Filter modules based on user access
  const accessibleModules = moduleNavigation.filter(module => 
    hasModuleAccess(module.slug)
  );

  return (
    <SidebarProvider>
      <SidebarPrimitive className="w-64 border-r border-border bg-card">
        <SidebarHeader className="px-4 py-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Start Together</h1>
              <p className="text-xs text-muted-foreground">By COFOUND</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4">
          {/* Module Groups */}
          {accessibleModules.map((module) => (
            <SidebarGroup key={module.slug} className="mb-4">
              <SidebarGroupLabel className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground">
                <module.icon className="h-4 w-4" />
                {module.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {module.items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                              isActive
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-foreground hover:bg-accent/50"
                            )
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {/* Admin Section */}
          <SidebarGroup className="mb-4">
            <SidebarGroupLabel className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground">
              <Settings className="h-4 w-4" />
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-foreground hover:bg-accent/50"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* System Admin Section */}
          <PermissionGate requiredRole="admin">
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground">
                <Shield className="h-4 w-4" />
                Admin Sistema
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/app/admin"
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            isActive
                              ? "bg-destructive/10 text-destructive font-medium"
                              : "text-foreground hover:bg-destructive/5"
                          )
                        }
                      >
                        <Shield className="h-4 w-4" />
                        <span>Painel Admin</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </PermissionGate>
        </SidebarContent>
      </SidebarPrimitive>
    </SidebarProvider>
  );
};
