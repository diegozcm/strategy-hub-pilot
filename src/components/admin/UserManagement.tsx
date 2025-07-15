
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Edit, 
  UserCheck, 
  UserX, 
  Search, 
  Shield, 
  User, 
  Crown 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: 'admin' | 'manager' | 'member';
  status: string;
  department?: string;
  position?: string;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editingRole, setEditingRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

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

      if (error) {
        console.error('Error loading users:', error);
        throw error;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
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
    if (!user) return;

    try {
      console.log('Updating user role:', { userId, newRole, adminId: user.id });
      
      const { data, error } = await supabase.rpc('update_user_role', {
        _user_id: userId,
        _new_role: newRole,
        _admin_id: user.id
      });

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Perfil do usuário atualizado com sucesso',
      });

      await loadUsers();
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar perfil do usuário',
        variant: 'destructive',
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    if (!user) return;

    try {
      const isDeactivating = currentStatus === 'active';
      
      const { data, error } = await supabase.rpc(
        isDeactivating ? 'deactivate_user' : 'activate_user',
        {
          _user_id: userId,
          _admin_id: user.id
        }
      );

      if (error) {
        console.error('Error toggling user status:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: `Usuário ${isDeactivating ? 'desativado' : 'ativado'} com sucesso`,
      });

      await loadUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status do usuário',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower) ||
      user.position?.toLowerCase().includes(searchLower)
    );
  });

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'manager': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta funcionalidade.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Gerenciamento de Usuários</span>
        </CardTitle>
        <CardDescription>
          Gerencie usuários, seus perfis de acesso e status no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email, departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={loadUsers} variant="outline">
              Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {userProfile.first_name} {userProfile.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{userProfile.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(userProfile.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(userProfile.role)}
                          {getRoleLabel(userProfile.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(userProfile.status)}>
                          {userProfile.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{userProfile.department || '-'}</p>
                          <p className="text-xs text-gray-500">{userProfile.position || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog open={isEditDialogOpen && selectedUser?.id === userProfile.id} onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) setSelectedUser(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(userProfile);
                                  setEditingRole(userProfile.role);
                                  setIsEditDialogOpen(true);
                                }}
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
                                  <p className="text-sm font-medium">Usuário</p>
                                  <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Função</label>
                                  <Select
                                    value={editingRole}
                                    onValueChange={(value: 'admin' | 'manager' | 'member') => {
                                      setEditingRole(value);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4" />
                                          Membro
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="manager">
                                        <div className="flex items-center gap-2">
                                          <Shield className="h-4 w-4" />
                                          Gerente
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                          <Crown className="h-4 w-4" />
                                          Administrador
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={() => {
                                    if (selectedUser) {
                                      updateUserRole(selectedUser.user_id, editingRole);
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
                              <Button 
                                size="sm" 
                                variant={userProfile.status === 'active' ? 'destructive' : 'default'}
                                disabled={userProfile.user_id === user?.id}
                              >
                                {userProfile.status === 'active' ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {userProfile.status === 'active' ? 'Desativar' : 'Ativar'} Usuário
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja {userProfile.status === 'active' ? 'desativar' : 'ativar'} este usuário? 
                                  {userProfile.status === 'active' ? ' O usuário não conseguirá mais acessar o sistema.' : ' O usuário voltará a ter acesso ao sistema.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => toggleUserStatus(userProfile.user_id, userProfile.status)}
                                  className={userProfile.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                                >
                                  {userProfile.status === 'active' ? 'Desativar' : 'Ativar'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Nenhum usuário cadastrado no sistema.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
