
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Target, Briefcase, Users, Settings, ChevronLeft, ChevronRight, Zap, TrendingUp, Activity, Brain, Map, Building2, UserCheck, Shield, Building, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useMultiTenant';
import { PermissionGate } from '@/components/PermissionGate';
import { useModules } from '@/hooks/useModules';
import { useStartupProfile } from '@/hooks/useStartupProfile';

const menuStructure = [
  {
    name: 'STRATEGY HUB',
    icon: Target,
    items: [
      { name: 'Dashboard', href: '/app/dashboard', icon: BarChart3 },
      { name: 'Mapa Estratégico', href: '/app/strategic-map', icon: Map },
      { name: 'Objetivos', href: '/app/objectives', icon: Target },
      { name: 'Resultados Chave', href: '/app/indicators', icon: TrendingUp },
      { name: 'Projetos', href: '/app/projects', icon: Briefcase },
      { name: 'Relatórios', href: '/app/reports', icon: Activity }
    ]
  },
  {
    name: 'STARTUP HUB',
    icon: Brain,
    items: [
      { name: 'Dashboard', href: '/app/startup-hub?tab=dashboard', icon: BarChart3 },
      { name: 'Avaliação BEEP', href: '/app/startup-hub?tab=beep', icon: TrendingUp, requiresStartup: true },
      { name: 'Startups', href: '/app/startup-hub?tab=startups', icon: Building, requiresMentor: true },
      { name: 'Avaliações BEEP', href: '/app/startup-hub?tab=beep-analytics', icon: Activity, requiresMentor: true },
      { name: 'Mentorias', href: '/app/startup-hub?tab=sessions', icon: Users, requiresMentor: true },
      { name: 'Mentorias', href: '/app/startup-hub?tab=mentoring', icon: Users, requiresStartup: true },
      { name: 'Perfil', href: '/app/startup-hub?tab=profile', icon: User }
    ]
  },
  {
    name: 'CONFIGURAÇÕES',
    icon: Settings,
    items: [
      { name: 'Configurações', href: '/app/settings', icon: Settings }
    ]
  }
];

const systemAdminNavigation = [
  { name: 'Painel Admin', href: '/app/admin', icon: Shield },
  { name: 'Empresas', href: '/app/admin/companies', icon: Building2 },
  { name: 'Usuários Pendentes', href: '/app/admin/users', icon: UserCheck }
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { hasModuleAccess } = useModules();
  const { isStartup, isMentor, hasProfile } = useStartupProfile();
  const location = useLocation();

  // Helper function to check if a route is active
  const isRouteActive = (href: string) => {
    if (href.includes('?')) {
      // For routes with query parameters, check both path and query
      const [path, query] = href.split('?');
      return location.pathname === path && location.search.includes(query);
    }
    // For regular routes, exact match
    return location.pathname === href;
  };

  // Force cache refresh - refactored sidebar structure

  return (
    <div className={cn("bg-card border-r border-border flex flex-col transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Start Together</h1>
                <p className="text-xs text-muted-foreground">By COFOUND</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4">
        {menuStructure.map((group) => {
          // Check if user has access to at least one item in this group
                // For Startup Hub, check different conditions based on user type
            const hasAccessToGroup = group.items.some(item => {
              if (item.href.includes('/startup-hub')) {
                // Check if user has startup-hub access
                if (!hasModuleAccess('startup-hub')) return false;
                
                // Filter out 'startups' tab for mentors unless they have mentored startups
                if (item.href.includes('?tab=startups') && isMentor) {
                  return true; // Allow startups tab for mentors to see their mentored startups
                }
                
                return true;
              }
              if (item.href.includes('/strategic-map') || item.href.includes('/objectives') || item.href.includes('/indicators') || item.href.includes('/projects') || item.href.includes('/reports')) {
                return hasModuleAccess('strategic-planning');
              }
              return true; // Dashboard and settings are always accessible
            });

          if (!hasAccessToGroup) return null;

          return (
            <div key={group.name} className="space-y-2">
              {/* Module Title - Non-clickable with emphasis */}
              {!collapsed && (
                <div className="flex items-center px-3 py-2">
                  <group.icon className="h-5 w-5 mr-3 text-foreground" />
                  <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    {group.name}
                  </span>
                </div>
              )}
              
              {/* Group Items - Indented sub-menu */}
              <div className="space-y-1">
                {group.items.map(item => {
                  // Check access for individual items
                  let hasAccess = true;
                  if (item.href.includes('/startup-hub')) {
                    hasAccess = hasModuleAccess('startup-hub');
                  } else if (item.href.includes('/strategic-map') || item.href.includes('/objectives') || item.href.includes('/indicators') || item.href.includes('/projects') || item.href.includes('/reports')) {
                    hasAccess = hasModuleAccess('strategic-planning');
                  }

                  if (!hasAccess) return null;

                  // Check startup profile requirements for startup hub items
                  if (item.href.includes('/startup-hub') && hasProfile) {
                    if (item.requiresStartup && !isStartup) return null;
                    if (item.requiresMentor && !isMentor) return null;
                  }

                  const isActive = isRouteActive(item.href);

                  return (
                    <NavLink 
                      key={item.name} 
                      to={item.href} 
                      className={cn(
                        "flex items-center py-2 rounded-lg transition-colors",
                        // Indentation for sub-items
                        collapsed ? "px-3 justify-center" : "px-3 ml-4",
                        // Color scheme: muted by default, accent on hover/active
                        isActive 
                          ? "bg-accent text-accent-foreground font-medium" 
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                      {!collapsed && <span className="text-sm">{item.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* System Admin Section */}
        <PermissionGate requiredRole="admin">
          <div className="pt-4 mt-4 border-t border-border space-y-2">
            {!collapsed && (
              <div className="flex items-center px-3 py-1">
                <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Admin Sistema
                </span>
              </div>
            )}
            
            <div className="space-y-1">
              {systemAdminNavigation.map(item => (
                <NavLink 
                  key={item.name} 
                  to={item.href} 
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive ? "bg-destructive/10 text-destructive font-medium" : "text-foreground hover:bg-destructive/5",
                    collapsed && "justify-center"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && <span className="text-sm">{item.name}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </PermissionGate>
      </nav>
    </div>
  );
};
