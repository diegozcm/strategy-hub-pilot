
import React from 'react';
import { Bell, User, Settings, LogOut, Brain } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useMultiTenant';
import { CompanySelector } from '@/components/CompanySelector';

export const DashboardHeader: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    console.log('🚪 DashboardHeader: Starting logout process');
    await signOut();
  };

  return (
    <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-3">
          {/* Company Selector */}
          <CompanySelector />
          
          <NavLink to="/app/ai-copilot">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:block text-sm font-medium">Copilot HUB</span>
            </Button>
          </NavLink>
          
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
               <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                 <span className="hidden sm:block text-sm font-medium">
                   {profile?.first_name || 'Usuário'}
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
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
