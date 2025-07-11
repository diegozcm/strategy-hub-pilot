import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Target, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);

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
          <p className="text-gray-600 mt-2">Gerencie seus objetivos e resultados-chave (OKRs)</p>
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
              <Card key={objective.id} className="hover:shadow-lg transition-shadow">
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
                        Key Results
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
    </div>
  );
};