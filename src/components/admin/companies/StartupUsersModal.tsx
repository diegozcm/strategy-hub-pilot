import React, { useState, useEffect } from 'react';
import { 
  User, 
  Plus, 
  Trash2, 
  Users,
  Rocket,
  UserCheck,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Company, CompanyUser } from '@/types/admin';

interface StartupUsersModalProps {
  company: Company | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

interface AvailableUser {
  user_id: string;
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  startup_profile_type?: 'startup' | 'mentor' | null;
  startup_profile_status?: string;
}

interface StartupUser extends CompanyUser {
  startup_profile_type?: 'startup' | 'mentor' | null;
  startup_profile_status?: string;
}

export const StartupUsersModal: React.FC<StartupUsersModalProps> = ({
  company,
  isOpen,
  onOpenChange,
  onUpdated
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<StartupUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (company && isOpen) {
      loadUsers();
    }
  }, [company, isOpen]);

  const loadUsers = async () => {
    if (!company) return;
    
    setLoading(true);
    try {
      // Buscar usuários da empresa com informações do perfil startup
      const { data: relations, error: relationsError } = await supabase
        .from('user_company_relations')
        .select('user_id, role')
        .eq('company_id', company.id);

      if (relationsError) throw relationsError;

      if (relations && relations.length > 0) {
        const userIds = relations.map(r => r.user_id);
        
        // Buscar perfis dos usuários
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, id, first_name, last_name, email, status')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Buscar perfis startup hub
        const { data: startupProfiles, error: startupProfilesError } = await supabase
          .from('startup_hub_profiles')
          .select('user_id, type, status')
          .in('user_id', userIds)
          .eq('status', 'active');

        if (startupProfilesError) throw startupProfilesError;

        const users = relations.map(relation => {
          const profile = profiles?.find(p => p.user_id === relation.user_id);
          const startupProfile = startupProfiles?.find(sp => sp.user_id === relation.user_id);
          
          return {
            user_id: relation.user_id,
            id: profile?.id || '',
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            email: profile?.email,
            role: relation.role as 'admin' | 'manager' | 'member',
            status: profile?.status as 'active' | 'inactive',
            company_id: company.id,
            company_name: company.name,
            startup_profile_type: startupProfile?.type || null,
            startup_profile_status: startupProfile?.status || null
          };
        }).filter(user => user.id);

        setCompanyUsers(users);
      } else {
        setCompanyUsers([]);
      }

      // Buscar usuários disponíveis (que não estão na empresa) com perfis startup
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('user_id, id, first_name, last_name, email, status')
        .eq('status', 'active');

      if (allProfilesError) throw allProfilesError;

      // Buscar perfis startup de todos os usuários
      const { data: allStartupProfiles, error: allStartupProfilesError } = await supabase
        .from('startup_hub_profiles')
        .select('user_id, type, status')
        .eq('status', 'active');

      if (allStartupProfilesError) throw allStartupProfilesError;

      const companyUserIds = relations?.map(r => r.user_id) || [];
      const available = allProfiles?.filter(p => !companyUserIds.includes(p.user_id)) || [];
      
      const availableWithStartupProfiles = available.map(user => {
        const startupProfile = allStartupProfiles?.find(sp => sp.user_id === user.user_id);
        return {
          ...user,
          startup_profile_type: startupProfile?.type || null,
          startup_profile_status: startupProfile?.status || null
        };
      });
      
      setAvailableUsers(availableWithStartupProfiles);

    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!company || !selectedUser || !currentUser) return;

    setAdding(true);
    try {
      // Adicionar usuário à empresa
      const { error: addError } = await supabase
        .rpc('assign_user_to_company_v2', {
          _user_id: selectedUser,
          _company_id: company.id,
          _admin_id: currentUser.id,
          _role: selectedRole
        });

      if (addError) throw addError;

      // Verificar se o usuário tem perfil startup hub
      const { data: existingProfile } = await supabase
        .from('startup_hub_profiles')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('status', 'active')
        .maybeSingle();

      // Se não tem perfil startup, criar um
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('startup_hub_profiles')
          .insert({
            user_id: selectedUser,
            type: 'startup',
            status: 'active'
          });

        if (profileError) {
          console.warn('Aviso ao criar perfil startup:', profileError);
          toast({
            title: 'Usuário Adicionado',
            description: 'Usuário adicionado à startup, mas perfil Startup HUB precisa ser configurado manualmente.',
            variant: 'default'
          });
        } else {
          toast({
            title: 'Sucesso',
            description: 'Usuário adicionado à startup e perfil Startup HUB criado automaticamente'
          });
        }
      } else {
        toast({
          title: 'Sucesso',
          description: 'Usuário adicionado à startup com sucesso'
        });
      }

      setSelectedUser('');
      setSelectedRole('member');
      loadUsers();
      onUpdated();
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar usuário à startup',
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!company || !currentUser) return;

