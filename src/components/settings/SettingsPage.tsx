
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Key, 
  Mail, 
  Chrome,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { UserManagement } from '@/components/admin/UserManagement';

export const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [resetEmail, setResetEmail] = useState('');

  const isAdmin = profile?.role === 'admin';

  const handlePasswordReset = async () => {
    if (!resetEmail) return;

    try {
      // Note: Password reset functionality would need to be implemented separately
      toast({
        title: 'Funcionalidade não disponível',
        description: 'Reset de senha não implementado no novo sistema',
        variant: 'destructive',
      });
      
      setResetEmail('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar email de reset',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleConnect = async () => {
    try {
      // Note: Google OAuth functionality would need to be implemented separately
      toast({
        title: 'Funcionalidade não disponível',
        description: 'OAuth Google não implementado no novo sistema',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao conectar com Google',
        variant: 'destructive',
      });
    }
  };

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
          {isAdmin && <TabsTrigger value="users">Usuários</TabsTrigger>}
          <TabsTrigger value="oauth">OAuth & SSO</TabsTrigger>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Reset de Senha</span>
                </CardTitle>
                <CardDescription>
                  Envie um email de reset de senha para qualquer usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Email do usuário"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    type="email"
                  />
                  <Button onClick={handlePasswordReset} disabled={!resetEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management (Admin Only) */}
        {isAdmin && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}

        {/* OAuth Settings */}
        <TabsContent value="oauth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>OAuth & SSO</span>
              </CardTitle>
              <CardDescription>
                Configure provedores de autenticação externa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Chrome className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">Google OAuth</p>
                      <p className="text-sm text-gray-500">
                        Faça login com sua conta Google
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleGoogleConnect} variant="outline">
                    Conectar Google
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Configuração Necessária</p>
                    <p className="text-sm text-yellow-700">
                      Para usar OAuth do Google, configure as credenciais no painel do Supabase.
                      Visite Authentication → Providers no dashboard do Supabase.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
