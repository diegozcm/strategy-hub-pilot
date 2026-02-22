import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditCompanyModal } from "./EditCompanyModal";
import { ManageCompanyUsersModal } from "./ManageCompanyUsersModal";
import { ExportCompanyDataCard } from "./ExportCompanyDataCard";
import { ImportCompanyDataCard } from "./ImportCompanyDataCard";
import { ImportCompanyDataModal } from "./ImportCompanyDataModal";
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
  Bot,
  Info,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

type SubModalType = 'edit' | 'users' | 'status' | 'import' | null;
type SectionType = 'info' | 'users' | 'config' | 'actions';

const sidebarItems: { key: SectionType; label: string; icon: React.ElementType }[] = [
  { key: 'info', label: 'Informações', icon: Info },
  { key: 'users', label: 'Usuários', icon: Users },
  { key: 'config', label: 'Configurações', icon: Settings },
  { key: 'actions', label: 'Ações', icon: Zap },
];

export function CompanyDetailsModal({ 
  open, 
  onOpenChange, 
  company,
  onSuccess 
}: CompanyDetailsModalProps) {
  const [subModal, setSubModal] = useState<SubModalType>(null);
  const [activeSection, setActiveSection] = useState<SectionType>('info');

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
      return { ...data, userCount: company.userCount || 0 };
    },
    enabled: open && !!company,
  });

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
        <DialogContent className="sm:max-w-4xl p-0 gap-0 max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 p-6 pb-4 border-b">
            <Avatar className="h-14 w-14">
              <AvatarImage src={displayCompany.logo_url || undefined} alt={displayCompany.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {displayCompany.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{displayCompany.name}</h2>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant={displayCompany.status === 'active' ? 'default' : 'secondary'}>
                  {displayCompany.status === 'active' ? 'Ativa' : 'Inativa'}
                </Badge>
                <Badge variant="outline">
                  <Building2 className="h-3 w-3 mr-1" />
                  {displayCompany.company_type === 'startup' ? 'Startup' : 'Regular'}
                </Badge>
                {displayCompany.ai_enabled && (
                  <Badge variant="outline" className="border-violet-500 text-violet-600">
                    <Bot className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Body: Sidebar + Content */}
          <div className="flex min-h-[400px] max-h-[calc(85vh-100px)]">
            {/* Sidebar */}
            <div className="w-[180px] border-r bg-muted/30 p-3 flex flex-col gap-1 shrink-0">
              {sidebarItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left w-full",
                    activeSection === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {activeSection === 'info' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <p className="font-medium">{displayCompany.company_type === 'startup' ? 'Startup' : 'Regular'}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Criada em</p>
                            <p className="font-medium">{formatDate(displayCompany.created_at)}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Usuários</p>
                            <p className="font-medium">{displayCompany.userCount || 0}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                            <Bot className="h-5 w-5 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">AI Copilot</p>
                            <p className="font-medium">{displayCompany.ai_enabled ? 'Habilitado' : 'Desabilitado'}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {(fullCompany?.mission || fullCompany?.vision) && (
                      <>
                        <Separator />
                        <div className="space-y-4">
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
                      </>
                    )}

                    {fullCompany?.values && fullCompany.values.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Valores</p>
                          <div className="flex flex-wrap gap-2">
                            {fullCompany.values.map((value, i) => (
                              <Badge key={i} variant="secondary">{value}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeSection === 'users' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{companyUsers?.length || 0} usuário(s) vinculado(s)</h3>
                      <Button variant="outline" size="sm" onClick={() => setSubModal('users')}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                    </div>

                    {companyUsers && companyUsers.length > 0 ? (
                      <div className="space-y-2">
                        {companyUsers.map((user: any) => (
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
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum usuário vinculado
                      </p>
                    )}
                  </div>
                )}

                {activeSection === 'config' && (
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

                    <div className="pt-4">
                      <Button variant="cofound" onClick={() => setSubModal('edit')} className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Editar Configurações
                      </Button>
                    </div>
                  </div>
                )}

                {activeSection === 'actions' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSubModal('edit')}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Pencil className="h-4 w-4 text-primary" />
                          Editar Empresa
                        </CardTitle>
                        <CardDescription className="text-xs">Atualizar informações e configurações</CardDescription>
                      </CardHeader>
                    </Card>

                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSubModal('users')}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-primary" />
                          Gerenciar Usuários
                        </CardTitle>
                        <CardDescription className="text-xs">Adicionar ou remover usuários</CardDescription>
                      </CardHeader>
                    </Card>

                    <Card 
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        displayCompany.status === 'active' ? 'border-orange-500/50' : 'border-green-500/50'
                      )}
                      onClick={() => setSubModal('status')}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Power className={cn("h-4 w-4", displayCompany.status === 'active' ? 'text-orange-500' : 'text-green-500')} />
                          {displayCompany.status === 'active' ? 'Desativar' : 'Reativar'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {displayCompany.status === 'active' ? 'Remove acesso temporariamente' : 'Restaura o acesso'}
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <ImportCompanyDataCard onClick={() => setSubModal('import')} />

                    <div className="col-span-2">
                      <ExportCompanyDataCard
                        companyId={displayCompany.id}
                        companyName={displayCompany.name}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

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
      {subModal === 'import' && (
        <ImportCompanyDataModal
          open={true}
          onOpenChange={() => setSubModal(null)}
          companyId={displayCompany.id}
          companyName={displayCompany.name}
          onSuccess={handleSubModalSuccess}
        />
      )}
    </>
  );
}
