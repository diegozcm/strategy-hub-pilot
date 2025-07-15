import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Target, TrendingUp, Clock, AlertTriangle, Edit, Eye, Save, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { AddResultadoChaveModal } from '@/components/strategic-map/AddResultadoChaveModal';
import { ResultadoChaveMiniCard } from '@/components/strategic-map/ResultadoChaveMiniCard';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
  period_start: string;
  period_end: string;
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
  owner_id: string;
  created_at: string;
}

interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
  status: string;
  objective_id: string;
}

export const ObjectivesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateObjectiveOpen, setIsCreateObjectiveOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<StrategicObjective | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddResultadoChaveOpen, setIsAddResultadoChaveOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Form states
  const [objectiveForm, setObjectiveForm] = useState({
    title: '',
    description: '',
    weight: 1,
    target_date: '',
    plan_id: ''
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
    status: 'not_started'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load strategic plans
      const { data: plansData, error: plansError } = await supabase
        .from('strategic_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      if (plansData && plansData.length > 0 && selectedPlan === 'all') {
        // Keep 'all' as default to show all plans
      }

      // Load objectives
      const { data: objectivesData, error: objectivesError } = await supabase
        .from('strategic_objectives')
        .select('*')
        .order('created_at', { ascending: false });

      if (objectivesError) throw objectivesError;
      setObjectives(objectivesData || []);

      // Load key results
      const { data: keyResultsData, error: keyResultsError } = await supabase
        .from('key_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (keyResultsError) throw keyResultsError;
      setKeyResults(keyResultsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async () => {
    if (!user || !planForm.name || !planForm.period_start || !planForm.period_end) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('strategic_plans')
        .insert([{
          ...planForm,
          organization_id: user.id, // Using user id as organization for simplicity
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => [data, ...prev]);
      setSelectedPlan(data.id);
      setPlanForm({ name: '', vision: '', mission: '', period_start: '', period_end: '' });
      setIsCreatePlanOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Plano estratégico criado com sucesso!",
      });
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano estratégico. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const createObjective = async () => {
    if (!user || !objectiveForm.title || !objectiveForm.plan_id) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('strategic_objectives')
        .insert([{
          ...objectiveForm,
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setObjectives(prev => [data, ...prev]);
      setObjectiveForm({ title: '', description: '', weight: 1, target_date: '', plan_id: '' });
      setIsCreateObjectiveOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Objetivo estratégico criado com sucesso!",
      });
    } catch (error) {
      console.error('Error creating objective:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar objetivo estratégico. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openDetailModal = (objective: StrategicObjective) => {
    setSelectedObjective(objective);
    setEditForm({
      title: objective.title,
      description: objective.description || '',
      weight: objective.weight,
      target_date: objective.target_date || '',
      status: objective.status
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
    if (!selectedObjective || !editForm.title) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título do objetivo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('strategic_objectives')
        .update({
          title: editForm.title,
          description: editForm.description,
          weight: editForm.weight,
          target_date: editForm.target_date || null,
          status: editForm.status
        })
        .eq('id', selectedObjective.id)
        .select()
        .single();

      if (error) throw error;

      // Update the objectives list
      setObjectives(prev => prev.map(obj => 
        obj.id === selectedObjective.id ? data : obj
      ));
      
      setSelectedObjective(data);
      setIsEditing(false);
      
      toast({
        title: "Sucesso",
        description: "Objetivo atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating objective:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar objetivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const deleteObjective = async () => {
    if (!selectedObjective) return;

    try {
      const { error } = await supabase
        .from('strategic_objectives')
        .delete()
        .eq('id', selectedObjective.id);

      if (error) throw error;

      // Remove from objectives list
      setObjectives(prev => prev.filter(obj => obj.id !== selectedObjective.id));
      
      // Close modals
      setIsDeleteConfirmOpen(false);
      closeDetailModal();
      
      toast({
        title: "Sucesso",
        description: "Objetivo excluído com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir objetivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const createResultadoChave = async (resultadoChaveData: any) => {
    if (!selectedObjective || !user) return;

    try {
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

      // Add to key results list
      setKeyResults(prev => [data, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Resultado-chave criado com sucesso!",
      });
    } catch (error) {
      console.error('Error creating key result:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar resultado-chave. Tente novamente.",
        variant: "destructive",
      });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Objetivos Estratégicos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus objetivos e resultados-chave</p>
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
                  Defina um novo plano estratégico para sua organização.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan-name">Nome do Plano</Label>
                  <Input
                    id="plan-name"
                    value={planForm.name}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Plano Estratégico 2024-2026"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-vision">Visão</Label>
                  <Textarea
                    id="plan-vision"
                    value={planForm.vision}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, vision: e.target.value }))}
                    placeholder="Descreva a visão da organização"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-mission">Missão</Label>
                  <Textarea
                    id="plan-mission"
                    value={planForm.mission}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, mission: e.target.value }))}
                    placeholder="Descreva a missão da organização"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="period-start">Data de Início</Label>
                    <Input
                      id="period-start"
                      type="date"
                      value={planForm.period_start}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, period_start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="period-end">Data de Término</Label>
                    <Input
                      id="period-end"
                      type="date"
                      value={planForm.period_end}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, period_end: e.target.value }))}
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
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateObjectiveOpen} onOpenChange={setIsCreateObjectiveOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Objetivo Estratégico</DialogTitle>
                <DialogDescription>
                  Defina um novo objetivo estratégico para alcançar suas metas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objective-plan">Plano Estratégico</Label>
                  <Select 
                    value={objectiveForm.plan_id} 
                    onValueChange={(value) => setObjectiveForm(prev => ({ ...prev, plan_id: value }))}
                  >
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
                    placeholder="Descreva o objetivo em detalhes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="objective-weight">Peso (1-10)</Label>
                    <Input
                      id="objective-weight"
                      type="number"
                      min="1"
                      max="10"
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
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateObjectiveOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createObjective}>
                    Criar Objetivo
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar objetivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os planos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="not_started">Não Iniciado</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="at_risk">Em Risco</SelectItem>
              <SelectItem value="delayed">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty State */}
      {plans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum plano estratégico encontrado</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro plano estratégico.</p>
            <Button onClick={() => setIsCreatePlanOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : filteredObjectives.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum objetivo encontrado</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro objetivo estratégico.</p>
            <Button onClick={() => setIsCreateObjectiveOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Objetivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Objectives Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredObjectives.map((objective) => {
            const objectiveKRs = getObjectiveKeyResults(objective.id);
            const completedKRs = objectiveKRs.filter(kr => kr.status === 'completed').length;
            const avgProgress = objectiveKRs.length > 0 
              ? objectiveKRs.reduce((acc, kr) => acc + ((kr.current_value / kr.target_value) * 100), 0) / objectiveKRs.length
              : objective.progress;

            return (
              <Card 
                key={objective.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openDetailModal(objective)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{objective.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {objective.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className={`${getStatusColor(objective.status)} text-white`}>
                      {getStatusText(objective.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progresso</span>
                        <span className="font-medium">{Math.round(avgProgress)}%</span>
                      </div>
                      <Progress value={avgProgress} className="h-2" />
                    </div>

                    {/* Key Results Summary */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Resultados-Chave
                      </div>
                      <span className="font-medium">
                        {completedKRs}/{objectiveKRs.length} concluídos
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Peso: {objective.weight}/10
                      </div>
                      {objective.target_date && (
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {new Date(objective.target_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail/Edit Modal */}
      {selectedObjective && (
        <Dialog open={isDetailModalOpen} onOpenChange={closeDetailModal}>
          <DialogContent className="w-[95vw] max-w-2xl sm:w-full">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {isEditing ? 'Editar Objetivo' : 'Detalhes do Objetivo'}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing ? 'Edite as informações do objetivo estratégico' : 'Visualize e gerencie seu objetivo estratégico'}
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddResultadoChaveOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Resultado-Chave
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeleteConfirmOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={updateObjective}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                
                <div>
                  <Label htmlFor="detail-title">Título</Label>
                  {isEditing ? (
                    <Input
                      id="detail-title"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do objetivo"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedObjective.title}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="detail-description">Descrição</Label>
                  {isEditing ? (
                    <Textarea
                      id="detail-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do objetivo"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md min-h-[80px]">
                      {selectedObjective.description || 'Nenhuma descrição fornecida'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="detail-weight">Peso</Label>
                    {isEditing ? (
                      <Input
                        id="detail-weight"
                        type="number"
                        min="1"
                        max="10"
                        value={editForm.weight}
                        onChange={(e) => setEditForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedObjective.weight}/10</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="detail-status">Status</Label>
                    {isEditing ? (
                      <Select 
                        value={editForm.status} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Não Iniciado</SelectItem>
                          <SelectItem value="in_progress">Em Progresso</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="at_risk">Em Risco</SelectItem>
                          <SelectItem value="delayed">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <Badge variant="secondary" className={`${getStatusColor(selectedObjective.status)} text-white`}>
                          {getStatusText(selectedObjective.status)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="detail-target-date">Data Meta</Label>
                    {isEditing ? (
                      <Input
                        id="detail-target-date"
                        type="date"
                        value={editForm.target_date}
                        onChange={(e) => setEditForm(prev => ({ ...prev, target_date: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedObjective.target_date 
                          ? new Date(selectedObjective.target_date).toLocaleDateString('pt-BR')
                          : 'Não definida'
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Results Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Resultados-Chave</h3>
                  <Badge variant="outline">
                    {getObjectiveKeyResults(selectedObjective.id).length} Resultados-Chave
                  </Badge>
                </div>

                {getObjectiveKeyResults(selectedObjective.id).length > 0 ? (
                  <div className="space-y-3">
                    {getObjectiveKeyResults(selectedObjective.id).map((kr) => {
                      const progress = kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0;
                      return (
                        <Card key={kr.id} className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm">{kr.title}</h4>
                              <Badge 
                                variant={kr.status === 'completed' ? 'default' : 'secondary'}
                                className={kr.status === 'completed' ? 'bg-green-500 text-white' : ''}
                              >
                                {getStatusText(kr.status)}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{kr.current_value} / {kr.target_value} {kr.unit}</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum resultado-chave definido</p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3">Informações Adicionais</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Plano:</span>
                    <span className="ml-2 font-medium">
                      {plans.find(p => p.id === selectedObjective.plan_id)?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Criado em:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedObjective.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Progresso Geral:</span>
                    <span className="ml-2 font-medium">
                      {selectedObjective.progress || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Resultado-Chave Modal */}
      {selectedObjective && (
        <AddResultadoChaveModal
          objectiveId={selectedObjective.id}
          open={isAddResultadoChaveOpen}
          onClose={() => setIsAddResultadoChaveOpen(false)}
          onSave={async (resultadoChaveData) => {
            await createResultadoChave(resultadoChaveData);
            setIsAddResultadoChaveOpen(false);
          }}
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
    </div>
  );
};