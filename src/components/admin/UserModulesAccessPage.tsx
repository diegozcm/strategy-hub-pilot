
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, Eye, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
// Removed Dialog imports for inline panel UI
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

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
const [profileType, setProfileType] = useState<'startup' | 'mentor'>('startup');
const [bio, setBio] = useState('');
const [areasText, setAreasText] = useState('');
const [startupName, setStartupName] = useState('');
const [website, setWebsite] = useState('');
const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
const [profileLoading, setProfileLoading] = useState(false);

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

  // Startup HUB profile helpers
  const resetStartupHubProfileState = () => {
    setExistingProfileId(null);
    setProfileType('startup');
    setBio('');
    setAreasText('');
    setStartupName('');
    setWebsite('');
  };

  const loadStartupHubProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      const startupModule = modules.find(m => m.slug === 'startup-hub');
      if (!startupModule) {
        resetStartupHubProfileState();
        return;
      }
      const { data, error } = await supabase
        .from('user_module_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', startupModule.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setExistingProfileId((data as any).id as string);
        const pd = (data as any).profile_data || {};
        setProfileType((pd.type as 'startup' | 'mentor') || 'startup');
        setBio((pd.bio as string) || '');
        setAreasText((((pd.areas_of_expertise as string[]) || []).join(', ')));
        setStartupName((pd.startup_name as string) || '');
        setWebsite((pd.website as string) || '');
      } else {
        resetStartupHubProfileState();
      }
    } catch (e: any) {
      console.error('Erro ao carregar perfil Startup HUB:', e);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o perfil do Startup HUB.',
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle user selection for inline panel
  const handleSelectUser = (userProfile: UserProfile) => {
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

    const sh = modules.find(m => m.slug === 'startup-hub');
    if (sh && currentAccess[sh.id]) {
      loadStartupHubProfile(userProfile.user_id);
    } else {
      resetStartupHubProfileState();
    }
  };

  // Save module access changes
  const saveModuleAccess = async () => {
    if (!selectedUser || !user) return;

    try {
      // Process each module access change
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

      // Handle Startup HUB profile save/inactivation using user_module_profiles
      const startupModule = modules.find((m) => m.slug === 'startup-hub');
      if (startupModule) {
        const hasStartup = moduleAccess[startupModule.id];
        const profilePayload = {
          type: profileType,
          bio: bio || null,
          areas_of_expertise: areasText
            ? areasText.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          startup_name: profileType === 'startup' ? (startupName || null) : null,
          website: website || null,
        };

        // Load existing row for upsert safety
        const { data: existing, error: existingErr } = await supabase
          .from('user_module_profiles')
          .select('id, status')
          .eq('user_id', selectedUser.user_id)
          .eq('module_id', startupModule.id)
          .maybeSingle();
        if (existingErr) throw existingErr;

        if (hasStartup) {
          if (existing) {
            const { error: updErr } = await supabase
              .from('user_module_profiles')
              .update({ profile_data: profilePayload, status: 'active' })
              .eq('id', existing.id as string);
            if (updErr) throw updErr;
          } else {
            const { error: insErr } = await supabase
              .from('user_module_profiles')
              .insert({
                user_id: selectedUser.user_id,
                module_id: startupModule.id,
                profile_data: profilePayload,
                status: 'active',
              });
            if (insErr) throw insErr;
          }
        } else if (existing) {
          const { error: inactErr } = await supabase
            .from('user_module_profiles')
            .update({ status: 'inactive' })
            .eq('id', existing.id as string);
          if (inactErr) {
            console.warn('Falha ao inativar perfil Startup HUB:', inactErr.message);
          }
        }
      }

      // Refresh data
      await fetchData();

      toast({
        title: 'Acesso atualizado',
        description: `Os acessos de ${selectedUser.first_name} foram atualizados com sucesso.`,
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

      {/* Painel de Gestão de Acesso (inline) */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Acesso aos Módulos</CardTitle>
            <CardDescription>
              Configure quais módulos {selectedUser.first_name} pode acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={module.id}
                    checked={moduleAccess[module.id] || false}
                    onCheckedChange={(checked) => {
                      setModuleAccess((prev) => ({ ...prev, [module.id]: !!checked }));
                      if (module.slug === 'startup-hub') {
                        if (!!checked) {
                          if (selectedUser) loadStartupHubProfile(selectedUser.user_id);
                        } else {
                          resetStartupHubProfileState();
                        }
                      }
                    }}
                  />
                  <div className="flex-1">
                    <label htmlFor={module.id} className="text-sm font-medium cursor-pointer">
                      {module.name}
                    </label>
                    <p className="text-xs text-muted-foreground">{module.slug}</p>
                  </div>
                </div>
              ))}

              {startupHubModuleId && (moduleAccess[startupHubModuleId] || false) && (
                <div className="pt-4 border-t space-y-3">
                  <div className="text-sm">
                    <div className="font-medium">Perfil do Startup HUB</div>
                    <div className="text-muted-foreground">
                      Defina o perfil como Startup ou Mentor e preencha os detalhes.
                    </div>
                  </div>
                  {profileLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando perfil...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Tipo de Perfil</Label>
                          <Select value={profileType} onValueChange={(v) => setProfileType(v as 'startup' | 'mentor')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="startup">Startup</SelectItem>
                              <SelectItem value="mentor">Mentor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Website</Label>
                          <Input placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} />
                        </div>
                      </div>

                      {profileType === 'startup' && (
                        <div>
                          <Label>Nome da Startup</Label>
                          <Input placeholder="Ex: Minha Startup Ltda." value={startupName} onChange={(e) => setStartupName(e.target.value)} />
                        </div>
                      )}

                      {profileType === 'mentor' && (
                        <div>
                          <Label>Áreas de Atuação (separe por vírgula)</Label>
                          <Input placeholder="Finanças, Marketing, Vendas" value={areasText} onChange={(e) => setAreasText(e.target.value)} />
                        </div>
                      )}

                      <div>
                        <Label>Bio</Label>
                        <Textarea placeholder="Conte um pouco sobre a startup ou experiência do mentor..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[100px]" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
            <Button onClick={saveModuleAccess}>Salvar Alterações</Button>
          </div>
        </Card>
      )}


    </div>
  );
};