    try {
      const { error } = await supabase
        .rpc('unassign_user_from_company_v2', {
          _user_id: userId,
          _company_id: company.id,
          _admin_id: currentUser.id
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário removido da startup com sucesso'
      });

      loadUsers();
      onUpdated();
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover usuário da startup',
        variant: 'destructive'
      });
    }
  };

  const getStartupProfileBadge = (user: StartupUser | AvailableUser) => {
    if (!user.startup_profile_type) {
      return (
        <Badge variant="outline" className="text-orange-400 border-orange-400">
          Sem Perfil Startup
        </Badge>
      );
    }

    return (
      <Badge 
        variant={user.startup_profile_type === 'startup' ? 'default' : 'secondary'}
        className={user.startup_profile_type === 'startup' ? 'bg-blue-600' : 'bg-purple-600'}
      >
        <Rocket className="w-3 h-3 mr-1" />
        {user.startup_profile_type === 'startup' ? 'Startup' : 'Mentor'}
      </Badge>
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Building2 className="w-4 h-4 text-yellow-400" />;
      case 'manager':
        return <UserCheck className="w-4 h-4 text-blue-400" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      default:
        return 'Membro';
    }
  };

  if (!company) return null;

  const usersWithoutStartupProfile = companyUsers.filter(user => !user.startup_profile_type);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-400" />
            Gerenciar Usuários Startup - {company.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Gerencie usuários desta startup e seus perfis no Startup HUB
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Aviso sobre usuários sem perfil startup */}
          {usersWithoutStartupProfile.length > 0 && (
            <Alert className="bg-orange-900/20 border-orange-700">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300">
                {usersWithoutStartupProfile.length} usuário(s) não têm perfil no Startup HUB configurado.
                Eles não poderão acessar funcionalidades específicas para startups.
              </AlertDescription>
            </Alert>
          )}

          {/* Adicionar usuário */}
          <Card className="bg-muted border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-card-foreground text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Usuário à Startup
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Selecione um usuário para adicionar à startup (perfil Startup HUB será criado automaticamente se necessário)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="flex-1 bg-input border-border text-foreground">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground max-h-48">
                    {availableUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{user.first_name} {user.last_name} ({user.email})</span>
                          <div className="ml-2">
                            {getStartupProfileBadge(user)}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRole} onValueChange={(value: 'admin' | 'manager' | 'member') => setSelectedRole(value)}>
                  <SelectTrigger className="w-40 bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>  
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleAddUser} 
                  disabled={!selectedUser || adding}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {adding ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usuários da startup */}
          <Card className="bg-muted border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-card-foreground text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuários da Startup ({companyUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : companyUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Rocket className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Nenhum usuário associado
                  </h3>
                  <p className="text-slate-400">
                    Adicione usuários para começar a gerenciar a startup.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300">Usuário</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Papel na Empresa</TableHead>
                      <TableHead className="text-slate-300">Perfil Startup</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300 w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyUsers.map((user) => (
                      <TableRow key={user.user_id} className="border-slate-600">
                        <TableCell className="text-white">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <span className="text-slate-300">
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStartupProfileBadge(user)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(user.user_id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-600">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};