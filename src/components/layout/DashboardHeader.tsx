
import React from 'react';
import { Bell, Search, User, Settings, LogOut, Target, BarChart3, TrendingUp } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';

export const DashboardHeader: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-gradient-to-r from-[hsl(var(--header-primary))] to-[hsl(201_90%_55%)] shadow-lg">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white text-xl font-bold">
                StrategicHub
              </h1>
              <p className="text-white/80 text-sm">
                Planejamento Estratégico
              </p>
            </div>
          </div>

          {/* Search Bar - Centro */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <Input
                placeholder="Buscar projetos, objetivos, indicadores..."
                className="pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 rounded-xl focus:bg-white/20 transition-all duration-200"
              />
            </div>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Search mobile */}
            <Button variant="ghost" size="sm" className="md:hidden text-white hover:bg-white/10">
              <Search className="h-5 w-5" />
            </Button>

            {/* AI Copilot */}
            <NavLink to="/ai-copilot">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 transition-all duration-200">
                <div className="flex items-center space-x-2">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <span className="hidden lg:block text-sm font-medium">AI Copilot</span>
                </div>
              </Button>
            </NavLink>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative text-white hover:bg-white/10 transition-all duration-200">
              <div className="bg-white/10 p-2 rounded-lg">
                <Bell className="h-5 w-5" />
              </div>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                3
              </span>
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl h-10 w-10 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-white">
                        {user?.email?.split('@')[0] || 'Usuário'}
                      </div>
                      <div className="text-xs text-white/70">
                        Administrador
                      </div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 mt-2 bg-white/95 backdrop-blur-sm border-white/20">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'usuario@exemplo.com'}
                  </p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center w-full px-4 py-3 hover:bg-gray-50">
                    <User className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Meu Perfil</div>
                      <div className="text-xs text-gray-500">Gerencie suas informações</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center w-full px-4 py-3 hover:bg-gray-50">
                    <Settings className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Configurações</div>
                      <div className="text-xs text-gray-500">Preferências do sistema</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600 px-4 py-3 hover:bg-red-50">
                  <LogOut className="mr-3 h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">Sair do Sistema</div>
                    <div className="text-xs">Fazer logout da conta</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
