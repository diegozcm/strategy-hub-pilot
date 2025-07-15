import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Key, 
  Mail, 
  Chrome,
  Trash2,
  Edit,
  Plus,
  Search,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  department: string;
  position: string;
  status: string;
  created_at: string;
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
      }
    };
    
    checkAdminRole();
  }, [user]);

  // Load users (admin only)
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'manager' | 'member') => {
    try {
      // Update profile role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update or insert user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole
        }, {
          onConflict: 'user_id'
        });

      if (roleError) throw roleError;

      toast({
        title: 'Sucesso',
        description: 'Perfil do usuário atualizado',
      });

      loadUsers();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar perfil do usuário',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Note: This will only deactivate the user profile
      // The actual auth.users record should be handled by Supabase admin
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário desativado',
      });

      loadUsers();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao desativar usuário',
        variant: 'destructive',
      });
    }
  };

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

  const filteredUsers = users.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      default: return 'secondary';
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
                  <Input id="role" value={getRoleLabel(userRole)} disabled />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Gerenciamento de Usuários</span>
                </CardTitle>
                <CardDescription>
                  Gerencie usuários e seus perfis de acesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={loadUsers} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400">
                                {user.department} - {user.position}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Usuário</DialogTitle>
                                  <DialogDescription>
                                    Altere o perfil de acesso do usuário
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Usuário</Label>
                                    <p className="text-sm">{selectedUser?.email}</p>
                                  </div>
                                  <div>
                                    <Label htmlFor="role">Função</Label>
                                    <Select
                                      value={selectedUser?.role || 'member'}
                                      onValueChange={(value: 'admin' | 'manager' | 'member') => {
                                        if (selectedUser) {
                                          setSelectedUser({ ...selectedUser, role: value });
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="member">Membro</SelectItem>
                                        <SelectItem value="manager">Gerente</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      if (selectedUser) {
                                        updateUserRole(selectedUser.user_id, selectedUser.role);
                                        setSelectedUser(null);
                                      }
                                    }}
                                    className="w-full"
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Atualizar Função
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Desativar Usuário</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja desativar este usuário? 
                                    Esta ação pode ser revertida.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(user.user_id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Desativar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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