import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, Search, Edit, BarChart3, TrendingUp, TrendingDown, Calendar, CalendarDays, User, Target, AlertTriangle, CheckCircle, Activity, Trash2, Save, X, MoreVertical, AlertCircle, LayoutGrid, Table2 } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { KROverviewModal } from '@/components/strategic-map/KROverviewModal';
import { KREditModal } from '@/components/strategic-map/KREditModal';
import { KRUpdateValuesModal } from '@/components/strategic-map/KRUpdateValuesModal';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';
import { useSearchParams } from 'react-router-dom';
import { KRCard } from './KRCard';
import { StandaloneKeyResultForm } from './StandaloneKeyResultForm';
import { KRTableView } from './KRTableView';
import { useKRMetrics } from '@/hooks/useKRMetrics';
import { useCompanyModuleSettings } from '@/hooks/useCompanyModuleSettings';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';
import { filterKRsByValidity, getPopulatedQuarters } from '@/lib/krValidityFilter';
import { useObjectivesData } from '@/hooks/useObjectivesData';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
import { useKRPermissions } from '@/hooks/useKRPermissions';
import { cn } from '@/lib/utils';
import { SmartPeriodSelector } from '@/components/ui/SmartPeriodSelector';

// Converte quarter + ano para start_month e end_month
const quarterToMonths = (quarter: 1 | 2 | 3 | 4, year: number): { start_month: string; end_month: string } => {
  const quarterRanges = {
    1: { start: '01', end: '03' },
    2: { start: '04', end: '06' },
    3: { start: '07', end: '09' },
    4: { start: '10', end: '12' }
  };
  const range = quarterRanges[quarter];
  return {
    start_month: `${year}-${range.start}`,
    end_month: `${year}-${range.end}`
  };
};

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
  const { validityEnabled, membersCanViewAll, loading: settingsLoading } = useCompanyModuleSettings('strategic-planning');
  const [searchParams, setSearchParams] = useSearchParams();
  const { canCreateKR, canSelectOwner, canEditAnyKR, canDeleteKR, currentUserId, isMemberOnly, canViewAllKRs } = useKRPermissions();
  
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
    isYTDCalculable, ytdInfoMessage, planFirstYear,
    quarterOptions, monthOptions, yearOptions, semesterOptions, bimonthlyOptions,
    handleYTDClick: contextHandleYTDClick
  } = usePeriodFilter();
  
  // Get additional functions from usePlanPeriodOptions
  const { getDefaultYear, getDefaultQuarter, getDefaultMonth } = usePlanPeriodOptions();
  
  console.log('[IndicatorsPage] Dono do KR Debug:', {
    canSelectOwner,
    companyUsersCount: companyUsers.length,
    companyUsersList: companyUsers.map(u => `${u.first_name} ${u.last_name}`),
    loadingUsers,
    isMemberOnly,
    companyId: authCompany?.id,
    companyName: authCompany?.name,
    authCompanyExists: !!authCompany
  });
  
  // Use objetivos data hook que já filtra por plano ativo
  const { 
    objectives: objectivesData, 
    pillars: pillarsData, 
    keyResults: keyResultsData, 
    loading: dataLoading,
    hasActivePlan,
    activePlan,
    refreshData
  } = useObjectivesData();
  
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Filtrar quarters para mostrar apenas os que têm KRs registrados
  const filteredQuarterOptions = useMemo(() => {
    return getPopulatedQuarters(keyResults, quarterOptions);
  }, [keyResults, quarterOptions]);
  
  // Ref para controlar se os filtros já foram inicializados
  const hasInitializedFilters = useRef(false);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isKROverviewModalOpen, setIsKROverviewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<{ name: string; color: string } | null>(null);
  
  // Handler para clique no botão YTD - sempre permite selecionar
  const handleYTDClick = () => {
    contextHandleYTDClick();
    if (!isYTDCalculable && ytdInfoMessage) {
      sonnerToast.info(ytdInfoMessage);
    }
  };

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

  // Sincronizar dados do hook com state local
  useEffect(() => {
    setObjectives(objectivesData);
    setPillars(pillarsData);
    setKeyResults(keyResultsData);
    setLoading(dataLoading);
  }, [objectivesData, pillarsData, keyResultsData, dataLoading]);

  // Sincronizar selectedKeyResult com a lista atualizada de keyResults
  useEffect(() => {
    if (selectedKeyResult && keyResults.length > 0) {
      const updatedKR = keyResults.find(kr => kr.id === selectedKeyResult.id);
      if (updatedKR) {
        // Só atualiza se os dados forem diferentes para evitar re-renders desnecessários
        if (JSON.stringify(updatedKR) !== JSON.stringify(selectedKeyResult)) {
          console.log('[IndicatorsPage] Sincronizando selectedKeyResult:', {
            id: updatedKR.id,
            start_month: updatedKR.start_month,
            end_month: updatedKR.end_month
          });
          setSelectedKeyResult(updatedKR);
        }
      }
    }
  }, [keyResults]); // Não incluir selectedKeyResult para evitar loop infinito

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

  // Create key result using the new standalone form
  const handleCreateKeyResultFromForm = async (krData: Omit<import('@/types/strategic-map').KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !authCompany) return;

    try {
      setIsSubmitting(true);
      
      const keyResultData = {
        ...krData,
        owner_id: user.id,
        objective_id: krData.objective_id || null,
      };

      const { data, error } = await supabase
        .from('key_results')
        .insert([keyResultData])
        .select()
        .single();

      if (error) throw error;

      // Cast types to the correct union types
      const processedData = {
        ...data,
        aggregation_type: (data.aggregation_type as 'sum' | 'average' | 'max' | 'min') || 'sum',
        target_direction: (data.target_direction as 'maximize' | 'minimize') || 'maximize',
        comparison_type: (data.comparison_type as 'cumulative' | 'period') || 'cumulative',
        frequency: (data.frequency as 'monthly' | 'quarterly' | 'semesterly' | 'yearly') || 'monthly'
      };

      setKeyResults(prev => [processedData, ...prev]);
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
        semesterly: {
          target: 0,
          actual: 0,
          percentage: 0,
        },
        bimonthly: {
          target: 0,
          actual: 0,
          percentage: 0,
        },
      };
      map.set(kr.id, metrics);
    });
    return map;
  }, [keyResults, selectedQuarter]);

  // Recalcular metrics considerando mês customizado, ano customizado, semestre OU bimestre
  const customMetricsMap = useMemo(() => {
    const needsRecalculation = 
      (selectedPeriod === 'monthly' && selectedMonth && selectedYear) ||
      (selectedPeriod === 'yearly' && selectedYear) ||
      (selectedPeriod === 'semesterly' && selectedSemester && selectedSemesterYear) ||
      (selectedPeriod === 'bimonthly' && selectedBimonth && selectedBimonthYear);
      
    if (!needsRecalculation) {
      return krMetricsMap;
    }
    
    const map = new Map();
    keyResults.forEach(kr => {
      if (selectedPeriod === 'monthly' && selectedMonth && selectedYear) {
        // Para monthly com mês customizado, precisamos recalcular
        const monthKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
        const target = kr.monthly_targets?.[monthKey] ?? 0;
        const actual = kr.monthly_actual?.[monthKey] ?? 0;
        
        // Calcular percentage usando a mesma lógica do banco
        let percentage = 0;
        if (target > 0 && actual > 0) {
          if (kr.target_direction === 'minimize') {
            percentage = (target / actual) * 100;
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
          semesterly: { target: 0, actual: 0, percentage: 0 },
          bimonthly: { target: 0, actual: 0, percentage: 0 },
        });
      } else if (selectedPeriod === 'yearly' && selectedYear) {
        // Para yearly com ano customizado, recalcular
        const monthKeys = [];
        for (let m = 1; m <= 12; m++) {
          monthKeys.push(`${selectedYear}-${m.toString().padStart(2, '0')}`);
        }
        
        const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
        const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
        
        const totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
        const totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
        
        let percentage = 0;
        if (totalTarget > 0 && totalActual > 0) {
          if (kr.target_direction === 'minimize') {
            percentage = (totalTarget / totalActual) * 100;
          } else {
            percentage = (totalActual / totalTarget) * 100;
          }
        }
        
        map.set(kr.id, {
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
            target: totalTarget,
            actual: totalActual,
            percentage,
          },
          quarterly: krMetricsMap.get(kr.id)?.quarterly ?? {
            target: 0,
            actual: 0,
            percentage: 0,
          },
          semesterly: { target: 0, actual: 0, percentage: 0 },
          bimonthly: { target: 0, actual: 0, percentage: 0 },
        });
      } else if (selectedPeriod === 'semesterly' && selectedSemester && selectedSemesterYear) {
        // Para semestre, calcular S1 (Jan-Jun) ou S2 (Jul-Dez)
        const startMonth = selectedSemester === 1 ? 1 : 7;
        const endMonth = selectedSemester === 1 ? 6 : 12;
        
        const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
        const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
        
        let totalTarget = 0;
        let totalActual = 0;
        
        for (let m = startMonth; m <= endMonth; m++) {
          const monthKey = `${selectedSemesterYear}-${m.toString().padStart(2, '0')}`;
          totalTarget += monthlyTargets[monthKey] || 0;
          totalActual += monthlyActual[monthKey] || 0;
        }
        
        let percentage = 0;
        if (totalTarget > 0 && totalActual > 0) {
          if (kr.target_direction === 'minimize') {
            percentage = (totalTarget / totalActual) * 100;
          } else {
            percentage = (totalActual / totalTarget) * 100;
          }
        }
        
        map.set(kr.id, {
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
          quarterly: krMetricsMap.get(kr.id)?.quarterly ?? {
            target: 0,
            actual: 0,
            percentage: 0,
          },
          semesterly: {
            target: totalTarget,
            actual: totalActual,
            percentage,
          },
          bimonthly: { target: 0, actual: 0, percentage: 0 },
        });
      } else if (selectedPeriod === 'bimonthly' && selectedBimonth && selectedBimonthYear) {
        // Para bimestre, calcular B1-B6 (Jan-Fev, Mar-Abr, Mai-Jun, Jul-Ago, Set-Out, Nov-Dez)
        const bimonthMonths: Record<number, [number, number]> = {
          1: [1, 2], 2: [3, 4], 3: [5, 6],
          4: [7, 8], 5: [9, 10], 6: [11, 12]
        };
        const [startMonth, endMonth] = bimonthMonths[selectedBimonth];
        
        const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
        const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
        
        let totalTarget = 0;
        let totalActual = 0;
        
        for (let m = startMonth; m <= endMonth; m++) {
          const monthKey = `${selectedBimonthYear}-${m.toString().padStart(2, '0')}`;
          totalTarget += monthlyTargets[monthKey] || 0;
          totalActual += monthlyActual[monthKey] || 0;
        }
        
        let percentage = 0;
        if (totalTarget > 0 && totalActual > 0) {
          if (kr.target_direction === 'minimize') {
            percentage = (totalTarget / totalActual) * 100;
          } else {
            percentage = (totalActual / totalTarget) * 100;
          }
        }
        
        map.set(kr.id, {
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
          quarterly: krMetricsMap.get(kr.id)?.quarterly ?? {
            target: 0,
            actual: 0,
            percentage: 0,
          },
          semesterly: { target: 0, actual: 0, percentage: 0 },
          bimonthly: {
            target: totalTarget,
            actual: totalActual,
            percentage,
          },
        });
      } else {
        // Se não precisa recalcular, usar valores do map original
        map.set(kr.id, krMetricsMap.get(kr.id));
      }
    });
    return map;
  }, [keyResults, selectedPeriod, selectedMonth, selectedYear, selectedSemester, selectedSemesterYear, selectedBimonth, selectedBimonthYear, krMetricsMap]);
  
  // Filter KRs with validity
  const filteredByValidity = useMemo(() => {
    return filterKRsByValidity(
      keyResults,
      validityEnabled,
      selectedPeriod,
      {
        selectedQuarter,
        selectedQuarterYear,
        selectedYear,
        selectedMonth,
        selectedSemester,
        selectedSemesterYear,
        selectedBimonth,
        selectedBimonthYear,
        planFirstYear
      }
    );
  }, [keyResults, validityEnabled, selectedPeriod, selectedQuarter, selectedQuarterYear, selectedYear, selectedMonth, selectedSemester, selectedSemesterYear, selectedBimonth, selectedBimonthYear, planFirstYear]);

  const getMetricsByPeriod = (keyResultId: string) => {
    const metrics = customMetricsMap.get(keyResultId);
    if (!metrics) return { target: 0, actual: 0, percentage: 0 };
    
    return selectedPeriod === 'quarterly' ? metrics.quarterly :
           selectedPeriod === 'monthly' ? metrics.monthly :
           selectedPeriod === 'yearly' ? metrics.yearly :
           selectedPeriod === 'semesterly' ? metrics.semesterly :
           selectedPeriod === 'bimonthly' ? metrics.bimonthly :
           metrics.ytd;
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'quarterly') return `Q${selectedQuarter}`;
    if (selectedPeriod === 'ytd') return 'YTD';
    if (selectedPeriod === 'yearly') return 'Ano';
    if (selectedPeriod === 'semesterly') return `S${selectedSemester}`;
    if (selectedPeriod === 'bimonthly') return `B${selectedBimonth}`;
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

  // Aplicar filtro de vigência usando o helper centralizado
  const validityFilteredKeyResults = useMemo(() => {
    return filterKRsByValidity(
      keyResults,
      validityEnabled,
      selectedPeriod,
      {
        selectedQuarter,
        selectedQuarterYear,
        selectedYear,
        selectedMonth,
        selectedSemester,
        selectedSemesterYear,
        selectedBimonth,
        selectedBimonthYear,
        planFirstYear // Passa o primeiro ano do plano para YTD inteligente
      }
    );
  }, [keyResults, validityEnabled, selectedPeriod, selectedQuarter, selectedQuarterYear, selectedYear, selectedMonth, selectedSemester, selectedSemesterYear, selectedBimonth, selectedBimonthYear, planFirstYear]);

  // Aplicar filtro de visibilidade para membros
  const visibilityFilteredKeyResults = useMemo(() => {
    // Se não for membro, settings carregando, ou pode ver todos, mostrar todos
    if (!isMemberOnly || settingsLoading || canViewAllKRs) {
      return validityFilteredKeyResults;
    }
    
    // Membro só pode ver seus próprios KRs
    return validityFilteredKeyResults.filter(kr => 
      kr.assigned_owner_id === currentUserId
    );
  }, [validityFilteredKeyResults, isMemberOnly, canViewAllKRs, currentUserId, settingsLoading]);

  // Context filtered KRs (search, pillar, objective - used for statistics)
  const contextFilteredKeyResults = visibilityFilteredKeyResults.filter(keyResult => {
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
    
    return matchesSearch && matchesPriority && matchesObjective && matchesPillar;
  });

  // Final filtered KRs (adds progress filter on top of context filters)
  const filteredKeyResults = contextFilteredKeyResults.filter(keyResult => {
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
    
    return matchesProgress;
  }).sort((a, b) => {
    // Primeiro, KRs onde o usuário é dono vêm primeiro
    const aIsOwned = a.assigned_owner_id === currentUserId;
    const bIsOwned = b.assigned_owner_id === currentUserId;
    
    if (aIsOwned && !bIsOwned) return -1;
    if (!aIsOwned && bIsOwned) return 1;
    
    // Segundo, ordenar por peso (maior peso primeiro - prioridade 10 no topo)
    const weightA = a.weight || 1;
    const weightB = b.weight || 1;
    if (weightB !== weightA) {
      return weightB - weightA;
    }
    
    // Depois, ordenar por pillar index
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

  // Calculate summary statistics from context-filtered KRs (respects quarter filter)
  const totalKeyResults = contextFilteredKeyResults.length;
  const excellentKeyResults = contextFilteredKeyResults.filter(kr => {
    const metrics = getMetricsByPeriod(kr.id);
    return metrics.percentage > 105;
  }).length;
  const onTargetKeyResults = contextFilteredKeyResults.filter(kr => {
    const metrics = getMetricsByPeriod(kr.id);
    const p = metrics.percentage;
    return p >= 100 && p <= 105;
  }).length;
  const atRiskKeyResults = contextFilteredKeyResults.filter(kr => {
    const metrics = getMetricsByPeriod(kr.id);
    const p = metrics.percentage;
    return p >= 71 && p < 100;
  }).length;
  const criticalKeyResults = contextFilteredKeyResults.filter(kr => {
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

  // Show message if no active plan
  if (!hasActivePlan) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Calendar className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Nenhum Plano Ativo</h2>
            <p className="text-muted-foreground">
              Não há um plano estratégico ativo no momento. Configure um plano estratégico ativo para visualizar os resultados-chave.
            </p>
            {activePlan && (
              <p className="text-sm text-muted-foreground">
                Plano atual: {activePlan.name} ({activePlan.status})
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Title and Description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resultados-Chave</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-muted-foreground">
              Acompanhe resultados-chave e métricas estratégicas em tempo real
            </p>
            {validityEnabled && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="w-3 h-3" />
                Vigência Ativa
              </Badge>
            )}
          </div>
        </div>
        
        {/* Right side: Action Button only */}
        {canCreateKR && (
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Resultado-Chave
          </Button>
        )}
      </div>

      {/* View Mode Toggle - Below subtitle, same pattern as Rumo/Instrumentos tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'table')} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cards" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <Table2 className="w-4 h-4" />
            Tabela RMRE
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* SmartPeriodSelector - Compact Period Filter */}
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
        quarterOptions={filteredQuarterOptions}
        semesterOptions={semesterOptions}
        bimonthlyOptions={bimonthlyOptions}
        monthOptions={monthOptions}
        isYTDCalculable={isYTDCalculable}
        ytdInfoMessage={ytdInfoMessage}
        onYTDClick={handleYTDClick}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          className={`cursor-pointer transition-all hover:shadow-lg ${progressFilter === 'excellent' ? 'ring-2 ring-blue-600' : ''}`}
          onClick={() => setProgressFilter('excellent')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excelente</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{excellentKeyResults}</div>
            <p className="text-xs text-muted-foreground">&gt;105% da meta ({getPeriodLabel()})</p>
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
        
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 items-center">
          <Select value={pillarFilter} onValueChange={(v) => { setPillarFilter(v); setObjectiveFilter('all'); }}>
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
              {objectives
                .filter(obj => pillarFilter === 'all' || obj.pillar_id === pillarFilter)
                .map((objective) => (
                  <SelectItem key={objective.id} value={objective.id}>
                    {objective.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

           <Select value={progressFilter} onValueChange={setProgressFilter}>
             <SelectTrigger className="w-full sm:w-48">
               <SelectValue placeholder="Todos os status" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todos os status</SelectItem>
               <SelectItem value="excellent">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-blue-500" />
                   Excelente (&gt;105%)
                 </div>
               </SelectItem>
               <SelectItem value="success">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-green-500" />
                   No Alvo (100-105%)
                 </div>
               </SelectItem>
               <SelectItem value="attention">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-yellow-500" />
                   Atenção (71-99%)
                 </div>
               </SelectItem>
               <SelectItem value="critical">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500" />
                   Críticos (&lt;71%)
                 </div>
               </SelectItem>
             </SelectContent>
           </Select>

           {viewMode === 'table' && (
             <Button 
               variant="outline" 
               size="sm" 
               className="gap-2"
               onClick={() => setExportModalOpen(true)}
             >
               <Download className="h-4 w-4" />
               Exportar
             </Button>
           )}
        </div>
      </div>

      {/* Key Results View - Cards or Table */}
      {viewMode === 'table' ? (
        <KRTableView
          keyResults={filteredKeyResults}
          objectives={objectives}
          pillars={pillars}
          periodType={selectedPeriod}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          selectedQuarter={selectedQuarter}
          selectedQuarterYear={selectedQuarterYear}
          selectedSemester={selectedSemester}
          selectedSemesterYear={selectedSemesterYear}
          selectedBimonth={selectedBimonth}
          selectedBimonthYear={selectedBimonthYear}
          onKRClick={openKROverviewModal}
          customMetricsMap={customMetricsMap}
          pillarFilter={pillarFilter}
          statusFilter={progressFilter}
          searchTerm={searchTerm}
          exportModalOpen={exportModalOpen}
          setExportModalOpen={setExportModalOpen}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKeyResults.map((keyResult) => {
              const pillar = getKeyResultPillar(keyResult);
              const isOwned = keyResult.assigned_owner_id === currentUserId;
              
              return (
                <KRCard
                  key={keyResult.id}
                  keyResult={keyResult}
                  pillar={pillar}
                  selectedPeriod={selectedPeriod}
                  selectedMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
                  selectedYear={selectedPeriod === 'monthly' || selectedPeriod === 'yearly' ? selectedYear : undefined}
                  selectedQuarter={selectedPeriod === 'quarterly' ? selectedQuarter : undefined}
                  selectedSemester={selectedPeriod === 'semesterly' ? selectedSemester : undefined}
                  selectedSemesterYear={selectedPeriod === 'semesterly' ? selectedSemesterYear : undefined}
                  selectedBimonth={selectedPeriod === 'bimonthly' ? selectedBimonth : undefined}
                  selectedBimonthYear={selectedPeriod === 'bimonthly' ? selectedBimonthYear : undefined}
                  onClick={() => openKROverviewModal(keyResult)}
                  isOwned={isOwned}
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
        </>
      )}

      {/* Add Key Result Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <StandaloneKeyResultForm
            objectives={objectives}
            onSave={handleCreateKeyResultFromForm}
            onCancel={() => setIsAddModalOpen(false)}
          />
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
            await refreshData();
          }}
          objectives={objectives.map(obj => ({ id: obj.id, title: obj.title }))}
          initialPeriod={selectedPeriod}
          initialMonth={selectedMonth}
          initialYear={selectedPeriod === 'monthly' || selectedPeriod === 'yearly' ? selectedYear : undefined}
          initialQuarter={selectedQuarter}
          initialQuarterYear={selectedQuarterYear}
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