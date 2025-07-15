import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { Search, Building2, Users, Edit, Save, X, UserCheck, UserMinus, Power, PowerOff, Plus, UserPlus, Link2, Unlink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Company {
  id: string;
  name: string;
  owner_id: string;
  mission?: string;
  vision?: string;
  values?: string[];
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface CompanyUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive';
  company_id?: string;
}

export const CompaniesPage: React.FC = () => {
  const { canAdmin, user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<{ [key: string]: CompanyUser[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [managingUsers, setManagingUsers] = useState<Company | null>(null);
  const [availableUsers, setAvailableUsers] = useState<CompanyUser[]>([]);

  useEffect(() => {
    if (managingUsers) {
      fetchAvailableUsers();
    }
  }, [managingUsers]);

  useEffect(() => {
    if (canAdmin) {
      fetchCompanies();
    }
  }, [canAdmin]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      setCompanies((companiesData || []).map(company => ({
        ...company,
        status: company.status as 'active' | 'inactive'
      })));

      // Buscar usuários para cada empresa
      const usersPromises = (companiesData || []).map(async (company) => {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role, status, company_id')
          .eq('company_id', company.id)
          .order('first_name');

        if (error) {
          console.error(`Erro ao buscar usuários da empresa ${company.name}:`, error);
          return { companyId: company.id, users: [] };
        }

        return { companyId: company.id, users: users || [] };
      });

      const usersResults = await Promise.all(usersPromises);
      const usersMap = usersResults.reduce((acc, { companyId, users }) => {
        acc[companyId] = users.map(user => ({
          ...user,
          status: user.status as 'active' | 'inactive'
        }));
        return acc;
      }, {} as { [key: string]: CompanyUser[] });

      setCompanyUsers(usersMap);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar a lista de empresas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...companyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setCompanies([{...data, status: data.status as 'active' | 'inactive'}, ...companies]);
      setShowCreateForm(false);

      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar empresa.",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, status, company_id')
        .order('first_name');

      if (error) throw error;

      setAvailableUsers((users || []).map(user => ({
        ...user,
        status: user.status as 'active' | 'inactive'
      })));
    } catch (error) {
      console.error('Erro ao buscar usuários disponíveis:', error);
    }
  };

  const handleAssignUser = async (userId: string, companyId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc('assign_user_to_company', {
        _user_id: userId,
        _company_id: companyId,
        _admin_id: user.id
      });

      if (error) throw error;

      // Atualizar listas locais
      await fetchCompanies();
      await fetchAvailableUsers();

      toast({
        title: "Sucesso",
        description: "Usuário vinculado à empresa com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao vincular usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao vincular usuário à empresa.",
        variant: "destructive",
      });
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc('unassign_user_from_company', {
        _user_id: userId,
        _admin_id: user.id
      });

      if (error) throw error;

      // Atualizar listas locais
      await fetchCompanies();
      await fetchAvailableUsers();

      toast({
        title: "Sucesso",
        description: "Usuário desvinculado da empresa com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao desvincular usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao desvincular usuário da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCompany = async (company: Company) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: company.name,
          mission: company.mission,
          vision: company.vision,
          values: company.values,
          status: company.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      setCompanies(companies.map(c => c.id === company.id ? company : c));
      setEditingCompany(null);

      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa.",
        variant: "destructive",
      });
    }
  };

  const handleToggleCompanyStatus = async (companyId: string, currentStatus: string) => {
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

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as empresas do sistema e seus usuários
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas */}
      <div className="space-y-4">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa cadastrada.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              users={companyUsers[company.id] || []}
              onEdit={setEditingCompany}
          onToggleStatus={handleToggleCompanyStatus}
          onManageUsers={setManagingUsers}
            />
          ))
        )}
      </div>

      {/* Modal de Gerenciamento de Usuários */}
      {managingUsers && (
        <ManageUsersModal
          company={managingUsers}
          availableUsers={availableUsers}
          companyUsers={companyUsers[managingUsers.id] || []}
          onAssignUser={handleAssignUser}
          onUnassignUser={handleUnassignUser}
          onClose={() => {
            setManagingUsers(null);
            fetchAvailableUsers();
          }}
        />
      )}

      {/* Modal de Criação */}
      {showCreateForm && (
        <CreateCompanyModal
          onSave={handleCreateCompany}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Modal de Edição */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onSave={handleUpdateCompany}
          onCancel={() => setEditingCompany(null)}
        />
      )}
    </div>
  );
};

