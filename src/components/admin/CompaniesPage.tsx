import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { Search, Building2, Plus } from 'lucide-react';
import { CompanyGrid } from './companies/CompanyGrid';
import { CreateCompanyModal } from './companies/CreateCompanyModal';
import { EditCompanyModal } from './companies/EditCompanyModal';
import { ManageUsersModal } from './companies/ManageUsersModal';
import { DeleteCompanyModal } from './companies/DeleteCompanyModal';
import { Company, CompanyUser } from '@/types/admin';

export const CompaniesPage: React.FC = () => {
  const { canAdmin, user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<{ [key: string]: CompanyUser[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [managingUsers, setManagingUsers] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
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

      // Buscar usuários para cada empresa usando a nova tabela de relacionamentos
      const usersPromises = (companiesData || []).map(async (company) => {
        const { data: relations, error } = await supabase
          .from('user_company_relations')
          .select('user_id, role')
          .eq('company_id', company.id);

        if (error) {
          console.error(`Erro ao buscar usuários da empresa ${company.name}:`, error);
          return { companyId: company.id, users: [] };
        }

        if (!relations || relations.length === 0) {
          return { companyId: company.id, users: [] };
        }

        // Buscar dados dos perfis dos usuários
        const userIds = relations.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, id, first_name, last_name, email, status')
          .in('user_id', userIds);

        if (profilesError) {
          console.error(`Erro ao buscar perfis da empresa ${company.name}:`, profilesError);
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
        }).filter(user => user.id); // Remove users sem perfil válido

        return { companyId: company.id, users };
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
        .select('id, user_id, first_name, last_name, email, role, status')
        .order('first_name');

      if (error) throw error;

      setAvailableUsers((users || []).map(user => ({
        user_id: user.user_id,
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role as 'admin' | 'manager' | 'member',
        status: user.status as 'active' | 'inactive'
      })));
    } catch (error) {
      console.error('Erro ao buscar usuários disponíveis:', error);
    }
  };

  const handleAssignUser = async (userId: string, companyId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc('assign_user_to_company_v2', {
        _user_id: userId,
        _company_id: companyId,
        _admin_id: user.id,
        _role: 'member'
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

  const handleUnassignUser = async (userId: string, companyId?: string) => {
    if (!user?.id) return;

    if (!companyId && managingUsers) {
      companyId = managingUsers.id;
    }

    if (!companyId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('unassign_user_from_company_v2', {
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
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gerenciar Empresas</h1>
              <p className="text-muted-foreground mt-2">
                Administre empresas e suas relações com usuários
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </div>
          
          <div className="mt-6">
            <div className="relative max-w-md">
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
      </div>

      <div className="container max-w-7xl mx-auto px-6 py-8">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente ajustar sua pesquisa para encontrar empresas.' 
                  : 'Comece criando sua primeira empresa no sistema.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Empresa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <CompanyGrid
            companies={filteredCompanies}
            companyUsers={companyUsers}
            onEdit={setEditingCompany}
            onToggleStatus={handleToggleCompanyStatus}
            onManageUsers={setManagingUsers}
            onDelete={setDeletingCompany}
          />
        )}
      </div>

      {/* Modals */}
      {managingUsers && (
        <ManageUsersModal
          company={managingUsers}
          availableUsers={availableUsers}
          companyUsers={companyUsers[managingUsers.id] || []}
          onAssignUser={handleAssignUser}
          onUnassignUser={(userId, companyId) => handleUnassignUser(userId, companyId)}
          onClose={() => {
            setManagingUsers(null);
            fetchAvailableUsers();
          }}
        />
      )}

      {showCreateForm && (
        <CreateCompanyModal
          onSave={handleCreateCompany}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onSave={handleUpdateCompany}
          onCancel={() => setEditingCompany(null)}
        />
      )}

      <DeleteCompanyModal
        company={deletingCompany}
        open={!!deletingCompany}
        onClose={() => setDeletingCompany(null)}
        onConfirm={handleDeleteCompany}
      />
    </div>
  );
};
