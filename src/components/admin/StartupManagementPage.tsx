import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Plus, 
  Search, 
  Users, 
  Building2,
  Eye,
  Settings,
  TrendingUp,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CreateCompanyModal } from './companies/CreateCompanyModal';
import { StartupUsersModal } from './companies/StartupUsersModal';
import { Company } from '@/types/admin';

interface StartupData {
  id: string;
  name: string;
  owner_id: string;
  mission?: string | null;
  vision?: string | null;
  values?: string[] | null;
  logo_url?: string | null;
  status: string;
  company_type: string;
  created_at: string;
  updated_at: string;
  user_count: number;
  active_users: number;
  beep_assessments_count: number;
  last_assessment_date?: string;
}

export const StartupManagementPage: React.FC = () => {
  const { user, isSystemAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [startups, setStartups] = useState<StartupData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageUsersModalOpen, setManageUsersModalOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<Company | null>(null);

  useEffect(() => {
    if (isSystemAdmin) {
      loadStartups();
    }
  }, [isSystemAdmin]);

  const loadStartups = async () => {
    setLoading(true);
    try {
      // Buscar empresas do tipo startup
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('company_type', 'startup')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      if (!companies) {
        setStartups([]);
        return;
      }

      // Para cada startup, buscar estatísticas
      const startupsWithStats = await Promise.all(
        companies.map(async (company) => {
          // Contar usuários da empresa
          const { data: userRelations, error: userRelationsError } = await supabase
            .from('user_company_relations')
            .select('user_id')
            .eq('company_id', company.id);

          if (userRelationsError) {
            console.warn('Erro ao buscar relações de usuários:', userRelationsError);
          }

          const userIds = userRelations?.map(r => r.user_id) || [];
          
          // Contar usuários ativos
          let activeUsersCount = 0;
          if (userIds.length > 0) {
            const { data: activeUsers, error: activeUsersError } = await supabase
              .from('profiles')
              .select('user_id')
              .in('user_id', userIds)
              .eq('status', 'active');

            if (activeUsersError) {
              console.warn('Erro ao buscar usuários ativos:', activeUsersError);
            } else {
              activeUsersCount = activeUsers?.length || 0;
            }
          }

          // Contar avaliações BEEP da empresa
          let beepCount = 0;
          let lastAssessmentDate: string | undefined;
          if (userIds.length > 0) {
            const { data: beepAssessments, error: beepError } = await supabase
              .from('beep_assessments')
              .select('id, created_at')
              .in('user_id', userIds)
              .order('created_at', { ascending: false });

            if (beepError) {
              console.warn('Erro ao buscar avaliações BEEP:', beepError);
            } else {
              beepCount = beepAssessments?.length || 0;
              lastAssessmentDate = beepAssessments?.[0]?.created_at;
            }
          }

          return {
            ...company,
            user_count: userIds.length,
            active_users: activeUsersCount,
            beep_assessments_count: beepCount,
            last_assessment_date: lastAssessmentDate
          };
        })
      );

      setStartups(startupsWithStats);
    } catch (error) {
      console.error('Erro ao carregar startups:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de startups',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStartups = startups.filter(startup =>
    startup.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateStartup = () => {
    setCreateModalOpen(true);
  };

  const handleManageUsers = (startup: StartupData) => {
    // Converter StartupData para Company
    const companyData: Company = {
      id: startup.id,
      name: startup.name,
      owner_id: startup.owner_id,
      mission: startup.mission,
      vision: startup.vision,
      values: startup.values,
      logo_url: startup.logo_url,
      status: startup.status as 'active' | 'inactive',
      company_type: startup.company_type as 'regular' | 'startup',
      created_at: startup.created_at,
      updated_at: startup.updated_at
    };
    setSelectedStartup(companyData);
    setManageUsersModalOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status === 'active' ? 'Ativa' : 'Inativa'}
      </Badge>
    );
  };

  if (!isSystemAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Rocket className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Acesso Restrito
          </h2>
          <p className="text-slate-400">
            Apenas administradores do sistema podem acessar a gestão de startups.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rocket className="h-6 w-6 text-blue-400" />
            Gestão de Startups
          </h1>
          <p className="text-slate-400">
            Gerencie startups, usuários e perfis do Startup HUB
          </p>
        </div>
        <Button onClick={handleCreateStartup} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Startup
        </Button>
      </div>

      {/* Resumo das estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total de Startups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {startups.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Startups Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {startups.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {startups.reduce((total, startup) => total + startup.user_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Avaliações BEEP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {startups.reduce((total, startup) => total + startup.beep_assessments_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Buscar startups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de startups */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            Startups ({filteredStartups.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Lista de todas as startups cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredStartups.length === 0 ? (
            <div className="text-center py-8">
              <Rocket className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm ? 'Nenhuma startup encontrada' : 'Nenhuma startup cadastrada'}
              </h3>
              <p className="text-slate-400 mb-4">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando sua primeira startup.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateStartup} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Startup
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-600">
                  <TableHead className="text-slate-300">Nome</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Usuários</TableHead>
                  <TableHead className="text-slate-300">Usuários Ativos</TableHead>
                  <TableHead className="text-slate-300">Avaliações BEEP</TableHead>
                  <TableHead className="text-slate-300">Última Avaliação</TableHead>
                  <TableHead className="text-slate-300">Criada em</TableHead>
                  <TableHead className="text-slate-300 w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStartups.map((startup) => (
                  <TableRow key={startup.id} className="border-slate-600">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-400" />
                        <div>
                          <div className="font-medium text-white">{startup.name}</div>
                          {startup.mission && (
                            <div className="text-sm text-slate-400 truncate max-w-xs">
                              {startup.mission}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(startup.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-300">
                        <Users className="h-4 w-4" />
                        {startup.user_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-400">
                        <User className="h-4 w-4" />
                        {startup.active_users}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-purple-400">
                        <TrendingUp className="h-4 w-4" />
                        {startup.beep_assessments_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDate(startup.last_assessment_date)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDate(startup.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageUsers(startup)}
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <CreateCompanyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCompanyCreated={loadStartups}
      />

      <StartupUsersModal
        company={selectedStartup}
        isOpen={manageUsersModalOpen}
        onOpenChange={setManageUsersModalOpen}
        onUpdated={loadStartups}
      />
    </div>
  );
};