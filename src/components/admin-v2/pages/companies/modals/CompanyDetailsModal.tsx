import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CompanyHeader } from "./shared/CompanyHeader";
import { EditCompanyModal } from "./EditCompanyModal";
import { ManageCompanyUsersModal } from "./ManageCompanyUsersModal";
import { CompanyStatusModal } from "./CompanyStatusModal";
import { 
  Building2, 
  Users, 
  Settings, 
  Pencil, 
  UserCog, 
  Power, 
  Calendar, 
  Target,
  Eye,
  Bot
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface CompanyWithDetails {
  id: string;
  name: string;
  logo_url?: string | null;
  status?: string | null;
  company_type?: string | null;
  ai_enabled?: boolean;
  userCount?: number;
  created_at?: string;
}

interface CompanyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyWithDetails | null;
  onSuccess: () => void;
}

interface FullCompanyData extends CompanyWithDetails {
  mission?: string | null;
  vision?: string | null;
  values?: string[] | null;
}

type SubModalType = 'edit' | 'users' | 'status' | null;

export function CompanyDetailsModal({ 
  open, 
  onOpenChange, 
  company,
  onSuccess 
}: CompanyDetailsModalProps) {
  const [subModal, setSubModal] = useState<SubModalType>(null);

  // Fetch full company data
  const { data: fullCompany, refetch } = useQuery({
    queryKey: ['company-details', company?.id],
    queryFn: async (): Promise<FullCompanyData | null> => {
      if (!company) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company.id)
        .single();

      if (error) throw error;

      return {
        ...data,
        userCount: company.userCount || 0,
      };
    },
    enabled: open && !!company,
  });

  // Fetch company users for the Users tab
  const { data: companyUsers } = useQuery({
    queryKey: ['company-users-list', company?.id],
    queryFn: async () => {
      if (!company) return [];
      const { data, error } = await supabase
        .rpc('get_company_users', { _company_id: company.id });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!company,
  });

  if (!company) return null;

  const displayCompany = fullCompany || company;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const handleSubModalSuccess = () => {
    setSubModal(null);
    refetch();
    onSuccess();
  };

  return (
    <>
      <Dialog open={open && !subModal} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detalhes da Empresa
            </DialogTitle>
          </DialogHeader>

          {/* Header */}
          <div className="py-4">
            <CompanyHeader company={displayCompany} />
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
            </TabsList>

            {/* Tab: Informações */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Tipo
                  </p>
                  <p className="font-medium">
                    {displayCompany.company_type === 'startup' ? 'Startup' : 'Regular'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Criada em
                  </p>
                  <p className="font-medium">{formatDate(displayCompany.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Usuários
                  </p>
                  <p className="font-medium">{displayCompany.userCount || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Bot className="h-3 w-3" /> AI Copilot
                  </p>
                  <p className="font-medium">
                    {displayCompany.ai_enabled ? 'Habilitado' : 'Desabilitado'}
                  </p>
                </div>
              </div>

              {(fullCompany?.mission || fullCompany?.vision) && (
                <div className="space-y-4 pt-4">
                  {fullCompany.mission && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" /> Missão
                      </p>
                      <p className="text-sm">{fullCompany.mission}</p>
                    </div>
                  )}
                  {fullCompany.vision && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Visão
                      </p>
                      <p className="text-sm">{fullCompany.vision}</p>
                    </div>
                  )}
                </div>
              )}

              {fullCompany?.values && fullCompany.values.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm text-muted-foreground">Valores</p>
                  <div className="flex flex-wrap gap-2">
                    {fullCompany.values.map((value, i) => (
                      <Badge key={i} variant="secondary">{value}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button variant="cofound" onClick={() => setSubModal('edit')} className="w-full">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Informações
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Usuários */}
            <TabsContent value="users" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground">
                {companyUsers?.length || 0} usuário(s) vinculado(s)
              </div>

              {companyUsers && companyUsers.length > 0 ? (
                <div className="space-y-2">
                  {companyUsers.slice(0, 5).map((user: any) => (
                    <div 
                      key={user.user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <span className="font-medium">
                          {user.first_name} {user.last_name}
                        </span>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                  {companyUsers.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      + {companyUsers.length - 5} outros usuários
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum usuário vinculado
                </p>
              )}

              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSubModal('users')} 
                  className="w-full"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Configurações */}
            <TabsContent value="config" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Tipo de Empresa</p>
                    <p className="text-sm text-muted-foreground">
                      Define o tipo de funcionalidades disponíveis
                    </p>
                  </div>
                  <Badge variant="outline">
                    {displayCompany.company_type === 'startup' ? 'Startup' : 'Regular'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">AI Copilot</p>
                    <p className="text-sm text-muted-foreground">
                      Assistente de IA para usuários da empresa
                    </p>
                  </div>
                  <Badge variant={displayCompany.ai_enabled ? 'default' : 'secondary'}>
                    {displayCompany.ai_enabled ? 'Habilitado' : 'Desabilitado'}
                  </Badge>
                </div>
              </div>

              <div className="pt-4">
                <Button variant="cofound" onClick={() => setSubModal('edit')} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Editar Configurações
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Ações */}
            <TabsContent value="actions" className="space-y-3 mt-4">
              {/* Edit Company */}
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors" 
                onClick={() => setSubModal('edit')}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-cofound-blue-light" />
                    Editar Empresa
                  </CardTitle>
                  <CardDescription>
                    Atualizar informações e configurações da empresa
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Manage Users */}
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors" 
                onClick={() => setSubModal('users')}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-cofound-blue-light" />
                    Gerenciar Usuários
                  </CardTitle>
                  <CardDescription>
                    Adicionar ou remover usuários da empresa
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Status Toggle */}
              <Card 
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                  displayCompany.status === 'active' 
                    ? 'border-orange-500/50' 
                    : 'border-cofound-green/50'
                }`}
                onClick={() => setSubModal('status')}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Power className={`h-4 w-4 ${
                      displayCompany.status === 'active' ? 'text-orange-500' : 'text-cofound-green'
                    }`} />
                    {displayCompany.status === 'active' ? 'Desativar Empresa' : 'Reativar Empresa'}
                  </CardTitle>
                  <CardDescription>
                    {displayCompany.status === 'active'
                      ? 'Remove o acesso de todos os usuários temporariamente'
                      : 'Restaura o acesso para os usuários da empresa'
                    }
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Sub Modals */}
      {subModal === 'edit' && (
        <EditCompanyModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          company={displayCompany}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {subModal === 'users' && (
        <ManageCompanyUsersModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          company={displayCompany}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {subModal === 'status' && (
        <CompanyStatusModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          company={displayCompany}
          action={displayCompany.status === 'active' ? 'deactivate' : 'reactivate'}
          onSuccess={handleSubModalSuccess}
        />
      )}
    </>
  );
}
