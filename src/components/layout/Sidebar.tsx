import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Target, Briefcase, Users, Settings, ChevronLeft, ChevronRight, Zap, TrendingUp, Activity, Brain, Map, Building2, UserCheck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useMultiTenant';
import { PermissionGate } from '@/components/PermissionGate';
import { useModules } from '@/hooks/useModules';
import { ModuleSelector } from '@/components/ui/ModuleSelector';
const getNavigationByModule = (moduleSlug: string) => {
  if (moduleSlug === 'strategic-planning') {
    return [{
      name: 'Dashboard',
      href: '/app/dashboard',
      icon: BarChart3
    }, {
      name: 'Mapa Estratégico',
      href: '/app/strategic-map',
      icon: Map
    }, {
      name: 'Objetivos',
      href: '/app/objectives',
      icon: Target
    }, {
      name: 'Resultados Chave',
      href: '/app/indicators',
      icon: TrendingUp
    }, {
      name: 'Projetos',
      href: '/app/projects',
      icon: Briefcase
    }, {
      name: 'Relatórios',
      href: '/app/reports',
      icon: Activity
    }];
  }
  
  if (moduleSlug === 'startup-hub') {
    return [{
      name: 'Dashboard',
      href: '/app/startup-hub',
      icon: BarChart3
    }];
  }
  
  return [];
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
  const [collapsed, setCollapsed] = useState(false);
  const { currentModule } = useModules();
  
  const navigation = getNavigationByModule(currentModule?.slug || 'strategic-planning');
  return <div className={cn("bg-card border-r border-border flex flex-col transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">StrategyHub</h1>
                <p className="text-xs text-muted-foreground">By COFOUND</p>
              </div>
            </div>}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsed && (
          <div className="mt-3">
            <ModuleSelector />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map(item => <NavLink key={item.name} to={item.href} className={({
        isActive
      }) => cn("flex items-center px-3 py-2 rounded-lg transition-colors", isActive ? "bg-accent text-accent-foreground font-medium" : "text-foreground hover:bg-accent/50", collapsed && "justify-center")}>
            <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>)}
        
        <div className="pt-4 mt-4 border-t border-border">
          {adminNavigation.map(item => <NavLink key={item.name} to={item.href} className={({
          isActive
        }) => cn("flex items-center px-3 py-2 rounded-lg transition-colors", isActive ? "bg-accent text-accent-foreground font-medium" : "text-foreground hover:bg-accent/50", collapsed && "justify-center")}>
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>)}
          
          <PermissionGate requiredRole="admin">
            {!collapsed && <div className="mt-4 mb-2">
                <div className="flex items-center px-3 py-1">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Admin Sistema
                  </span>
                </div>
              </div>}
            <NavLink to="/app/admin" className={({
            isActive
          }) => cn("flex items-center px-3 py-2 rounded-lg transition-colors", isActive ? "bg-destructive/10 text-destructive font-medium" : "text-foreground hover:bg-destructive/5", collapsed && "justify-center")}>
                <Shield className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && <span>Painel Admin</span>}
              </NavLink>
          </PermissionGate>
        </div>
      </nav>
    </div>;
};