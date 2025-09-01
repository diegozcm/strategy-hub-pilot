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

interface EditCompanyDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyUpdated: () => void;
}

const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({ 
  company, 
  open, 
  onOpenChange, 
  onCompanyUpdated 
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editedCompany, setEditedCompany] = useState<Company | null>(null);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (company) {
      setEditedCompany({ ...company });
    }
  }, [company]);

  const handleAddValue = () => {
    if (newValue.trim() && editedCompany) {
      setEditedCompany({
        ...editedCompany,
        values: [...(editedCompany.values || []), newValue.trim()]
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    if (editedCompany) {
      setEditedCompany({
        ...editedCompany,
        values: editedCompany.values?.filter((_, i) => i !== index)
      });
    }
  };

  const handleSaveCompany = async () => {
    if (!editedCompany || !currentUser) {
      console.log('DEBUG: Missing data', { editedCompany: !!editedCompany, currentUser: !!currentUser });
      return;
    }

    if (!editedCompany.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da empresa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    console.log('DEBUG: Tentando atualizar empresa', {
      companyId: editedCompany.id,
      newName: editedCompany.name.trim(),
      currentUserId: currentUser.id,
      userRole: currentUser.role
    });

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({
          name: editedCompany.name.trim(),
          mission: editedCompany.mission || null,
          vision: editedCompany.vision || null,
          values: editedCompany.values || null,
          status: editedCompany.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedCompany.id)
        .select();

      console.log('DEBUG: Resultado da atualização', { data, error });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Empresa atualizada com sucesso'
      });

      onCompanyUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar empresa',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!editedCompany) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Edite as informações da empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Nome da Empresa</Label>
            <Input
              id="name"
              value={editedCompany.name}
              onChange={(e) => setEditedCompany({ ...editedCompany, name: e.target.value })}
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-foreground">Status</Label>
            <Select
              value={editedCompany.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setEditedCompany({ ...editedCompany, status: value })
              }
            >
              <SelectTrigger className="bg-background border-input text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission" className="text-foreground">Missão</Label>
            <Textarea
              id="mission"
              value={editedCompany.mission || ''}
              onChange={(e) => setEditedCompany({ ...editedCompany, mission: e.target.value })}
              placeholder="Descrição da missão da empresa"
              rows={3}
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision" className="text-foreground">Visão</Label>
            <Textarea
              id="vision"
              value={editedCompany.vision || ''}
              onChange={(e) => setEditedCompany({ ...editedCompany, vision: e.target.value })}
              placeholder="Descrição da visão da empresa"
              rows={3}
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground">Valores</Label>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Adicionar novo valor"
                onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                className="bg-background border-input text-foreground"
              />
              <Button onClick={handleAddValue} size="sm">
                Adicionar
              </Button>
            </div>
            {editedCompany.values && editedCompany.values.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editedCompany.values.map((value, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {value}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => handleRemoveValue(index)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveCompany} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CompaniesPage: React.FC = () => {
  const { user, profile } = useAuth();
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
    return matchesSearch && matchesType;
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
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </div>

          {loading.overall ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground mt-2">
                {loading.companies ? 'Carregando empresas...' : loading.users ? 'Carregando usuários...' : 'Carregando dados...'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  users={companyUsers[company.id] || []}
                  onEdit={(company) => {
                    setSelectedCompany(company);
                    setIsEditDialogOpen(true);
                  }}
                  onToggleStatus={handleToggleStatus}
                  onManageUsers={setManagingUsers}
                  onDelete={setDeletingCompany}
                />
              ))}
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

        <EditCompanyDialog
          company={selectedCompany}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onCompanyUpdated={loadAllData}
        />

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