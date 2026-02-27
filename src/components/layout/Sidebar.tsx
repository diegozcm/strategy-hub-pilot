
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Target, Briefcase, Users, Settings, ChevronLeft, ChevronRight, Zap, TrendingUp, Activity, Map, Building, User, Circle, Rocket, Search, Calendar } from 'lucide-react';
import { AtlasOrb } from '@/components/ai/atlas/AtlasOrb';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useMultiTenant';

import { useModules } from '@/hooks/useModules';
import { useStartupProfile } from '@/hooks/useStartupProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCompanyAIAccess } from '@/hooks/useCompanyAIAccess';

const menuStructure = [
  {
    name: 'STRATEGY HUB',
    icon: Search,
    items: [
      { name: 'Dashboard', href: '/app/dashboard', icon: BarChart3 },
      { name: 'Mapa Estratégico', href: '/app/strategic-map', icon: Map },
      { name: 'Objetivos', href: '/app/objectives', icon: Target },
      { name: 'Resultados Chave', href: '/app/indicators', icon: TrendingUp },
      { name: 'Projetos', href: '/app/projects', icon: Briefcase },
      { name: 'Ferramentas', href: '/app/tools', icon: Circle },
    ]
  },
  {
    name: 'STARTUP HUB',
    icon: Rocket,
    items: [
      { name: 'Dashboard', href: '/app/startup-hub?tab=dashboard', icon: BarChart3 },
      { name: 'Avaliação BEEP', href: '/app/startup-hub?tab=beep', icon: TrendingUp, requiresStartup: true },
      { name: 'Startups', href: '/app/startup-hub?tab=startups', icon: Building, requiresMentor: true },
      { name: 'Avaliações BEEP', href: '/app/startup-hub?tab=beep-analytics', icon: Activity, requiresMentor: true },
      { name: 'Calendário', href: '/app/startup-hub?tab=calendar', icon: Calendar },
      { name: 'Perfil Startup', href: '/app/startup-hub?tab=profile', icon: Rocket, requiresStartup: true }
    ]
  }
];


interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const isMobile = useIsMobile();
  const collapsed = false; // Sidebar is always expanded
  const { hasModuleAccess } = useModules();
  const { isStartup, isMentor, hasProfile } = useStartupProfile();
  const location = useLocation();
  const { hasAIAccess } = useCompanyAIAccess();

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
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        isMobile ? (
          `fixed z-40 h-full w-64 transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`
        ) : (
          `min-h-screen ${collapsed ? 'w-16' : 'w-64'}`
        )
      )}>
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-between">
          {(!collapsed || isMobile) && (
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-[hsl(var(--cofound-blue-light))]" />
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">Strategy HUB</h1>
                <p className="text-xs text-sidebar-foreground/60">By COFOUND</p>
              </div>
            </div>
          )}
          {collapsed && !isMobile && (
            <Target className="h-6 w-6 text-[hsl(var(--cofound-blue-light))] mx-auto" />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Atlas Hub Button */}
        {hasAIAccess && (
          <div className="mb-3 px-0.5">
            <NavLink
              to="/app/atlas-hub"
              className={cn(
                "atlas-sidebar-btn group relative block rounded-xl p-[1.5px] transition-all duration-300",
                isRouteActive('/app/atlas-hub')
                  ? "shadow-[0_0_24px_rgba(56,182,255,0.3),0_0_48px_rgba(205,217,102,0.08)]"
                  : "hover:shadow-[0_0_20px_rgba(56,182,255,0.2),0_0_32px_rgba(205,217,102,0.06)]"
              )}
            >
              {/* Rotating gradient border */}
              <div className="absolute inset-0 rounded-xl atlas-sidebar-btn-border" />
              {/* Inner content */}
              <div className="relative flex items-center gap-3 rounded-[10px] atlas-hub-btn-inner px-4 py-3.5 transition-all duration-300 overflow-hidden">
                <div
                  className="color-orb-atlas shrink-0"
                  style={{
                    '--base': 'oklch(5% 0.01 240)',
                    '--accent1': 'oklch(72% 0.28 155)',
                    '--accent2': 'oklch(70% 0.25 230)',
                    '--accent3': 'oklch(65% 0.22 195)',
                    '--blur': '0.3px',
                    '--contrast': '1.8',
                    '--dot': '0.05rem',
                    '--shadow': '1rem',
                    '--mask': '8%',
                    '--spin-duration': '4s',
                    width: 36,
                    height: 36,
                  } as React.CSSProperties}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold tracking-[0.2em] text-white/95 group-hover:text-white transition-colors uppercase font-display leading-tight">Atlas Hub</span>
                  <span className="text-[9px] font-medium tracking-[0.15em] text-[hsl(var(--cofound-green))]/70 group-hover:text-[hsl(var(--cofound-green))]/90 transition-colors uppercase leading-tight mt-0.5">Powered by COFOUND</span>
                </div>
              </div>
            </NavLink>
          </div>
        )}

        {menuStructure.map((group) => {
          const hasAccessToGroup = group.items.some(item => {
            if (item.href.includes('/startup-hub')) {
              return hasModuleAccess('startup-hub');
            }
            if (item.href.includes('/dashboard') || item.href.includes('/strategic-map') || item.href.includes('/tools') || item.href.includes('/objectives') || item.href.includes('/indicators') || item.href.includes('/projects') || item.href.includes('/reports')) {
              return hasModuleAccess('strategic-planning');
            }
            return false;
          });

          if (!hasAccessToGroup) return null;

          return (
            <div key={group.name} className="space-y-2">
              {(!collapsed || isMobile) && (
                <div className="flex items-center px-3 py-2">
                  <group.icon className="h-5 w-5 mr-3 text-[hsl(var(--cofound-blue-light))]" />
                  <span className="text-sm font-semibold text-sidebar-foreground/80 uppercase tracking-wider">
                    {group.name}
                  </span>
                </div>
              )}
              
              {/* Group Items - Indented sub-menu */}
              <div className="space-y-1">
                {group.items.map(item => {
                  // Check access for individual items
                  let hasAccess = false;
                  if (item.href.includes('/startup-hub')) {
                    hasAccess = hasModuleAccess('startup-hub');
                  } else if (item.href.includes('/dashboard') || item.href.includes('/strategic-map') || item.href.includes('/tools') || item.href.includes('/objectives') || item.href.includes('/indicators') || item.href.includes('/projects') || item.href.includes('/reports')) {
                    hasAccess = hasModuleAccess('strategic-planning');
                  }

                  if (!hasAccess) return null;

                  // Check startup profile requirements for startup hub items
                  if (item.href.includes('/startup-hub') && hasProfile) {
                    if (item.requiresStartup && !isStartup) return null;
                    if (item.requiresMentor && !isMentor) return null;
                  }

                  const isActive = isRouteActive(item.href);

                  // Special handling for calendar with conditional naming
                  if (item.href.includes('tab=calendar')) {
                    const calendarName = 'Mentorias';
                      return (
                      <NavLink 
                        key="calendar" 
                        to={item.href} 
                        className={cn(
                          "flex items-center py-2 rounded-lg transition-colors",
                          isMobile ? "px-3 ml-4" : (collapsed ? "px-3 justify-center" : "px-3 ml-4"),
                        isActive 
                            ? "bg-sidebar-accent/20 text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-accent" 
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                        )}
                      >
                        <Calendar className={cn("h-4 w-4", isActive ? "text-[hsl(66,45%,42%)]" : "text-sidebar-foreground/60", (!collapsed || isMobile) && "mr-3")} />
                        {(!collapsed || isMobile) && <span className="text-sm">{calendarName}</span>}
                      </NavLink>
                    );
                  }

                  return (
                    <NavLink 
                      key={item.name} 
                      to={item.href} 
                      className={cn(
                        "flex items-center py-2 rounded-lg transition-colors",
                        isMobile ? "px-3 ml-4" : (collapsed ? "px-3 justify-center" : "px-3 ml-4"),
                        isActive 
                          ? "bg-sidebar-accent/20 text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-accent" 
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-[hsl(66,45%,42%)]" : "text-sidebar-foreground/60", (!collapsed || isMobile) && "mr-3")} />
                      {(!collapsed || isMobile) && <span className="text-sm">{item.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer - Settings Button */}
      <div className="border-t border-sidebar-border p-4 shrink-0">
        <NavLink 
          to="/app/settings"
          className={cn(
            "flex items-center py-2.5 px-3 rounded-lg transition-colors w-full",
            isMobile ? "" : (collapsed ? "justify-center" : ""),
            isRouteActive('/app/settings')
              ? "bg-sidebar-accent/20 text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-accent"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
          )}
        >
          <Settings className={cn("h-4 w-4", (!collapsed || isMobile) && "mr-3")} />
          {(!collapsed || isMobile) && <span className="text-sm">Configurações</span>}
        </NavLink>
      </div>
    </div>
    </>
  );
};
