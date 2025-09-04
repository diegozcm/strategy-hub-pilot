import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Edit, 
  Search, 
  Shield, 
  User, 
  Crown,
  Building2,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  Settings,
  UserCog,
  Building,
  Lock,
  Activity,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UserProfile, Company, CompanyUser } from '@/types/admin';
import { Checkbox } from '@/components/ui/checkbox';
import ModuleAccessRow from './user-modules/ModuleAccessRow';
import type { UserRole } from '@/types/auth';

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface ExtendedUser extends UserProfile {
  email_confirmed_at?: string | null;
}

interface UserModuleAccess {
  user_id: string;
  module_id: string;
  active: boolean;
}

interface UserDetailsDialogProps {
  user: UserProfile | null;
  companies: Company[];
  modules: SystemModule[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({ 
  user, 
  companies, 
  modules,
  open, 
  onOpenChange, 
  onUserUpdated 
}) => {
  const { user: currentUser, isSystemAdmin, startImpersonation, isImpersonating } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [userCompanies, setUserCompanies] = useState<CompanyUser[]>([]);
  const [userModules, setUserModules] = useState<UserModuleAccess[]>([]);
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [moduleRoles, setModuleRoles] = useState<Record<string, UserRole[]>>({});
  const [startupHubOptions, setStartupHubOptions] = useState<{ startup: boolean; mentor: boolean }>({ startup: false, mentor: false });
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (user && open) {
      setEditedUser({ ...user });
      loadUserData();
    }
  }, [user, open]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user companies
      const { data: companyData, error: companyError } = await supabase
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

      if (companyError) throw companyError;

      const companyUsers = companyData?.map(relation => ({
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

      // Load user module access
      const { data: moduleData, error: moduleError } = await supabase
        .from('user_modules')
        .select('*')
        .eq('user_id', user.user_id);

      if (moduleError) throw moduleError;

      setUserModules(moduleData || []);

      // Set module access state
      const currentAccess: Record<string, boolean> = {};
      modules.forEach(module => {
        const hasAccess = (moduleData || []).some(um =>
          um.user_id === user.user_id &&
          um.module_id === module.id &&
          um.active
        );
        currentAccess[module.id] = hasAccess;
      });
      setModuleAccess(currentAccess);

      // Load module roles
      await loadUserModuleRoles(user.user_id);

      // Load startup hub options
      const startupModule = modules.find(m => m.slug === 'startup-hub');
      if (startupModule && currentAccess[startupModule.id]) {
        await loadStartupHubOptions(user.user_id);
      } else {
        resetStartupHubOptions();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do usuário',
        variant: 'destructive'
      });
    }
  };

  const loadUserModuleRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_module_roles', { _user_id: userId });
      if (error) throw error;
      const rolesMap: Record<string, UserRole[]> = {};
      (data || []).forEach((row: any) => {
        rolesMap[row.module_id] = (row.roles || []) as UserRole[];
      });
      setModuleRoles(rolesMap);
    } catch (e) {
      console.error('Erro ao carregar perfis por módulo:', e);
      setModuleRoles({});
    }
  };

  const resetStartupHubOptions = () => {
    setStartupHubOptions({ startup: false, mentor: false });
  };

  const loadStartupHubOptions = async (userId: string) => {
    try {
      const startupModule = modules.find(m => m.slug === 'startup-hub');
      if (!startupModule) {
        resetStartupHubOptions();
        return;
      }
      const { data, error } = await supabase
        .from('startup_hub_profiles')
        .select('type, status')
        .eq('user_id', userId)
        .eq('status', 'active');
      if (error) throw error;
      const types = (data || []).map((row: any) => row.type as 'startup' | 'mentor');
      setStartupHubOptions({
        startup: types.includes('startup'),
        mentor: types.includes('mentor'),
      });
    } catch (e) {
      console.error('Erro ao carregar perfis Startup HUB:', e);
      resetStartupHubOptions();
    }
  };

  const saveAllChanges = async () => {
    if (!editedUser || !currentUser) return;

    setIsLoading(true);
    try {
      // Save personal data (without role)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editedUser.first_name,
          last_name: editedUser.last_name,
          email: editedUser.email,
          department: editedUser.department,
          position: editedUser.position,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', editedUser.user_id);

      if (profileError) throw profileError;

      // Update role (only through module role management)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: editedUser.user_id,
          role: editedUser.role,
          updated_at: new Date().toISOString()
        });

      if (roleError) {
        console.error('Aviso: Erro ao atualizar role:', roleError);
      }

      // Save module access and roles
      for (const [moduleId, hasAccess] of Object.entries(moduleAccess)) {
        if (hasAccess) {
          const { error } = await supabase.rpc('grant_module_access', {
            _admin_id: currentUser.id,
            _user_id: editedUser.user_id,
            _module_id: moduleId,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.rpc('revoke_module_access', {
            _admin_id: currentUser.id,
            _user_id: editedUser.user_id,
            _module_id: moduleId,
          });
          if (error) throw error;
        }
      }

      // Set module roles (skip Startup HUB)
      for (const mod of modules) {
        if (mod.slug === 'startup-hub') continue;

        const roles = moduleRoles[mod.id] || [];
        const { error: rolesErr } = await supabase.rpc('set_user_module_roles', {
          _admin_id: currentUser.id,
          _user_id: editedUser.user_id,
          _module_id: mod.id,
          _roles: roles,
        });
        if (rolesErr) throw rolesErr;
      }

      // Handle Startup HUB profiles
      const startupModule = modules.find((m) => m.slug === 'startup-hub');
      if (startupModule) {
        const hasStartupAccess = moduleAccess[startupModule.id];

        if (hasStartupAccess) {
          const isStartup = startupHubOptions.startup;
          const isMentor = startupHubOptions.mentor;
          
          if (isStartup || isMentor) {
            const selectedType = isStartup ? 'startup' : 'mentor';
            
            const { data: existing, error: existingErr } = await supabase
              .from('startup_hub_profiles')
              .select('id, type, status')
              .eq('user_id', editedUser.user_id)
              .maybeSingle();
            if (existingErr) throw existingErr;

            if (existing) {
              const { error: updErr } = await supabase
                .from('startup_hub_profiles')
                .update({ 
                  type: selectedType,
                  status: 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existing.id as string);
              if (updErr) throw updErr;
            } else {
              const { error: insErr } = await supabase
                .from('startup_hub_profiles')
                .insert({
                  user_id: editedUser.user_id,
                  type: selectedType,
                  status: 'active',
                });
              if (insErr) throw insErr;
            }
          } else {
            const { error: deactErr } = await supabase
              .from('startup_hub_profiles')
              .update({ status: 'inactive' })
              .eq('user_id', editedUser.user_id);
            if (deactErr && deactErr.code !== 'PGRST116') throw deactErr;
          }
        } else {
          const { error: deactErr } = await supabase
            .from('startup_hub_profiles')
            .update({ status: 'inactive' })
            .eq('user_id', editedUser.user_id);
          if (deactErr && deactErr.code !== 'PGRST116') throw deactErr;
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Todas as alterações foram salvas com sucesso'
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar alterações',
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

      loadUserData();
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

      loadUserData();
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
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário',
        variant: 'destructive'
      });
    }
  };

  const handleStartImpersonation = async () => {
    if (!user || !startImpersonation) return;

    try {
      const { error } = await startImpersonation(user.user_id);
      if (error) {
        toast({
          title: 'Erro',
          description: `Erro ao iniciar impersonation: ${error.message}`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Impersonation iniciada',
          description: `Agora você está visualizando como ${user.first_name} ${user.last_name}`
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao iniciar impersonation',
        variant: 'destructive'
      });
    }
  };

  const canStartImpersonation = isSystemAdmin && !isImpersonating && user?.user_id !== currentUser?.id && user?.status === 'active';
  const availableCompanies = companies.filter(company => 
    !userCompanies.some(uc => uc.company_id === company.id)
  );

  const sidebarItems = [
    { id: 'personal', label: 'Dados Pessoais', icon: UserCog },
    { id: 'companies', label: 'Empresas', icon: Building },
    { id: 'modules', label: 'Módulos e Permissões', icon: Lock },
    { id: 'actions', label: 'Ações', icon: Activity },
  ];

  if (!editedUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Usuário: {editedUser.first_name} {editedUser.last_name}
          </DialogTitle>
          <DialogDescription>
            Gerencie dados pessoais, empresas associadas e permissões de módulos
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-sidebar border-r flex flex-col">
            <div className="p-4">
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'personal' && (
                <div className="space-y-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </div>
              )}

              {activeTab === 'companies' && (
                <div className="space-y-4">
                  {userCompanies.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Empresas Associadas</Label>
                      {userCompanies.map((companyUser) => (
                        <div key={companyUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{companyUser.company_name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {companyUser.role === 'admin' ? 'Administrador' : 
                                 companyUser.role === 'manager' ? 'Gerente' : 'Membro'}
                              </Badge>
                            </div>
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
                    <p className="text-muted-foreground text-center py-4">
                      Usuário não está associado a nenhuma empresa
                    </p>
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
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4" />
                                  {company.name}
                                  <Badge variant="outline" className="text-xs ml-2">
                                    {company.company_type === 'startup' ? 'Startup' : 'Empresa'}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'modules' && (
                <div className="space-y-3">
                  {modules.map((module) => {
                    const isStartupHub = module.slug === 'startup-hub';
                    const checked = moduleAccess[module.id] || false;
                    return (
                      <ModuleAccessRow
                        key={module.id}
                        module={module}
                        checked={checked}
                        roles={moduleRoles[module.id] || []}
                        onAccessChange={(v) => {
                          setModuleAccess((prev) => ({ ...prev, [module.id]: !!v }));
                          if (isStartupHub) {
                            if (!!v && user) {
                              loadStartupHubOptions(user.user_id);
                            } else {
                              resetStartupHubOptions();
                            }
                          }
                        }}
                        onRoleToggle={(role) => {
                          setModuleRoles((prev) => {
                            const current = prev[module.id] || [];
                            const has = current.includes(role);
                            const next = has ? current.filter((r) => r !== role) : [...current, role];
                            return { ...prev, [module.id]: next };
                          });
                        }}
                        {...(isStartupHub
                          ? {
                              startupOptions: startupHubOptions,
                              onStartupOptionToggle: (opt: 'startup' | 'mentor') =>
                                setStartupHubOptions((prev) => ({ ...prev, [opt]: !prev[opt] })),
                            }
                          : {})}
                      />
                    );
                  })}
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status do Usuário</CardTitle>
                      <CardDescription>
                        Ativar ou desativar o usuário no sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant={user?.status === 'active' ? 'destructive' : 'default'}>
                            {user?.status === 'active' ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Desativar Usuário
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Ativar Usuário
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {user?.status === 'active' ? 'Desativar' : 'Ativar'} Usuário
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja {user?.status === 'active' ? 'desativar' : 'ativar'} este usuário?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={toggleUserStatus}>
                              {user?.status === 'active' ? 'Desativar' : 'Ativar'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>

                  {canStartImpersonation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Impersonation</CardTitle>
                        <CardDescription>
                          Fazer login como este usuário para testar permissões
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="secondary">
                              <Eye className="h-4 w-4 mr-2" />
                              Logar como usuário
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Impersonation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja fazer login como {user?.first_name} {user?.last_name}?
                                <br /><br />
                                Você poderá voltar ao seu usuário admin a qualquer momento.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleStartImpersonation}>
                                Confirmar Impersonation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* Footer com botão de salvar */}
            <div className="border-t p-4 bg-background">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveAllChanges} disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar e Fechar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const UserManagementPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userModules, setUserModules] = useState<UserModuleAccess[]>([]);
  const [confirmingEmail, setConfirmingEmail] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    console.log('👥 Carregando dados de usuários...');
    
    try {
      // Carregar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (usersError) {
        console.error('❌ Erro ao carregar usuários:', usersError);
        throw usersError;
      }

      console.log(`✅ ${usersData?.length || 0} usuários carregados`);

      // Transformar usuários para ExtendedUser (sem dados de confirmação por enquanto)
      const usersWithEmailData = (usersData || []).map(user => ({
        ...user,
        email_confirmed_at: null, // Por enquanto sem dados de confirmação
        status: user.status as 'active' | 'inactive' | 'pending'
      })) as ExtendedUser[];

      // Carregar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (companiesError) {
        console.error('❌ Erro ao carregar empresas:', companiesError);
        throw companiesError;
      }

      console.log(`✅ ${companiesData?.length || 0} empresas carregadas`);

      // Carregar módulos
      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('*')
        .eq('active', true)
        .order('name');

      if (modulesError) {
        console.error('❌ Erro ao carregar módulos:', modulesError);
        throw modulesError;
      }

      console.log(`✅ ${modulesData?.length || 0} módulos carregados`);

      // Carregar acesso dos usuários aos módulos
      const { data: userModulesData, error: userModulesError } = await supabase
        .from('user_modules')
        .select('*');

      if (userModulesError) {
        console.error('❌ Erro ao carregar acessos de módulos:', userModulesError);
        throw userModulesError;
      }

      console.log(`✅ ${userModulesData?.length || 0} acessos de módulos carregados`);

      const companiesTyped = (companiesData || []).map(company => ({
        ...company,
        status: company.status as 'active' | 'inactive'
      })) as Company[];

      setUsers(usersWithEmailData);
      setCompanies(companiesTyped);
      setModules(modulesData || []);
      setUserModules(userModulesData || []);
      
      console.log('✅ Todos os dados carregados com sucesso');
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      console.log('🏁 Carregamento de dados de usuários finalizado');
    }
  };

  const getUserModuleCount = (userId: string) => {
    return userModules.filter(um => um.user_id === userId && um.active).length;
  };

  const confirmUserEmail = async (userId: string) => {
    if (!user) return;

    setConfirmingEmail(userId);
    try {
      const { error } = await supabase.rpc('confirm_user_email', {
        _user_id: userId,
        _admin_id: user.id
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'E-mail confirmado com sucesso. O usuário agora pode fazer login.'
      });

      loadData(); // Recarregar dados para atualizar o status
    } catch (error) {
      console.error('Erro ao confirmar e-mail:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao confirmar e-mail do usuário',
        variant: 'destructive'
      });
    } finally {
      setConfirmingEmail(null);
    }
  };

  const getUserCompanyCount = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('user_company_relations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count || 0;
    } catch (error) {
      return 0;
    }
  };

  const filteredUsers = users.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Acesso Negado</h2>
              <p className="text-sm text-muted-foreground">
                Você precisa ser administrador para acessar esta página.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, suas empresas associadas e permissões de módulos de forma unificada
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Usuários do Sistema</span>
          </CardTitle>
          <CardDescription>
            Clique em um usuário para gerenciar todos os seus dados e permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar usuários por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p>{user.first_name} {user.last_name}</p>
                          {user.department && (
                            <p className="text-xs text-muted-foreground">{user.department}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Administrador' : 
                         user.role === 'manager' ? 'Gerente' : 'Membro'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {user.status === 'active' ? 'Ativo' : 
                         user.status === 'pending' ? 'Pendente' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Aguardando confirmação
                        </span>
                        {user.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={confirmingEmail === user.user_id}
                            onClick={() => confirmUserEmail(user.user_id)}
                          >
                            {confirmingEmail === user.user_id ? 'Confirmando...' : 'Confirmar E-mail'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getUserModuleCount(user.user_id)} de {modules.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserDetailsDialog
        user={selectedUser}
        companies={companies}
        modules={modules}
        open={!!selectedUser}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedUser(null);
        }}
        onUserUpdated={loadData}
      />
    </div>
  );
};
