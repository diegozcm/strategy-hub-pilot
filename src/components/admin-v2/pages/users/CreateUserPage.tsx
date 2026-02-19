import React, { useState, useEffect, useMemo } from 'react';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useMultiTenant';
import { User, Building2, Key, Shield, Loader2, Mail, Briefcase, Eye, CheckCircle2, Info, UserPlus, AlertTriangle, Copy, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AvatarCropUploadLocal } from '@/components/ui/AvatarCropUploadLocal';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { UserRole } from '@/types/auth';

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface CompanyWithDetails {
  id: string;
  name: string;
  company_type: 'regular' | 'startup' | null;
  ai_enabled: boolean;
  status: string;
}

interface AvailableModule {
  moduleId: string;
  moduleSlug: string;
  moduleName: string;
}

interface CreatedUserData {
  id: string;
  name: string;
  email: string;
  password: string;
  company: string | null;
  emailSent: boolean;
  emailStatus: 'sent' | 'failed' | 'pending';
  emailMessage: string;
}

type CreationStep = 'idle' | 'password' | 'auth' | 'profile' | 'avatar' | 'modules' | 'email' | 'done';

// Hook para buscar módulos do sistema
const useSystemModules = () => {
  return useQuery({
    queryKey: ['system-modules-active'],
    queryFn: async (): Promise<SystemModule[]> => {
      const { data, error } = await supabase
        .from('system_modules')
        .select('id, name, slug, active')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para buscar empresas com detalhes para determinar módulos
const useCompaniesWithDetails = () => {
  return useQuery({
    queryKey: ['companies-with-details'],
    queryFn: async (): Promise<CompanyWithDetails[]> => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, company_type, ai_enabled, status')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
};

// Hook para verificar se uma empresa tem usuários com perfis no Startup Hub
const useCompanyHasStartupHubUsers = (companyId: string | null) => {
  return useQuery({
    queryKey: ['company-startup-hub-users', companyId],
    queryFn: async (): Promise<boolean> => {
      if (!companyId) return false;
      
      // Verificar se há relações mentor_startup_relations onde esta empresa é uma startup
      const { data: startupRelations, error: startupError } = await supabase
        .from('mentor_startup_relations')
        .select('id')
        .eq('startup_company_id', companyId)
        .limit(1);
      
      if (!startupError && startupRelations && startupRelations.length > 0) {
        return true;
      }
      
      // Verificar se há usuários desta empresa com perfis no startup_hub_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('company_id', companyId);
      
      if (profilesError || !profiles || profiles.length === 0) return false;
      
      const userIds = profiles.map(p => p.user_id);
      
      const { data: startupProfiles, error: startupProfilesError } = await supabase
        .from('startup_hub_profiles')
        .select('id')
        .in('user_id', userIds)
        .limit(1);
      
      if (!startupProfilesError && startupProfiles && startupProfiles.length > 0) {
        return true;
      }
      
      return false;
    },
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });
};

const initialFormData = {
  firstName: '', lastName: '', email: '', companyId: '', department: '', position: '',
  passwordType: 'auto', manualPassword: '', sendCredentials: true, forcePasswordChange: true
};

const CREATION_STEPS: { key: CreationStep; label: string }[] = [
  { key: 'password', label: 'Gerando senha...' },
  { key: 'auth', label: 'Criando conta...' },
  { key: 'profile', label: 'Configurando perfil...' },
  { key: 'avatar', label: 'Salvando foto...' },
  { key: 'modules', label: 'Configurando módulos...' },
  { key: 'email', label: 'Enviando credenciais...' },
];

export default function CreateUserPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { data: companies, isLoading: companiesLoading } = useCompaniesWithDetails();
  const { data: systemModules, isLoading: modulesLoading } = useSystemModules();

  const [formData, setFormData] = useState(initialFormData);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>('');
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [moduleRoles, setModuleRoles] = useState<Record<string, UserRole | null>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estados de criação
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<CreationStep>('idle');
  const [createdUser, setCreatedUser] = useState<CreatedUserData | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Verificar se a empresa selecionada tem acesso ao Startup Hub
  const { data: hasStartupHubUsers } = useCompanyHasStartupHubUsers(formData.companyId || null);

  // Determinar módulos disponíveis baseado nas características da empresa
  const availableModules = useMemo((): AvailableModule[] => {
    if (!systemModules) return [];
    if (!formData.companyId) {
      // Sem empresa selecionada, mostrar todos os módulos
      return systemModules.map(m => ({
        moduleId: m.id,
        moduleSlug: m.slug,
        moduleName: m.name,
      }));
    }

    const selectedCompany = companies?.find(c => c.id === formData.companyId);
    if (!selectedCompany) return [];

    const modules: AvailableModule[] = [];

    // Strategy HUB - sempre disponível para todas as empresas
    const strategyModule = systemModules.find(m => m.slug === 'strategic-planning');
    if (strategyModule) {
      modules.push({
        moduleId: strategyModule.id,
        moduleSlug: strategyModule.slug,
        moduleName: strategyModule.name,
      });
    }

    // Startup HUB - disponível se:
    // 1. company_type === 'startup' OU
    // 2. Empresa tem usuários com perfis no startup_hub_profiles (mentores)
    const startupModule = systemModules.find(m => m.slug === 'startup-hub');
    if (startupModule) {
      const isStartup = selectedCompany.company_type === 'startup';
      const hasMentorsOrStartups = hasStartupHubUsers === true;
      
      if (isStartup || hasMentorsOrStartups) {
        modules.push({
          moduleId: startupModule.id,
          moduleSlug: startupModule.slug,
          moduleName: startupModule.name,
        });
      }
    }

    // AI Copilot - disponível se ai_enabled === true
    const aiModule = systemModules.find(m => m.slug === 'ai-copilot');
    if (aiModule && selectedCompany.ai_enabled) {
      modules.push({
        moduleId: aiModule.id,
        moduleSlug: aiModule.slug,
        moduleName: aiModule.name,
      });
    }

    return modules;
  }, [formData.companyId, companies, systemModules, hasStartupHubUsers]);

  // Reset module access when company changes
  useEffect(() => {
    setModuleAccess({});
    setModuleRoles({});
  }, [formData.companyId]);

  const resetForm = () => {
    setFormData(initialFormData);
    setAvatarDataUrl('');
    setModuleAccess({});
    setModuleRoles({});
    setGeneratedPassword('');
    setCreatedUser(null);
    setCreationStep('idle');
  };

  const handleModuleAccessChange = (moduleId: string, checked: boolean) => {
    setModuleAccess(prev => ({ ...prev, [moduleId]: checked }));
    if (!checked) {
      setModuleRoles(prev => ({ ...prev, [moduleId]: null }));
    }
  };

  const handleModuleRoleChange = (moduleId: string, role: UserRole | null) => {
    setModuleRoles(prev => ({ ...prev, [moduleId]: role }));
  };

  const getRoleOptions = (moduleSlug: string): { value: string; label: string }[] => {
    if (moduleSlug === 'startup-hub') {
      return [
        { value: 'startup', label: 'Startup' },
        { value: 'mentor', label: 'Mentor' },
      ];
    }
    if (moduleSlug === 'strategic-planning') {
      return [
        { value: 'manager', label: 'Gestor' },
        { value: 'member', label: 'Membro' },
      ];
    }
    return [
      { value: 'admin', label: 'Admin' },
      { value: 'manager', label: 'Gestor' },
      { value: 'member', label: 'Membro' },
    ];
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
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setGeneratedPassword(password);
      return password;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Credenciais copiadas para a área de transferência." });
  };

  const handleCreateUser = async () => {
    // Validação básica
    if (!formData.firstName.trim() || !formData.email.trim()) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Preencha nome e email para continuar.",
        variant: "destructive" 
      });
      return;
    }

    if (!currentUser) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    // Validar senha manual se selecionada
    if (formData.passwordType === 'manual') {
      if (formData.manualPassword.length < 8) {
        toast({ title: "Senha inválida", description: "A senha deve ter no mínimo 8 caracteres.", variant: "destructive" });
        return;
      }
      if (!/[a-zA-Z]/.test(formData.manualPassword) || !/\d/.test(formData.manualPassword)) {
        toast({ title: "Senha inválida", description: "A senha deve conter letras e números.", variant: "destructive" });
        return;
      }
    }

    setIsCreating(true);
    let newUserId: string | null = null;

    try {
      // 1. Gerar senha
      setCreationStep('password');
      let passwordToUse = formData.passwordType === 'manual' ? formData.manualPassword : '';
      if (formData.passwordType === 'auto') {
        passwordToUse = await generatePassword();
      }

      // 2. Criar usuário no Auth
      setCreationStep('auth');
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-user-admin', {
        body: {
          email: formData.email,
          password: passwordToUse,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: null,
          position: formData.position || null,
          department: formData.department || null,
        }
      });

      // Handle edge function errors (including 422 business errors)
      if (createError) {
        console.error('Edge function error:', createError);
        let errorMessage = 'Erro de comunicação com o servidor.';
        
        try {
          if (createError instanceof FunctionsHttpError) {
            // Para erros HTTP da edge function, extrair o JSON da resposta
            const errorData = await createError.context.json();
            console.log('Edge function error data:', errorData);
            errorMessage = errorData?.error || errorMessage;
          } else if (createError instanceof FunctionsRelayError) {
            errorMessage = `Erro de relay: ${createError.message}`;
          } else if (createError instanceof FunctionsFetchError) {
            errorMessage = `Erro de conexão: ${createError.message}`;
          } else if ((createError as any).message) {
            errorMessage = (createError as any).message;
          }
        } catch (parseError) {
          console.error('Error parsing edge function error:', parseError);
        }
        
        if (errorMessage.includes('já existe') || errorMessage.includes('already exists')) {
          throw new Error('Este e-mail já está cadastrado no sistema.');
        }
        throw new Error(errorMessage);
      }

      if (!createResult?.success) {
        const errorMessage = createResult?.error || 'Falha na criação do usuário';
        if (errorMessage.includes('já existe')) {
          throw new Error('Este e-mail já está cadastrado no sistema.');
        }
        throw new Error(errorMessage);
      }

      newUserId = createResult.user_id;
      console.log('✅ Auth user created:', newUserId);

      // 3. Configurar perfil
      setCreationStep('profile');
      const { data: profileResult, error: profileError } = await supabase.rpc('configure_user_profile', {
        _admin_id: currentUser.id,
        _user_id: newUserId,
        _email: formData.email,
        _first_name: formData.firstName,
        _last_name: formData.lastName,
        _phone: null,
        _position: formData.position || null,
        _department: formData.department || null,
        _role: 'member',
        _company_id: formData.companyId || null
      });

      if (profileError) {
        console.error('Profile configuration error:', profileError);
        throw new Error('Erro ao configurar perfil do usuário.');
      }

      if (!profileResult?.[0]?.success) {
        throw new Error(profileResult?.[0]?.message || 'Falha na configuração do perfil');
      }

      console.log('✅ Profile configured');

      // 4. Upload do avatar (se existir)
      setCreationStep('avatar');
      if (avatarDataUrl && newUserId) {
        try {
          // Converter Data URL para Blob
          const response = await fetch(avatarDataUrl);
          const blob = await response.blob();
          
          const fileName = `${newUserId}/avatar.webp`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, { upsert: true });

          if (uploadError) {
            console.error('Avatar upload error:', uploadError);
            toast({
              title: 'Aviso',
              description: 'Não foi possível salvar a foto de perfil. O usuário foi criado sem foto.',
            });
          } else {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            
            await supabase
              .from('profiles')
              .update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` })
              .eq('user_id', newUserId);
            
            console.log('✅ Avatar uploaded:', urlData.publicUrl);
          }
        } catch (avatarErr) {
          console.warn('Avatar upload failed, continuing:', avatarErr);
          toast({
            title: 'Aviso',
            description: 'Erro ao processar foto de perfil.',
          });
        }
      }

      // 5. Configurar módulos
      setCreationStep('modules');
      const moduleIds = Object.entries(moduleAccess)
        .filter(([_, hasAccess]) => hasAccess)
        .map(([moduleId]) => moduleId);

      if (moduleIds.length > 0) {
        const moduleRolesJson: Record<string, string[]> = {};
        for (const [moduleId, role] of Object.entries(moduleRoles)) {
          if (role) {
            moduleRolesJson[moduleId] = [role];
          }
        }

        let startupHubOptionsJson = {};
        const startupModule = systemModules?.find(m => m.slug === 'startup-hub');
        if (startupModule && moduleAccess[startupModule.id]) {
          const startupRole = moduleRoles[startupModule.id] as string | null;
          if (startupRole === 'startup' || startupRole === 'mentor') {
            startupHubOptionsJson = { type: startupRole };
          }
        }

        const { error: modulesError } = await supabase.rpc('configure_user_modules', {
          _admin_id: currentUser.id,
          _user_id: newUserId,
          _module_ids: moduleIds,
          _module_roles: moduleRolesJson,
          _startup_hub_options: startupHubOptionsJson
        });

        if (modulesError) {
          console.warn('Module configuration failed:', modulesError);
        } else {
          console.log('✅ Modules configured');
        }
      }

      // 6. Enviar credenciais por email
      setCreationStep('email');
      let emailStatus: 'sent' | 'failed' | 'pending' = 'pending';
      let emailMessage = '';

      if (formData.sendCredentials) {
        try {
          const selectedCompany = companies?.find(c => c.id === formData.companyId);
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-user-credentials', {
            body: {
              to: formData.email,
              userName: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              temporaryPassword: passwordToUse,
              companyName: selectedCompany?.name
            }
          });

          if (emailError) {
            emailStatus = 'failed';
            emailMessage = 'Falha na comunicação com o serviço de e-mail';
          } else if (emailResult?.emailSent === false) {
            emailStatus = 'failed';
            emailMessage = emailResult.emailError || 'Falha no envio do e-mail';
          } else {
            emailStatus = 'sent';
            emailMessage = 'E-mail enviado com sucesso';
          }
        } catch (emailErr) {
          emailStatus = 'failed';
          emailMessage = 'Erro inesperado no envio do e-mail';
        }
      } else {
        emailStatus = 'pending';
        emailMessage = 'Envio de e-mail não solicitado';
      }

      console.log('✅ Creation complete, email status:', emailStatus);

      // Sucesso!
      setCreationStep('done');
      const selectedCompany = companies?.find(c => c.id === formData.companyId);
      
      setCreatedUser({
        id: newUserId!,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: passwordToUse,
        company: selectedCompany?.name || null,
        emailSent: emailStatus === 'sent',
        emailStatus,
        emailMessage
      });

      setShowSuccessModal(true);

      toast({
        title: emailStatus === 'sent' ? "Usuário criado com sucesso!" : "Usuário criado com aviso",
        description: emailStatus === 'sent' 
          ? "E-mail com credenciais enviado." 
          : "Usuário criado, mas o e-mail não foi enviado.",
      });

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || 'Erro inesperado',
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
      setCreationStep('idle');
    }
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  const getSelectedModulesWithRoles = () => {
    return availableModules
      .filter(m => moduleAccess[m.moduleId])
      .map(module => {
        const role = moduleRoles[module.moduleId];
        const roleLabel = role 
          ? getRoleOptions(module.moduleSlug).find(r => r.value === role)?.label
          : null;
        return { ...module, roleLabel };
      });
  };

  const selectedModulesCount = Object.values(moduleAccess).filter(Boolean).length;

  const getCreationProgress = (): number => {
    const stepIndex = CREATION_STEPS.findIndex(s => s.key === creationStep);
    if (stepIndex === -1) return 0;
    return ((stepIndex + 1) / CREATION_STEPS.length) * 100;
  };

  return (
    <AdminPageContainer title="Criar Usuário" description="Adicione um novo usuário ao sistema">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Informações do Usuário */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload de Foto de Perfil */}
              <div className="flex justify-center pb-4 border-b">
                <AvatarCropUploadLocal
                  currentImageUrl={avatarDataUrl || undefined}
                  onImageCropped={(dataUrl) => setAvatarDataUrl(dataUrl)}
                  onImageRemoved={() => setAvatarDataUrl('')}
                  userInitials={
                    formData.firstName && formData.lastName 
                      ? `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
                      : formData.firstName 
                        ? formData.firstName[0].toUpperCase()
                        : 'U'
                  }
                  size="lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input 
                    placeholder="Digite o nome" 
                    value={formData.firstName} 
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sobrenome</Label>
                  <Input 
                    placeholder="Digite o sobrenome" 
                    value={formData.lastName} 
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email" 
                  placeholder="email@empresa.com" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isCreating}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Empresa e Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select 
                  value={formData.companyId} 
                  onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companiesLoading ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      companies?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.company_type === 'startup' && (
                            <span className="ml-2 text-xs text-muted-foreground">(Startup)</span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input 
                    placeholder="Ex: Tecnologia" 
                    value={formData.department} 
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input 
                    placeholder="Ex: Desenvolvedor" 
                    value={formData.position} 
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5" />
                Credenciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={formData.passwordType} 
                onValueChange={(value) => setFormData({ ...formData, passwordType: value })}
                disabled={isCreating}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="auto" />
                  <Label htmlFor="auto">Gerar senha temporária automaticamente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual">Definir senha manualmente</Label>
                </div>
              </RadioGroup>
              {formData.passwordType === 'manual' && (
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input 
                    type="password" 
                    placeholder="Mínimo 8 caracteres, letras e números" 
                    value={formData.manualPassword} 
                    onChange={(e) => setFormData({ ...formData, manualPassword: e.target.value })}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter no mínimo 8 caracteres, incluindo letras e números.
                  </p>
                </div>
              )}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sendCredentials" 
                    checked={formData.sendCredentials} 
                    onCheckedChange={(checked) => setFormData({ ...formData, sendCredentials: checked as boolean })}
                    disabled={isCreating}
                  />
                  <Label htmlFor="sendCredentials" className="font-normal">
                    Enviar credenciais por email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="forcePasswordChange" 
                    checked={formData.forcePasswordChange} 
                    onCheckedChange={(checked) => setFormData({ ...formData, forcePasswordChange: checked as boolean })}
                    disabled={isCreating}
                  />
                  <Label htmlFor="forcePasswordChange" className="font-normal">
                    Obrigar troca de senha no primeiro login
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Módulos e Permissões */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Módulos e Permissões
              </CardTitle>
              <CardDescription>
                {formData.companyId 
                  ? "Selecione os módulos e defina as permissões do usuário"
                  : "Selecione uma empresa para ver os módulos disponíveis"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!formData.companyId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecione uma empresa primeiro</p>
                  <p className="text-xs mt-1">Os módulos disponíveis serão exibidos aqui</p>
                </div>
              ) : modulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableModules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum módulo disponível para esta empresa</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableModules.map((module) => {
                    const isChecked = moduleAccess[module.moduleId] || false;
                    const currentRole = moduleRoles[module.moduleId] || null;
                    const roleOptions = getRoleOptions(module.moduleSlug);

                    return (
                      <div 
                        key={module.moduleId} 
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`module-${module.moduleId}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleModuleAccessChange(module.moduleId, !!checked)}
                            disabled={isCreating}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`module-${module.moduleId}`} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              {module.moduleName}
                            </label>
                            <p className="text-xs text-muted-foreground">{module.moduleSlug}</p>
                          </div>
                        </div>

                        {isChecked && (
                          <div className="pl-7">
                            <Label className="text-xs text-muted-foreground mb-2 block">
                              Papel no módulo:
                            </Label>
                            <RadioGroup 
                              value={currentRole || ''} 
                              onValueChange={(value) => handleModuleRoleChange(module.moduleId, value as UserRole)}
                              className="flex flex-wrap gap-3"
                              disabled={isCreating}
                            >
                              {roleOptions.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <RadioGroupItem 
                                    id={`role-${module.moduleId}-${option.value}`}
                                    value={option.value}
                                  />
                                  <Label 
                                    htmlFor={`role-${module.moduleId}-${option.value}`}
                                    className="cursor-pointer text-sm"
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {selectedModulesCount > 0 && (
                    <div className="pt-2 text-sm text-muted-foreground">
                      {selectedModulesCount} módulo{selectedModulesCount > 1 ? 's' : ''} selecionado{selectedModulesCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Pré-visualização */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" />
                Pré-visualização
              </CardTitle>
              <CardDescription>
                Como o perfil aparecerá no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  {avatarDataUrl ? (
                    <AvatarImage src={avatarDataUrl} alt="Preview" />
                  ) : null}
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {formData.firstName && formData.lastName 
                      ? `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
                      : formData.firstName 
                        ? formData.firstName[0].toUpperCase()
                        : <User className="h-8 w-8 text-muted-foreground" />
                    }
                  </AvatarFallback>
                </Avatar>

                {/* Nome */}
                <div>
                  <p className="font-semibold text-lg">
                    {formData.firstName || formData.lastName 
                      ? `${formData.firstName} ${formData.lastName}`.trim()
                      : <span className="text-muted-foreground italic">Nome do usuário</span>
                    }
                  </p>
                  {formData.position && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {formData.position}
                    </p>
                  )}
                </div>

                {/* Informações */}
                <div className="w-full space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className={formData.email ? 'text-foreground' : 'italic'}>
                      {formData.email || 'email@empresa.com'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className={formData.companyId ? 'text-foreground' : 'italic'}>
                      {formData.companyId 
                        ? companies?.find(c => c.id === formData.companyId)?.name
                        : 'Nenhuma empresa'
                      }
                    </span>
                  </div>

                  {formData.department && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-foreground">{formData.department}</span>
                    </div>
                  )}
                </div>

                {/* Módulos Selecionados */}
                {selectedModulesCount > 0 && (
                  <div className="w-full pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Acesso aos módulos:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {availableModules
                        .filter(m => moduleAccess[m.moduleId])
                        .map(module => {
                          const role = moduleRoles[module.moduleId];
                          const roleLabel = role 
                            ? getRoleOptions(module.moduleSlug).find(r => r.value === role)?.label
                            : null;
                          
                          return (
                            <Badge 
                              key={module.moduleId} 
                              variant="secondary"
                              className="text-xs"
                            >
                              {module.moduleName}
                              {roleLabel && (
                                <span className="ml-1 opacity-70">({roleLabel})</span>
                              )}
                            </Badge>
                          );
                        })
                      }
                    </div>
                  </div>
                )}

                {/* Status de credenciais */}
                <div className="w-full pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Key className="h-3 w-3" />
                    <span>
                      {formData.passwordType === 'auto' 
                        ? 'Senha temporária será gerada'
                        : 'Senha definida manualmente'
                      }
                    </span>
                  </div>
                  {formData.sendCredentials && (
                    <p className="mt-1">Credenciais serão enviadas por email</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Indicador de Progresso */}
      {isCreating && (
        <Card className="mt-6">
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">
                  {CREATION_STEPS.find(s => s.key === creationStep)?.label || 'Processando...'}
                </span>
              </div>
              <Progress value={getCreationProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                {CREATION_STEPS.map((step, idx) => {
                  const currentIdx = CREATION_STEPS.findIndex(s => s.key === creationStep);
                  const isComplete = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  
                  return (
                    <span 
                      key={step.key}
                      className={isComplete ? 'text-green-600' : isCurrent ? 'text-primary font-medium' : ''}
                    >
                      {isComplete ? '✓' : idx + 1}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={resetForm} disabled={isCreating}>
          Cancelar
        </Button>
        <Button onClick={handleCreateUser} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            'Criar Usuário'
          )}
        </Button>
      </div>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex flex-col items-center text-center py-4">
            {/* Ícone de sucesso */}
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
              createdUser?.emailStatus === 'sent' 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-yellow-100 dark:bg-yellow-900/30'
            }`}>
              {createdUser?.emailStatus === 'sent' ? (
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            
            <DialogTitle className="text-xl">
              {createdUser?.emailStatus === 'sent' 
                ? 'Usuário Cadastrado com Sucesso!' 
                : 'Usuário Cadastrado com Aviso'
              }
            </DialogTitle>
            
            {/* Preview do usuário criado */}
            <div className="w-full mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-background">
                  {avatarDataUrl && <AvatarImage src={avatarDataUrl} alt="Avatar" />}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {formData.firstName?.[0]?.toUpperCase()}{formData.lastName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium">{createdUser?.name}</p>
                  <p className="text-sm text-muted-foreground">{createdUser?.email}</p>
                  {createdUser?.company && (
                    <p className="text-xs text-muted-foreground">{createdUser.company}</p>
                  )}
                </div>
              </div>
              
              {/* Módulos selecionados */}
              {selectedModulesCount > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {getSelectedModulesWithRoles().map(module => (
                    <Badge key={module.moduleId} variant="secondary" className="text-xs">
                      {module.moduleName}
                      {module.roleLabel && (
                        <span className="ml-1 opacity-70">({module.roleLabel})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Credenciais */}
            <div className="w-full mt-4 p-4 bg-background border rounded-lg text-left">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Credenciais de Acesso
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <code className="text-sm font-mono">{createdUser?.email}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Senha temporária:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold text-primary">{createdUser?.password}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`Email: ${createdUser?.email}\nSenha: ${createdUser?.password}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status do email */}
            {createdUser?.emailStatus === 'sent' ? (
              <Alert className="w-full mt-4">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  E-mail com credenciais enviado para <strong>{createdUser.email}</strong>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="w-full mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Problema no envio:</strong> {createdUser?.emailMessage}
                  <br />
                  <span className="text-sm">Informe as credenciais manualmente ao usuário.</span>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Texto de ajuda */}
            <div className="w-full mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-left">
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Próximos passos
              </h4>
              <p className="text-sm text-muted-foreground">
                O usuário deve acessar o sistema e trocar a senha temporária no primeiro login.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/app/admin/users');
              }}
            >
              Voltar para Lista
            </Button>
            <Button onClick={handleCreateAnother}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Outro Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageContainer>
  );
}
