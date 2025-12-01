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
  Mail,
  Key,
  MoreHorizontal,
  ChevronDown
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UserProfile, Company, CompanyUser } from '@/types/admin';
import { Checkbox } from '@/components/ui/checkbox';
import ModuleAccessRow from './user-modules/ModuleAccessRow';
import type { UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { UserDeletionModal } from './users/UserDeletionModal';

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface ExtendedUser extends UserProfile {
  email_confirmed_at?: string | null;
  must_change_password?: boolean;
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
  userToDelete: UserProfile | null;
  setUserToDelete: (user: UserProfile | null) => void;
  isDeletionModalOpen: boolean;
  setIsDeletionModalOpen: (open: boolean) => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({ 
  user, 
  companies, 
  modules,
  open, 
  onOpenChange, 
  onUserUpdated,
  userToDelete,
  setUserToDelete,
  isDeletionModalOpen,
  setIsDeletionModalOpen
}) => {
  const { user: currentUser, isSystemAdmin, startImpersonation, isImpersonating } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [userCompanies, setUserCompanies] = useState<CompanyUser[]>([]);
  const [userModules, setUserModules] = useState<UserModuleAccess[]>([]);
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [moduleRoles, setModuleRoles] = useState<Record<string, UserRole | null>>({});
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
      const rolesMap: Record<string, UserRole | null> = {};
      (data || []).forEach((row: any) => {
        // Pegar apenas a primeira role (ou null se não houver)
        const roles = (row.roles || []) as UserRole[];
        rolesMap[row.module_id] = roles.length > 0 ? roles[0] : null;
      });
      
      // Buscar perfil do Startup HUB separadamente
      const startupModule = modules.find(m => m.slug === 'startup-hub');
      if (startupModule) {
        const { data: shProfile } = await supabase
          .from('startup_hub_profiles')
          .select('type')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        
        if (shProfile?.type) {
          rolesMap[startupModule.id] = shProfile.type as UserRole;
        }
      }
      
      setModuleRoles(rolesMap);
    } catch (e) {
      console.error('Erro ao carregar perfis por módulo:', e);
      setModuleRoles({});
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
        }, {
          onConflict: 'user_id,role'
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

        const role = moduleRoles[mod.id];
        const roles = role ? [role] : [];
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
        const startupRole = moduleRoles[startupModule.id];

        if (hasStartupAccess && startupRole) {
          const selectedType: 'startup' | 'mentor' = (startupRole as string) === 'startup' ? 'startup' : 'mentor';
          
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
          // Deactivate profile if access removed or no role selected
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

  const handleAddCompany = async (companyId: string) => {
    if (!user || !currentUser) return;

    try {
      const { error } = await supabase.rpc('assign_user_to_company_v2', {
        _user_id: user.user_id,
        _company_id: companyId,
        _admin_id: currentUser.id
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
    { id: 'actions', label: 'Ações e Segurança', icon: Activity },
  ];

  if (!editedUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Usuário: {editedUser.first_name} {editedUser.last_name}
          </DialogTitle>
          <DialogDescription>
            Gerencie dados pessoais, empresas associadas e permissões de módulos
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar */}
          <div className="w-64 bg-sidebar border-r flex flex-col shrink-0">
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
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-6">
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

                  {/* Senha Temporária - mostrar apenas se o usuário ainda não alterou a senha */}
                  {editedUser.must_change_password && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                          <Key className="h-4 w-4" />
                          Senha Temporária
                        </CardTitle>
                        <CardDescription className="text-yellow-600 dark:text-yellow-400">
                          Este usuário ainda não alterou sua senha inicial
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-background/50 border rounded-md">
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                              ⚠️ Aguardando primeira alteração da senha
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase.rpc('confirm_user_email', {
                                    _user_id: editedUser.user_id,
                                    _admin_id: currentUser?.id
                                  });
                                  if (error) throw error;
                                  toast({
                                    title: 'Sucesso',
                                    description: 'E-mail do usuário confirmado'
                                  });
                                  onUserUpdated();
                                } catch (error) {
                                  console.error('Erro ao confirmar e-mail:', error);
                                  toast({
                                    title: 'Erro',
                                    description: 'Erro ao confirmar e-mail do usuário',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Confirmar E-mail
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  // Gerar nova senha temporária
                                  const { data: newPassword, error } = await supabase.rpc('generate_temporary_password');
                                  if (error) throw error;
                                  
                                  // Aqui seria ideal ter uma função para resetar a senha
                                  // Por enquanto, apenas mostramos um toast informativo
                                  toast({
                                    title: 'Nova senha gerada',
                                    description: `Nova senha temporária: ${newPassword}. Compartilhe manualmente com o usuário.`
                                  });
                                } catch (error) {
                                  console.error('Erro ao gerar nova senha:', error);
                                  toast({
                                    title: 'Erro',
                                    description: 'Erro ao gerar nova senha temporária',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              <Key className="h-4 w-4 mr-1" />
                              Gerar Nova Senha
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'companies' && (
                <div className="space-y-4">
                  {userCompanies.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Empresas Associadas</Label>
                      <ScrollArea className="h-[400px] pr-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          {userCompanies.map((companyUser) => (
                            <div key={companyUser.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30 group hover:bg-muted/50 transition-colors">
                              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{companyUser.company_name}</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveCompany(companyUser.company_id!)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
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
                            handleAddCompany(companyId);
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
                  {modules
                    .filter((m) => m.slug !== 'ai' && m.slug !== 'okr-execution' && m.slug !== 'okr-planning')
                    .map((module) => {
                      const isStartupHub = module.slug === 'startup-hub';
                      const checked = moduleAccess[module.id] || false;
                      return (
                        <ModuleAccessRow
                        key={module.id}
                        module={module}
                        checked={checked}
                        role={moduleRoles[module.id] || null}
                        onAccessChange={(v) => {
                          setModuleAccess((prev) => ({ ...prev, [module.id]: !!v }));
                          // Reset role when access is removed
                          if (!v) {
                            setModuleRoles((prev) => ({ ...prev, [module.id]: null }));
                          }
                        }}
                        onRoleChange={(role) => {
                          setModuleRoles((prev) => ({ ...prev, [module.id]: role }));
                        }}
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

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Confirmação de E-mail</CardTitle>
                      <CardDescription>
                        Confirmar o e-mail do usuário manualmente
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <Badge variant="secondary">
                              Aguardando Confirmação
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={async () => {
                              if (!user || !currentUser) return;
                              setIsLoading(true);
                              try {
                                const { error } = await supabase.rpc('confirm_user_email', {
                                  _user_id: user.user_id,
                                  _admin_id: currentUser.id
                                });
                                if (error) throw error;
                                toast({
                                  title: 'Sucesso',
                                  description: 'E-mail confirmado com sucesso'
                                });
                                onUserUpdated();
                              } catch (error) {
                                console.error('Erro ao confirmar e-mail:', error);
                                toast({
                                  title: 'Erro',
                                  description: 'Erro ao confirmar e-mail do usuário',
                                  variant: 'destructive'
                                });
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {isLoading ? 'Confirmando...' : 'Confirmar E-mail'}
                          </Button>
                        </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-destructive">Zona de Perigo</CardTitle>
                      <CardDescription>
                        Ações permanentes que não podem ser desfeitas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          onOpenChange(false);
                          // Pequeno delay para fechar o modal atual antes de abrir o modal de exclusão
                          setTimeout(() => {
                            if (user) {
                              setUserToDelete(user);
                              setIsDeletionModalOpen(true);
                            }
                          }, 100);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Usuário
                      </Button>
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
          </ScrollArea>

          {/* Footer com botão de salvar */}
          <div className="border-t p-4 bg-background shrink-0">
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

        {/* User Deletion Modal */}
        <UserDeletionModal
          user={userToDelete}
          open={isDeletionModalOpen}
          onClose={() => {
            setUserToDelete(null);
            setIsDeletionModalOpen(false);
          }}
          onDeleted={() => {
            onUserUpdated();
            setUserToDelete(null);
            setIsDeletionModalOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userModules, setUserModules] = useState<UserModuleAccess[]>([]);
  const [userModuleRoles, setUserModuleRoles] = useState<Record<string, Record<string, string | null>>>({});
  const [confirmingEmail, setConfirmingEmail] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);

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

      // Carregar roles de todos os usuários
      const rolesMap: Record<string, Record<string, string | null>> = {};
      
      // Buscar roles de user_module_roles
      const { data: allUserModuleRoles, error: rolesError } = await supabase
        .from('user_module_roles')
        .select(`
          user_id,
          module_id,
          role,
          system_modules!inner(id, slug)
        `)
        .eq('active', true);

      if (!rolesError && allUserModuleRoles) {
        allUserModuleRoles.forEach((userRole: any) => {
          if (!rolesMap[userRole.user_id]) {
            rolesMap[userRole.user_id] = {};
          }
          rolesMap[userRole.user_id][userRole.module_id] = userRole.role;
        });
      }

      // Buscar perfis do Startup HUB separadamente
      const startupModule = modulesData?.find(m => m.slug === 'startup-hub');
      if (startupModule) {
        const { data: startupProfiles } = await supabase
          .from('startup_hub_profiles')
          .select('user_id, type')
          .eq('status', 'active');
        
        if (startupProfiles) {
          startupProfiles.forEach((profile: any) => {
            if (!rolesMap[profile.user_id]) {
              rolesMap[profile.user_id] = {};
            }
            rolesMap[profile.user_id][startupModule.id] = profile.type;
          });
        }
      }

      console.log(`✅ Roles carregadas para ${Object.keys(rolesMap).length} usuários`);

      const companiesTyped = (companiesData || []).map(company => ({
        ...company,
        status: company.status as 'active' | 'inactive'
      })) as Company[];

      setUsers(usersWithEmailData);
      setCompanies(companiesTyped);
      setModules(modulesData || []);
      setUserModules(userModulesData || []);
      setUserModuleRoles(rolesMap);
      
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

  const getRoleLabel = (role: string, moduleSlug: string): string => {
    if (moduleSlug === 'startup-hub') {
      return role === 'startup' ? 'Startup' : role === 'mentor' ? 'Mentor' : role;
    }
    switch (role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Gestor';
      case 'member': return 'Membro';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string, moduleSlug: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (moduleSlug === 'startup-hub') {
      return role === 'startup' ? 'destructive' : 'default'; // Startup: vermelho, Mentor: verde (default será customizado)
    }
    // Gestor: amarelo (outline será customizado), Membro: azul (secondary será customizado)
    return role === 'manager' ? 'outline' : 'secondary';
  };

  const getRoleBadgeClasses = (role: string, moduleSlug: string): string => {
    if (moduleSlug === 'startup-hub') {
      if (role === 'startup') return 'bg-red-500 hover:bg-red-600 text-white border-transparent';
      if (role === 'mentor') return 'bg-green-500 hover:bg-green-600 text-white border-transparent';
    }
    if (role === 'manager') return 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent';
    if (role === 'member') return 'bg-blue-500 hover:bg-blue-600 text-white border-transparent';
    return '';
  };

  const getUserRoleForModule = (userId: string, moduleId: string): string | null => {
    return userModuleRoles[userId]?.[moduleId] || null;
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

  const handleOpenDeletionModal = (userToDelete: UserProfile) => {
    setUserToDelete(userToDelete);
    setIsDeletionModalOpen(true);
  };

  const handleCloseDeletionModal = () => {
    setUserToDelete(null);
    setIsDeletionModalOpen(false);
  };

  const handleUserDeleted = () => {
    loadData();
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, suas empresas associadas e permissões de módulos de forma unificada
          </p>
        </div>
        <Button onClick={() => navigate('/app/admin/users/create')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Novo Usuário
        </Button>
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

            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    {modules.map((module) => (
                      <TableHead key={module.id} className="hidden md:table-cell text-center">
                        {module.name.replace(' HUB', '')}
                      </TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{user.first_name} {user.last_name}</p>
                            {user.department && (
                              <p className="text-xs text-muted-foreground truncate">{user.department}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="truncate">{user.email}</p>
                      </TableCell>
                      {modules.map((module) => {
                        const role = getUserRoleForModule(user.user_id, module.id);
                        return (
                          <TableCell key={module.id} className="hidden md:table-cell text-center">
                            {role ? (
                              <Badge 
                                variant={getRoleBadgeVariant(role, module.slug)}
                                className={`text-xs ${getRoleBadgeClasses(role, module.slug)}`}
                              >
                                {getRoleLabel(role, module.slug)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Badge 
                          variant={
                            user.status === 'active' ? 'default' :
                            user.status === 'pending' ? 'secondary' : 
                            'destructive'
                          }
                          className="text-xs"
                        >
                          {user.status === 'active' ? 'Ativo' : 
                           user.status === 'pending' ? 'Pendente' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Gerenciar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleOpenDeletionModal(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
        userToDelete={userToDelete}
        setUserToDelete={setUserToDelete}
        isDeletionModalOpen={isDeletionModalOpen}
        setIsDeletionModalOpen={setIsDeletionModalOpen}
      />

      {/* User Deletion Modal */}
      <UserDeletionModal
        user={userToDelete}
        open={isDeletionModalOpen}
        onClose={handleCloseDeletionModal}
        onDeleted={handleUserDeleted}
      />
    </div>
  );
};
