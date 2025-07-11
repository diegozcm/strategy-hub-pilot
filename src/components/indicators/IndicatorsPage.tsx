import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, Edit, BarChart3, TrendingUp, TrendingDown, Calendar, User, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Indicator {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  target_value: number;
  current_value: number;
  measurement_frequency: string;
  owner_id: string;
  status: string;
  priority: string;
  last_updated: string;
  created_at: string;
}

interface IndicatorValue {
  id: string;
  indicator_id: string;
  value: number;
  period_date: string;
  comments: string;
  recorded_by: string;
  created_at: string;
}

interface StrategicObjective {
  id: string;
  title: string;
}

export const IndicatorsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [indicatorValues, setIndicatorValues] = useState<IndicatorValue[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: '',
    target_value: '',
    measurement_frequency: '',
    priority: 'medium',
    strategic_objective_id: ''
  });
  
  const [updateData, setUpdateData] = useState({
    value: '',
    period_date: new Date().toISOString().split('T')[0],
    comments: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load indicators
      const { data: indicatorsData, error: indicatorsError } = await supabase
        .from('indicators')
        .select('*')
        .order('created_at', { ascending: false });

      if (indicatorsError) throw indicatorsError;
      setIndicators(indicatorsData || []);

      // Load indicator values
      const { data: valuesData, error: valuesError } = await supabase
        .from('indicator_values')
        .select('*')
        .order('period_date', { ascending: false });

      if (valuesError) throw valuesError;
      setIndicatorValues(valuesData || []);

      // Load strategic objectives
      const { data: objectivesData, error: objectivesError } = await supabase
        .from('strategic_objectives')
        .select('id, title')
        .order('title');

      if (objectivesError) throw objectivesError;
      setObjectives(objectivesData || []);

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

  const handleCreateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('indicators')
        .insert([{
          ...formData,
          target_value: parseFloat(formData.target_value),
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setIndicators(prev => [data, ...prev]);
      setFormData({
        name: '',
        description: '',
        category: '',
        unit: '',
        target_value: '',
        measurement_frequency: '',
        priority: 'medium',
        strategic_objective_id: ''
      });
      setIsAddModalOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Indicador criado com sucesso!",
      });
    } catch (error) {
      console.error('Error creating indicator:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar indicador. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedIndicator) return;

    try {
      setIsSubmitting(true);
      
      // Insert new value record
      const { data: valueData, error: valueError } = await supabase
        .from('indicator_values')
        .insert([{
          indicator_id: selectedIndicator.id,
          value: parseFloat(updateData.value),
          period_date: updateData.period_date,
          comments: updateData.comments,
          recorded_by: user.id
        }])
        .select()
        .single();

      if (valueError) throw valueError;

      // Update current value in indicator
      const { error: updateError } = await supabase
        .from('indicators')
        .update({ 
          current_value: parseFloat(updateData.value),
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedIndicator.id);

      if (updateError) throw updateError;

      // Update local state
      setIndicators(prev => prev.map(ind => 
        ind.id === selectedIndicator.id 
          ? { ...ind, current_value: parseFloat(updateData.value) }
          : ind
      ));
      setIndicatorValues(prev => [valueData, ...prev]);
      
      setUpdateData({
        value: '',
        period_date: new Date().toISOString().split('T')[0],
        comments: ''
      });
      setIsUpdateModalOpen(false);
      setSelectedIndicator(null);
      
      toast({
        title: "Sucesso",
        description: "Valor atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating value:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar valor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProgress = (indicator: Indicator) => {
    if (indicator.target_value === 0) return 0;
    return Math.min(Math.round((indicator.current_value / indicator.target_value) * 100), 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600';
    if (progress >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return '💰';
      case 'operational': return '⚙️';
      case 'customer': return '👥';
      case 'people': return '👨‍💼';
      case 'quality': return '⭐';
      default: return '📊';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'financial': return 'Financeiro';
      case 'operational': return 'Operacional';
      case 'customer': return 'Cliente';
      case 'people': return 'Pessoas';
      case 'quality': return 'Qualidade';
      default: return category;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'yearly': return 'Anual';
      default: return frequency;
    }
  };

  const getIndicatorHistory = (indicatorId: string) => {
    return indicatorValues
      .filter(value => value.indicator_id === indicatorId)
      .slice(0, 10)
      .reverse();
  };

  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || indicator.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || indicator.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || indicator.priority === priorityFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Indicadores</h1>
            <p className="text-gray-600 mt-2">Acompanhe KPIs e métricas estratégicas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Indicadores</h1>
          <p className="text-gray-600 mt-2">Acompanhe KPIs e métricas estratégicas</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Indicador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Indicador</DialogTitle>
                <DialogDescription>
                  Cadastre um novo indicador estratégico para acompanhamento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateIndicator} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Indicador *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Taxa de Conversão"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">💰 Financeiro</SelectItem>
                        <SelectItem value="operational">⚙️ Operacional</SelectItem>
                        <SelectItem value="customer">👥 Cliente</SelectItem>
                        <SelectItem value="people">👨‍💼 Pessoas</SelectItem>
                        <SelectItem value="quality">⭐ Qualidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o que este indicador mede..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_value">Meta *</Label>
                    <Input
                      id="target_value"
                      type="number"
                      step="0.01"
                      placeholder="100"
                      value={formData.target_value}
                      onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade *</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="%">% (Percentual)</SelectItem>
                        <SelectItem value="R$">R$ (Real)</SelectItem>
                        <SelectItem value="unidades">Unidades</SelectItem>
                        <SelectItem value="dias">Dias</SelectItem>
                        <SelectItem value="score">Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequência *</Label>
                    <Select value={formData.measurement_frequency} onValueChange={(value) => setFormData({...formData, measurement_frequency: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="objective">Objetivo Estratégico</Label>
                    <Select value={formData.strategic_objective_id} onValueChange={(value) => setFormData({...formData, strategic_objective_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives.map((objective) => (
                          <SelectItem key={objective.id} value={objective.id}>
                            {objective.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Indicador'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar indicadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="financial">💰 Financeiro</SelectItem>
              <SelectItem value="operational">⚙️ Operacional</SelectItem>
              <SelectItem value="customer">👥 Cliente</SelectItem>
              <SelectItem value="people">👨‍💼 Pessoas</SelectItem>
              <SelectItem value="quality">⭐ Qualidade</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="completed">Completo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIndicators.map((indicator) => {
          const progress = calculateProgress(indicator);
          const history = getIndicatorHistory(indicator.id);
          
          return (
            <Card key={indicator.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getCategoryIcon(indicator.category)}</span>
                      <CardTitle className="text-lg leading-tight">{indicator.name}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{indicator.description}</p>
                  </div>
                  <Badge variant={getPriorityColor(indicator.priority)}>
                    {getPriorityText(indicator.priority)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progresso</span>
                    <span className={`font-semibold ${getProgressColor(progress)}`}>
                      {progress}% do objetivo
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {indicator.current_value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-600">Atual {indicator.unit}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {indicator.target_value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-600">Meta {indicator.unit}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categoria:</span>
                    <Badge variant="outline">{getCategoryText(indicator.category)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequência:</span>
                    <span>{getFrequencyText(indicator.measurement_frequency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={indicator.status === 'active' ? 'default' : 'secondary'}>
                      {indicator.status === 'active' ? 'Ativo' : indicator.status === 'paused' ? 'Pausado' : 'Completo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3">
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedIndicator(indicator);
                      setIsUpdateModalOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Atualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedIndicator(indicator);
                      setIsDetailsModalOpen(true);
                    }}
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Detalhes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredIndicators.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum indicador encontrado</h3>
          <p className="text-gray-500 mb-4">Crie seu primeiro indicador para começar o acompanhamento.</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Indicador
          </Button>
        </div>
      )}

      {/* Update Value Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Valor</DialogTitle>
            <DialogDescription>
              Registre o novo valor para: {selectedIndicator?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateValue} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_value">Novo Valor *</Label>
              <Input
                id="new_value"
                type="number"
                step="0.01"
                placeholder="Digite o novo valor"
                value={updateData.value}
                onChange={(e) => setUpdateData({...updateData, value: e.target.value})}
                required
              />
              {selectedIndicator && (
                <p className="text-sm text-gray-600">
                  Valor atual: {selectedIndicator.current_value.toLocaleString('pt-BR')} {selectedIndicator.unit}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period_date">Data de Referência *</Label>
              <Input
                id="period_date"
                type="date"
                value={updateData.period_date}
                onChange={(e) => setUpdateData({...updateData, period_date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comentários</Label>
              <Textarea
                id="comments"
                placeholder="Observações sobre esta medição..."
                value={updateData.comments}
                onChange={(e) => setUpdateData({...updateData, comments: e.target.value})}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Atualizando...' : 'Atualizar Valor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Indicador</DialogTitle>
            <DialogDescription>
              {selectedIndicator?.name} - Histórico e estatísticas
            </DialogDescription>
          </DialogHeader>
          {selectedIndicator && (
            <div className="space-y-6">
              {/* Chart */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Histórico de Valores</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getIndicatorHistory(selectedIndicator.id)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period_date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        name="Valor Real"
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => selectedIndicator.target_value} 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Meta"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Updates */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Últimas Atualizações</h3>
                <div className="space-y-3">
                  {getIndicatorHistory(selectedIndicator.id).slice(0, 5).map((update) => (
                    <div key={update.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{update.value.toLocaleString('pt-BR')} {selectedIndicator.unit}</p>
                          <p className="text-sm text-gray-600">{update.comments}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{new Date(update.period_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};