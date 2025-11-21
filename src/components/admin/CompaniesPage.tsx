import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Edit, 
  Search, 
  Shield, 
  Users, 
  Crown,
  Plus,
  Trash2,
  Save,
  Power,
  PowerOff,
  UserPlus,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Company, CompanyUser } from '@/types/admin';
import { ManageUsersModal } from './companies/ManageUsersModal';
import { CreateCompanyModal } from './companies/CreateCompanyModal';
import { EditCompanyModal } from './companies/EditCompanyModal';
import { useCompanyDataLoader } from '@/hooks/useCompanyDataLoader';

interface CompanyCardProps {
  company: Company;
  users: CompanyUser[];
  onEdit: (company: Company) => void;
  onToggleStatus: (companyId: string, currentStatus: string) => void;
  onManageUsers: (company: Company) => void;
  onDelete: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ 
  company, 
  users, 
  onEdit, 
  onToggleStatus,
  onManageUsers,
  onDelete
}) => {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalUsers = users.length;
  const canDelete = totalUsers === 0;

  return (
    <Card className="hover:shadow-md transition-shadow border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground text-base">{company.name}</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                {activeUsers}/{totalUsers} usuários ativos
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={company.company_type === 'startup' ? 'outline' : 'secondary'}
              className={company.company_type === 'startup' ? 'border-orange-500 text-orange-500' : ''}
            >
              {company.company_type === 'startup' ? 'Startup' : 'Empresa'}
            </Badge>
            <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
              {company.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
            {company.ai_enabled && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                IA
              </Badge>
            )}
            {company.okr_enabled && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                OKR
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                <DropdownMenuItem onClick={() => onEdit(company)} className="hover:bg-accent">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageUsers(company)} className="hover:bg-accent">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Gerenciar Usuários
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={() => onToggleStatus(company.id, company.status)}
                  className="hover:bg-accent"
                >
                  {company.status === 'active' ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-2" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem 
                      onClick={() => onDelete(company)}
                      className="hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {company.mission && (
            <div>
              <p className="text-xs text-muted-foreground font-medium">Missão</p>
              <p className="text-sm text-foreground line-clamp-2">{company.mission}</p>
            </div>
          )}
          
          {users.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Usuários Recentes</p>
              <div className="space-y-1">
                {users.slice(0, 3).map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground truncate">
                      {user.first_name} {user.last_name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                ))}
                {users.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{users.length - 3} usuários
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


export const CompaniesPage: React.FC = () => {
  const { user, profile, company: currentCompany, switchCompany } = useAuth();
  const { toast } = useToast();
  // Usar o hook customizado para carregamento de dados
  const {
    companies,
    companyUsers,
    loading,
    errors,
    loadAllData,
    reloadUsers,
    clearErrors,
    hasErrors
  } = useCompanyDataLoader();
  const [searchTerm, setSearchTerm] = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState<'all' | 'regular' | 'startup'>('all');
  const [moduleFilter, setModuleFilter] = useState<'all' | 'ai_enabled' | 'okr_enabled' | 'no_modules'>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [managingUsers, setManagingUsers] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin, loadAllData]);

  const handleToggleStatus = async (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      if (error) throw error;

      // Recarregar dados para garantir sincronização
      await loadAllData();

      toast({
        title: "Sucesso",
        description: `Empresa ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      // Primeiro verificar se a empresa pode ser excluída
      const { data: canDelete, error: checkError } = await supabase
        .rpc('can_delete_company', { _company_id: companyId });

      if (checkError) throw checkError;

      if (!canDelete) {
        toast({
          title: "Erro",
          description: "Não é possível excluir esta empresa pois ainda possui usuários ativos associados.",
          variant: "destructive",
        });
        return;
      }

      // Proceder com a exclusão (CASCADE removerá todos os dados relacionados)
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      setDeletingCompany(null);

      toast({
        title: "Sucesso",
        description: "Empresa e todos os seus dados foram excluídos com sucesso.",
      });

      // Recarregar dados para garantir sincronização
      await loadAllData();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir empresa.",
        variant: "destructive",
      });
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = companyTypeFilter === 'all' || company.company_type === companyTypeFilter;
    
    let matchesModule = true;
    if (moduleFilter === 'ai_enabled') {
      matchesModule = company.ai_enabled === true;
    } else if (moduleFilter === 'okr_enabled') {
      matchesModule = company.okr_enabled === true;
    } else if (moduleFilter === 'no_modules') {
      matchesModule = !company.ai_enabled && !company.okr_enabled;
    }
    
    return matchesSearch && matchesType && matchesModule;
  });

  if (!isAdmin) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-center text-foreground">
            <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta funcionalidade.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Building2 className="h-5 w-5" />
          <span>Gerenciar Empresas</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Administre empresas e suas relações com usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome da empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-input text-foreground"
                />
              </div>
              <Select
                value={companyTypeFilter}
                onValueChange={(value: 'all' | 'regular' | 'startup') => setCompanyTypeFilter(value)}
              >
                <SelectTrigger className="w-48 bg-background border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="regular">Empresas Regulares</SelectItem>
                  <SelectItem value="startup">Startups</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={moduleFilter}
                onValueChange={(value: 'all' | 'ai_enabled' | 'okr_enabled' | 'no_modules') => setModuleFilter(value)}
              >
                <SelectTrigger className="w-48 bg-background border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="all">Todos os Módulos</SelectItem>
                  <SelectItem value="ai_enabled">Com IA</SelectItem>
                  <SelectItem value="okr_enabled">Com OKR</SelectItem>
                  <SelectItem value="no_modules">Sem Módulos</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
            </div>
          </div>

          {loading.overall ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground mt-2">
                {loading.companies ? 'Carregando empresas...' : loading.users ? 'Carregando usuários...' : 'Carregando dados...'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Empresa</TableHead>
                    <TableHead className="text-foreground">Tipo</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Usuários</TableHead>
                    <TableHead className="text-foreground">Missão</TableHead>
                    <TableHead className="text-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const users = companyUsers[company.id] || [];
                    const activeUsers = users.filter(u => u.status === 'active').length;
                    const totalUsers = users.length;
                    const canDelete = totalUsers === 0;

                    return (
                      <TableRow key={company.id} className="border-border hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{company.name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {company.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={company.company_type === 'startup' ? 'outline' : 'secondary'}
                            className={company.company_type === 'startup' ? 'border-orange-500 text-orange-500' : ''}
                          >
                            {company.company_type === 'startup' ? 'Startup' : 'Empresa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                              {company.status === 'active' ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {company.ai_enabled && (
                                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                                  IA
                                </Badge>
                              )}
                              {company.okr_enabled && (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                  OKR
                                </Badge>
                              )}
                              {!company.ai_enabled && !company.okr_enabled && (
                                <span className="text-xs text-muted-foreground">Sem módulos</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{activeUsers}/{totalUsers}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {company.mission ? (
                              <p className="text-sm text-foreground truncate" title={company.mission}>
                                {company.mission}
                              </p>
                            ) : (
                              <span className="text-muted-foreground text-sm">Não definida</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                              <DropdownMenuItem onClick={() => {
                                setSelectedCompany(company);
                                setIsEditDialogOpen(true);
                              }} className="hover:bg-accent">
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setManagingUsers(company)} className="hover:bg-accent">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Gerenciar Usuários
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(company.id, company.status)}
                                className="hover:bg-accent"
                              >
                                {company.status === 'active' ? (
                                  <>
                                    <PowerOff className="w-4 h-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <Power className="w-4 h-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator className="bg-border" />
                                  <DropdownMenuItem 
                                    onClick={() => setDeletingCompany(company)}
                                    className="hover:bg-destructive/10 text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Banner de aviso para erros não críticos */}
          {hasErrors && !loading.overall && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Alguns dados podem estar incompletos
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    {errors.users && "Erro ao carregar usuários das empresas. "}
                    <button 
                      onClick={reloadUsers}
                      className="underline hover:no-underline"
                    >
                      Tentar recarregar
                    </button>
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearErrors}
                  className="text-orange-600 hover:text-orange-800"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {!loading.overall && filteredCompanies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Nenhuma empresa cadastrada no sistema.'
                }
              </p>
            </div>
          )}
        </div>

        {selectedCompany && isEditDialogOpen && (
          <EditCompanyModal
            company={selectedCompany}
            onSave={async (editedCompany) => {
              setIsEditDialogOpen(false);
              
              // Recarregar lista de empresas
              await loadAllData();
              
              // Se a empresa editada for a atual do contexto, forçar reload
              if (currentCompany?.id === editedCompany.id && switchCompany) {
                console.log('🔄 Reloading current company context after edit');
                await switchCompany(editedCompany.id);
              }
            }}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        )}

        {/* Modal de criação de empresa */}
        <CreateCompanyModal
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onCompanyCreated={loadAllData}
        />

        {/* Modal de gestão de usuários */}
        {managingUsers && (
          <ManageUsersModal
            company={managingUsers}
            isOpen={!!managingUsers}
            onOpenChange={(open) => !open && setManagingUsers(null)}
            onUpdated={loadAllData}
          />
        )}

        {/* Modal de confirmação de exclusão */}
        <AlertDialog open={!!deletingCompany} onOpenChange={(open) => !open && setDeletingCompany(null)}>
          <AlertDialogContent className="bg-card border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tem certeza que deseja excluir a empresa "{deletingCompany?.name}"? 
                Esta ação não pode ser desfeita e todos os dados associados à empresa serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingCompany(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deletingCompany && handleDeleteCompany(deletingCompany.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
