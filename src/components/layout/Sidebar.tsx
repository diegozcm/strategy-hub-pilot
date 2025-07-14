
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Target, 
  Briefcase, 
  Users, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Activity,
  Brain,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Mapa Estratégico', href: '/strategic-map', icon: Map },
  { name: 'Objetivos', href: '/objectives', icon: Target },
  { name: 'Relatórios', href: '/reports', icon: Activity },
  { name: 'Projetos', href: '/projects', icon: Briefcase },
  { name: 'Resultados Chave', href: '/indicators', icon: TrendingUp },
  { name: 'Equipe', href: '/team', icon: Users },
];

const adminNavigation = [
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">StrategyHub</h1>
                <p className="text-xs text-gray-500">Gestão Estratégica</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100",
                collapsed && "justify-center"
              )
            }
          >
            <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
        
        <div className="pt-4 mt-4 border-t border-gray-200">
          {adminNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100",
                  collapsed && "justify-center"
                )
              }
            >
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
