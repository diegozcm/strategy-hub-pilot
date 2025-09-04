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
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { EditKeyResultModal } from '@/components/strategic-map/EditKeyResultModal';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';

interface KeyResultValue {
  id: string;
  key_result_id: string;
  value: number;
  period_date: string;
  comments: string;
  recorded_by: string;
  created_at: string;
}

export const IndicatorsPage: React.FC = () => {
  const { user, company: authCompany } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [keyResultValues, setKeyResultValues] = useState<KeyResultValue[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditKeyResultModalOpen, setIsEditKeyResultModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    unit: '%',
    priority: 'medium',
    objective_id: 'none'
  });

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    unit: '',
    priority: '',
    objective_id: ''
  });

  const [updateData, setUpdateData] = useState({
    current_value: '',
    comments: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data
  const loadData = async () => {
    if (!authCompany?.id) return;

    try {
      setLoading(true);
      
      // Load strategic plans and objectives
      const { data: plansData, error: plansError } = await supabase
        .from('strategic_plans')
        .select('*')
        .eq('company_id', authCompany.id);

      if (plansError) throw plansError;

      if (plansData && plansData.length > 0) {
        const planIds = plansData.map(plan => plan.id);
        
        const { data: objectivesData, error: objectivesError } = await supabase
          .from('strategic_objectives')
          .select('*')
          .in('plan_id', planIds);

        if (objectivesError) throw objectivesError;
        setObjectives(objectivesData || []);

        // Load strategic pillars
        const { data: pillarsData, error: pillarsError } = await supabase
          .from('strategic_pillars')
          .select('*')
          .eq('company_id', authCompany.id)
          .order('order_index');

        if (pillarsError) throw pillarsError;
        setPillars(pillarsData || []);
      }

      // Load key results
      const { data: keyResultsData, error: keyResultsError } = await supabase
        .from('key_results')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (keyResultsError) throw keyResultsError;
      
      console.log('Loaded key results:', keyResultsData);
      setKeyResults(keyResultsData || []);

      // Load key result values
      if (keyResultsData && keyResultsData.length > 0) {
        const keyResultIds = keyResultsData.map(kr => kr.id);
        
        const { data: valuesData, error: valuesError } = await supabase
          .from('key_result_values')
          .select('*')
          .in('key_result_id', keyResultIds)
          .order('created_at', { ascending: false });

        if (valuesError) throw valuesError;
        setKeyResultValues(valuesData || []);
      }

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

  useEffect(() => {
    if (user && authCompany) {
      loadData();
    }
  }, [user, authCompany]);

  // Create key result
  const handleCreateKeyResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !authCompany) return;

    try {
      setIsSubmitting(true);
      
      const keyResultData = {
        title: formData.title,
        description: formData.description,
        unit: formData.unit,
        target_value: 0, // Will be calculated from monthly targets
        current_value: 0,
        owner_id: user.id,
        objective_id: formData.objective_id === 'none' ? null : formData.objective_id,
        metric_type: 'number',
        frequency: 'monthly',
        monthly_targets: {},
        monthly_actual: {},
        yearly_target: 0,
        yearly_actual: 0,
      };

      const { data, error } = await supabase
        .from('key_results')
        .insert([keyResultData])
        .select()
        .single();

      if (error) throw error;

      setKeyResults(prev => [data, ...prev]);
      setIsAddModalOpen(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        unit: '%',
        priority: 'medium',
        objective_id: 'none'
      });

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

  // Update value
  const handleUpdateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedKeyResult) return;

    try {
      setIsSubmitting(true);
      
      const newValue = parseFloat(updateData.current_value);
      
      // Update key result current value
      const updatePayload: any = {
        current_value: newValue,
      };

      const { error: updateError } = await supabase
        .from('key_results')
        .update(updatePayload)
        .eq('id', selectedKeyResult.id);

      if (updateError) throw updateError;

      // Create value record
      const { error: valueError } = await supabase
        .from('key_result_values')
        .insert([{
          key_result_id: selectedKeyResult.id,
          value: newValue,
          period_date: new Date().toISOString().split('T')[0],
          comments: updateData.comments,
          recorded_by: user.id
        }]);

      if (valueError) throw valueError;

      // Refresh data
      await loadData();
      
      setIsUpdateModalOpen(false);
      setUpdateData({ current_value: '', comments: '' });
      
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

  // Edit key result (basic info)
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
          unit: editData.unit,
          frequency: 'monthly',
          objective_id: editData.objective_id === 'none' ? null : editData.objective_id
        })
        .eq('id', selectedKeyResult.id)
        .select()
        .single();

      if (error) throw error;

      setKeyResults(prev => prev.map(kr => kr.id === selectedKeyResult.id ? data : kr));
      setIsEditModalOpen(false);
      
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

  // Delete key result
  const handleDeleteKeyResult = async () => {
    if (!selectedKeyResult) return;

    try {
      setIsSubmitting(true);

      // Delete associated values first
      const { error: valuesError } = await supabase
        .from('key_result_values')
        .delete()
        .eq('key_result_id', selectedKeyResult.id);

      if (valuesError) throw valuesError;

      // Delete the key result
      const { error: keyResultError } = await supabase
        .from('key_results')
        .delete()
        .eq('id', selectedKeyResult.id);

      if (keyResultError) throw keyResultError;

      // Update local state
      setKeyResults(prev => prev.filter(kr => kr.id !== selectedKeyResult.id));
      setKeyResultValues(prev => prev.filter(krv => krv.key_result_id !== selectedKeyResult.id));
      
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

  // Modal handlers
  const openEditModal = (keyResult: KeyResult) => {
    setSelectedKeyResult(keyResult);
    setEditData({
      title: keyResult.title,
      description: keyResult.description || '',
      unit: keyResult.unit,
      priority: 'medium', // Default priority since not in KeyResult interface
      objective_id: keyResult.objective_id || 'none'
    });
    setIsEditModalOpen(true);
  };

  const openEditKeyResultModal = (keyResult: KeyResult) => {
    setSelectedKeyResult(keyResult);
    setIsEditKeyResultModalOpen(true);
  };

  // Get strategic pillar info for a key result
  const getKeyResultPillar = (keyResult: any) => {
    const objective = objectives.find(obj => obj.id === keyResult.objective_id);
    if (!objective) return { name: 'Sem pilar', color: '#6B7280' };
    
    const pillar = pillars.find(p => p.id === objective.pillar_id);
    if (!pillar) return { name: 'Sem pilar', color: '#6B7280' };
    
    return {
      name: pillar.name,
      color: pillar.color
    };
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
      default: return category || 'Operacional';
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
      default: return priority || 'Média';
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'yearly': return 'Anual';
      default: return frequency || 'Mensal';
    }
  };

  const getKeyResultHistory = (keyResultId: string) => {
    return keyResultValues
      .filter(value => value.key_result_id === keyResultId)
      .slice(0, 10)
      .reverse();
  };

  // Filter logic
  const filteredKeyResults = keyResults.filter(keyResult => {
    const matchesSearch = keyResult.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         keyResult.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || priorityFilter === 'medium'; // Default to medium
    
    return matchesSearch && matchesPriority;
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

  // Block access if no company is associated
  if (!authCompany) {
    return <NoCompanyMessage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resultados-Chave</h1>
          <p className="text-muted-foreground mt-2">Acompanhe resultados-chave e métricas estratégicas em tempo real</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Resultado-Chave
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeyResults}</div>
            <p className="text-xs text-muted-foreground">Resultados-chave</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Alvo</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onTargetKeyResults}</div>
            <p className="text-xs text-muted-foreground">≥90% da meta</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{atRiskKeyResults}</div>
            <p className="text-xs text-muted-foreground">70-89% da meta</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalKeyResults}</div>
            <p className="text-xs text-muted-foreground">&lt;70% da meta</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
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
        </CardContent>
      </Card>

      {/* Key Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKeyResults.map((keyResult) => {
          const progress = calculateProgress(keyResult);
          
          return (
            <Card key={keyResult.id} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getKeyResultPillar(keyResult).color }}
                      />
                      <Badge variant="outline" className="text-xs">
                        {getKeyResultPillar(keyResult).name}
                      </Badge>
                      <Badge variant={getPriorityColor('medium')} className="text-xs">
                        {getPriorityText('medium')}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{keyResult.title}</CardTitle>
                    {keyResult.description && (
                      <CardDescription className="mt-1 text-sm">
                        {keyResult.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditKeyResultModal(keyResult)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Atualizar Valores Mensais
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
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className={`text-sm font-bold ${getProgressColor(progress)}`}>
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Current vs Target */}
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="text-muted-foreground">Atual</p>
                    <p className="font-semibold">{keyResult.current_value.toLocaleString('pt-BR')} {keyResult.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Meta</p>
                    <p className="font-semibold">{keyResult.target_value.toLocaleString('pt-BR')} {keyResult.unit}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      Progresso: {progress}%
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Mensal
                  </span>
                </div>

                {/* Last Update */}
                <div className="text-xs text-muted-foreground">
                  Última atualização: {new Date(keyResult.updated_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredKeyResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || priorityFilter !== 'all'
                ? 'Nenhum resultado-chave encontrado com os filtros aplicados.'
                : 'Nenhum resultado-chave cadastrado ainda. Crie seu primeiro resultado-chave!'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Key Result Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Resultado-Chave</DialogTitle>
            <DialogDescription>
              Crie um novo resultado-chave para acompanhar o progresso de suas metas.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_value">Meta Anual *</Label>
                <div className="px-3 py-2 border rounded-md bg-muted">
                  <span className="text-sm font-medium">
                    Será calculada automaticamente após definir as metas mensais
                  </span>
                </div>
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
                {isSubmitting ? 'Criando...' : 'Criar Resultado-Chave'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Value Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Valor</DialogTitle>
            <DialogDescription>
              Atualize o valor atual do resultado-chave: {selectedKeyResult?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateValue} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_value">Novo Valor *</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                placeholder="Digite o novo valor"
                value={updateData.current_value}
                onChange={(e) => setUpdateData({...updateData, current_value: e.target.value})}
                required
              />
              <p className="text-sm text-muted-foreground">
                Meta: {selectedKeyResult?.target_value} {selectedKeyResult?.unit}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comments">Comentários</Label>
              <Textarea
                id="comments"
                placeholder="Adicione comentários sobre esta atualização (opcional)"
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
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedKeyResult ? getKeyResultPillar(selectedKeyResult).color : '#6B7280' }}
              />
              {selectedKeyResult?.title}
            </DialogTitle>
            <DialogDescription>
              Histórico completo e estatísticas detalhadas do resultado-chave
            </DialogDescription>
          </DialogHeader>
          
          {selectedKeyResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Progresso Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {calculateProgress(selectedKeyResult)}%
                    </div>
                    <Progress value={calculateProgress(selectedKeyResult)} className="mt-2" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Valor Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedKeyResult.current_value.toLocaleString('pt-BR')} {selectedKeyResult.unit}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Meta: {selectedKeyResult.target_value.toLocaleString('pt-BR')} {selectedKeyResult.unit}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Progresso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {calculateProgress(selectedKeyResult)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Meta atingida
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução do Resultado-Chave</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const history = getKeyResultHistory(selectedKeyResult.id);
                    if (history.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum histórico disponível ainda.
                        </div>
                      );
                    }

                    const chartData = history.map(entry => ({
                      date: new Date(entry.period_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
                      value: entry.value,
                      target: selectedKeyResult.target_value
                    }));

                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#8884d8" name="Valor Atual" />
                          <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeDasharray="5 5" name="Meta" />
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* History and Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Atualizações</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {getKeyResultHistory(selectedKeyResult.id).map((update, index) => (
                        <div key={update.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">{index + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{update.value.toLocaleString('pt-BR')} {selectedKeyResult.unit}</p>
                              <div className="flex items-center space-x-2">
                                {update.value > (getKeyResultHistory(selectedKeyResult.id)[index + 1]?.value || 0) ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant="outline" className="text-xs">
                                {new Date(update.period_date).toLocaleDateString('pt-BR')}
                              </Badge>
                              <Badge variant="outline">
                                {update.comments && update.comments.length > 20 
                                  ? `${update.comments.slice(0, 17)}...` 
                                  : update.comments || 'Sem comentários'
                                }
                              </Badge>
                            </div>
                            {update.comments && (
                              <p className="text-sm text-muted-foreground mt-1">{update.comments}</p>
                            )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_target_value">Meta Anual *</Label>
                <div className="px-3 py-2 border rounded-md bg-muted">
                  <span className="text-sm font-medium">
                    {selectedKeyResult?.yearly_target || selectedKeyResult?.target_value || 0} {selectedKeyResult?.unit}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculada automaticamente a partir das metas mensais
                  </p>
                </div>
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

      {/* Edit Key Result Modal with Monthly Values */}
      {selectedKeyResult && (
        <EditKeyResultModal
          keyResult={selectedKeyResult}
          open={isEditKeyResultModalOpen}
          onClose={() => setIsEditKeyResultModalOpen(false)}
          onSave={async (keyResultData) => {
            if (!user || !selectedKeyResult) return;

            try {
              console.log('Saving key result data:', keyResultData);
              
              const { data, error } = await supabase
                .from('key_results')
                .update(keyResultData)
                .eq('id', selectedKeyResult.id)
                .select();

              if (error) throw error;

              console.log('Key result updated successfully:', data);

              // Refresh data
              await loadData();
              
              toast({
                title: "Sucesso",
                description: "Resultado-chave atualizado com sucesso!",
              });
            } catch (error) {
              console.error('Error updating key result:', error);
              toast({
                title: "Erro",
                description: "Erro ao atualizar resultado-chave",
                variant: "destructive",
              });
              throw error;
            }
          }}
        />
      )}
    </div>
  );
};