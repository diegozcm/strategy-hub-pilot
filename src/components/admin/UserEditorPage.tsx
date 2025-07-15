import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Edit, 
  UserCheck, 
  UserX, 
  Search, 
  Shield, 
  User, 
  Crown,
  Building,
  Plus,
  Trash2,
  Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UserProfile, Company, CompanyUser } from '@/types/admin';

interface EditUserDialogProps {
  user: UserProfile | null;
  companies: Company[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ 
  user, 
  companies, 
  open, 
  onOpenChange, 
  onUserUpdated 
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [userCompanies, setUserCompanies] = useState<CompanyUser[]>([]);

  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
      loadUserCompanies();
    }
  }, [user]);

  const loadUserCompanies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_company_relations')
        .select(`
          id,
          company_id,
          role,
          companies (
            id,
            name,
            status
          )
        `)
        .eq('user_id', user.user_id);

      if (error) throw error;

      const companyUsers = data?.map(relation => ({
        user_id: user.user_id,
        id: relation.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: relation.role as 'admin' | 'manager' | 'member',
        status: user.status,
        company_id: relation.company_id,
        company_name: relation.companies?.name || 'Empresa não encontrada'
      })) || [];

      setUserCompanies(companyUsers);
    } catch (error) {
      console.error('Erro ao carregar empresas do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas do usuário',
        variant: 'destructive'
      });
    }
  };

  const handleSaveUser = async () => {
    if (!editedUser || !currentUser) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedUser.first_name,
          last_name: editedUser.last_name,
          email: editedUser.email,
          department: editedUser.department,
          position: editedUser.position,
          role: editedUser.role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', editedUser.user_id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Dados do usuário atualizados com sucesso'
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar dados do usuário',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompany = async (companyId: string, role: string) => {
    if (!user || !currentUser) return;

    try {
      const { error } = await supabase.rpc('assign_user_to_company_v2', {
        _user_id: user.user_id,
        _company_id: companyId,
        _admin_id: currentUser.id,
        _role: role
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário associado à empresa com sucesso'
      });

      loadUserCompanies();
    } catch (error) {
      console.error('Erro ao associar usuário à empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao associar usuário à empresa',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (!user || !currentUser) return;

    try {
      const { error } = await supabase.rpc('unassign_user_from_company_v2', {
        _user_id: user.user_id,
        _company_id: companyId,
        _admin_id: currentUser.id
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário desvinculado da empresa com sucesso'
      });

      loadUserCompanies();
    } catch (error) {
      console.error('Erro ao desvincular usuário da empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desvincular usuário da empresa',
        variant: 'destructive'
      });
    }
  };

  const toggleUserStatus = async () => {
    if (!user || !currentUser) return;

    try {
      const isDeactivating = user.status === 'active';
      
      const { error } = await supabase.rpc(
        isDeactivating ? 'deactivate_user' : 'activate_user',
        {
          _user_id: user.user_id,
          _admin_id: currentUser.id
        }
      );

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Usuário ${isDeactivating ? 'desativado' : 'ativado'} com sucesso`
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário',
        variant: 'destructive'
      });
    }
  };

  if (!editedUser) return null;

  const availableCompanies = companies.filter(company => 
    !userCompanies.some(uc => uc.company_id === company.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite os dados do usuário e gerencie suas associações com empresas
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={editedUser.first_name || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={editedUser.last_name || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedUser.email || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={editedUser.department || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, department: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={editedUser.position || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, position: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="role">Função no Sistema</Label>
                <Select
                  value={editedUser.role}
                  onValueChange={(value: 'admin' | 'manager' | 'member') => 
                    setEditedUser({ ...editedUser, role: value })
                  }
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
            </CardContent>
          </Card>

          {/* Empresas Associadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Empresas Associadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userCompanies.length > 0 ? (
                <div className="space-y-2">
                  {userCompanies.map((companyUser) => (
                    <div key={companyUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{companyUser.company_name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {companyUser.role === 'admin' ? 'Administrador' : 
                           companyUser.role === 'manager' ? 'Gerente' : 'Membro'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveCompany(companyUser.company_id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Usuário não está associado a nenhuma empresa</p>
              )}

              {availableCompanies.length > 0 && (
                <div className="border-t pt-4">
                  <Label>Adicionar à Empresa</Label>
                  <div className="flex gap-2 mt-2">
                    <Select onValueChange={(companyId) => {
                      const company = companies.find(c => c.id === companyId);
                      if (company) {
                        handleAddCompany(companyId, 'member');
                      }
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant={user.status === 'active' ? 'destructive' : 'default'}>
                  {user.status === 'active' ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Ativar
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {user.status === 'active' ? 'Desativar' : 'Ativar'} Usuário
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja {user.status === 'active' ? 'desativar' : 'ativar'} este usuário?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={toggleUserStatus}>
                    {user.status === 'active' ? 'Desativar' : 'Ativar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const UserEditorPage: React.FC = () => {
  const { user: currentUser, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, companiesResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true })
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (companiesResponse.error) throw companiesResponse.error;
      
      // Type cast to match our interfaces
      const usersData = (usersResponse.data || []).map(user => ({
        ...user,
        status: user.status as 'active' | 'inactive'
      })) as UserProfile[];
      
      const companiesData = (companiesResponse.data || []).map(company => ({
        ...company,
        status: company.status as 'active' | 'inactive'
      })) as Company[];
      
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    if (userId === currentUser.id) {
      toast({
        title: "Erro", 
        description: "Você não pode excluir sua própria conta",
        variant: "destructive"
      });
      return;
    }

    try {
      // Primeiro remover o usuário das empresas
      const { error: relationError } = await supabase
        .from('user_company_relations')
        .delete()
        .eq('user_id', userId);

      if (relationError) throw relationError;

      // Depois remover o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Por fim, remover o usuário do auth (apenas admin pode fazer isso via RPC se necessário)
      // Como não temos uma função RPC para isso, vamos apenas remover o perfil
      
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso'
      });

      loadData();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir usuário',
        variant: 'destructive'
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
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
            <p className="text-gray-400">Você não tem permissão para acessar esta funcionalidade.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Users className="h-5 w-5" />
          <span>Edição de Usuários</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Edite dados dos usuários e gerencie suas associações com empresas
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
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button onClick={loadData} variant="outline">
              Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="border border-slate-600 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600">
                    <TableHead className="text-slate-300">Usuário</TableHead>
                    <TableHead className="text-slate-300">Função</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Departamento</TableHead>
                    <TableHead className="text-slate-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userProfile) => (
                    <TableRow key={userProfile.id} className="border-slate-600">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">
                            {userProfile.first_name} {userProfile.last_name}
                          </p>
                          <p className="text-sm text-slate-400">{userProfile.email}</p>
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
                          <p className="text-sm text-white">{userProfile.department || '-'}</p>
                          <p className="text-xs text-slate-400">{userProfile.position || '-'}</p>
                        </div>
                      </TableCell>
                       <TableCell>
                         <div className="flex gap-2">
                           <Button 
                             size="sm" 
                             variant="outline"
                             onClick={() => {
                               setSelectedUser(userProfile);
                               setIsEditDialogOpen(true);
                             }}
                           >
                             <Edit className="h-4 w-4 mr-2" />
                             Editar
                           </Button>
                           
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button 
                                 size="sm" 
                                 variant="destructive"
                                 disabled={userProfile.user_id === currentUser?.id}
                               >
                                 <Trash2 className="h-4 w-4 mr-2" />
                                 Excluir
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                 <AlertDialogDescription className="text-slate-400">
                                   Tem certeza que deseja excluir o usuário {userProfile.first_name} {userProfile.last_name}? 
                                   Esta ação não pode ser desfeita e todos os dados associados ao usuário serão removidos.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                 <AlertDialogAction 
                                   onClick={() => handleDeleteUser(userProfile.user_id)}
                                   className="bg-red-600 hover:bg-red-700"
                                 >
                                   Excluir
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
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum usuário encontrado</h3>
              <p className="text-slate-400">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Nenhum usuário cadastrado no sistema.'}
              </p>
            </div>
          )}
        </div>

        <EditUserDialog
          user={selectedUser}
          companies={companies}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUserUpdated={loadData}
        />
      </CardContent>
    </Card>
  );
};