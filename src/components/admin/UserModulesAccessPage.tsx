import React, { useState, useEffect } from 'react';
import { Search, Shield, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ModuleAccessRow from './user-modules/ModuleAccessRow';
import type { UserRole } from '@/types/auth';

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: string;
  status: string;
  current_module_id?: string;
}

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface UserModuleAccess {
  user_id: string;
  module_id: string;
  active: boolean;
}

export const UserModulesAccessPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [userModules, setUserModules] = useState<UserModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [moduleRoles, setModuleRoles] = useState<Record<string, UserRole[]>>({});
  const [startupHubOptions, setStartupHubOptions] = useState<{ startup: boolean; mentor: boolean }>({ startup: false, mentor: false });

  // Fetch data
  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (usersError) throw usersError;

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('*')
        .eq('active', true)
        .order('name');

      if (modulesError) throw modulesError;

      // Fetch user module access
      const { data: userModulesData, error: userModulesError } = await supabase
        .from('user_modules')
        .select('*');

      if (userModulesError) throw userModulesError;

      setUsers(usersData || []);
      setModules(modulesData || []);
      setUserModules(userModulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Startup HUB options helpers
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

  // Novo: carregar roles por módulo do usuário selecionado
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
      // Mantém vazio em caso de falha
      setModuleRoles({});
    }
  };

  const handleSelectUser = (userProfile: any) => {
    setSelectedUser(userProfile);
    const currentAccess: Record<string, boolean> = {};
    modules.forEach(module => {
      const hasAccess = userModules.some(um =>
        um.user_id === userProfile.user_id &&
        um.module_id === module.id &&
        um.active
      );
      currentAccess[module.id] = hasAccess;
    });
    setModuleAccess(currentAccess);

    // Carregar perfis por módulo
    loadUserModuleRoles(userProfile.user_id);

    const sh = modules.find(m => m.slug === 'startup-hub');
    if (sh && currentAccess[sh.id]) {
      loadStartupHubOptions(userProfile.user_id);
    } else {
      resetStartupHubOptions();
    }
  };

  // Salvar alterações
  const saveModuleAccess = async () => {
    if (!selectedUser || !user) return;

    try {
      // Conceder/revogar acesso a cada módulo
      for (const [moduleId, hasAccess] of Object.entries(moduleAccess)) {
        if (hasAccess) {
          const { error } = await supabase.rpc('grant_module_access', {
            _admin_id: user.id,
            _user_id: selectedUser.user_id,
            _module_id: moduleId,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.rpc('revoke_module_access', {
            _admin_id: user.id,
            _user_id: selectedUser.user_id,
            _module_id: moduleId,
          });
          if (error) throw error;
        }
      }

      // Definir perfis por módulo (admin/manager/member)
      for (const mod of modules) {
        const roles = moduleRoles[mod.id] || [];
        const { error: rolesErr } = await supabase.rpc('set_user_module_roles', {
          _admin_id: user.id,
          _user_id: selectedUser.user_id,
          _module_id: mod.id,
          _roles: roles,
        });
        if (rolesErr) throw rolesErr;
      }

      // Startup HUB: gerenciar perfis (startup/mentor) via checkboxes
      const startupModule = modules.find((m) => m.slug === 'startup-hub');
      if (startupModule) {
        const hasStartupAccess = moduleAccess[startupModule.id];

        if (hasStartupAccess) {
          // Ativar/criar perfis marcados
          const types: Array<'startup' | 'mentor'> = ['startup', 'mentor'];
          for (const t of types) {
            const checked = startupHubOptions[t];
            const { data: existing, error: existingErr } = await supabase
              .from('startup_hub_profiles')
              .select('id, status')
              .eq('user_id', selectedUser.user_id)
              .eq('type', t)
              .maybeSingle();
            if (existingErr) throw existingErr;

            if (checked) {
              if (existing) {
                const { error: updErr } = await supabase
                  .from('startup_hub_profiles')
                  .update({ status: 'active' })
                  .eq('id', existing.id as string);
                if (updErr) throw updErr;
              } else {
                const { error: insErr } = await supabase
                  .from('startup_hub_profiles')
                  .insert({
                    user_id: selectedUser.user_id,
                    type: t,
                    status: 'active',
                  });
                if (insErr) throw insErr;
              }
            } else if (existing && existing.status === 'active') {
              const { error: inactErr } = await supabase
                .from('startup_hub_profiles')
                .update({ status: 'inactive' })
                .eq('id', existing.id as string);
              if (inactErr) throw inactErr;
            }
          }
        } else {
          // Sem acesso ao módulo: desativar quaisquer perfis ativos
          const { data: rows, error: listErr } = await supabase
            .from('startup_hub_profiles')
            .select('id, status')
            .eq('user_id', selectedUser.user_id);
          if (listErr) throw listErr;
          for (const row of rows || []) {
            if (row.status === 'active') {
              const { error: inactErr } = await supabase
                .from('startup_hub_profiles')
                .update({ status: 'inactive' })
                .eq('id', row.id as string);
              if (inactErr) throw inactErr;
            }
          }
        }
      }

      // Recarregar dados
      await fetchData();

      toast({
        title: 'Acesso atualizado',
        description: `Os acessos e perfis de ${selectedUser.first_name} foram atualizados com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error updating access:', error);
      toast({
        title: 'Erro ao atualizar acesso',
        description: error.message || 'Não foi possível atualizar os acessos.',
        variant: 'destructive',
      });
    }
  };

  // Get user's module access count
  const getUserModuleCount = (userId: string) => {
    return userModules.filter(um => um.user_id === userId && um.active).length;
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    document.title = 'Gerenciamento de Usuários | Admin';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Gerencie perfis de acesso e módulos dos usuários.');
    }
  }, []);

  if (loading) {
    return <div>Carregando usuários...</div>;
  }

  const startupHubModule = modules.find(m => m.slug === 'startup-hub');
  const startupHubModuleId = startupHubModule?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie perfis de acesso (funções) e módulos dos usuários
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Usuários do Sistema</span>
          </CardTitle>
          <CardDescription>
            Clique em um usuário para gerenciar seus acessos aos módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar usuários..."
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
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
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
                        onClick={() => handleSelectUser(user)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Gerenciar Acesso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Gestão de Acesso */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedUser(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Usuário</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `Defina os perfis de acesso por módulo para ${selectedUser.first_name}`
                : 'Defina os perfis de acesso por módulo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">

            {/* Acessos e Perfis por Módulo */}
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
                        if (!!v && selectedUser) {
                          loadStartupHubOptions(selectedUser.user_id);
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
              <Button onClick={saveModuleAccess}>Salvar Alterações</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
