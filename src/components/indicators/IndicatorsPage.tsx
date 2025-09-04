import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditKeyResultModal } from '@/components/strategic-map/EditKeyResultModal';
import { CreateKeyResultModal } from './CreateKeyResultModal';
import { KeyResultsTable } from './KeyResultsTable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const IndicatorsPage: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [keyResultToDelete, setKeyResultToDelete] = useState<KeyResult | null>(null);

  // Load data function
  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: userCompany } = await supabase
        .from('user_company_relations')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!userCompany) {
        setLoading(false);
        return;
      }

      // Get strategic plans for the company
      const { data: plans } = await supabase
        .from('strategic_plans')
        .select('*')
        .eq('company_id', userCompany.company_id);

      if (!plans || plans.length === 0) {
        setLoading(false);
        return;
      }

      // Get objectives for the plans
      const planIds = plans.map(plan => plan.id);
      const { data: objectivesData, error: objectivesError } = await supabase
        .from('strategic_objectives')
        .select('*')
        .in('plan_id', planIds);

      if (objectivesError) throw objectivesError;
      setObjectives(objectivesData || []);

      // Get key results for the objectives
      const objectiveIds = objectivesData?.map(obj => obj.id) || [];
      if (objectiveIds.length > 0) {
        const { data: keyResultsData, error: keyResultsError } = await supabase
          .from('key_results')
          .select('*')
          .in('objective_id', objectiveIds)
          .order('created_at', { ascending: false });

        if (keyResultsError) throw keyResultsError;
        setKeyResults(keyResultsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create key result handler
  const handleCreateKeyResult = async (keyResultData: Partial<KeyResult>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const insertData = {
        title: keyResultData.title!,
        objective_id: keyResultData.objective_id!,
        target_value: keyResultData.target_value!,
        current_value: keyResultData.current_value || 0,
        unit: keyResultData.unit || 'number',
        status: keyResultData.status || 'not_started',
        owner_id: user.id,
        description: keyResultData.description,
        metric_type: keyResultData.metric_type,
        frequency: keyResultData.frequency,
        responsible: keyResultData.responsible,
        category: keyResultData.category,
        priority: keyResultData.priority,
        due_date: keyResultData.due_date,
        yearly_target: keyResultData.yearly_target,
        yearly_actual: keyResultData.yearly_actual || 0,
        monthly_targets: keyResultData.monthly_targets || {},
        monthly_actual: keyResultData.monthly_actual || {}
      };

      const { data, error } = await supabase
        .from('key_results')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setKeyResults(prev => [data, ...prev]);
      toast({
        title: 'Sucesso',
        description: 'Resultado-chave criado com sucesso'
      });
      
      // Open edit modal for monthly targets configuration
      setSelectedKeyResult(data);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error creating key result:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar resultado-chave',
        variant: 'destructive'
      });
    }
  };

  // Update key result handler from EditKeyResultModal
  const handleUpdateKeyResult = useCallback(async (updatedKeyResult: KeyResult) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update(updatedKeyResult)
        .eq('id', updatedKeyResult.id);

      if (error) throw error;

      setKeyResults(prev => prev.map(kr => 
        kr.id === updatedKeyResult.id ? updatedKeyResult : kr
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Resultado-chave atualizado com sucesso'
      });
    } catch (error) {
      console.error('Error updating key result:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar resultado-chave',
        variant: 'destructive'
      });
    }
  }, []);

  // Delete key result handler
  const confirmDelete = async () => {
    if (!keyResultToDelete) return;

    try {
      const { error } = await supabase
        .from('key_results')
        .delete()
        .eq('id', keyResultToDelete.id);

      if (error) throw error;

      setKeyResults(prev => prev.filter(kr => kr.id !== keyResultToDelete.id));
      setShowDeleteDialog(false);
      setKeyResultToDelete(null);
      
      toast({
        title: 'Sucesso',
        description: 'Resultado-chave excluído com sucesso'
      });
    } catch (error) {
      console.error('Error deleting key result:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir resultado-chave',
        variant: 'destructive'
      });
    }
  };

  // Check if user has a company
  const hasCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: userCompany } = await supabase
      .from('user_company_relations')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    return !!userCompany;
  };

  // Filter key results based on search and status
  const filteredKeyResults = keyResults.filter(kr => {
    const matchesSearch = kr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kr.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kr.responsible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kr.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || kr.status === statusFilter;
    
    const matchesPriority = priorityFilter === 'all' || kr.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate summary statistics
  const totalKeyResults = keyResults.length;
  const completedKeyResults = keyResults.filter(kr => kr.status === 'completed').length;
  const inProgressKeyResults = keyResults.filter(kr => kr.status === 'in_progress').length;
  const notStartedKeyResults = keyResults.filter(kr => kr.status === 'not_started').length;

  // Check if user has no company
  if (!loading && keyResults.length === 0 && objectives.length === 0) {
    const [hasCompanyResult, setHasCompanyResult] = useState<boolean | null>(null);
    
    useEffect(() => {
      hasCompany().then(setHasCompanyResult);
    }, []);

    if (hasCompanyResult === false) {
      return <NoCompanyMessage />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resultados-Chave</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe seus Key Results estratégicos
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeyResults}</div>
            <p className="text-xs text-muted-foreground">
              Resultados-chave criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedKeyResults}</div>
            <p className="text-xs text-muted-foreground">
              Objetivos atingidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressKeyResults}</div>
            <p className="text-xs text-muted-foreground">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Iniciados</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{notStartedKeyResults}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando início
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar resultados-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="not_started">Não iniciado</SelectItem>
                  <SelectItem value="in_progress">Em progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Resultado-Chave
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <KeyResultsTable
            keyResults={filteredKeyResults}
            onEdit={(keyResult) => {
              setSelectedKeyResult(keyResult);
              setShowEditModal(true);
            }}
            onDelete={(keyResult) => {
              setKeyResultToDelete(keyResult);
              setShowDeleteDialog(true);
            }}
            onUpdateMonthly={(keyResult) => {
              setSelectedKeyResult(keyResult);
              setShowEditModal(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      <CreateKeyResultModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateKeyResult}
        objectives={objectives}
      />

      {showEditModal && selectedKeyResult && (
        <EditKeyResultModal
          keyResult={selectedKeyResult}
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedKeyResult(null);
          }}
          onSave={handleUpdateKeyResult}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o resultado-chave "{keyResultToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};