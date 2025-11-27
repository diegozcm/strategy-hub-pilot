import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Target, TrendingUp, Clock, AlertTriangle, Edit, Eye, Save, X, Trash2, Layout, MoreVertical, Calendar, CalendarDays, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { useOperationState } from '@/hooks/useOperationState';

import { ResultadoChaveMiniCard } from '@/components/strategic-map/ResultadoChaveMiniCard';
import { KROverviewModal } from '@/components/strategic-map/KROverviewModal';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { KeyResult, StrategicObjective, StrategicPillar } from '@/types/strategic-map';
import { PlanCard } from './PlanCard';
import { PlanDetailModal } from './PlanDetailModal';
import { EditPlanModal } from './EditPlanModal';
import { DeletePlanModal } from './DeletePlanModal';
import { ObjectiveDetailModal } from './ObjectiveDetailModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useObjectivesData } from '@/hooks/useObjectivesData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditKeyResultModal } from '@/components/strategic-map/EditKeyResultModal';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
  period_start: string;
  period_end: string;
  vision?: string;
  mission?: string;
  company_id: string;
  created_at: string;
}


export const ObjectivesPage: React.FC = () => {
  const { user, company: authCompany } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use our new data management hook
  const { 
    objectives, plans, pillars, keyResults, loading, error,
    setObjectives, setPlans, setPillars, setKeyResults,
    refreshData, softReload, invalidateAndReload, handleError, clearError
  } = useObjectivesData();
  
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'ytd' | 'monthly' | 'yearly' | 'quarterly'>('ytd');
  
  // Inicializar com o último mês fechado (mês anterior)
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const [selectedMonth, setSelectedMonth] = useState<number>(previousMonth.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(previousMonth.getFullYear());
  
  // Quarter state - inicializado com o trimestre atual
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(
    Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4
  );
  
  const [isCreateObjectiveOpen, setIsCreateObjectiveOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<StrategicObjective | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Plan management states
  const [selectedPlanForDetail, setSelectedPlanForDetail] = useState<StrategicPlan | null>(null);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<StrategicPlan | null>(null);
  const [selectedPlanForDelete, setSelectedPlanForDelete] = useState<StrategicPlan | null>(null);
  const [selectedPlanForActivate, setSelectedPlanForActivate] = useState<StrategicPlan | null>(null);
  const [isPlanDetailOpen, setIsPlanDetailOpen] = useState(false);
  const [isPlanEditOpen, setIsPlanEditOpen] = useState(false);
  const [isPlanDeleteOpen, setIsPlanDeleteOpen] = useState(false);
  const [isPlanActivateConfirmOpen, setIsPlanActivateConfirmOpen] = useState(false);

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
    pillar_id: ''
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    vision: '',
    mission: '',
    period_start: '',
    period_end: ''
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    target_date: '',
    pillar_id: ''
  });

  // Health monitoring hooks
  const { logRenderCycle } = useHealthMonitor();
  
  // Log render cycle for monitoring
  useEffect(() => {
    logRenderCycle('ObjectivesPage', 'mount');
    return () => logRenderCycle('ObjectivesPage', 'unmount');
  }, [logRenderCycle]);

  const createPlan = async () => {
    if (!user || !authCompany || !planForm.name || !planForm.period_start || !planForm.period_end) {
      toast({
        title: "Erro",
        description: !authCompany 
          ? "Nenhuma empresa selecionada. Selecione uma empresa no menu superior."
          : "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('🔄 Creating plan...');
      
      const { data, error } = await supabase
        .from('strategic_plans')
        .insert([{
          ...planForm,
          company_id: authCompany.id,
          status: 'inactive'
        }])
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      setPlans(prev => [data, ...prev]);
      setSelectedPlan(data.id);
      setPlanForm({ name: '', vision: '', mission: '', period_start: '', period_end: '' });
      setIsCreatePlanOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Plano estratégico criado como inativo. Ative-o para começar a usar.",
      });

      // Reload data to ensure consistency
      await invalidateAndReload();
      console.log('✅ Plan created successfully');
    } catch (error) {
      handleError(error, 'criar plano estratégico');
      // Revert optimistic update if needed
      await refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const activatePlan = async () => {
    if (!selectedPlanForActivate || !authCompany || isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('🔄 Activating plan:', selectedPlanForActivate.id);
      
      // 1. Desativar todos os planos da empresa
      await supabase
        .from('strategic_plans')
        .update({ status: 'inactive' })
        .eq('company_id', authCompany.id);
      
      // 2. Ativar apenas o plano selecionado
      const { error } = await supabase
        .from('strategic_plans')
        .update({ status: 'active' })
        .eq('id', selectedPlanForActivate.id);
      
      if (error) throw error;
      
      toast({ 
        title: "Sucesso", 
        description: "Plano ativado com sucesso! Agora os OEs e KRs deste plano serão exibidos." 
      });
      
      setIsPlanActivateConfirmOpen(false);
      setSelectedPlanForActivate(null);
      await invalidateAndReload();
      console.log('✅ Plan activated successfully');
    } catch (error) {
      handleError(error, 'ativar plano');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        progress: 0
      };

      console.log('🔄 Creating objective with data:', objectiveData);

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
        pillar_id: ''
      });
      setIsCreateObjectiveOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Objetivo estratégico criado com sucesso!",
      });

      // Reload data to ensure consistency
      await invalidateAndReload();
      console.log('✅ Objective created successfully');
    } catch (error) {
      handleError(error, 'criar objetivo estratégico');
      // Revert optimistic update if needed
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
      console.log('🔄 Updating objective:', selectedObjective.id);

      // Sanitize payload: convert empty date strings to null to avoid Postgres 22007 errors
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
      console.log('🔄 Deleting objective:', selectedObjective.id);
      
      const { error } = await supabase
        .from('strategic_objectives')
        .delete()
        .eq('id', selectedObjective.id);

      if (error) throw error;

      // Optimistic update
      setObjectives(prev => prev.filter(obj => obj.id !== selectedObjective.id));
      
      // Close modals
      closeDetailModal();
      
      toast({
        title: "Sucesso",
        description: "Objetivo excluído com sucesso!",
      });

      // Soft reload in background without blocking UI
      void softReload();
      console.log('✅ Objective deleted successfully');
    } catch (error) {
      handleError(error, 'excluir objetivo');
      // Revert optimistic update if needed
      await refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateObjective = async () => {
    if (!selectedObjective || !editForm.title || !editForm.pillar_id) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios incluindo o pilar estratégico.",
        variant: "destructive",
      });
      return;
    }

    await handleUpdateObjective(editForm);
    setIsEditing(false);
  };

  const deleteObjective = async () => {
    if (!selectedObjective || isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('🔄 Deleting objective:', selectedObjective.id);
      
      const { error } = await supabase
        .from('strategic_objectives')
        .delete()
        .eq('id', selectedObjective.id);

      if (error) throw error;

      // Optimistic update
      setObjectives(prev => prev.filter(obj => obj.id !== selectedObjective.id));
      
      // Close modals
      setIsDeleteConfirmOpen(false);
      closeDetailModal();
      
      toast({
        title: "Sucesso",
        description: "Objetivo excluído com sucesso!",
      });

      // Reload data to ensure consistency
      await invalidateAndReload();
      console.log('✅ Objective deleted successfully');
    } catch (error) {
      handleError(error, 'excluir objetivo');
      // Revert optimistic update if needed
      await refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions - must be declared before filteredObjectives
  const getObjectiveKeyResults = (objectiveId: string) => {
    return keyResults.filter(kr => kr.objective_id === objectiveId);
  };

  // Gerar lista de meses disponíveis (últimos 24 meses)
  const monthOptions = React.useMemo(() => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      options.push({
        value: `${year}-${month.toString().padStart(2, '0')}`,
        label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          .replace(/^\w/, c => c.toUpperCase())
      });
    }
    
    return options;
  }, []);

  const calculateObjectiveProgress = (
    keyResults: any[], 
    period: 'ytd' | 'monthly' | 'yearly' | 'quarterly' = 'ytd',
    options?: {
      selectedMonth?: number;
      selectedYear?: number;
      selectedQuarter?: 1 | 2 | 3 | 4;
    }
  ) => {
    if (keyResults.length === 0) return 0;
    
    const totalProgress = keyResults.reduce((sum, kr) => {
      let percentage = 0;
      
      switch (period) {
        case 'quarterly':
          const quarter = options?.selectedQuarter || 1;
          switch (quarter) {
            case 1: percentage = kr.q1_percentage || 0; break;
            case 2: percentage = kr.q2_percentage || 0; break;
            case 3: percentage = kr.q3_percentage || 0; break;
            case 4: percentage = kr.q4_percentage || 0; break;
          }
          break;
        case 'monthly':
          // Se mês customizado foi fornecido, recalcular
          if (options?.selectedMonth && options?.selectedYear) {
            const monthKey = `${options.selectedYear}-${options.selectedMonth.toString().padStart(2, '0')}`;
            const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
            const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
            
            const monthTarget = monthlyTargets[monthKey] || 0;
            const monthActual = monthlyActual[monthKey] || 0;
            percentage = monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;
          } else {
            // Usar valor pré-calculado do mês atual
            percentage = kr.monthly_percentage || 0;
          }
          break;
        case 'yearly':
          percentage = kr.yearly_percentage || 0;
          break;
        case 'ytd':
        default:
          percentage = kr.ytd_percentage || 0;
          break;
      }
      
      return sum + percentage;
    }, 0);
    
    return Math.round(totalProgress / keyResults.length);
  };

  const filteredObjectives = objectives.filter(objective => {
    const matchesSearch = objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         objective.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === 'all' || objective.plan_id === selectedPlan;
    
    // Check status match
    let matchesStatus = statusFilter === 'all';
    if (!matchesStatus) {
      const objectiveKeyResults = getObjectiveKeyResults(objective.id);
      const progress = calculateObjectiveProgress(
        objectiveKeyResults, 
        selectedPeriod,
        selectedPeriod === 'monthly' 
          ? { selectedMonth, selectedYear } 
          : selectedPeriod === 'quarterly'
          ? { selectedQuarter }
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
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 60) return 'bg-yellow-500';
    if (progress < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };


  // Plan management functions
  const updatePlan = async (planId: string, updates: Partial<StrategicPlan>) => {
    try {
      const { data, error } = await supabase
        .from('strategic_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(plan => plan.id === planId ? data : plan));
      
      toast({
        title: "Sucesso",
        description: "Plano estratégico atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano estratégico. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('strategic_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      setPlans(prev => prev.filter(plan => plan.id !== planId));
      
      // Reset selected plan if it was deleted
      if (selectedPlan === planId) {
        setSelectedPlan('all');
      }
      
      toast({
        title: "Sucesso",
        description: "Plano estratégico excluído com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano estratégico. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Key Result edit functions
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

      // Refresh data
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

  const handlePlanView = (plan: StrategicPlan) => {
    setSelectedPlanForDetail(plan);
    setIsPlanDetailOpen(true);
  };

  const handlePlanEdit = (plan: StrategicPlan) => {
    setSelectedPlanForEdit(plan);
    setIsPlanEditOpen(true);
  };

  const handlePlanDelete = (plan: StrategicPlan) => {
    setSelectedPlanForDelete(plan);
    setIsPlanDeleteOpen(true);
  };

  const handlePlanActivate = (plan: StrategicPlan) => {
    setSelectedPlanForActivate(plan);
    setIsPlanActivateConfirmOpen(true);
  };

  const getObjectivesCountForPlan = (planId: string) => {
    return objectives.filter(obj => obj.plan_id === planId).length;
  };

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
              <p className="text-muted-foreground mt-2">Gerencie seus planos estratégicos e objetivos</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Plano
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Plano Estratégico</DialogTitle>
                  <DialogDescription>
                    Crie um novo plano estratégico para organizar seus objetivos
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan-name">Nome do Plano</Label>
                    <Input
                      id="plan-name"
                      value={planForm.name}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Plano Estratégico 2024-2026"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="period-start">Data de Início</Label>
                      <Input
                        id="period-start"
                        type="date"
                        value={planForm.period_start}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, period_start: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="period-end">Data de Fim</Label>
                      <Input
                        id="period-end"
                        type="date"
                        value={planForm.period_end}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, period_end: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plan-vision">Visão (Opcional)</Label>
                    <Textarea
                      id="plan-vision"
                      value={planForm.vision}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, vision: e.target.value }))}
                      placeholder="Descreva a visão da empresa para este período"
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plan-mission">Missão (Opcional)</Label>
                    <Textarea
                      id="plan-mission"
                      value={planForm.mission}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, mission: e.target.value }))}
                      placeholder="Descreva a missão da empresa"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createPlan}>
                    Criar Plano
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateObjectiveOpen} onOpenChange={setIsCreateObjectiveOpen}>
              <DialogTrigger asChild>
                <Button disabled={plans.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Objetivo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Objetivo Estratégico</DialogTitle>
                  <DialogDescription>
                    {plans.length === 0 
                      ? "Primeiro você precisa criar um plano estratégico"
                      : "Defina um novo objetivo estratégico para sua organização."
                    }
                  </DialogDescription>
                </DialogHeader>
                {plans.length > 0 && (
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
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="objective-plan">Plano Estratégico</Label>
                          <Select value={objectiveForm.plan_id} onValueChange={(value) => setObjectiveForm(prev => ({ ...prev, plan_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
        </div>

        {/* Period Selector - Below Description */}
        <div className="flex items-center gap-2">
          {/* Botões de Período - Sempre visíveis */}
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={selectedPeriod === 'ytd' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('ytd')}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              YTD
            </Button>
            
            <Button
              variant={selectedPeriod === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('yearly')}
              className="gap-2 border-l border-border/50 ml-1 pl-2"
            >
              <Target className="w-4 h-4" />
              Ano
            </Button>
            
            <Button
              variant={selectedPeriod === 'quarterly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('quarterly')}
              className="gap-2 border-l border-border/50 ml-1 pl-2"
            >
              <Calendar className="w-4 h-4" />
              Quarter
            </Button>
            
            {/* Select de Quarter - Aparece dentro do container quando quarterly está selecionado */}
            {selectedPeriod === 'quarterly' && (
              <Select
                value={selectedQuarter.toString()}
                onValueChange={(value) => setSelectedQuarter(parseInt(value) as 1 | 2 | 3 | 4)}
              >
                <SelectTrigger className="h-9 w-[100px] gap-2">
                  <Calendar className="w-4 h-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1</SelectItem>
                  <SelectItem value="2">Q2</SelectItem>
                  <SelectItem value="3">Q3</SelectItem>
                  <SelectItem value="4">Q4</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Button
              variant={selectedPeriod === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('monthly')}
              className="gap-2 border-l border-border/50 ml-1 pl-2"
            >
              <CalendarDays className="w-4 h-4" />
              Mês
            </Button>
          </div>
          
          {/* Select de Mês - Aparece ao lado quando monthly está selecionado */}
          {selectedPeriod === 'monthly' && (
            <Select
              value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
              onValueChange={(value) => {
                const [year, month] = value.split('-');
                setSelectedYear(parseInt(year));
                setSelectedMonth(parseInt(month));
              }}
            >
              <SelectTrigger className="h-9 w-[180px] gap-2">
                <Calendar className="w-4 h-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Plans Management Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Planos Estratégicos</h2>
            </div>
          </div>
          
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum plano estratégico</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro plano estratégico para começar a definir objetivos.
                </p>
                <Button onClick={() => setIsCreatePlanOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Plano</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Objetivos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => {
                      const getStatusConfig = (status: string) => {
                        switch (status) {
                          case 'active':
                            return {
                              className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
                              label: 'Ativo'
                            };
                          case 'draft':
                            return {
                              className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
                              label: 'Rascunho'
                            };
                          case 'completed':
                            return {
                              className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
                              label: 'Concluído'
                            };
                          case 'paused':
                            return {
                              className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
                              label: 'Pausado'
                            };
                          default:
                            return {
                              className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
                              label: status
                            };
                        }
                      };

                      const statusConfig = getStatusConfig(plan.status);
                      const objectivesCount = getObjectivesCountForPlan(plan.id);

                      return (
                        <TableRow key={plan.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(plan.period_start), 'MM/yyyy', { locale: ptBR })} - {format(new Date(plan.period_end), 'MM/yyyy', { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {objectivesCount} objetivo{objectivesCount !== 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig.className} border`}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {plan.vision ? (
                              <p className="text-sm text-muted-foreground truncate">
                                {plan.vision}
                              </p>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Sem visão definida</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {plan.status !== 'active' && (
                                  <DropdownMenuItem onClick={() => handlePlanActivate(plan)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Ativar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handlePlanView(plan)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePlanEdit(plan)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handlePlanDelete(plan)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Objectives Section */}
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
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
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
              {objectives.length === 0 && plans.length > 0 && (
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
                    {/* Header colorido com pilar */}
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
                            <span className="text-sm font-bold text-foreground">{calculateObjectiveProgress(
                              objectiveKeyResults, 
                              selectedPeriod,
                              selectedPeriod === 'monthly' 
                                ? { selectedMonth, selectedYear } 
                                : selectedPeriod === 'quarterly'
                                ? { selectedQuarter }
                                : undefined
                            )}%</span>
                          </div>
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            {(() => {
                            const progress = calculateObjectiveProgress(
                              objectiveKeyResults, 
                              selectedPeriod,
                              selectedPeriod === 'monthly' 
                                ? { selectedMonth, selectedYear } 
                                : selectedPeriod === 'quarterly'
                                ? { selectedQuarter }
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
          keyResults={selectedObjective ? getObjectiveKeyResults(selectedObjective.id) : []}
          pillar={selectedObjective ? pillars.find(p => p.id === selectedObjective.pillar_id) || null : null}
          plan={selectedObjective ? plans.find(p => p.id === selectedObjective.plan_id) || null : null}
          onUpdate={handleUpdateObjective}
          onDelete={handleDeleteObjective}
          onOpenKeyResultDetails={handleOpenKeyResultDetails}
          pillars={pillars}
          progressPercentage={selectedObjective ? calculateObjectiveProgress(
            getObjectiveKeyResults(selectedObjective.id), 
            selectedPeriod,
            selectedPeriod === 'monthly' 
              ? { selectedMonth, selectedYear }
              : selectedPeriod === 'quarterly'
              ? { selectedQuarter }
              : undefined
          ) : 0}
          selectedPeriod={selectedPeriod}
          selectedMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
          selectedYear={selectedPeriod === 'monthly' ? selectedYear : undefined}
          selectedQuarter={selectedPeriod === 'quarterly' ? selectedQuarter : undefined}
        />


        {/* Delete Confirmation Modal */}
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o objetivo "{selectedObjective?.title}"?
                Esta ação não pode ser desfeita e todos os resultados-chave associados também serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={deleteObjective}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir Objetivo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Plan Management Modals */}
        <PlanDetailModal
          plan={selectedPlanForDetail}
          isOpen={isPlanDetailOpen}
          onClose={() => {
            setIsPlanDetailOpen(false);
            setSelectedPlanForDetail(null);
          }}
          objectivesCount={selectedPlanForDetail ? getObjectivesCountForPlan(selectedPlanForDetail.id) : 0}
        />

        <EditPlanModal
          plan={selectedPlanForEdit}
          isOpen={isPlanEditOpen}
          onClose={() => {
            setIsPlanEditOpen(false);
            setSelectedPlanForEdit(null);
          }}
          onUpdate={updatePlan}
        />

        <DeletePlanModal
          plan={selectedPlanForDelete}
          isOpen={isPlanDeleteOpen}
          onClose={() => {
            setIsPlanDeleteOpen(false);
            setSelectedPlanForDelete(null);
          }}
          onDelete={deletePlan}
          objectivesCount={selectedPlanForDelete ? getObjectivesCountForPlan(selectedPlanForDelete.id) : 0}
        />

        {/* Activate Plan Confirmation Modal */}
        <AlertDialog open={isPlanActivateConfirmOpen} onOpenChange={setIsPlanActivateConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ativar Plano Estratégico</AlertDialogTitle>
              <AlertDialogDescription>
                Ao ativar o plano "{selectedPlanForActivate?.name}", todos os outros planos da empresa serão desativados.
                {' '}Os Objetivos Estratégicos (OEs) e Resultados-Chave (KRs) do novo plano ativo serão exibidos em todas as telas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsPlanActivateConfirmOpen(false);
                setSelectedPlanForActivate(null);
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={activatePlan} disabled={isSubmitting}>
                {isSubmitting ? 'Ativando...' : 'Ativar Plano'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
              // Buscar o objetivo associado ao key result
              const objective = objectives.find(obj => 
                obj.id === selectedKeyResultForOverview.objective_id
              );
              // Retornar o pilar do objetivo
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
