import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Target, TrendingUp, Clock, AlertTriangle, Edit, Eye, Save, X, Trash2, Layout, MoreVertical, Calendar } from 'lucide-react';
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
import { AddResultadoChaveModal } from '@/components/strategic-map/AddResultadoChaveModal';
import { ResultadoChaveMiniCard } from '@/components/strategic-map/ResultadoChaveMiniCard';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { KeyResult } from '@/types/strategic-map';
import { PlanCard } from './PlanCard';
import { PlanDetailModal } from './PlanDetailModal';
import { EditPlanModal } from './EditPlanModal';
import { DeletePlanModal } from './DeletePlanModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useObjectivesData } from '@/hooks/useObjectivesData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface StrategicObjective {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  weight: number;
  target_date: string;
  plan_id: string;
  pillar_id: string;
  owner_id: string;
  created_at: string;
}

interface StrategicPillar {
  id: string;
  name: string;
  description: string;
  color: string;
  company_id: string;
}

export const ObjectivesPage: React.FC = () => {
  const { user, company: authCompany } = useAuth();
  const { toast } = useToast();
  
  // Use our new data management hook
  const { 
    objectives, plans, pillars, keyResults, loading, error,
    setObjectives, setPlans, setPillars, setKeyResults,
    refreshData, invalidateAndReload, handleError, clearError
  } = useObjectivesData();
  
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateObjectiveOpen, setIsCreateObjectiveOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<StrategicObjective | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddResultadoChaveOpen, setIsAddResultadoChaveOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Plan management states
  const [selectedPlanForDetail, setSelectedPlanForDetail] = useState<StrategicPlan | null>(null);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<StrategicPlan | null>(null);
  const [selectedPlanForDelete, setSelectedPlanForDelete] = useState<StrategicPlan | null>(null);
  const [isPlanDetailOpen, setIsPlanDetailOpen] = useState(false);
  const [isPlanEditOpen, setIsPlanEditOpen] = useState(false);
  const [isPlanDeleteOpen, setIsPlanDeleteOpen] = useState(false);

  // Form states
  const [objectiveForm, setObjectiveForm] = useState({
    title: '',
    description: '',
    weight: 50, // Use default value from database
    target_date: '',
    plan_id: '',
    pillar_id: '',
    status: 'not_started',
    progress: 0
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
    weight: 1,
    target_date: '',
    status: 'not_started',
    pillar_id: ''
  });

  // Clear error when component mounts or when user changes
  useEffect(() => {
    clearError();
  }, [user, authCompany, clearError]);

  // Data management is handled by useObjectivesData hook
  useEffect(() => {
    if (user && authCompany) {
      loadData();
    }
  }, [authCompany?.id]);

  const loadData = async () => {
    try {
      // Remove old loadData references since we use the hook now
      
      if (!user || !authCompany) {
        setPlans([]);
        setObjectives([]);
        setKeyResults([]);
        setPillars([]);
        return;
      }
      
      // Load strategic plans with explicit company validation
      const { data: plansData, error: plansError } = await supabase
        .from('strategic_plans')
        .select('*')
        .eq('company_id', authCompany.id)
        .order('created_at', { ascending: false });

      if (plansError) {
        console.error('Error loading plans:', plansError);
        throw plansError;
      }
      
      // Ensure we only use plans from the current company
      const validPlans = (plansData || []).filter(plan => plan.company_id === authCompany.id);
      setPlans(validPlans);

      // Load strategic pillars
      const { data: pillarsData, error: pillarsError } = await supabase
        .from('strategic_pillars')
        .select('*')
        .eq('company_id', authCompany.id)
        .order('order_index', { ascending: true });

      if (pillarsError) throw pillarsError;
      setPillars(pillarsData || []);

      // Load objectives - filter by plans from the same company
      let objectivesQuery = supabase
        .from('strategic_objectives')
        .select('*');
      
      if (plansData && plansData.length > 0) {
        const planIds = plansData.map(plan => plan.id);
        objectivesQuery = objectivesQuery.in('plan_id', planIds);
      } else {
        // If no plans, set empty objectives
        setObjectives([]);
        setKeyResults([]);
        return;
      }
      
      const { data: objectivesData, error: objectivesError } = await objectivesQuery
        .order('created_at', { ascending: false });

      if (objectivesError) throw objectivesError;
      setObjectives(objectivesData || []);

      // Load key results - filter by objectives from this company
      if (objectivesData && objectivesData.length > 0) {
        const objectiveIds = objectivesData.map(obj => obj.id);
        const { data: keyResultsData, error: keyResultsError } = await supabase
          .from('key_results')
          .select('*')
          .in('objective_id', objectiveIds)
          .order('created_at', { ascending: false });

        if (keyResultsError) throw keyResultsError;
        setKeyResults((keyResultsData || []) as unknown as KeyResult[]);
      } else {
        setKeyResults([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      // Loading is handled by the hook
    }
  };

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
          status: 'active'
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
        description: "Plano estratégico criado com sucesso!",
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

    // Validate weight
    if (objectiveForm.weight < 1 || objectiveForm.weight > 100) {
      toast({
        title: "Erro",
        description: "O peso deve ser um valor entre 1 e 100.",
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const objectiveData = {
        ...objectiveForm,
        owner_id: user.id,
        target_date: objectiveForm.target_date ? objectiveForm.target_date : null,
        status: 'not_started',
        progress: 0,
        weight: Math.max(1, Math.min(100, objectiveForm.weight)) // Ensure weight is in valid range
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
        weight: 50, // Use default value 
        target_date: '', 
        plan_id: '', 
        pillar_id: '',
        status: 'not_started',
        progress: 0
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
      weight: objective.weight,
      target_date: objective.target_date || '',
      status: objective.status,
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

  const updateObjective = async () => {
    if (!selectedObjective || !editForm.title || !editForm.pillar_id) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios incluindo o pilar estratégico.",
        variant: "destructive",
      });
      return;
    }

    // Validate weight
    if (editForm.weight < 1 || editForm.weight > 100) {
      toast({
        title: "Erro",
        description: "O peso deve ser um valor entre 1 e 100.",
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('🔄 Updating objective:', selectedObjective.id);
      
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        weight: Math.max(1, Math.min(100, editForm.weight)), // Ensure valid range
        target_date: editForm.target_date || null,
        status: editForm.status,
        pillar_id: editForm.pillar_id
      };

      const { data, error } = await supabase
        .from('strategic_objectives')
        .update(updateData)
        .eq('id', selectedObjective.id)
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      setObjectives(prev => prev.map(obj => 
        obj.id === selectedObjective.id ? data : obj
      ));
      
      setSelectedObjective(data);
      setIsEditing(false);
      
      toast({
        title: "Sucesso",
        description: "Objetivo atualizado com sucesso!",
      });

      // Reload data to ensure consistency
      await invalidateAndReload();
      console.log('✅ Objective updated successfully');
    } catch (error) {
      handleError(error, 'atualizar objetivo');
      // Revert optimistic update if needed
      await refreshData();
    } finally {
      setIsSubmitting(false);
    }
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

  const createResultadoChave = async (resultadoChaveData: any) => {
    if (!selectedObjective || !user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('🔄 Creating key result for objective:', selectedObjective.id);
      
      const { data, error } = await supabase
        .from('key_results')
        .insert([{
          ...resultadoChaveData,
          objective_id: selectedObjective.id,
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      setKeyResults(prev => [data as unknown as KeyResult, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Resultado-chave criado com sucesso!",
      });

      // Reload data to ensure consistency
      await invalidateAndReload();
      console.log('✅ Key result created successfully');
    } catch (error) {
      handleError(error, 'criar resultado-chave');
      // Revert optimistic update if needed
      await refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'at_risk': return 'bg-yellow-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in_progress': return 'Em Progresso';
      case 'at_risk': return 'Em Risco';
      case 'delayed': return 'Atrasado';
      default: return 'Não Iniciado';
    }
  };

  const filteredObjectives = objectives.filter(objective => {
    const matchesSearch = objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         objective.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || objective.status === statusFilter;
    const matchesPlan = selectedPlan === 'all' || objective.plan_id === selectedPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getObjectiveKeyResults = (objectiveId: string) => {
    return keyResults.filter(kr => kr.objective_id === objectiveId);
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

  const getObjectivesCountForPlan = (planId: string) => {
    return objectives.filter(obj => obj.plan_id === planId).length;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Objetivos Estratégicos</h1>
            <p className="text-gray-600 mt-2">Gerencie seus objetivos e resultados-chave (OKRs)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Block access if no company is associated
  if (!authCompany) {
    return <NoCompanyMessage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Objetivos Estratégicos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus planos estratégicos e objetivos</p>
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
                        <Label htmlFor="objective-weight">Peso (%)</Label>
                        <Input
                          id="objective-weight"
                          type="number"
                          min="1"
                          max="100"
                          value={objectiveForm.weight}
                          onChange={(e) => setObjectiveForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar objetivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="not_started">Não Iniciado</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="at_risk">Em Risco</SelectItem>
                <SelectItem value="delayed">Atrasado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
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
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => openDetailModal(objective)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {objective.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: `${pillar?.color}20`, color: pillar?.color }}
                          >
                            {pillar?.name}
                          </Badge>
                          <Badge variant="outline">
                            {plan?.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(objective.status)}`}></div>
                        <span className="text-xs text-gray-500">{getStatusText(objective.status)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {objective.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{objective.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Target className="w-3 h-3" />
                          <span>{objectiveKeyResults.length} resultados-chave</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>Peso: {objective.weight}%</span>
                        </div>
                      </div>
                      {objective.target_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Meta: {new Date(objective.target_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      <Progress value={objective.progress || 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Objective Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={closeDetailModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl">
                  {isEditing ? 'Editar Objetivo' : 'Detalhes do Objetivo'}
                </DialogTitle>
                <DialogDescription>
                  {selectedObjective && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {pillars.find(p => p.id === selectedObjective.pillar_id)?.name}
                      </Badge>
                      <Badge variant="outline">
                        {plans.find(p => p.id === selectedObjective.plan_id)?.name}
                      </Badge>
                    </div>
                  )}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirmOpen(true)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </>
                )}
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {selectedObjective && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Título</Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-weight">Peso (%)</Label>
                      <Input
                        id="edit-weight"
                        type="number"
                        min="1"
                        max="100"
                        value={editForm.weight}
                        onChange={(e) => setEditForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-target-date">Data Meta</Label>
                      <Input
                        id="edit-target-date"
                        type="date"
                        value={editForm.target_date}
                        onChange={(e) => setEditForm(prev => ({ ...prev, target_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Não Iniciado</SelectItem>
                          <SelectItem value="in_progress">Em Progresso</SelectItem>
                          <SelectItem value="at_risk">Em Risco</SelectItem>
                          <SelectItem value="delayed">Atrasado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-pillar">Pilar Estratégico</Label>
                      <Select value={editForm.pillar_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, pillar_id: value }))}>
                        <SelectTrigger>
                          <SelectValue />
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
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={updateObjective}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Descrição</h3>
                    <p className="text-gray-600">{selectedObjective.description || 'Nenhuma descrição fornecida.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">Peso</h4>
                      <p className="text-lg">{selectedObjective.weight}%</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">Status</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedObjective.status)}`}></div>
                        <span>{getStatusText(selectedObjective.status)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedObjective.target_date && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">Data Meta</h4>
                      <p>{new Date(selectedObjective.target_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Resultados-Chave</h3>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsAddResultadoChaveOpen(true)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {getObjectiveKeyResults(selectedObjective.id).map((kr) => (
                        <ResultadoChaveMiniCard key={kr.id} resultadoChave={kr} />
                      ))}
                      {getObjectiveKeyResults(selectedObjective.id).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nenhum resultado-chave definido. Clique em "Adicionar" para criar o primeiro.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Key Result Modal */}
      {selectedObjective && (
        <AddResultadoChaveModal
          objectiveId={selectedObjective.id}
          open={isAddResultadoChaveOpen}
          onClose={() => setIsAddResultadoChaveOpen(false)}
          onSave={createResultadoChave}
        />
      )}

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
    </div>
  );
};