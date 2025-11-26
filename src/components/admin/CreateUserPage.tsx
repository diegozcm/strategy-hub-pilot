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
import { ArrowLeft, User, Mail, Phone, Building, Key, Send, Settings, AlertTriangle } from 'lucide-react';
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

interface Company {
  id: string;
  name: string;
  company_type: 'regular' | 'startup';
  status: string;
}

export const CreateUserPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

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
  const [moduleRoles, setModuleRoles] = useState<Record<string, UserRole | null>>({});
  const [startupHubOptions, setStartupHubOptions] = useState<{ startup: boolean; mentor: boolean }>({ 
    startup: false, 
    mentor: false 
  });

  // Carregar módulos do sistema e empresas
  useEffect(() => {
    loadModules();
    loadCompanies();
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

  const loadCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, company_type, status')
        .eq('status', 'active')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar lista de empresas');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const generatePassword = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_temporary_password');
      if (error) throw error;
      setGeneratedPassword(data);
      return data;
    } catch (error) {
      console.error('Error generating password:', error);
      // Fallback local generation
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let password = '';
      for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setGeneratedPassword(password);
      return password;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);

    try {
      // Ensure password is generated first
      let passwordToUse = generatedPassword;
      if (!passwordToUse) {
        passwordToUse = await generatePassword();
      }

      console.log('Creating user with edge function:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      });

      // Step 1: Create auth user using edge function
      let createResult, createError;
      
      try {
        const result = await supabase.functions.invoke('create-user-admin', {
          body: {
            email: formData.email,
            password: passwordToUse,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || null,
            position: formData.position || null,
            department: formData.department || null,
            role: formData.role
          }
        });
        
        createResult = result.data;
        createError = result.error;
        
        // Se há erro de comunicação real (network, timeout, etc)
        if (createError) {
          console.error('Edge function invocation error:', createError);
          throw new Error('Erro de comunicação com o servidor. Verifique sua conexão e tente novamente.');
        }
        
        // Se não há resultado da função
        if (!createResult) {
          throw new Error('Resposta inválida do servidor');
        }
        
        // Se o edge function retornou mas com erro de negócio (422, 400, etc)
        if (!createResult.success) {
          const errorMessage = createResult.error || 'Falha na criação do usuário';
          console.error('Create user business error:', errorMessage);
          
          // Tratar erro específico de usuário já existente
          if (errorMessage.includes('Usuário com este email já existe')) {
            throw new Error('Este e-mail já está cadastrado no sistema. Verifique o e-mail informado.');
          }
          
          // Outros erros de negócio
          throw new Error(errorMessage);
        }
        
      } catch (err: any) {
        console.error('Unexpected error in edge function call:', err);
        
        // Re-lançar erros já tratados
        if (err.message.includes('e-mail já está cadastrado') || 
            err.message.includes('Erro de comunicação') ||
            err.message.includes('Resposta inválida')) {
          throw err;
        }
        
        // Outros erros inesperados
        throw new Error('Erro inesperado ao criar usuário. Tente novamente.');
      }

      const newUserId = createResult.user_id;
      console.log('Auth user created successfully:', newUserId);

      // Step 2: Configure user profile
      const { data: profileResult, error: profileError } = await supabase.rpc('configure_user_profile', {
        _admin_id: currentUser.id,
        _user_id: newUserId,
        _email: formData.email,
        _first_name: formData.firstName,
        _last_name: formData.lastName,
        _phone: formData.phone || null,
        _position: formData.position || null,
        _department: formData.department || null,
        _role: formData.role,
        _company_id: selectedCompanyId || null
      });

      if (profileError) {
        console.error('Configure profile error:', profileError);
        throw new Error(profileError.message || 'Erro ao configurar perfil do usuário');
      }

      if (!profileResult?.[0]?.success) {
        throw new Error(profileResult?.[0]?.message || 'Falha na configuração do perfil');
      }

      console.log('Profile configured successfully');

      // Step 3: Configure user modules
      const { data: configResult, error: configError } = await configureUserModulesV2(newUserId);

      if (configError) {
        console.error('Configure modules error:', configError);
        // Don't fail completely, just warn
        console.warn('Módulos não puderam ser configurados, mas usuário foi criado');
      } else if (configResult && !configResult[0]?.success) {
        console.warn('Configuração de módulos falhou:', configResult[0]?.message);
      }

      // Step 4: Send credentials to user
      let emailStatus = 'pending';
      let emailMessage = '';

      try {
        const emailResult = await supabase.functions.invoke('send-user-credentials', {
          body: {
            to: formData.email,
            userName: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            temporaryPassword: passwordToUse,
            companyName: companies.find(c => c.id === selectedCompanyId)?.name
          }
        });

        if (emailResult.error) {
          console.error('Email edge function error:', emailResult.error);
          emailStatus = 'failed';
          emailMessage = 'Falha na comunicação com o serviço de e-mail';
        } else if (emailResult.data?.emailSent === false) {
          console.error('Email sending failed:', emailResult.data.emailError);
          emailStatus = 'failed';
          emailMessage = emailResult.data.emailError || 'Falha no envio do e-mail';
        } else {
          console.log('Email sent successfully');
          emailStatus = 'sent';
          emailMessage = 'E-mail enviado com sucesso';
        }
      } catch (emailErr: any) {
        console.error('Error invoking send-user-credentials function:', emailErr);
        emailStatus = 'failed';
        emailMessage = 'Erro inesperado no envio do e-mail';
      }

      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      
      setCreatedUser({
        id: newUserId,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: passwordToUse,
        company: selectedCompany?.name || null,
        emailSent: emailStatus === 'sent',
        emailStatus,
        emailMessage
      });

      const toastTitle = emailStatus === 'sent' 
        ? "Usuário criado com sucesso" 
        : "Usuário criado com aviso";
      const toastDescription = emailStatus === 'sent'
        ? "E-mail com credenciais enviado"
        : `Usuário criado, mas ${emailMessage.toLowerCase()}`;

      toast(toastDescription, {
        description: toastTitle,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const configureUserModulesV2 = async (userId: string) => {
    if (!currentUser?.id) return { data: null, error: null };

    try {
      // Collect module IDs that have access
      const moduleIds = Object.entries(moduleAccess)
        .filter(([_, hasAccess]) => hasAccess)
        .map(([moduleId, _]) => moduleId);

      if (moduleIds.length === 0) return { data: null, error: null };

      // Prepare module roles JSON
      const moduleRolesJson: Record<string, string[]> = {};
      for (const [moduleId, role] of Object.entries(moduleRoles)) {
        if (role) {
          moduleRolesJson[moduleId] = [role];
        }
      }

      // Prepare startup hub options JSON
      let startupHubOptionsJson = {};
      const startupModule = modules.find(m => m.slug === 'startup-hub');
      if (startupModule && moduleAccess[startupModule.id]) {
        if (startupHubOptions.startup) {
          startupHubOptionsJson = { type: 'startup' };
        } else if (startupHubOptions.mentor) {
          startupHubOptionsJson = { type: 'mentor' };
        }
      }

      // Use the new configure_user_modules function
      const { data, error } = await supabase.rpc('configure_user_modules', {
        _admin_id: currentUser.id,
        _user_id: userId,
        _module_ids: moduleIds,
        _module_roles: moduleRolesJson,
        _startup_hub_options: startupHubOptionsJson
      });

      if (error) return { data: null, error };

      const result = data[0];
      if (!result.success) {
        console.error('Module configuration debug log:', result.debug_log);
        return { data: null, error: new Error(result.message) };
      }

      console.log('Module configuration successful:', result.debug_log);
      return { data: result, error: null };
    } catch (error) {
      console.error('Erro ao configurar módulos do usuário:', error);
      return { data: null, error: error as Error };
    }
  };

  if (createdUser) {
    const isEmailSent = createdUser.emailStatus === 'sent';
    
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
            <CardTitle className={`flex items-center gap-2 ${
              isEmailSent ? 'text-emerald-600' : 'text-yellow-600'
            }`}>
              {isEmailSent ? '✅' : '⚠️'} Usuário Criado{isEmailSent ? ' com Sucesso!' : ' com Aviso'}
            </CardTitle>
            <CardDescription>
              O usuário foi criado{isEmailSent ? ' e as credenciais foram enviadas por e-mail' : ', mas houve problema no envio do e-mail'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEmailSent && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Problema no envio:</strong> {createdUser.emailMessage}
                  <br />
                  Por favor, informe as credenciais ao usuário manualmente.
                </AlertDescription>
              </Alert>
            )}
            
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
                {createdUser.company && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Empresa</Label>
                    <p className="font-medium">{createdUser.company}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 p-3 bg-background border rounded">
                <Label className="text-sm text-muted-foreground">Senha Temporária</Label>
                <p className="font-mono text-lg font-bold text-primary">{createdUser.password}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O usuário deve alterar esta senha no primeiro acesso
                </p>
              </div>
            </div>

            <Alert variant={isEmailSent ? 'default' : 'destructive'}>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {isEmailSent ? (
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
                setSelectedCompanyId('');
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
              <Building className="h-5 w-5" />
              Empresa
            </CardTitle>
            <CardDescription>
              Selecione a empresa que será associada ao usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Select 
                value={selectedCompanyId} 
                onValueChange={setSelectedCompanyId}
                disabled={companiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={companiesLoading ? "Carregando empresas..." : "Selecione uma empresa"} />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 && !companiesLoading ? (
                    <SelectItem value="" disabled>
                      Nenhuma empresa disponível
                    </SelectItem>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} 
                        {company.company_type === 'startup' && (
                          <Badge variant="secondary" className="ml-2">Startup</Badge>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Opcional: O usuário poderá ser associado a uma empresa específica
              </p>
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
                const role = moduleRoles[module.id] || null;
                
                return (
                  <ModuleAccessRow
                    key={module.id}
                    module={module}
                    checked={checked}
                    role={role}
                    onAccessChange={(hasAccess) => {
                      setModuleAccess(prev => ({
                        ...prev,
                        [module.id]: hasAccess
                      }));
                      
                      // Reset role when access is removed
                      if (!hasAccess) {
                        setModuleRoles(prev => ({
                          ...prev,
                          [module.id]: null
                        }));
                        
                        // Reset startup hub options if it's the startup hub module
                        if (isStartupHub) {
                          setStartupHubOptions({ startup: false, mentor: false });
                        }
                      }
                    }}
                    onRoleChange={(role) => {
                      setModuleRoles(prev => ({
                        ...prev,
                        [module.id]: role
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
          <Button 
            type="submit" 
            disabled={loading} 
            className="flex items-center gap-2"
            variant={generatedPassword ? "default" : "default"}
          >
            {loading ? (
              <>Criando...</>
            ) : generatedPassword ? (
              <>
                <Send className="h-4 w-4" />
                Criar Usuário
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                Gerar Senha
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