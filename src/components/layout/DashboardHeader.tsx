import React from 'react';
import { Bell, Search, User, Settings, LogOut, Brain } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useMultiTenant';
import { Input } from '@/components/ui/input';
import { CompanySelector } from '@/components/CompanySelector';
import { ModuleSelector } from '@/components/ui/ModuleSelector';
export const DashboardHeader: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  return <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Buscar projetos, objetivos..." className="pl-10 bg-muted border-border" />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Module Selector */}
          
          
          {/* Company Selector */}
          <CompanySelector />
          
          <NavLink to="/app/ai-copilot">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:block text-sm font-medium">Copilot HUB</span>
            </Button>
          </NavLink>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
               <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user?.email?.split('@')[0] || 'Usuário'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
};