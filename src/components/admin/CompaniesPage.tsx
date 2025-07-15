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
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white text-base">{company.name}</CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                {activeUsers}/{totalUsers} usuários ativos
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
              {company.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                <DropdownMenuItem onClick={() => onEdit(company)} className="hover:bg-slate-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageUsers(company)} className="hover:bg-slate-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Gerenciar Usuários
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-600" />
                <DropdownMenuItem 
                  onClick={() => onToggleStatus(company.id, company.status)}
                  className="hover:bg-slate-700"
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
                    <DropdownMenuSeparator className="bg-slate-600" />
                    <DropdownMenuItem 
                      onClick={() => onDelete(company)}
                      className="hover:bg-red-900/50 text-red-400"
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
              <p className="text-xs text-slate-500 font-medium">Missão</p>
              <p className="text-sm text-slate-300 line-clamp-2">{company.mission}</p>
            </div>
          )}
          
          {users.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">Usuários Recentes</p>
              <div className="space-y-1">
                {users.slice(0, 3).map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate">
                      {user.first_name} {user.last_name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                ))}
                {users.length > 3 && (
                  <p className="text-xs text-slate-500">
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
    if (!editedCompany || !currentUser) return;

    if (!editedCompany.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da empresa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: editedCompany.name.trim(),
          mission: editedCompany.mission || null,
          vision: editedCompany.vision || null,
          values: editedCompany.values || null,
          status: editedCompany.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedCompany.id);

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription className="text-slate-400">
            Edite as informações da empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Nome da Empresa</Label>
            <Input
              id="name"
              value={editedCompany.name}
              onChange={(e) => setEditedCompany({ ...editedCompany, name: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-white">Status</Label>
            <Select
              value={editedCompany.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setEditedCompany({ ...editedCompany, status: value })
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission" className="text-white">Missão</Label>
            <Textarea
              id="mission"
              value={editedCompany.mission || ''}
              onChange={(e) => setEditedCompany({ ...editedCompany, mission: e.target.value })}
              placeholder="Descrição da missão da empresa"
              rows={3}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision" className="text-white">Visão</Label>
            <Textarea
              id="vision"
              value={editedCompany.vision || ''}
              onChange={(e) => setEditedCompany({ ...editedCompany, vision: e.target.value })}
              placeholder="Descrição da visão da empresa"
              rows={3}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-white">Valores</Label>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Adicionar novo valor"
                onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                className="bg-slate-700 border-slate-600 text-white"
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

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-600">
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<{ [key: string]: CompanyUser[] }>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [managingUsers, setManagingUsers] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      const companiesTyped = (companiesData || []).map(company => ({
        ...company,
        status: company.status as 'active' | 'inactive'
      })) as Company[];

      setCompanies(companiesTyped);

      // Buscar usuários para cada empresa
      const usersPromises = companiesTyped.map(async (company) => {
        const { data: relations, error } = await supabase
          .from('user_company_relations')
          .select('user_id, role')
          .eq('company_id', company.id);

        if (error || !relations || relations.length === 0) {
          return { companyId: company.id, users: [] };
        }

        const userIds = relations.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, id, first_name, last_name, email, status')
          .in('user_id', userIds);

        if (profilesError) {
          return { companyId: company.id, users: [] };
        }

        const users = relations.map(relation => {
          const profile = profiles?.find(p => p.user_id === relation.user_id);
          return {
            user_id: relation.user_id,
            id: profile?.id || '',
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            email: profile?.email,
            role: relation.role as 'admin' | 'manager' | 'member',
            status: profile?.status as 'active' | 'inactive'
          };
        }).filter(user => user.id);

        return { companyId: company.id, users };
      });

      const usersResults = await Promise.all(usersPromises);
      const usersMap = usersResults.reduce((acc, { companyId, users }) => {
        acc[companyId] = users;
        return acc;
      }, {} as { [key: string]: CompanyUser[] });

      setCompanyUsers(usersMap);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

      setCompanies(companies.map(c => 
        c.id === companyId ? { ...c, status: newStatus as 'active' | 'inactive' } : c
      ));

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
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      setCompanies(companies.filter(c => c.id !== companyId));
      setDeletingCompany(null);

      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa.",
        variant: "destructive",
      });
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
            <p className="text-slate-400">Você não tem permissão para acessar esta funcionalidade.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Building2 className="h-5 w-5" />
          <span>Gerenciar Empresas</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Administre empresas e suas relações com usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome da empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
            <Button onClick={loadData} variant="outline">
              Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
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

          {!loading && filteredCompanies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
              </h3>
              <p className="text-slate-400">
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
          onCompanyUpdated={loadData}
        />

        {/* TODO: Implementar modais de criação, gestão de usuários e exclusão */}
      </CardContent>
    </Card>
  );
};