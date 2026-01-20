import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserWithDetails } from "@/hooks/admin/useUsersStats";
import { User, Building2, Calendar, Shield, Clock, Pencil, Key, Mail, UserCog, Ban, UserX, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { EditUserModal } from "./EditUserModal";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { ResendCredentialsModal } from "./ResendCredentialsModal";
import { AdminPrivilegeModal } from "./AdminPrivilegeModal";
import { UserStatusModal } from "./UserStatusModal";
import { UserDeletionModal } from "@/components/admin/users/UserDeletionModal";

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
  onSuccess: () => void;
}

type SubModalType = 'edit' | 'password' | 'credentials' | 'admin' | 'status' | 'delete' | null;

interface TempPasswordInfo {
  token: string | null;
  expiresAt: string | null;
  isValid: boolean;
}

interface ModulePermission {
  module_name: string;
  module_slug: string;
  role: string;
}

export function UserDetailsModal({ open, onOpenChange, user, onSuccess }: UserDetailsModalProps) {
  const [subModal, setSubModal] = useState<SubModalType>(null);
  const [tempPassword, setTempPassword] = useState<TempPasswordInfo>({ token: null, expiresAt: null, isValid: false });

  // Fetch temp password info
  useEffect(() => {
    if (open && user) {
      checkTempPassword();
    }
  }, [open, user]);

  const checkTempPassword = async () => {
    if (!user) return;
    
    // Query using type assertion since these columns may not be in generated types yet
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.user_id)
      .single();
    
    const profileData = data as any;
    if (profileData?.temp_reset_token && profileData?.temp_reset_token_expires_at) {
      const isValid = new Date(profileData.temp_reset_token_expires_at) > new Date();
      setTempPassword({
        token: profileData.temp_reset_token,
        expiresAt: profileData.temp_reset_token_expires_at,
        isValid
      });
    } else {
      setTempPassword({ token: null, expiresAt: null, isValid: false });
    }
  };

  // Fetch user module permissions
  const { data: modulePermissions } = useQuery({
    queryKey: ['user-module-permissions', user?.user_id],
    queryFn: async (): Promise<ModulePermission[]> => {
      if (!user) return [];
      
      // Cast to any to avoid deep type instantiation error
      const { data: roles } = await (supabase as any)
        .from('user_module_roles')
        .select('role, module_id')
        .eq('user_id', user.user_id)
        .eq('is_active', true);
      
      if (!roles || roles.length === 0) return [];
      
      // Fetch module names separately
      const moduleIds = roles.map((r: any) => r.module_id);
      
      const { data: modules } = await (supabase as any)
        .from('system_modules')
        .select('id, name, slug');
      
      const filteredModules = (modules || []).filter((m: any) => moduleIds.includes(m.id));
      const moduleMap = new Map<string, {id: string, name: string, slug: string}>(
        filteredModules.map((m: any) => [m.id, m])
      );
      
      return roles.map((r: any) => ({
        module_name: moduleMap.get(r.module_id)?.name || 'Módulo',
        module_slug: moduleMap.get(r.module_id)?.slug || '',
        role: r.role
      }));
    },
    enabled: open && !!user
  });

  if (!user) return null;

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm");
  };

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gestor',
      member: 'Membro'
    };
    return labels[role] || role;
  };

  const handleSubModalSuccess = () => {
    setSubModal(null);
    checkTempPassword();
    onSuccess();
  };

  return (
    <>
      <Dialog open={open && !subModal} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Usuário
            </DialogTitle>
          </DialogHeader>

          {/* Header with Avatar */}
          <div className="flex items-center gap-4 pb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                {user.is_system_admin && (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
            </TabsList>

            {/* Tab: Informações */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Empresa
                  </p>
                  <p className="font-medium">{user.company_name || 'Sem empresa'}</p>
                  {user.company_ids.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      + {user.company_ids.length - 1} outra(s)
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Criado em
                  </p>
                  <p className="font-medium">{formatDateShort(user.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Primeiro login
                  </p>
                  <p className="font-medium">{formatDate(user.first_login_at)}</p>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => setSubModal('edit')} className="w-full">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Segurança */}
            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Senha Temporária</h4>
                  {tempPassword.isValid && tempPassword.token ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-background rounded text-sm font-mono">
                          {tempPassword.token}
                        </code>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(tempPassword.token!)}
                        >
                          Copiar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expira em: {formatDate(tempPassword.expiresAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma senha temporária ativa
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Troca de senha obrigatória</p>
                  <p className="font-medium">{user.must_change_password ? 'Sim' : 'Não'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button variant="outline" onClick={() => setSubModal('password')}>
                  <Key className="h-4 w-4 mr-2" />
                  Gerar Nova Senha
                </Button>
                <Button variant="outline" onClick={() => setSubModal('credentials')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Reenviar Credenciais
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Permissões */}
            <TabsContent value="permissions" className="space-y-4 mt-4">
              <div className="space-y-2">
                {modulePermissions && modulePermissions.length > 0 ? (
                  modulePermissions.map((perm, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{perm.module_name}</span>
                      <Badge variant="secondary">{getRoleLabel(perm.role)}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum módulo atribuído
                  </p>
                )}
              </div>

              <div className="pt-4">
                <Button variant="outline" onClick={() => setSubModal('edit')} className="w-full">
                  <UserCog className="h-4 w-4 mr-2" />
                  Editar Permissões
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Ações */}
            <TabsContent value="actions" className="space-y-3 mt-4">
              {/* Admin Privilege */}
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSubModal('admin')}>
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    {user.is_system_admin ? 'Remover Privilégios de Admin' : 'Promover a Administrador'}
                  </CardTitle>
                  <CardDescription>
                    {user.is_system_admin 
                      ? 'Remove acesso ao painel de administração'
                      : 'Concede acesso total ao painel de administração'
                    }
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Status Toggle */}
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSubModal('status')}>
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    {user.status === 'active' ? (
                      <>
                        <Ban className="h-4 w-4 text-orange-500" />
                        Desativar Usuário
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Reativar Usuário
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {user.status === 'active'
                      ? 'Remove acesso ao sistema temporariamente'
                      : 'Restaura acesso ao sistema'
                    }
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Delete User */}
              <Card className="cursor-pointer hover:bg-destructive/10 transition-colors border-destructive/50" onClick={() => setSubModal('delete')}>
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <UserX className="h-4 w-4" />
                    Excluir Permanentemente
                  </CardTitle>
                  <CardDescription>
                    Remove o usuário e todos os seus dados do sistema
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Sub Modals */}
      {subModal === 'edit' && (
        <EditUserModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          user={user}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {subModal === 'password' && (
        <ResetPasswordModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          user={user}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {subModal === 'credentials' && (
        <ResendCredentialsModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          user={user}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {subModal === 'admin' && (
        <AdminPrivilegeModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          user={user}
          action={user.is_system_admin ? 'demote' : 'promote'}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {subModal === 'status' && (
        <UserStatusModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          user={user}
          action={user.status === 'active' ? 'deactivate' : 'reactivate'}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {subModal === 'delete' && (
        <UserDeletionModal
          open={true}
          onClose={() => setSubModal(null)}
          user={{
            id: user.user_id,
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: 'member',
            status: (user.status as 'active' | 'inactive' | 'pending') || 'active',
            created_at: user.created_at,
            updated_at: user.created_at
          }}
          onDeleted={handleSubModalSuccess}
        />
      )}
    </>
  );
}
