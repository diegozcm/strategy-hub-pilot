
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Key, 
  Mail, 
  Palette
} from 'lucide-react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserManagementPage } from '@/components/admin/UserManagementPage';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Email validation schema
const emailSchema = z.string()
  .trim()
  .email({ message: "Email inválido" })
  .max(255, { message: "Email deve ter menos de 255 caracteres" });

export const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email válido',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailValidation = emailSchema.safeParse(resetEmail);
    if (!emailValidation.success) {
      toast({
        title: 'Erro',
        description: emailValidation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { email: resetEmail.trim() }
      });

      if (error) {
        console.error('Reset password function error:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao processar solicitação. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: 'Erro',
          description: data?.message || 'Erro ao processar solicitação.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Token enviado!',
        description: `${data.message} O usuário receberá um token temporário por email.`,
      });
      
      setResetEmail('');
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Algo deu errado. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Reset de Senha</span>
                </CardTitle>
                <CardDescription>
                  Envie um token temporário por email para redefinir a senha de qualquer usuário
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
                  <Button 
                    onClick={handlePasswordReset} 
                    disabled={!resetEmail.trim() || isLoading}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {isLoading ? 'Enviando...' : 'Enviar Token'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management (Admin Only) */}
        {isAdmin && (
          <TabsContent value="users">
            <UserManagementPage />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
