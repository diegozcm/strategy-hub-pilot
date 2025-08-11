
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, Eye, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import StartupHubProfileDialog from './startup-hub/StartupHubProfileDialog';

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
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

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

  // Open access modal for user
  const openAccessModal = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    
    // Set current access status for this user
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
    setIsAccessModalOpen(true);
  };

  // Save module access changes
  const saveModuleAccess = async () => {
    if (!selectedUser || !user) return;

    try {
      // Process each module access change
      for (const [moduleId, hasAccess] of Object.entries(moduleAccess)) {
        if (hasAccess) {
          // Grant access
          const { error } = await supabase.rpc('grant_module_access', {
            _admin_id: user.id,
            _user_id: selectedUser.user_id,
            _module_id: moduleId
          });
          if (error) throw error;
        } else {
          // Revoke access
          const { error } = await supabase.rpc('revoke_module_access', {
            _admin_id: user.id,
            _user_id: selectedUser.user_id,
            _module_id: moduleId
          });
          if (error) throw error;
        }
      }

      // Refresh data
      await fetchData();
      setIsAccessModalOpen(false);
      
      toast({
        title: "Acesso atualizado",
        description: `Os acessos de ${selectedUser.first_name} foram atualizados com sucesso.`
      });
    } catch (error: any) {
      console.error('Error updating access:', error);
      toast({
        title: "Erro ao atualizar acesso",
        description: error.message || "Não foi possível atualizar os acessos.",
        variant: "destructive"
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

  if (loading) {
    return <div>Carregando usuários...</div>;
  }

  const startupHubModule = modules.find(m => m.slug === 'startup-hub');
  const startupHubModuleId = startupHubModule?.id;

  const canOpenProfileDialog = !!(startupHubModuleId && moduleAccess[startupHubModuleId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acesso aos Módulos</h1>
          <p className="text-muted-foreground">
            Gerencie o acesso dos usuários aos módulos do sistema
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
                        onClick={() => openAccessModal(user)}
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

      {/* Access Management Modal */}
      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Acesso aos Módulos</DialogTitle>
            <DialogDescription>
              Configure quais módulos {selectedUser?.first_name} pode acessar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center space-x-2">
                <Checkbox
                  id={module.id}
                  checked={moduleAccess[module.id] || false}
                  onCheckedChange={(checked) => 
                    setModuleAccess(prev => ({ ...prev, [module.id]: !!checked }))
                  }
                />
                <div className="flex-1">
                  <label htmlFor={module.id} className="text-sm font-medium cursor-pointer">
                    {module.name}
                  </label>
                  <p className="text-xs text-muted-foreground">{module.slug}</p>
                </div>
              </div>
            ))}

            {startupHubModuleId && selectedUser && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">Perfil do Startup HUB</div>
                    <div className="text-muted-foreground">
                      Defina o perfil de {selectedUser.first_name} como Startup ou Mentor
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsProfileDialogOpen(true)}
                    disabled={!canOpenProfileDialog}
                    title={
                      canOpenProfileDialog
                        ? 'Abrir configuração de perfil'
                        : 'Conceda acesso ao módulo startup-hub para habilitar'
                    }
                  >
                    Configurar Perfil
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveModuleAccess}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Startup HUB Profile Dialog */}
      {selectedUser && (
        <StartupHubProfileDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
          user={selectedUser}
          onSaved={fetchData}
        />
      )}
    </div>
  );
};
