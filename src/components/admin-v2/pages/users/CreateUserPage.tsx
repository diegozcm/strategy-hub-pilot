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
import { useCompaniesForSelect } from '@/hooks/admin/useUsersStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User, Building2, Key, Shield, Loader2, Mail, Briefcase, Eye, CheckCircle2, Info, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AvatarCropUploadLocal } from '@/components/ui/AvatarCropUploadLocal';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { UserRole } from '@/types/auth';

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface CompanyModuleAccess {
  moduleId: string;
  moduleSlug: string;
  moduleName: string;
}

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

// Hook para buscar quais módulos uma empresa tem acesso (baseado em usuários existentes)
const useCompanyModuleAccess = (companyId: string | null) => {
  return useQuery({
    queryKey: ['company-module-access', companyId],
    queryFn: async (): Promise<CompanyModuleAccess[]> => {
      if (!companyId) return [];
      
      // Step 1: Get user IDs for this company
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('company_id', companyId);
      
      if (profilesError || !profilesData?.length) {
        // Fallback: retornar todos os módulos ativos
        const { data: allModules } = await supabase
          .from('system_modules')
          .select('id, name, slug')
          .eq('active', true);
        
        return (allModules || []).map(m => ({
          moduleId: m.id,
          moduleSlug: m.slug,
          moduleName: m.name,
        }));
      }
      
      const userIds = profilesData.map(p => p.user_id);
      
      // Step 2: Get module roles for these users
      const { data: userModuleRoles, error } = await supabase
        .from('user_module_roles')
        .select(`
          module_id,
          system_modules!inner(id, name, slug)
        `)
        .in('user_id', userIds);
      
      if (error) {
        console.error('Error fetching company modules:', error);
        // Fallback: retornar todos os módulos ativos
        const { data: allModules } = await supabase
          .from('system_modules')
          .select('id, name, slug')
          .eq('active', true);
        
        return (allModules || []).map(m => ({
          moduleId: m.id,
          moduleSlug: m.slug,
          moduleName: m.name,
        }));
      }
      
      // Deduplicate modules
      const uniqueModules = new Map<string, CompanyModuleAccess>();
      userModuleRoles?.forEach((row: any) => {
        const mod = row.system_modules;
        if (mod && !uniqueModules.has(mod.id)) {
          uniqueModules.set(mod.id, {
            moduleId: mod.id,
            moduleSlug: mod.slug,
            moduleName: mod.name,
          });
        }
      });
      
      // Se não encontrou módulos específicos, retornar todos os módulos ativos
      if (uniqueModules.size === 0) {
        const { data: allModules } = await supabase
          .from('system_modules')
          .select('id, name, slug')
          .eq('active', true);
        
        return (allModules || []).map(m => ({
          moduleId: m.id,
          moduleSlug: m.slug,
          moduleName: m.name,
        }));
      }
      
      return Array.from(uniqueModules.values());
    },
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });
};

const initialFormData = {
  firstName: '', lastName: '', email: '', companyId: '', department: '', position: '',
  passwordType: 'auto', manualPassword: '', sendCredentials: true, forcePasswordChange: true
};

export default function CreateUserPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: companies, isLoading: companiesLoading } = useCompaniesForSelect();
  const { data: systemModules, isLoading: modulesLoading } = useSystemModules();

  const [formData, setFormData] = useState(initialFormData);

  // Estado para a foto de perfil (Data URL)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>('');

  // Estados para módulos e permissões
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [moduleRoles, setModuleRoles] = useState<Record<string, UserRole | null>>({});

  // Estado para controlar o modal de sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Função para limpar todos os campos do formulário
  const resetForm = () => {
    setFormData(initialFormData);
    setAvatarDataUrl('');
    setModuleAccess({});
    setModuleRoles({});
  };

  // Buscar módulos disponíveis quando empresa é selecionada
  const { data: companyModules, isLoading: companyModulesLoading } = useCompanyModuleAccess(formData.companyId || null);

  // Usar todos os módulos do sistema quando nenhuma empresa está selecionada
  const availableModules = useMemo(() => {
    if (!formData.companyId && systemModules) {
      return systemModules.map(m => ({
        moduleId: m.id,
        moduleSlug: m.slug,
        moduleName: m.name,
      }));
    }
    return companyModules || [];
  }, [formData.companyId, systemModules, companyModules]);

  // Reset module access when company changes
  useEffect(() => {
    setModuleAccess({});
    setModuleRoles({});
  }, [formData.companyId]);

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

  const handleCreateUser = () => {
    // Validação básica
    if (!formData.firstName.trim() || !formData.email.trim()) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Preencha nome e email para continuar.",
        variant: "destructive" 
      });
      return;
    }
    
    // Simula criação e abre o modal de sucesso
    setShowSuccessModal(true);
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sobrenome *</Label>
                  <Input 
                    placeholder="Digite o sobrenome" 
                    value={formData.lastName} 
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companiesLoading ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      companies?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input 
                    placeholder="Ex: Desenvolvedor" 
                    value={formData.position} 
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })} 
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
                    placeholder="Digite a senha" 
                    value={formData.manualPassword} 
                    onChange={(e) => setFormData({ ...formData, manualPassword: e.target.value })} 
                  />
                </div>
              )}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sendCredentials" 
                    checked={formData.sendCredentials} 
                    onCheckedChange={(checked) => setFormData({ ...formData, sendCredentials: checked as boolean })} 
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
              ) : companyModulesLoading || modulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableModules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum módulo disponível</p>
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
                  {/* Email */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className={formData.email ? 'text-foreground' : 'italic'}>
                      {formData.email || 'email@empresa.com'}
                    </span>
                  </div>

                  {/* Empresa */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className={formData.companyId ? 'text-foreground' : 'italic'}>
                      {formData.companyId 
                        ? companies?.find(c => c.id === formData.companyId)?.name
                        : 'Nenhuma empresa'
                      }
                    </span>
                  </div>

                  {/* Departamento */}
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

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={resetForm}>
          Cancelar
        </Button>
        <Button onClick={handleCreateUser}>
          Criar Usuário
        </Button>
      </div>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            {/* Ícone de sucesso */}
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            
            <DialogTitle className="text-xl">Usuário Cadastrado com Sucesso!</DialogTitle>
            
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
                  <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
                  {formData.position && (
                    <p className="text-xs text-muted-foreground">
                      {formData.position}
                      {formData.companyId && ` • ${companies?.find(c => c.id === formData.companyId)?.name}`}
                    </p>
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
            
            {/* Texto de ajuda */}
            <div className="w-full mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-left">
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Como o usuário pode acessar?
              </h4>
              <p className="text-sm text-muted-foreground">
                {formData.sendCredentials 
                  ? "O usuário receberá um email com suas credenciais de acesso. No primeiro login, será solicitada a alteração da senha temporária."
                  : "As credenciais de acesso devem ser informadas manualmente ao usuário. No primeiro login, será solicitada a alteração da senha."
                }
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowSuccessModal(false)}
            >
              Fechar
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
