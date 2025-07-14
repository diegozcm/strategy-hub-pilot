import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, Edit, BarChart3, TrendingUp, TrendingDown, Calendar, User, Target, AlertTriangle, CheckCircle, Activity, Trash2, Save, X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface KeyResult {
  id: string;
  title: string;
  description: string;
  category: string;
  unit: string;
  target_value: number;
  current_value: number;
  frequency: string;
  owner_id: string;
  status: string;
  priority: string;
  last_updated: string;
  created_at: string;
  objective_id: string;
}

interface KeyResultValue {
  id: string;
  key_result_id: string;
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
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [keyResultValues, setKeyResultValues] = useState<KeyResultValue[]>([]);
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    unit: '',
    target_value: '',
    frequency: '',
    priority: 'medium',
    objective_id: 'none'
  });
  
  
  const [updateData, setUpdateData] = useState({
    value: '',
    period_date: new Date().toISOString().split('T')[0],
    comments: ''
  });

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: '',
    unit: '',
    target_value: '',
    frequency: '',
    priority: 'medium',
    objective_id: '',
    status: 'not_started'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Highlight key result if navigated from objectives
  useEffect(() => {
    const highlightId = localStorage.getItem('highlightKeyResult');
    if (highlightId) {
      setTimeout(() => {
        const element = document.getElementById(`kr-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.boxShadow = '0 0 0 3px hsl(var(--primary))';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 3000);
        }
      }, 500);
      localStorage.removeItem('highlightKeyResult');
    }
  }, [keyResults]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load key results with categories
      const { data: keyResultsData, error: keyResultsError } = await supabase
        .from('key_results')
        .select('*')
        .not('category', 'is', null)
        .order('created_at', { ascending: false });

      if (keyResultsError) throw keyResultsError;
      setKeyResults(keyResultsData || []);

      // Load key result values
      const { data: valuesData, error: valuesError } = await supabase
        .from('key_result_values')
        .select('*')
        .order('period_date', { ascending: false });

      if (valuesError) throw valuesError;
      setKeyResultValues(valuesData || []);

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

  const handleCreateKeyResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('key_results')
        .insert([{
          ...formData,
          target_value: parseFloat(formData.target_value),
          objective_id: formData.objective_id === 'none' ? null : formData.objective_id || null,
          owner_id: user.id,
          current_value: 0,
          last_updated: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setKeyResults(prev => [data, ...prev]);
      setFormData({
        title: '',
        description: '',
        category: '',
        unit: '',
        target_value: '',
        frequency: '',
        priority: 'medium',
        objective_id: 'none'
      });
      setIsAddModalOpen(false);
      
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedKeyResult) return;

    try {
      setIsSubmitting(true);
      
      // Insert new value record
      const { data: valueData, error: valueError } = await supabase
        .from('key_result_values')
        .insert([{
          key_result_id: selectedKeyResult.id,
          value: parseFloat(updateData.value),
          period_date: updateData.period_date,
          comments: updateData.comments,
          recorded_by: user.id
        }])
        .select()
        .single();

      if (valueError) throw valueError;

      // Update current value in key result
      const { error: updateError } = await supabase
        .from('key_results')
        .update({ 
          current_value: parseFloat(updateData.value),
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedKeyResult.id);

      if (updateError) throw updateError;

      // Update local state
      setKeyResults(prev => prev.map(kr => 
        kr.id === selectedKeyResult.id 
          ? { ...kr, current_value: parseFloat(updateData.value) }
          : kr
      ));
      setKeyResultValues(prev => [valueData, ...prev]);
      
      setUpdateData({
        value: '',
        period_date: new Date().toISOString().split('T')[0],
        comments: ''
      });
      setIsUpdateModalOpen(false);
      setSelectedKeyResult(null);
      
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

  const handleEditKeyResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedKeyResult) return;

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('key_results')
        .update({
          title: editData.title,
          description: editData.description,
          category: editData.category,
          unit: editData.unit,
          target_value: parseFloat(editData.target_value),
          frequency: editData.frequency,
          priority: editData.priority,
          objective_id: editData.objective_id === 'none' ? null : editData.objective_id || null,
          status: editData.status,
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedKeyResult.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setKeyResults(prev => prev.map(kr => 
        kr.id === selectedKeyResult.id ? data : kr
      ));
      
      setIsEditModalOpen(false);
      setSelectedKeyResult(null);
      
      toast({
        title: "Sucesso",
        description: "Resultado-chave atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating key result:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar resultado-chave. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKeyResult = async () => {
    if (!selectedKeyResult) return;

    try {
      setIsSubmitting(true);
      
      // Delete key result (this will cascade delete key_result_values)
      const { error } = await supabase
        .from('key_results')
        .delete()
        .eq('id', selectedKeyResult.id);

      if (error) throw error;

      // Update local state
      setKeyResults(prev => prev.filter(kr => kr.id !== selectedKeyResult.id));
      setKeyResultValues(prev => prev.filter(krv => krv.key_result_id !== selectedKeyResult.id));
      
      // Reload data to ensure consistency across the app
      setTimeout(loadData, 500);
      
      setIsDeleteConfirmOpen(false);
      setSelectedKeyResult(null);
      
      toast({
        title: "Sucesso",
        description: "Resultado-chave excluído com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting key result:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir resultado-chave. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (keyResult: KeyResult) => {
    setSelectedKeyResult(keyResult);
    setEditData({
      title: keyResult.title,
      description: keyResult.description || '',
      category: keyResult.category,
      unit: keyResult.unit,
      target_value: keyResult.target_value.toString(),
      frequency: keyResult.frequency,
      priority: keyResult.priority,
      objective_id: keyResult.objective_id || 'none',
      status: keyResult.status
    });
    setIsEditModalOpen(true);
  };

  const calculateProgress = (keyResult: KeyResult) => {
    if (keyResult.target_value === 0) return 0;
    return Math.min(Math.round((keyResult.current_value / keyResult.target_value) * 100), 100);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Não Iniciado';
      case 'in_progress': return 'Em Progresso';
      case 'completed': return 'Completo';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  const getKeyResultHistory = (keyResultId: string) => {
    return keyResultValues
      .filter(value => value.key_result_id === keyResultId)
      .slice(0, 10)
      .reverse();
  };

  const filteredKeyResults = keyResults.filter(keyResult => {
    const matchesSearch = keyResult.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         keyResult.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || keyResult.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || keyResult.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || keyResult.priority === priorityFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  // Calculate summary statistics
  const totalKeyResults = keyResults.length;
  const onTargetKeyResults = keyResults.filter(kr => calculateProgress(kr) >= 90).length;
  const atRiskKeyResults = keyResults.filter(kr => {
    const progress = calculateProgress(kr);
    return progress >= 70 && progress < 90;
  }).length;
  const criticalKeyResults = keyResults.filter(kr => calculateProgress(kr) < 70).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Resultados-Chave</h1>
            <p className="text-muted-foreground mt-2">Acompanhe resultados-chave e métricas estratégicas</p>
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
          <h1 className="text-3xl font-bold">Resultados-Chave</h1>
          <p className="text-muted-foreground mt-2">Acompanhe resultados-chave e métricas estratégicas em tempo real</p>
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
                Novo Resultado-Chave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Resultado-Chave</DialogTitle>
                <DialogDescription>
                  Cadastre um novo resultado-chave estratégico para acompanhamento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateKeyResult} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Nome do Resultado-Chave *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Taxa de Conversão"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                    placeholder="Descreva o que este resultado-chave mede..."
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
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="dias">Dias</SelectItem>
                        <SelectItem value="score">Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequência *</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({...formData, frequency: value})}>
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
                    <Select value={formData.objective_id} onValueChange={(value) => setFormData({...formData, objective_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um objetivo" />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="none">Nenhum objetivo</SelectItem>
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
                    {isSubmitting ? 'Salvando...' : 'Salvar Resultado-Chave'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Resultados-Chave</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{totalKeyResults}</p>
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">No Alvo</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-green-600">{onTargetKeyResults}</p>
                  <span className="text-sm text-muted-foreground">
                    ({totalKeyResults > 0 ? Math.round((onTargetKeyResults / totalKeyResults) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Atenção</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-yellow-600">{atRiskKeyResults}</p>
                  <span className="text-sm text-muted-foreground">
                    ({totalKeyResults > 0 ? Math.round((atRiskKeyResults / totalKeyResults) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Críticos</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-red-600">{criticalKeyResults}</p>
                  <span className="text-sm text-muted-foreground">
                    ({totalKeyResults > 0 ? Math.round((criticalKeyResults / totalKeyResults) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar resultados-chave..."
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
              <SelectItem value="not_started">Não Iniciado</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="completed">Completo</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Key Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKeyResults.map((keyResult) => {
          const progress = calculateProgress(keyResult);
          const history = getKeyResultHistory(keyResult.id);
          
          return (
            <Card key={keyResult.id} id={`kr-${keyResult.id}`} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getCategoryIcon(keyResult.category)}</span>
                      <CardTitle className="text-lg leading-tight">{keyResult.title}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{keyResult.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(keyResult.priority)}>
                      {getPriorityText(keyResult.priority)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedKeyResult(keyResult);
                            setIsUpdateModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Atualizar Valor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(keyResult)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Resultado-Chave
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedKeyResult(keyResult);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedKeyResult(keyResult);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className={`font-semibold ${getProgressColor(progress)}`}>
                      {progress}% do objetivo
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg border">
                    <p className="text-2xl font-bold text-primary">
                      {keyResult.current_value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">Atual {keyResult.unit}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-600">
                      {keyResult.target_value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">Meta {keyResult.unit}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Categoria:</span>
                    <Badge variant="outline">{getCategoryText(keyResult.category)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Frequência:</span>
                    <span className="font-medium">{getFrequencyText(keyResult.frequency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={keyResult.status === 'in_progress' ? 'default' : 'secondary'}>
                      {getStatusText(keyResult.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Última atualização:</span>
                    <span className="text-xs font-medium">
                      {new Date(keyResult.last_updated).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredKeyResults.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {keyResults.length === 0 ? 'Nenhum resultado-chave cadastrado' : 'Nenhum resultado-chave encontrado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {keyResults.length === 0 
                ? 'Crie seu primeiro resultado-chave para começar o acompanhamento de KRs.' 
                : 'Tente ajustar os filtros para encontrar os resultados-chave desejados.'}
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Resultado-Chave
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Update Value Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Valor</DialogTitle>
            <DialogDescription>
              Registre o novo valor para: {selectedKeyResult?.title}
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
              {selectedKeyResult && (
                <p className="text-sm text-muted-foreground">
                  Valor atual: {selectedKeyResult.current_value.toLocaleString('pt-BR')} {selectedKeyResult.unit}
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
            <DialogTitle>Detalhes do Resultado-Chave</DialogTitle>
            <DialogDescription>
              {selectedKeyResult?.title} - Histórico e estatísticas
            </DialogDescription>
          </DialogHeader>
          {selectedKeyResult && (
            <div className="space-y-6">
              {/* Key Result Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {selectedKeyResult.current_value.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-muted-foreground">Valor Atual</div>
                    <div className="text-xs text-muted-foreground mt-1">{selectedKeyResult.unit}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {selectedKeyResult.target_value.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-muted-foreground">Meta</div>
                    <div className="text-xs text-muted-foreground mt-1">{selectedKeyResult.unit}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className={`text-3xl font-bold mb-2 ${getProgressColor(calculateProgress(selectedKeyResult))}`}>
                      {calculateProgress(selectedKeyResult)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Progresso</div>
                    <div className="text-xs text-muted-foreground mt-1">do objetivo</div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Histórico de Valores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getKeyResultHistory(selectedKeyResult.id)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period_date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                          formatter={(value, name) => [
                            `${Number(value).toLocaleString('pt-BR')} ${selectedKeyResult.unit}`, 
                            name
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Valor Real"
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={() => selectedKeyResult.target_value} 
                          stroke="#10b981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Meta"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Updates and Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Últimas Atualizações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getKeyResultHistory(selectedKeyResult.id).slice(0, 5).map((update) => (
                        <div key={update.id} className="border-l-4 border-primary/20 pl-4 py-2 bg-muted/30 rounded-r">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{update.value.toLocaleString('pt-BR')} {selectedKeyResult.unit}</p>
                              {update.comments && (
                                <p className="text-sm text-muted-foreground mt-1">{update.comments}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {new Date(update.period_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {getKeyResultHistory(selectedKeyResult.id).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhuma atualização registrada ainda.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        const history = getKeyResultHistory(selectedKeyResult.id);
                        const values = history.map(h => h.value);
                        const bestValue = values.length > 0 ? Math.max(...values) : 0;
                        const worstValue = values.length > 0 ? Math.min(...values) : 0;
                        const averageValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                        const trend = values.length >= 2 ? 
                          (values[values.length - 1] > values[values.length - 2] ? 'up' : 
                           values[values.length - 1] < values[values.length - 2] ? 'down' : 'stable') : 'stable';
                        
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Melhor Resultado:</span>
                              <span className="font-semibold text-green-600">
                                {bestValue.toLocaleString('pt-BR')} {selectedKeyResult.unit}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Pior Resultado:</span>
                              <span className="font-semibold text-red-600">
                                {worstValue.toLocaleString('pt-BR')} {selectedKeyResult.unit}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Média:</span>
                              <span className="font-semibold">
                                {averageValue.toLocaleString('pt-BR')} {selectedKeyResult.unit}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Tendência:</span>
                              <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
                                {trend === 'up' ? (
                                  <>
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Crescente
                                  </>
                                ) : trend === 'down' ? (
                                  <>
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    Decrescente
                                  </>
                                ) : (
                                  <>
                                    <Target className="w-3 h-3 mr-1" />
                                    Estável
                                  </>
                                )}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Total de Registros:</span>
                              <span className="font-semibold">{history.length}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Resultado-Chave</DialogTitle>
            <DialogDescription>
              Edite as informações do resultado-chave: {selectedKeyResult?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditKeyResult} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Nome do Resultado-Chave *</Label>
                <Input
                  id="edit_title"
                  placeholder="Ex: Taxa de Conversão"
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_category">Categoria *</Label>
                <Select value={editData.category} onValueChange={(value) => setEditData({...editData, category: value})}>
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
              <Label htmlFor="edit_description">Descrição</Label>
              <Textarea
                id="edit_description"
                placeholder="Descreva o que este resultado-chave mede..."
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_target_value">Meta *</Label>
                <Input
                  id="edit_target_value"
                  type="number"
                  step="0.01"
                  placeholder="100"
                  value={editData.target_value}
                  onChange={(e) => setEditData({...editData, target_value: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_unit">Unidade *</Label>
                <Select value={editData.unit} onValueChange={(value) => setEditData({...editData, unit: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="%">% (Percentual)</SelectItem>
                    <SelectItem value="R$">R$ (Real)</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="dias">Dias</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_frequency">Frequência *</Label>
                <Select value={editData.frequency} onValueChange={(value) => setEditData({...editData, frequency: value})}>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_objective">Objetivo Estratégico</Label>
                <Select value={editData.objective_id} onValueChange={(value) => setEditData({...editData, objective_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum objetivo</SelectItem>
                    {objectives.map((objective) => (
                      <SelectItem key={objective.id} value={objective.id}>
                        {objective.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_priority">Prioridade</Label>
                <Select value={editData.priority} onValueChange={(value) => setEditData({...editData, priority: value})}>
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
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Não Iniciado</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="completed">Completo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o resultado-chave "{selectedKeyResult?.title}"?
              Esta ação não pode ser desfeita e todos os históricos de valores também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteKeyResult}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Excluindo...' : 'Excluir Resultado-Chave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};