interface CompanyCardProps {
  company: Company;
  users: CompanyUser[];
  onEdit: (company: Company) => void;
  onToggleStatus: (companyId: string, currentStatus: string) => void;
  onManageUsers: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ 
  company, 
  users, 
  onEdit, 
  onToggleStatus,
  onManageUsers
}) => {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalUsers = users.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{company.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {activeUsers}/{totalUsers} usuários ativos
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={company.status === 'active' ? 'default' : 'destructive'}>
              {company.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleStatus(company.id, company.status)}
            >
              {company.status === 'active' ? (
                <>
                  <PowerOff className="w-4 h-4 mr-1" />
                  Desativar
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-1" />
                  Ativar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(company)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="users" onClick={() => onManageUsers(company)}>
              Usuários ({totalUsers})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            {company.mission && (
              <div>
                <h4 className="font-semibold mb-1">Missão</h4>
                <p className="text-sm text-muted-foreground">{company.mission}</p>
              </div>
            )}
            {company.vision && (
              <div>
                <h4 className="font-semibold mb-1">Visão</h4>
                <p className="text-sm text-muted-foreground">{company.vision}</p>
              </div>
            )}
            {company.values && company.values.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Valores</h4>
                <div className="flex flex-wrap gap-1">
                  {company.values.map((value, index) => (
                    <Badge key={index} variant="secondary">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="users" className="space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário vinculado a esta empresa.
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {user.status === 'active' ? (
                        <UserCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <UserMinus className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface EditCompanyModalProps {
  company: Company;
  onSave: (company: Company) => void;
  onCancel: () => void;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  company,
  onSave,
  onCancel
}) => {
  const [editedCompany, setEditedCompany] = useState<Company>({ ...company });
  const [newValue, setNewValue] = useState('');

  const handleAddValue = () => {
    if (newValue.trim()) {
      setEditedCompany({
        ...editedCompany,
        values: [...(editedCompany.values || []), newValue.trim()]
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setEditedCompany({
      ...editedCompany,
      values: editedCompany.values?.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Edite as informações da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input
              id="name"
              value={editedCompany.name}
              onChange={(e) => setEditedCompany({ ...editedCompany, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={editedCompany.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setEditedCompany({ ...editedCompany, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mission">Missão</Label>
            <Textarea
              id="mission"
              value={editedCompany.mission || ''}
              onChange={(e) => setEditedCompany({ ...editedCompany, mission: e.target.value })}
              placeholder="Descrição da missão da empresa"
            />
          </div>

          <div>
            <Label htmlFor="vision">Visão</Label>
            <Textarea
              id="vision"
              value={editedCompany.vision || ''}
              onChange={(e) => setEditedCompany({ ...editedCompany, vision: e.target.value })}
              placeholder="Descrição da visão da empresa"
            />
          </div>

          <div>
            <Label>Valores</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Adicionar novo valor"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                />
                <Button onClick={handleAddValue} size="sm">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editedCompany.values?.map((value, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {value}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => handleRemoveValue(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(editedCompany)}>
            <Save className="w-4 h-4 mr-1" />
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface CreateCompanyModalProps {
  onSave: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  onSave,
  onCancel
}) => {
  const { user } = useAuth();
  const [newCompany, setNewCompany] = useState<Omit<Company, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    owner_id: user?.id || '',
    mission: '',
    vision: '',
    values: [],
    status: 'active'
  });
  const [newValue, setNewValue] = useState('');

  const handleAddValue = () => {
    if (newValue.trim()) {
      setNewCompany({
        ...newCompany,
        values: [...(newCompany.values || []), newValue.trim()]
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setNewCompany({
      ...newCompany,
      values: newCompany.values?.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
          <DialogDescription>
            Crie uma nova empresa no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
              placeholder="Digite o nome da empresa"
            />
          </div>

          <div>
            <Label htmlFor="mission">Missão</Label>
            <Textarea
              id="mission"
              value={newCompany.mission || ''}
              onChange={(e) => setNewCompany({ ...newCompany, mission: e.target.value })}
              placeholder="Descrição da missão da empresa"
            />
          </div>

          <div>
            <Label htmlFor="vision">Visão</Label>
            <Textarea
              id="vision"
              value={newCompany.vision || ''}
              onChange={(e) => setNewCompany({ ...newCompany, vision: e.target.value })}
              placeholder="Descrição da visão da empresa"
            />
          </div>

          <div>
            <Label>Valores</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Adicionar novo valor"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                />
                <Button onClick={handleAddValue} size="sm">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newCompany.values?.map((value, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {value}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => handleRemoveValue(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onSave(newCompany)}
            disabled={!newCompany.name.trim()}
          >
            <Save className="w-4 h-4 mr-1" />
            Criar Empresa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ManageUsersModalProps {
  company: Company;
  availableUsers: CompanyUser[];
  companyUsers: CompanyUser[];
  onAssignUser: (userId: string, companyId: string) => void;
  onUnassignUser: (userId: string) => void;
  onClose: () => void;
}

const ManageUsersModal: React.FC<ManageUsersModalProps> = ({
  company,
  availableUsers,
  companyUsers,
  onAssignUser,
  onUnassignUser,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const unassignedUsers = availableUsers.filter(user => 
    !user.company_id || user.company_id !== company.id
  );
  
  const filteredUnassigned = unassignedUsers.filter(user =>
    `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuários - {company.name}</DialogTitle>
          <DialogDescription>
            Vincule ou desvincule usuários desta empresa.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="assigned" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned">Usuários da Empresa ({companyUsers.length})</TabsTrigger>
            <TabsTrigger value="available">Usuários Disponíveis ({filteredUnassigned.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="space-y-4 max-h-96 overflow-y-auto">
            {companyUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário vinculado a esta empresa.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {companyUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUnassignUser(user.id)}
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        Desvincular
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="available" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredUnassigned.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchTerm ? 'Nenhum usuário encontrado.' : 'Todos os usuários já estão vinculados a empresas.'}
                  </p>
                </div>
              ) : (
                filteredUnassigned.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserMinus className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.company_id && (
                          <p className="text-xs text-blue-600">Vinculado a outra empresa</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => onAssignUser(user.id, company.id)}
                        disabled={user.status === 'inactive'}
                      >
                        <Link2 className="w-4 h-4 mr-1" />
                        Vincular
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};