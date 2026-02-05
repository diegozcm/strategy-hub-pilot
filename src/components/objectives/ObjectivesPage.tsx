import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Target, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { useObjectivesData } from '@/hooks/useObjectivesData';
import { useKRPermissions } from '@/hooks/useKRPermissions';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';
import { calculateObjectiveProgressWeighted } from '@/lib/krHelpers';

import { ResultadoChaveMiniCard } from '@/components/strategic-map/ResultadoChaveMiniCard';
import { KROverviewModal } from '@/components/strategic-map/KROverviewModal';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';
import { ObjectiveDetailModal } from './ObjectiveDetailModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { EditKeyResultModal } from '@/components/strategic-map/EditKeyResultModal';
import { ActivePlanCard } from './ActivePlanCard';
import { SmartPeriodSelector } from '@/components/ui/SmartPeriodSelector';

export const ObjectivesPage: React.FC = () => {
  const { user, company: authCompany } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use our new data management hook
  const { 
    objectives, plans, pillars, keyResults, loading, error,
    setObjectives, setKeyResults,
    refreshData, softReload, invalidateAndReload, handleError, clearError
  } = useObjectivesData();
  
  // Use global period filter context
  const {
    periodType: selectedPeriod, setPeriodType: setSelectedPeriod,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedQuarter, setSelectedQuarter,
    selectedQuarterYear, setSelectedQuarterYear,
    selectedSemester, setSelectedSemester,
    selectedSemesterYear, setSelectedSemesterYear,
    selectedBimonth, setSelectedBimonth,
    selectedBimonthYear, setSelectedBimonthYear,
    isYTDCalculable, ytdInfoMessage,
    quarterOptions, monthOptions, yearOptions,
    semesterOptions, bimonthlyOptions,
    handleYTDClick
  } = usePeriodFilter();
  
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  
  const [isCreateObjectiveOpen, setIsCreateObjectiveOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<StrategicObjective | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Key Result modal states
  const [selectedKeyResultForEdit, setSelectedKeyResultForEdit] = useState<KeyResult | null>(null);
  const [isKeyResultEditModalOpen, setIsKeyResultEditModalOpen] = useState(false);
  const [selectedKeyResultForOverview, setSelectedKeyResultForOverview] = useState<KeyResult | null>(null);
  const [isKROverviewModalOpen, setIsKROverviewModalOpen] = useState(false);

  // Form states
  const [objectiveForm, setObjectiveForm] = useState({
    title: '',
    description: '',
    target_date: '',
    plan_id: '',
    pillar_id: '',
    weight: 1
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    target_date: '',
    pillar_id: ''
  });

  // Health monitoring hooks
  const { logRenderCycle } = useHealthMonitor();
  const { canCreateObjective, canEditObjective, canDeleteObjective } = useKRPermissions();
  
  // Log render cycle for monitoring
  useEffect(() => {
    logRenderCycle('ObjectivesPage', 'mount');
    return () => logRenderCycle('ObjectivesPage', 'unmount');
  }, [logRenderCycle]);

  const createObjective = async () => {
    // Check if there are any plans first
    if (plans.length === 0) {
      toast({
        title: "Erro",
        description: "É necessário criar um plano estratégico antes de criar objetivos.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !objectiveForm.title || !objectiveForm.plan_id || !objectiveForm.pillar_id) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios incluindo o pilar estratégico.",
        variant: "destructive",
      });
      return;
    }

    try {
      const objectiveData = {
        ...objectiveForm,
        owner_id: user.id,
        target_date: objectiveForm.target_date ? objectiveForm.target_date : null,
        progress: 0,
        weight: objectiveForm.weight || 1
      };

      const { data, error } = await supabase
        .from('strategic_objectives')
        .insert([objectiveData])
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      setObjectives(prev => [data, ...prev]);
      setObjectiveForm({ 
        title: '', 
        description: '', 
        target_date: '', 
        plan_id: '', 
        pillar_id: '',
        weight: 1
      });
      setIsCreateObjectiveOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Objetivo estratégico criado com sucesso!",
      });

      await invalidateAndReload();
    } catch (error) {
      handleError(error, 'criar objetivo estratégico');
      await refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailModal = (objective: StrategicObjective) => {
    setSelectedObjective(objective);
    setEditForm({
      title: objective.title,
      description: objective.description || '',
      target_date: objective.target_date || '',
      pillar_id: objective.pillar_id
    });
    setIsEditing(false);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedObjective(null);
    setIsEditing(false);
  };

  const handleUpdateObjective = async (data: Partial<StrategicObjective>) => {
    if (!selectedObjective) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const updates: Partial<StrategicObjective> & { [key: string]: any } = { ...data };
      if (updates.target_date === '' || updates.target_date === undefined) updates.target_date = null as any;
      if ((updates as any).deadline === '' || (updates as any).deadline === undefined) (updates as any).deadline = null;

      const { data: updatedData, error } = await supabase
        .from('strategic_objectives')
        .update(updates)
        .eq('id', selectedObjective.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      const finalUpdated = updatedData ?? { ...selectedObjective, ...updates };

      // Optimistic update
      setObjectives(prev => prev.map(obj => 
        obj.id === selectedObjective.id ? finalUpdated : obj
      ));
      
      setSelectedObjective(finalUpdated);

      toast({
        title: 'Sucesso',
        description: 'Objetivo atualizado com sucesso!',
      });

      setIsEditing(false);
      setIsDetailModalOpen(false);
    } catch (error) {
      handleError(error, 'atualizar objetivo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteObjective = async () => {
    if (!selectedObjective || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('strategic_objectives')
        .delete()
        .eq('id', selectedObjective.id);

      if (error) throw error;

      // Optimistic update
      setObjectives(prev => prev.filter(obj => obj.id !== selectedObjective.id));
      
      closeDetailModal();
      
      toast({
        title: "Sucesso",
        description: "Objetivo excluído com sucesso!",
      });

      void softReload();
    } catch (error) {
      handleError(error, 'excluir objetivo');
      await refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const getObjectiveKeyResults = (objectiveId: string) => {
    return keyResults.filter(kr => kr.objective_id === objectiveId);
  };

  // Usa função centralizada de média ponderada

  const filteredObjectives = objectives.filter(objective => {
    const matchesSearch = objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         objective.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === 'all' || objective.plan_id === selectedPlan;
    const matchesPillar = pillarFilter === 'all' || objective.pillar_id === pillarFilter;
    
    let matchesStatus = statusFilter === 'all';
    if (!matchesStatus) {
      const objectiveKeyResults = getObjectiveKeyResults(objective.id);
      const progress = calculateObjectiveProgressWeighted(
        objectiveKeyResults, 
        selectedPeriod,
        selectedPeriod === 'monthly' 
          ? { selectedMonth, selectedYear } 
          : selectedPeriod === 'quarterly'
          ? { selectedQuarter }
          : selectedPeriod === 'yearly'
          ? { selectedYear }
          : undefined
      );
      if (statusFilter === 'excellent') {
        matchesStatus = progress > 105;
      } else if (statusFilter === 'success') {
        matchesStatus = progress >= 100 && progress <= 105;
      } else if (statusFilter === 'attention') {
        matchesStatus = progress >= 71 && progress < 100;
      } else if (statusFilter === 'critical') {
        matchesStatus = progress < 71;
      }
    }
    
    return matchesSearch && matchesPlan && matchesPillar && matchesStatus;
  }).sort((a, b) => (b.weight || 1) - (a.weight || 1)); // Ordenar por peso (maior primeiro)

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setSelectedKeyResultForEdit(keyResult);
    setIsKeyResultEditModalOpen(true);
  };

  const handleOpenKeyResultDetails = (keyResult: KeyResult) => {
    setSelectedKeyResultForOverview(keyResult);
    setIsKROverviewModalOpen(true);
  };

  const handleUpdateKeyResult = async (keyResultData: Partial<KeyResult>) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update(keyResultData)
        .eq('id', selectedKeyResultForEdit?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resultado-chave atualizado com sucesso!",
      });

      await invalidateAndReload();
    } catch (error) {
      console.error('Error updating key result:', error);
      toast({
        title: "Erro", 
        description: "Erro ao atualizar resultado-chave. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sincronizar selectedKeyResultForOverview com a lista atualizada
  useEffect(() => {
    if (selectedKeyResultForOverview && keyResults.length > 0) {
      const updatedKR = keyResults.find(kr => kr.id === selectedKeyResultForOverview.id);
      if (updatedKR) {
        if (JSON.stringify(updatedKR) !== JSON.stringify(selectedKeyResultForOverview)) {
          console.log('[ObjectivesPage] Sincronizando selectedKeyResultForOverview:', {
            id: updatedKR.id,
            start_month: updatedKR.start_month,
            end_month: updatedKR.end_month
          });
          setSelectedKeyResultForOverview(updatedKR);
        }
      }
    }
  }, [keyResults]);

  // Create Key Result inline from ObjectiveDetailModal
  const handleCreateKeyResult = async (krData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('key_results')
        .insert([{ ...krData, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista de KRs
      setKeyResults(prev => [...prev, data as KeyResult]);
      
      toast({
        title: "Sucesso",
        description: "Resultado-chave criado com sucesso!",
      });

      // Refresh data to ensure consistency
      await invalidateAndReload();
    } catch (error) {
      console.error('Error creating key result:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar resultado-chave. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get active plan
  const activePlan = plans.find(p => p.status === 'active');
  const activePlanObjectivesCount = activePlan ? objectives.filter(obj => obj.plan_id === activePlan.id).length : 0;

  // Auto-populate plan_id with active plan
  useEffect(() => {
    if (activePlan && !objectiveForm.plan_id) {
      setObjectiveForm(prev => ({ ...prev, plan_id: activePlan.id }));
    }
  }, [activePlan, objectiveForm.plan_id]);

  // Show error state if there's an error
  if (error) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Objetivos Estratégicos</h1>
              <p className="text-muted-foreground mt-2">Gerencie seus objetivos e resultados-chave (OKRs)</p>
            </div>
          </div>
          <Card className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => {
              clearError();
              refreshData();
            }}>
              Tentar novamente
            </Button>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Objetivos Estratégicos</h1>
              <p className="text-muted-foreground mt-2">Gerencie seus objetivos e resultados-chave (OKRs)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded mb-4"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Block access if no company is associated
  if (!authCompany) {
    return <NoCompanyMessage />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Objetivos Estratégicos</h1>
              <p className="text-muted-foreground mt-2">Gerencie seus objetivos e resultados-chave (OKRs)</p>
            </div>
          </div>
          <Dialog open={isCreateObjectiveOpen} onOpenChange={setIsCreateObjectiveOpen}>
            {canCreateObjective && (
              <DialogTrigger asChild>
                <Button disabled={!activePlan}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Objetivo
                </Button>
              </DialogTrigger>
            )}
            {!canCreateObjective && (
              <Button disabled>
                <Plus className="w-4 h-4 mr-2" />
                Novo Objetivo
              </Button>
            )}
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Objetivo Estratégico</DialogTitle>
                <DialogDescription>
                  {!activePlan 
                    ? "É necessário ativar um plano estratégico primeiro. Peça a um gerente para ativar um plano em Configurações → Módulos."
                    : "Defina um novo objetivo estratégico para sua organização."
                  }
                </DialogDescription>
              </DialogHeader>
              {activePlan && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="objective-title">Título do Objetivo</Label>
                      <Input
                        id="objective-title"
                        value={objectiveForm.title}
                        onChange={(e) => setObjectiveForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Aumentar receita em 30%"
                      />
                    </div>
                    <div>
                      <Label htmlFor="objective-description">Descrição</Label>
                      <Textarea
                        id="objective-description"
                        value={objectiveForm.description}
                        onChange={(e) => setObjectiveForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o objetivo..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="objective-target-date">Data Meta</Label>
                        <Input
                          id="objective-target-date"
                          type="date"
                          value={objectiveForm.target_date}
                          onChange={(e) => setObjectiveForm(prev => ({ ...prev, target_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="objective-weight">Peso (1-10)</Label>
                        <Input
                          id="objective-weight"
                          type="number"
                          min={1}
                          max={10}
                          value={objectiveForm.weight}
                          onChange={(e) => setObjectiveForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 5 }))}
                          placeholder="5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="objective-pillar">Pilar Estratégico</Label>
                      <Select value={objectiveForm.pillar_id} onValueChange={(value) => setObjectiveForm(prev => ({ ...prev, pillar_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um pilar" />
                        </SelectTrigger>
                        <SelectContent>
                          {pillars.map((pillar) => (
                            <SelectItem key={pillar.id} value={pillar.id}>
                              {pillar.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateObjectiveOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createObjective}>
                      Criar Objetivo
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Plan Card */}
        <ActivePlanCard 
          plan={activePlan || null}
          objectivesCount={activePlanObjectivesCount}
        />

        {/* Period Selector */}
        <SmartPeriodSelector
          selectedPeriod={selectedPeriod}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          selectedQuarter={selectedQuarter}
          selectedQuarterYear={selectedQuarterYear}
          selectedSemester={selectedSemester}
          selectedSemesterYear={selectedSemesterYear}
          selectedBimonth={selectedBimonth}
          selectedBimonthYear={selectedBimonthYear}
          setSelectedPeriod={setSelectedPeriod}
          setSelectedYear={setSelectedYear}
          setSelectedMonth={setSelectedMonth}
          setSelectedQuarter={setSelectedQuarter}
          setSelectedQuarterYear={setSelectedQuarterYear}
          setSelectedSemester={setSelectedSemester}
          setSelectedSemesterYear={setSelectedSemesterYear}
          setSelectedBimonth={setSelectedBimonth}
          setSelectedBimonthYear={setSelectedBimonthYear}
          yearOptions={yearOptions}
          quarterOptions={quarterOptions}
          semesterOptions={semesterOptions}
          bimonthlyOptions={bimonthlyOptions}
          monthOptions={monthOptions}
          isYTDCalculable={isYTDCalculable}
          ytdInfoMessage={ytdInfoMessage}
          onYTDClick={handleYTDClick}
        />
        <div className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar objetivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Select value={pillarFilter} onValueChange={setPillarFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todos os pilares" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">
                    <span>Todos os pilares</span>
                  </SelectItem>
                  {pillars.map((pillar) => (
                    <SelectItem key={pillar.id} value={pillar.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: pillar.color }} 
                        />
                        <span>{pillar.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="excellent">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      &gt;105% Excelente
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      100-105% No Alvo
                    </div>
                  </SelectItem>
                  <SelectItem value="attention">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      71-99% Atenção
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      &lt;71% Crítico
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Objectives Grid */}
          {filteredObjectives.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {objectives.length === 0 ? 'Nenhum objetivo criado' : 'Nenhum objetivo encontrado'}
              </h3>
              <p className="text-gray-500 mb-4">
                {objectives.length === 0 
                  ? 'Comece criando seu primeiro objetivo estratégico.'
                  : 'Tente ajustar os filtros ou termo de busca.'
                }
              </p>
              {objectives.length === 0 && activePlan && (
                <Button onClick={() => setIsCreateObjectiveOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Objetivo
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredObjectives.map((objective) => {
                const pillar = pillars.find(p => p.id === objective.pillar_id);
                const plan = plans.find(p => p.id === objective.plan_id);
                const objectiveKeyResults = getObjectiveKeyResults(objective.id);
                
                return (
                  <Card 
                    key={objective.id} 
                    className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                    onClick={() => openDetailModal(objective)}
                  >
                    {pillar && (
                      <div 
                        style={{ backgroundColor: pillar.color }}
                        className="p-3"
                      >
                        <div className="space-y-2">
                          <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2">
                            {objective.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                              {pillar.name}
                            </Badge>
                            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                              {plan?.name}
                            </Badge>
                            {(objective.weight || 1) > 1 && (
                              <Badge className="bg-white/30 text-white border-white/40 hover:bg-white/40 text-xs font-semibold">
                                P:{objective.weight}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {objective.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{objective.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Target className="w-3 h-3" />
                            <span>{objectiveKeyResults.length} resultados-chave</span>
                          </div>
                        </div>
                        {objective.target_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Meta: {new Date(objective.target_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Progresso</span>
                            <span className="text-sm font-bold text-foreground">{calculateObjectiveProgressWeighted(
                              objectiveKeyResults, 
                              selectedPeriod,
                              selectedPeriod === 'monthly' 
                                ? { selectedMonth, selectedYear } 
                                : selectedPeriod === 'quarterly'
                                ? { selectedQuarter, selectedQuarterYear }
                                : selectedPeriod === 'semesterly'
                                ? { selectedSemester, selectedSemesterYear }
                                : selectedPeriod === 'bimonthly'
                                ? { selectedBimonth, selectedBimonthYear }
                                : selectedPeriod === 'yearly'
                                ? { selectedYear }
                                : undefined
                            ).toFixed(1).replace('.', ',')}%</span>
                          </div>
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            {(() => {
                              const progress = calculateObjectiveProgressWeighted(
                                objectiveKeyResults, 
                                selectedPeriod,
                                selectedPeriod === 'monthly' 
                                  ? { selectedMonth, selectedYear } 
                                  : selectedPeriod === 'quarterly'
                                  ? { selectedQuarter, selectedQuarterYear }
                                  : selectedPeriod === 'semesterly'
                                  ? { selectedSemester, selectedSemesterYear }
                                  : selectedPeriod === 'bimonthly'
                                  ? { selectedBimonth, selectedBimonthYear }
                                  : selectedPeriod === 'yearly'
                                  ? { selectedYear }
                                  : undefined
                              );
                              return (
                                <div 
                                  className={`h-full transition-all duration-300 rounded-full ${
                                    progress > 105 ? 'bg-blue-500' :
                                    progress >= 100 ? 'bg-green-500' :
                                    progress >= 71 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Objective Detail Modal */}
        <ObjectiveDetailModal
          objective={selectedObjective}
          open={isDetailModalOpen}
          onClose={closeDetailModal}
          onUpdate={handleUpdateObjective}
          onDelete={handleDeleteObjective}
          keyResults={selectedObjective ? getObjectiveKeyResults(selectedObjective.id) : []}
          pillar={selectedObjective ? pillars.find(p => p.id === selectedObjective.pillar_id) || null : null}
          plan={selectedObjective ? plans.find(p => p.id === selectedObjective.plan_id) || null : null}
          onOpenKeyResultDetails={handleOpenKeyResultDetails}
          pillars={pillars}
          progressPercentage={selectedObjective ? calculateObjectiveProgressWeighted(
            getObjectiveKeyResults(selectedObjective.id),
            selectedPeriod,
            selectedPeriod === 'monthly' 
              ? { selectedMonth, selectedYear } 
              : selectedPeriod === 'quarterly'
              ? { selectedQuarter }
              : undefined
          ) : 0}
          canEditObjective={canEditObjective}
          canDeleteObjective={canDeleteObjective}
          onCreateKeyResult={handleCreateKeyResult}
        />

        {/* Edit Key Result Modal */}
        {selectedKeyResultForEdit && (
          <EditKeyResultModal
            keyResult={selectedKeyResultForEdit}
            open={isKeyResultEditModalOpen}
            onClose={() => {
              setIsKeyResultEditModalOpen(false);
              setSelectedKeyResultForEdit(null);
            }}
            onSave={handleUpdateKeyResult}
          />
        )}

        {/* KR Overview Modal */}
        {selectedKeyResultForOverview && (
          <KROverviewModal
            keyResult={selectedKeyResultForOverview}
            pillar={(() => {
              const objective = objectives.find(obj => 
                obj.id === selectedKeyResultForOverview.objective_id
              );
              return objective 
                ? pillars.find(p => p.id === objective.pillar_id) 
                : null;
            })()}
            open={isKROverviewModalOpen}
            onClose={() => {
              setIsKROverviewModalOpen(false);
              setSelectedKeyResultForOverview(null);
            }}
            onDelete={() => {
              toast({
                title: "Funcionalidade em desenvolvimento",
                description: "A exclusão de Resultados-Chave será implementada em breve.",
              });
            }}
            onSave={async () => {
              await refreshData();
            }}
            objectives={objectives.map(obj => ({ id: obj.id, title: obj.title }))}
            showDeleteButton={false}
            initialPeriod={selectedPeriod}
            initialMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
            initialYear={selectedPeriod === 'monthly' ? selectedYear : undefined}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};
