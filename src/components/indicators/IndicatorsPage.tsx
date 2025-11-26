import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Search, Edit, BarChart3, TrendingUp, TrendingDown, Calendar, CalendarDays, User, Target, AlertTriangle, CheckCircle, Activity, Trash2, Save, X, MoreVertical } from 'lucide-react';
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
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { KROverviewModal } from '@/components/strategic-map/KROverviewModal';
import { KREditModal } from '@/components/strategic-map/KREditModal';
import { KRUpdateValuesModal } from '@/components/strategic-map/KRUpdateValuesModal';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';
import { useSearchParams } from 'react-router-dom';
import { KRCard } from './KRCard';
import { useKRMetrics } from '@/hooks/useKRMetrics';

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
  const { users: companyUsers, loading: loadingUsers } = useCompanyUsers(authCompany?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [keyResultValues, setKeyResultValues] = useState<KeyResultValue[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [objectiveFilter, setObjectiveFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'ytd' | 'monthly' | 'yearly' | 'quarterly'>('ytd');
  
  // Inicializar com o último mês fechado (mês anterior)
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const [selectedMonth, setSelectedMonth] = useState<number>(previousMonth.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(previousMonth.getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isKROverviewModalOpen, setIsKROverviewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<{ name: string; color: string } | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    unit: '%',
    priority: 'medium',
    objective_id: 'none',
    start_month: '',
    end_month: '',
    assigned_owner_id: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create memoized maps for efficient lookup and sorting
  const objectiveById = useMemo(() => {
    const map = new Map<string, StrategicObjective>();
    objectives.forEach(obj => map.set(obj.id, obj));
    return map;
  }, [objectives]);

  const pillarIndexById = useMemo(() => {
    const map = new Map<string, number>();
    pillars.forEach((pillar, index) => map.set(pillar.id, index));
    return map;
  }, [pillars]);

  // Load data
  const loadData = async () => {
    if (!authCompany?.id) return;

    try {
      // Only show loading spinner if we don't have any data yet (initial load)
      if (keyResults.length === 0) {
        setLoading(true);
      }
      
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

      // Load key results - filter by company through strategic objectives and plans
      const { data: keyResultsData, error: keyResultsError } = await supabase
        .from('key_results')
        .select(`
          *,
          strategic_objectives!inner (
            id,
            plan_id,
            strategic_plans!inner (
              id,
              company_id
            )
          )
        `)
        .eq('strategic_objectives.strategic_plans.company_id', authCompany.id)
        .order('created_at', { ascending: false });

      if (keyResultsError) throw keyResultsError;
      
      // Cast aggregation_type to the correct union type
      const processedKeyResults = (keyResultsData || []).map(kr => ({
        ...kr,
        aggregation_type: (kr.aggregation_type as 'sum' | 'average' | 'max' | 'min') || 'sum',
        target_direction: (kr.target_direction as 'maximize' | 'minimize') || 'maximize'
      }));
      
      setKeyResults(processedKeyResults);

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
    if (user?.id && authCompany?.id) {
      loadData();
    }
  }, [user?.id, authCompany?.id]);

  // Handle URL parameters for opening modals
  useEffect(() => {
    const editId = searchParams.get('edit');
    const updateId = searchParams.get('update');
    
    if (editId && keyResults.length > 0) {
      const keyResult = keyResults.find(kr => kr.id === editId);
      if (keyResult) {
        setSelectedKeyResult(keyResult);
        setIsKROverviewModalOpen(true);
        // Remove the parameter from URL
        searchParams.delete('edit');
        setSearchParams(searchParams);
      }
    }
    
    if (updateId && keyResults.length > 0) {
      const keyResult = keyResults.find(kr => kr.id === updateId);
      if (keyResult) {
        setSelectedKeyResult(keyResult);
        setIsKROverviewModalOpen(true);
        // Remove the parameter from URL
        searchParams.delete('update');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, keyResults, setSearchParams]);

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
        start_month: formData.start_month || null,
        end_month: formData.end_month || null,
        assigned_owner_id: formData.assigned_owner_id === 'none' ? null : formData.assigned_owner_id
      };

      const { data, error } = await supabase
        .from('key_results')
        .insert([keyResultData])
        .select()
        .single();

      if (error) throw error;

      // Cast aggregation_type to the correct union type
      const processedData = {
        ...data,
        aggregation_type: (data.aggregation_type as 'sum' | 'average' | 'max' | 'min') || 'sum',
        target_direction: (data.target_direction as 'maximize' | 'minimize') || 'maximize'
      };

      setKeyResults(prev => [processedData, ...prev]);
      setIsAddModalOpen(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        unit: '%',
        priority: 'medium',
        objective_id: 'none',
        start_month: '',
        end_month: '',
        assigned_owner_id: ''
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
  const openKROverviewModal = async (keyResult: KeyResult) => {
    setSelectedKeyResult(keyResult);
    
    // Buscar pillar ANTES de abrir modal para evitar flash
    if (keyResult.objective_id) {
      try {
        const { data, error } = await supabase
          .from('strategic_objectives')
          .select(`
            strategic_pillars (
              name,
              color
            )
          `)
          .eq('id', keyResult.objective_id)
          .single();

        if (!error && data?.strategic_pillars) {
          setSelectedPillar({
            name: data.strategic_pillars.name,
            color: data.strategic_pillars.color
          });
        }
      } catch (error) {
        console.error('Erro ao buscar pilar:', error);
        setSelectedPillar({ name: 'Sem pilar', color: '#6B7280' });
      }
    } else {
      setSelectedPillar({ name: 'Sem pilar', color: '#6B7280' });
    }
    
    setIsKROverviewModalOpen(true);
  };

  const closeAllModals = () => {
    setIsKROverviewModalOpen(false);
    setSelectedKeyResult(null);
    setSelectedPillar(null);
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

  // Pre-calculate metrics for all KRs to avoid hook issues in loops
  const krMetricsMap = useMemo(() => {
    const map = new Map();
    keyResults.forEach(kr => {
      const metrics = {
        ytd: {
          target: kr.ytd_target ?? 0,
          actual: kr.ytd_actual ?? 0,
          percentage: kr.ytd_percentage ?? 0,
        },
        monthly: {
          target: kr.current_month_target ?? 0,
          actual: kr.current_month_actual ?? 0,
          percentage: kr.monthly_percentage ?? 0,
        },
        yearly: {
          target: kr.yearly_target ?? 0,
          actual: kr.yearly_actual ?? 0,
          percentage: kr.yearly_percentage ?? 0,
        },
        quarterly: {
          target: selectedQuarter === 1 ? (kr.q1_target ?? 0) :
                   selectedQuarter === 2 ? (kr.q2_target ?? 0) :
                   selectedQuarter === 3 ? (kr.q3_target ?? 0) :
                   (kr.q4_target ?? 0),
          actual: selectedQuarter === 1 ? (kr.q1_actual ?? 0) :
                  selectedQuarter === 2 ? (kr.q2_actual ?? 0) :
                  selectedQuarter === 3 ? (kr.q3_actual ?? 0) :
                  (kr.q4_actual ?? 0),
          percentage: selectedQuarter === 1 ? (kr.q1_percentage ?? 0) :
                      selectedQuarter === 2 ? (kr.q2_percentage ?? 0) :
                      selectedQuarter === 3 ? (kr.q3_percentage ?? 0) :
                      (kr.q4_percentage ?? 0),
        },
      };
      map.set(kr.id, metrics);
    });
    return map;
  }, [keyResults, selectedQuarter]);

  // Recalcular metrics considerando mês customizado
  const customMetricsMap = useMemo(() => {
    if (selectedPeriod !== 'monthly' || !selectedMonth || !selectedYear) {
      return krMetricsMap;
    }
    
    const map = new Map();
    keyResults.forEach(kr => {
      // Para monthly com mês customizado, precisamos recalcular
      const monthKey = selectedMonth.toString();
      const target = kr.monthly_targets?.[monthKey] ?? 0;
      const actual = kr.monthly_actual?.[monthKey] ?? 0;
      
      // Calcular percentage usando a mesma lógica do banco
      let percentage = 0;
      if (target > 0 && actual > 0) {
        if (kr.target_direction === 'minimize') {
          percentage = ((target - actual) / target) * 100 + 100;
        } else {
          percentage = (actual / target) * 100;
        }
      }
      
      map.set(kr.id, {
        ytd: {
          target: kr.ytd_target ?? 0,
          actual: kr.ytd_actual ?? 0,
          percentage: kr.ytd_percentage ?? 0,
        },
        monthly: {
          target,
          actual,
          percentage,
        },
        yearly: {
          target: kr.yearly_target ?? 0,
          actual: kr.yearly_actual ?? 0,
          percentage: kr.yearly_percentage ?? 0,
        },
        quarterly: krMetricsMap.get(kr.id)?.quarterly ?? {
          target: 0,
          actual: 0,
          percentage: 0,
        },
      });
    });
    return map;
  }, [keyResults, selectedPeriod, selectedMonth, selectedYear, krMetricsMap]);

  // Gerar lista de meses disponíveis (últimos 24 meses)
  const monthOptions = useMemo(() => {
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

  const getMetricsByPeriod = (keyResultId: string) => {
    const metrics = customMetricsMap.get(keyResultId);
    if (!metrics) return { target: 0, actual: 0, percentage: 0 };
    
    return selectedPeriod === 'quarterly' ? metrics.quarterly :
           selectedPeriod === 'monthly' ? metrics.monthly :
           selectedPeriod === 'yearly' ? metrics.yearly :
           metrics.ytd;
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'quarterly') return `Q${selectedQuarter}`;
    if (selectedPeriod === 'ytd') return 'YTD';
    if (selectedPeriod === 'yearly') return 'Ano';
    if (selectedPeriod === 'monthly' && selectedMonth && selectedYear) {
      return new Date(selectedYear, selectedMonth - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'long' })
        .charAt(0).toUpperCase() + 
        new Date(selectedYear, selectedMonth - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'long' })
        .slice(1);
    }
    return 'Mês Atual';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600';
    if (progress >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAggregationTypeText = (aggregationType: string) => {
    switch (aggregationType) {
      case 'sum': return 'Soma';
      case 'average': return 'Média';
      case 'max': return 'Maior valor';
      case 'min': return 'Menor valor';
      default: return aggregationType || 'Soma';
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
    const matchesObjective = objectiveFilter === 'all' || keyResult.objective_id === objectiveFilter;
    
    // Check pillar match
    let matchesPillar = pillarFilter === 'all';
    if (!matchesPillar && keyResult.objective_id) {
      const objective = objectives.find(obj => obj.id === keyResult.objective_id);
      if (objective) {
        matchesPillar = objective.pillar_id === pillarFilter;
      }
    }
    
    // Check progress match
    let matchesProgress = progressFilter === 'all';
    if (!matchesProgress) {
      const metrics = getMetricsByPeriod(keyResult.id);
      const progress = metrics.percentage;
      if (progressFilter === 'excellent') {
        matchesProgress = progress > 105;
      } else if (progressFilter === 'success') {
        matchesProgress = progress >= 100 && progress <= 105;
      } else if (progressFilter === 'attention') {
        matchesProgress = progress >= 71 && progress < 100;
      } else if (progressFilter === 'critical') {
        matchesProgress = progress < 71;
      }
    }
    
    return matchesSearch && matchesPriority && matchesObjective && matchesPillar && matchesProgress;
  }).sort((a, b) => {
    // Sort by pillar index (following the filter order, same as Dashboard)
    const objectiveA = objectiveById.get(a.objective_id);
    const objectiveB = objectiveById.get(b.objective_id);
    
    const pillarIndexA = objectiveA ? (pillarIndexById.get(objectiveA.pillar_id) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    const pillarIndexB = objectiveB ? (pillarIndexById.get(objectiveB.pillar_id) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    
    // Sort by pillar index first
    if (pillarIndexA !== pillarIndexB) {
      return pillarIndexA - pillarIndexB;
    }
    
    // Within the same pillar, sort alphabetically by KR title
    return a.title.localeCompare(b.title, 'pt-BR');
  });

  // Calculate summary statistics based on selected period
  const totalKeyResults = keyResults.length;
  const onTargetKeyResults = keyResults.filter(kr => {
    const metrics = getMetricsByPeriod(kr.id);
    const p = metrics.percentage;
    return p >= 100 && p <= 105;
  }).length;
  const atRiskKeyResults = keyResults.filter(kr => {
    const metrics = getMetricsByPeriod(kr.id);
    const p = metrics.percentage;
    return p >= 71 && p < 100;
  }).length;
  const criticalKeyResults = keyResults.filter(kr => {
    const metrics = getMetricsByPeriod(kr.id);
    return metrics.percentage < 71;
  }).length;

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
      {/* Header - Title and Description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resultados-Chave</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe resultados-chave e métricas estratégicas em tempo real
          </p>
        </div>
        
        {/* Right side: Only New KR Button */}
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Resultado-Chave
        </Button>
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
              className="gap-2"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${progressFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setProgressFilter('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeyResults}</div>
            <p className="text-xs text-muted-foreground">Resultados-chave</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${progressFilter === 'success' ? 'ring-2 ring-green-600' : ''}`}
          onClick={() => setProgressFilter('success')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Alvo</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onTargetKeyResults}</div>
            <p className="text-xs text-muted-foreground">100-105% da meta ({getPeriodLabel()})</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${progressFilter === 'attention' ? 'ring-2 ring-yellow-600' : ''}`}
          onClick={() => setProgressFilter('attention')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{atRiskKeyResults}</div>
            <p className="text-xs text-muted-foreground">71-99% da meta ({getPeriodLabel()})</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${progressFilter === 'critical' ? 'ring-2 ring-red-600' : ''}`}
          onClick={() => setProgressFilter('critical')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalKeyResults}</div>
            <p className="text-xs text-muted-foreground">&lt;71% da meta ({getPeriodLabel()})</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
          <Select value={pillarFilter} onValueChange={setPillarFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os pilares" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pilares</SelectItem>
              {pillars.map((pillar) => (
                <SelectItem key={pillar.id} value={pillar.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pillar.color }}
                    />
                    {pillar.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os objetivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os objetivos</SelectItem>
              {objectives.map((objective) => {
                const pillar = pillars.find(p => p.id === objective.pillar_id);
                return (
                  <SelectItem key={objective.id} value={objective.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pillar?.color || '#6B7280' }}
                      />
                      {objective.title}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
           <Select value={priorityFilter} onValueChange={setPriorityFilter}>
             <SelectTrigger className="w-full sm:w-36">
               <SelectValue placeholder="Todas" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todas</SelectItem>
               <SelectItem value="high">Alta</SelectItem>
               <SelectItem value="medium">Média</SelectItem>
               <SelectItem value="low">Baixa</SelectItem>
             </SelectContent>
           </Select>

           <Select value={progressFilter} onValueChange={setProgressFilter}>
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

      {/* Key Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKeyResults.map((keyResult) => {
          const pillar = getKeyResultPillar(keyResult);
          
          return (
            <KRCard
              key={keyResult.id}
              keyResult={keyResult}
              pillar={pillar}
              selectedPeriod={selectedPeriod}
              selectedMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
              selectedYear={selectedPeriod === 'monthly' ? selectedYear : undefined}
              selectedQuarter={selectedPeriod === 'quarterly' ? selectedQuarter : undefined}
              onClick={() => openKROverviewModal(keyResult)}
            />
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
              
              <div className="space-y-2">
                <Label htmlFor="assigned_owner">Dono do KR *</Label>
                <Select 
                  value={formData.assigned_owner_id || 'none'} 
                  onValueChange={(value) => setFormData({...formData, assigned_owner_id: value})}
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dono" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum dono</SelectItem>
                    {companyUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_month">Mês de Início</Label>
                <Input
                  id="start_month"
                  type="month"
                  value={formData.start_month}
                  onChange={(e) => setFormData({...formData, start_month: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_month">Mês de Fim</Label>
                <Input
                  id="end_month"
                  type="month"
                  value={formData.end_month}
                  onChange={(e) => setFormData({...formData, end_month: e.target.value})}
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
                    <SelectItem value="un">Unidades</SelectItem>
                    <SelectItem value="h">Horas</SelectItem>
                    <SelectItem value="dias">Dias</SelectItem>
                    <SelectItem value="pontos">Pontos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

      {/* KR Overview Modal */}
      {selectedKeyResult && isKROverviewModalOpen && (
        <KROverviewModal
          keyResult={selectedKeyResult}
          pillar={selectedPillar}
          open={isKROverviewModalOpen}
          onClose={() => {
            setIsKROverviewModalOpen(false);
            setSelectedKeyResult(null);
            setSelectedPillar(null);
          }}
          onDelete={() => {
            setIsKROverviewModalOpen(false);
            setIsDeleteConfirmOpen(true);
          }}
          onSave={async () => {
            await loadData();
          }}
          objectives={objectives.map(obj => ({ id: obj.id, title: obj.title }))}
        />
      )}

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