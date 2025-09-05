import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Phone, Building, Shield, Key, Send, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ModuleAccessRow from './user-modules/ModuleAccessRow';
import type { UserRole } from '@/types/auth';

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export const CreateUserPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [modules, setModules] = useState<SystemModule[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    role: 'member' as 'admin' | 'manager' | 'member'
  });

  // Estados para módulos e permissões
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [moduleRoles, setModuleRoles] = useState<Record<string, UserRole[]>>({});
  const [startupHubOptions, setStartupHubOptions] = useState<{ startup: boolean; mentor: boolean }>({ 
    startup: false, 
    mentor: false 
  });

  // Carregar módulos do sistema
  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('*')
        .eq('active', true)
        .order('name');

      if (modulesError) throw modulesError;
      setModules(modulesData || []);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
    }
  };

  const generatePassword = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_temporary_password');
      if (error) throw error;
      setGeneratedPassword(data);
    } catch (error) {
      console.error('Error generating password:', error);
      // Fallback local generation
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let password = '';
      for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setGeneratedPassword(password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!generatedPassword) {
        await generatePassword();
        return;
      }

      // Create user via database function
      const { data, error } = await supabase.rpc('create_user_by_admin', {
        _admin_id: currentUser?.id,
        _email: formData.email,
        _password: generatedPassword,
        _first_name: formData.firstName,
        _last_name: formData.lastName,
        _phone: formData.phone || null,
        _position: formData.position || null,
        _department: formData.department || null,
        _role: formData.role
      });

      if (error) throw error;

      const result = data[0];
      if (!result.success) {
        throw new Error(result.message);
      }

      const newUserId = result.user_id;

      // Configure module access and permissions
      await configureUserModules(newUserId);

      // Send credentials email
      const emailResponse = await supabase.functions.invoke('send-user-credentials', {
        body: {
          to: formData.email,
          userName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          temporaryPassword: generatedPassword
        }
      });

      if (emailResponse.error) {
        console.warn('Email sending failed:', emailResponse.error);
      }

      setCreatedUser({
        id: newUserId,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: generatedPassword,
        emailSent: !emailResponse.error
      });

      toast.success('Usuário criado com sucesso!');
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const configureUserModules = async (userId: string) => {
    if (!currentUser?.id) return;

    try {
      // Configure module access
      for (const [moduleId, hasAccess] of Object.entries(moduleAccess)) {
        if (hasAccess) {
          const { error } = await supabase.rpc('grant_module_access', {
            _admin_id: currentUser.id,
            _user_id: userId,
            _module_id: moduleId,
          });
          if (error) throw error;
        }
      }

      // Configure module roles (skip Startup HUB)
      for (const module of modules) {
        if (module.slug === 'startup-hub') continue;

        const roles = moduleRoles[module.id] || [];
        if (roles.length > 0) {
          const { error } = await supabase.rpc('set_user_module_roles', {
            _admin_id: currentUser.id,
            _user_id: userId,
            _module_id: module.id,
            _roles: roles,
          });
          if (error) throw error;
        }
      }

      // Handle Startup HUB profile
      const startupModule = modules.find((m) => m.slug === 'startup-hub');
      if (startupModule && moduleAccess[startupModule.id]) {
        const isStartup = startupHubOptions.startup;
        const isMentor = startupHubOptions.mentor;
        
        if (isStartup || isMentor) {
          const selectedType = isStartup ? 'startup' : 'mentor';
          
          const { error } = await supabase
            .from('startup_hub_profiles')
            .insert({
              user_id: userId,
              type: selectedType,
              status: 'active',
            });
          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Erro ao configurar módulos do usuário:', error);
      throw error;
    }
  };

  if (createdUser) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para Usuários
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-600">✅ Usuário Criado com Sucesso!</CardTitle>
            <CardDescription>
              O usuário foi criado e as credenciais foram {createdUser.emailSent ? 'enviadas por e-mail' : 'geradas (falha no envio do e-mail)'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Credenciais do Usuário:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Nome</Label>
                  <p className="font-medium">{createdUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">E-mail</Label>
                  <p className="font-medium">{createdUser.email}</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-background border rounded">
                <Label className="text-sm text-muted-foreground">Senha Temporária</Label>
                <p className="font-mono text-lg font-bold text-primary">{createdUser.password}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O usuário deve alterar esta senha no primeiro acesso
                </p>
              </div>
            </div>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {createdUser.emailSent ? (
                  <>E-mail enviado com sucesso! O usuário receberá as credenciais em sua caixa de entrada.</>
                ) : (
                  <>Falha no envio do e-mail. Compartilhe manualmente as credenciais acima com o usuário.</>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={() => {
                setCreatedUser(null);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  position: '',
                  department: '',
                  role: 'member'
                });
                setGeneratedPassword('');
                setModuleAccess({});
                setModuleRoles({});
                setStartupHubOptions({ startup: false, mentor: false });
              }}>
                Criar Outro Usuário
              </Button>
              <Button variant="outline" onClick={() => navigate('/app/admin/users')}>
                Voltar para Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/admin/users')}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Criar Novo Usuário</h1>
          <p className="text-muted-foreground">
            Crie um novo usuário no sistema com senha temporária
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Digite o nome"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Digite o sobrenome"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@empresa.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Ex: Analista, Gerente"
                />
              </div>
              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Ex: TI, RH, Vendas"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Acesso e Permissões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="role">Nível de Acesso</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Membro</Badge>
                      <span className="text-sm text-muted-foreground">Acesso básico</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Gerente</Badge>
                      <span className="text-sm text-muted-foreground">Pode editar dados</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Admin</Badge>
                      <span className="text-sm text-muted-foreground">Acesso total</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Módulos e Permissões
            </CardTitle>
            <CardDescription>
              Configure quais módulos o usuário terá acesso e suas permissões específicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {modules.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhum módulo ativo encontrado no sistema.
                </AlertDescription>
              </Alert>
            ) : (
              modules.map((module) => {
                const isStartupHub = module.slug === 'startup-hub';
                const checked = moduleAccess[module.id] || false;
                const roles = moduleRoles[module.id] || [];
                
                return (
                  <ModuleAccessRow
                    key={module.id}
                    module={module}
                    checked={checked}
                    roles={roles}
                    onAccessChange={(hasAccess) => {
                      setModuleAccess(prev => ({
                        ...prev,
                        [module.id]: hasAccess
                      }));
                      
                      // Reset roles when access is removed
                      if (!hasAccess) {
                        setModuleRoles(prev => ({
                          ...prev,
                          [module.id]: []
                        }));
                        
                        // Reset startup hub options if it's the startup hub module
                        if (isStartupHub) {
                          setStartupHubOptions({ startup: false, mentor: false });
                        }
                      }
                    }}
                    onRoleToggle={(role) => {
                      const currentRoles = moduleRoles[module.id] || [];
                      const hasRole = currentRoles.includes(role);
                      
                      setModuleRoles(prev => ({
                        ...prev,
                        [module.id]: hasRole 
                          ? currentRoles.filter(r => r !== role)
                          : [...currentRoles, role]
                      }));
                    }}
                    startupOptions={isStartupHub ? startupHubOptions : undefined}
                    onStartupOptionToggle={isStartupHub ? (option) => {
                      setStartupHubOptions(prev => ({
                        ...prev,
                        [option]: !prev[option],
                        // Ensure only one option is selected
                        ...(option === 'startup' && !prev[option] ? { mentor: false } : {}),
                        ...(option === 'mentor' && !prev[option] ? { startup: false } : {})
                      }));
                    } : undefined}
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciais de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!generatedPassword ? (
              <Alert>
                <AlertDescription>
                  Uma senha temporária de 6 caracteres será gerada automaticamente quando você criar o usuário.
                  O usuário será obrigado a alterá-la no primeiro acesso.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="bg-muted p-4 rounded-lg">
                <Label className="text-sm text-muted-foreground">Senha Temporária Gerada</Label>
                <p className="font-mono text-lg font-bold text-primary mt-1">{generatedPassword}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta senha será enviada por e-mail para o usuário
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex items-center gap-2">
            {loading ? (
              <>Criando...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {generatedPassword ? 'Criar Usuário e Enviar Credenciais' : 'Gerar Senha e Criar Usuário'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/admin/users')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};