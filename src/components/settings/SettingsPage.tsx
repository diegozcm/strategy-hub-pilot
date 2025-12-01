
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Palette
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCurrentModuleRole } from '@/hooks/useCurrentModuleRole';
import { useIsSystemAdmin } from '@/hooks/useIsSystemAdmin';
import { UserManagementPage } from '@/components/admin/UserManagementPage';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PasswordChangeForm } from './PasswordChangeForm';
import { ModulesSettingsTab } from './ModulesSettingsTab';

export const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { isModuleManager, isModuleAdmin } = useCurrentModuleRole();
  const { data: isSystemAdmin } = useIsSystemAdmin();

  // Permissões baseadas no papel do módulo atual
  const isManagerOrAdmin = isModuleManager || isModuleAdmin;
  const showUsersTab = isSystemAdmin; // Apenas System Admin vê aba Usuários

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      default: return 'Membro';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          {isManagerOrAdmin && <TabsTrigger value="modules">Módulos</TabsTrigger>}
          {showUsersTab && <TabsTrigger value="users">Usuários</TabsTrigger>}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Gerencie as configurações básicas da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
                <div>
                  <Label htmlFor="role">Sua Função</Label>
                  <Input id="role" value={getRoleLabel(profile?.role || 'member')} disabled />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Tema</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre tema claro, escuro ou seguir configurações do sistema
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <PasswordChangeForm isAdmin={isModuleAdmin} />
        </TabsContent>

        {/* Modules Settings (Manager & Admin Only) */}
        {isManagerOrAdmin && (
          <TabsContent value="modules">
            <ModulesSettingsTab />
          </TabsContent>
        )}

        {/* User Management (System Admin Only) */}
        {showUsersTab && (
          <TabsContent value="users">
            <UserManagementPage />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
