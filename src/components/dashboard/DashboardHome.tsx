import React, { useState, useEffect, useMemo } from 'react';
import { Target, Briefcase, TrendingUp, Users, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Award, Building, Settings, Search, Compass, LayoutDashboard, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCompanyModuleSettings } from '@/hooks/useCompanyModuleSettings';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';
import { RumoDashboard } from './RumoDashboard';
import { MonthlyPerformanceIndicators } from '@/components/strategic-map/MonthlyPerformanceIndicators';
import { filterKRsByValidity, getPopulatedQuarters } from '@/lib/krValidityFilter';
import { KROverviewModal } from '@/components/strategic-map/KROverviewModal';
import { calculateKRStatus } from '@/lib/krHelpers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface KeyResultWithPillar {
  id: string;
  title: string;
  description?: string;
  monthly_targets: Record<string, number>;
  monthly_actual: Record<string, number>;
  yearly_target: number;
  yearly_actual: number;
  current_value: number;
  target_value: number;
  due_date?: string;
  pillar_name: string;
  pillar_color: string;
  objective_title: string;
  objective_id: string;
  pillar_id: string;
  aggregation_type?: string;
  priority?: string;
  target_direction?: 'maximize' | 'minimize';
  unit?: string;
  // Pre-calculated fields from database
  ytd_target?: number;
  ytd_actual?: number;
  ytd_percentage?: number;
  current_month_target?: number;
  current_month_actual?: number;
  monthly_percentage?: number;
  yearly_percentage?: number;
}

interface DashboardStats {
  totalObjectives: number;
  totalKRs: number;
  activeProjects: number;
  overallScore: number;
  filledTools: number;
}

const getDynamicStats = (stats: DashboardStats) => [{
  title: 'Objetivos Cadastrados',
  value: stats.totalObjectives.toString(),
  change: stats.totalObjectives > 0 ? '+' + stats.totalObjectives : '0',
  changeType: stats.totalObjectives > 0 ? 'positive' as const : 'neutral' as const,
  icon: Award,
  color: 'text-blue-600',
  bgColor: 'bg-blue-50'
}, {
  title: 'Total de KRs',
  value: stats.totalKRs.toString(),
  change: stats.totalKRs > 0 ? '+' + stats.totalKRs : '0',
  changeType: stats.totalKRs > 0 ? 'positive' as const : 'neutral' as const,
  icon: Target,
  color: 'text-green-600',
  bgColor: 'bg-green-50'
}, {
  title: 'Projetos em Andamento',
  value: stats.activeProjects.toString(),
  change: stats.activeProjects > 0 ? '+' + stats.activeProjects : '0',
  changeType: stats.activeProjects > 0 ? 'positive' as const : 'neutral' as const,
  icon: Briefcase,
  color: 'text-orange-600',
  bgColor: 'bg-orange-50'
}, {
  title: 'Ferramentas Preenchidas',
  value: `${stats.filledTools}/3`,
  change: stats.filledTools > 0 ? `${stats.filledTools} preenchidas` : 'Nenhuma preenchida',
  changeType: stats.filledTools > 0 ? 'positive' as const : 'neutral' as const,
  icon: Settings,
  color: 'text-purple-600',
  bgColor: 'bg-purple-50'
}];

export const DashboardHome: React.FC = () => {
  const { company } = useAuth();
  const { validityEnabled } = useCompanyModuleSettings('strategic-planning');
  
  // Use global period filter context
  const {
    periodType, setPeriodType,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedQuarter, setSelectedQuarter,
    selectedQuarterYear, setSelectedQuarterYear,
    selectedMonthYear, setSelectedMonthYear,
    isYTDCalculable, ytdInfoMessage, planFirstYear,
    quarterOptions, monthOptions, yearOptions,
    handleYTDClick: contextHandleYTDClick
  } = usePeriodFilter();
  
  const [activeTab, setActiveTab] = useState('rumo');
  const [keyResults, setKeyResults] = useState<KeyResultWithPillar[]>([]);
  const [filteredKeyResults, setFilteredKeyResults] = useState<KeyResultWithPillar[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [selectedKRForModal, setSelectedKRForModal] = useState<KeyResultWithPillar | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalObjectives: 0,
    totalKRs: 0,
    activeProjects: 0,
    overallScore: 0,
    filledTools: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [objectiveFilter, setObjectiveFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const currentYear = new Date().getFullYear();

  // Handler para clique no botão YTD - sempre permite selecionar
  const handleYTDClick = () => {
    contextHandleYTDClick();
    if (!isYTDCalculable && ytdInfoMessage) {
      toast.info(ytdInfoMessage);
    }
  };

  // Calculate progress function
  const calculateProgress = (keyResult: KeyResultWithPillar): number => {
    if (!keyResult.target_value || keyResult.target_value === 0) return 0;
    const pct = calculateKRStatus(
      keyResult.current_value,
      keyResult.target_value,
      keyResult.target_direction || 'maximize'
    ).percentage;
    return Math.min(pct, 100);
  };

  // Filtrar quarters para mostrar apenas os que têm KRs registrados
  const filteredQuarterOptions = useMemo(() => {
    return getPopulatedQuarters(keyResults as any[], quarterOptions);
  }, [keyResults, quarterOptions]);

  // Apply validity filtering first (use unknown cast to handle type differences)
  const validityFilteredKRs = useMemo(() => {
    return filterKRsByValidity(
      keyResults as any[],
      validityEnabled,
      periodType,
      {
        selectedQuarter,
        selectedQuarterYear,
        selectedYear,
        selectedMonth: selectedMonth,
        planFirstYear
      }
    ) as unknown as KeyResultWithPillar[];
  }, [keyResults, validityEnabled, periodType, selectedQuarter, selectedQuarterYear, selectedYear, selectedMonth, planFirstYear]);

  // Filter and sort logic
  useEffect(() => {
    const filtered = validityFilteredKRs.filter(keyResult => {
      const matchesSearch = keyResult.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           keyResult.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || keyResult.priority === priorityFilter;
      const matchesObjective = objectiveFilter === 'all' || keyResult.objective_id === objectiveFilter;
      const matchesPillar = pillarFilter === 'all' || keyResult.pillar_id === pillarFilter;
      
      // Check progress match
      let matchesProgress = progressFilter === 'all';
      if (!matchesProgress) {
        const progress = getSelectedAchievement(keyResult);
        if (progressFilter === 'above') {
          matchesProgress = progress >= 90;
        } else if (progressFilter === 'near') {
          matchesProgress = progress >= 70 && progress < 90;
        } else if (progressFilter === 'below') {
          matchesProgress = progress < 70;
        }
      }
      
      return matchesSearch && matchesPriority && matchesObjective && matchesPillar && matchesProgress;
    });
    
    // Sort by pillar order (as they appear in filter) and then alphabetically
    const sorted = filtered.sort((a, b) => {
      // Find pillar indices
      const pillarIndexA = pillars.findIndex(p => p.id === a.pillar_id);
      const pillarIndexB = pillars.findIndex(p => p.id === b.pillar_id);
      
      // Sort by pillar order first
      if (pillarIndexA !== pillarIndexB) {
        return pillarIndexA - pillarIndexB;
      }
      
      // Then sort alphabetically by title within the same pillar
      return a.title.localeCompare(b.title, 'pt-BR');
    });
    
    setFilteredKeyResults(sorted);
  }, [validityFilteredKRs, searchTerm, priorityFilter, objectiveFilter, pillarFilter, progressFilter, pillars]);

  // Sincronizar selectedKRForModal com a lista atualizada
  useEffect(() => {
    if (selectedKRForModal && keyResults.length > 0) {
      const updatedKR = keyResults.find(kr => kr.id === selectedKRForModal.id);
      if (updatedKR) {
        if (JSON.stringify(updatedKR) !== JSON.stringify(selectedKRForModal)) {
          console.log('[DashboardHome] Sincronizando selectedKRForModal:', {
            id: updatedKR.id,
            start_month: (updatedKR as any).start_month,
            end_month: (updatedKR as any).end_month
          });
          setSelectedKRForModal(updatedKR);
        }
      }
    }
  }, [keyResults]);

  useEffect(() => {
    if (company?.id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [company?.id, selectedYear]);

  const fetchDashboardData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      // Buscar planos estratégicos da empresa
      const { data: plansData } = await supabase
        .from('strategic_plans')
        .select('id')
        .eq('company_id', company.id);
      const planIds = plansData?.map(plan => plan.id) || [];
      
      if (planIds.length === 0) {
        setKeyResults([]);
        setObjectives([]);
        setPillars([]);
        setFilteredKeyResults([]);
        setDashboardStats({
          totalObjectives: 0,
          totalKRs: 0,
          activeProjects: 0,
          overallScore: 0,
          filledTools: 0
        });
        setLoading(false);
        return;
      }

      // Buscar objetivos primeiro para obter os IDs
      const { data: objectivesData } = await supabase
        .from('strategic_objectives')
        .select(`
          id,
          title,
          pillar_id,
          strategic_pillars!inner (
            id,
            name,
            color
          )
        `)
        .in('plan_id', planIds);
      
      // Buscar pilares únicos
      const uniquePillars = objectivesData?.reduce((acc: any[], obj: any) => {
        const existingPillar = acc.find(p => p.id === obj.strategic_pillars.id);
        if (!existingPillar) {
          acc.push({
            id: obj.strategic_pillars.id,
            name: obj.strategic_pillars.name,
            color: obj.strategic_pillars.color
          });
        }
        return acc;
      }, []) || [];
      
      const objectiveIds = objectivesData?.map(obj => obj.id) || [];
      
      if (objectiveIds.length === 0) {
        setKeyResults([]);
        setObjectives([]);
        setPillars([]);
        setFilteredKeyResults([]);
        setDashboardStats({
          totalObjectives: 0,
          totalKRs: 0,
          activeProjects: 0,
          overallScore: 0,
          filledTools: 0
        });
        setLoading(false);
        return;
      }

      // Buscar Key Results com informações de pilares e objetivos
      const { data: keyResultsData } = await supabase
        .from('key_results')
        .select(`
          id, 
          title,
          description,
          due_date, 
          current_value, 
          target_value,
          yearly_target,
          yearly_actual,
          monthly_targets,
          monthly_actual,
          target_direction,
          aggregation_type,
          objective_id,
          unit,
          ytd_target,
          ytd_actual,
          ytd_percentage,
          current_month_target,
          current_month_actual,
          monthly_percentage,
          yearly_percentage,
          strategic_objectives!inner (
            id,
            title,
            pillar_id,
            strategic_pillars!inner (
              name,
              color
            )
          )
        `)
        .in('objective_id', objectiveIds);

      // Buscar projetos da empresa
      const { data: projectsData } = await supabase
        .from('strategic_projects')
        .select('id, status')
        .eq('company_id', company.id);

      // Processar Key Results com informações de pilares
      const keyResultsWithPillars: KeyResultWithPillar[] = keyResultsData?.map(kr => ({
        id: kr.id,
        title: kr.title,
        description: kr.description,
        monthly_targets: kr.monthly_targets as Record<string, number> || {},
        monthly_actual: kr.monthly_actual as Record<string, number> || {},
        yearly_target: kr.yearly_target || kr.target_value || 0,
        yearly_actual: kr.yearly_actual || kr.current_value || 0,
        current_value: kr.current_value || 0,
        target_value: kr.target_value || 0,
        due_date: kr.due_date,
        pillar_name: kr.strategic_objectives.strategic_pillars.name,
        pillar_color: kr.strategic_objectives.strategic_pillars.color,
        objective_title: kr.strategic_objectives.title,
        objective_id: kr.objective_id,
        pillar_id: kr.strategic_objectives.pillar_id,
        aggregation_type: kr.aggregation_type || 'sum',
        target_direction: (kr.target_direction as 'maximize' | 'minimize') || 'maximize',
        priority: 'medium',
        unit: kr.unit,
        // Pre-calculated fields from database
        ytd_target: kr.ytd_target,
        ytd_actual: kr.ytd_actual,
        ytd_percentage: kr.ytd_percentage,
        current_month_target: kr.current_month_target,
        current_month_actual: kr.current_month_actual,
        monthly_percentage: kr.monthly_percentage,
        yearly_percentage: kr.yearly_percentage,
      })) || [];

      // Calcular estatísticas do dashboard
      const totalObjectives = objectiveIds.length;
      const totalKRs = keyResultsWithPillars.length;
      const activeProjects = projectsData?.filter(proj => 
        proj.status === 'in_progress' || proj.status === 'planning'
      ).length || 0;

      // Calcular score geral
      const scores = keyResultsWithPillars.map(kr => {
        const yearlyPercentage = kr.yearly_target > 0 ? kr.yearly_actual / kr.yearly_target * 100 : 0;
        return Math.min(yearlyPercentage, 100);
      });
      const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

      // Contar ferramentas preenchidas
      const toolsPromises = [
        // Golden Circle
        supabase
          .from('golden_circle')
          .select('id')
          .eq('company_id', company.id)
          .single(),
        // SWOT Analysis  
        supabase
          .from('swot_analysis')
          .select('id')
          .eq('company_id', company.id)
          .single(),
        // BEEP Assessments (completed)
        supabase
          .from('beep_assessments')
          .select('id')
          .eq('company_id', company.id)
          .eq('status', 'completed')
          .single()
      ];

      const toolsResults = await Promise.allSettled(toolsPromises);
      const filledTools = toolsResults.filter(result => result.status === 'fulfilled' && result.value.data).length;

      setKeyResults(keyResultsWithPillars);
      setObjectives(objectivesData || []);
      setPillars(uniquePillars);
      setFilteredKeyResults(keyResultsWithPillars);
      setDashboardStats({
        totalObjectives,
        totalKRs,
        activeProjects,
        overallScore,
        filledTools
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getYearlyAchievement = (kr: KeyResultWithPillar) => {
    if (kr.yearly_target === 0) return 0;
    return calculateKRStatus(
      kr.yearly_actual,
      kr.yearly_target,
      kr.target_direction || 'maximize'
    ).percentage;
  };

  const getPeriodLabel = () => {
    if (periodType === 'ytd') return 'YTD';
    if (periodType === 'monthly') {
      return new Date().toLocaleDateString('pt-BR', { month: 'long' }).replace(/^./, c => c.toUpperCase());
    }
    return 'Ano';
  };

  const getSelectedAchievement = (kr: KeyResultWithPillar) => {
    if (periodType === 'quarterly') {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      const endMonth = selectedQuarter * 3;
      
      const monthKeys = [];
      for (let m = startMonth; m <= endMonth; m++) {
        monthKeys.push(`${selectedQuarterYear}-${m.toString().padStart(2, '0')}`);
      }
      
      const targets = monthKeys.map(key => kr.monthly_targets?.[key] || 0);
      const actuals = monthKeys.map(key => kr.monthly_actual?.[key] || 0);
      
      const totalTarget = calculateAggregatedValue(targets, kr.aggregation_type || 'sum');
      const totalActual = calculateAggregatedValue(actuals, kr.aggregation_type || 'sum');
      
      if (totalTarget > 0) {
        return calculateKRStatus(totalActual, totalTarget, kr.target_direction || 'maximize').percentage;
      }
      return 0;
    }
    
    if (periodType === 'monthly') {
      // Se mês customizado foi selecionado
      if (selectedMonth && selectedMonthYear) {
        const monthKey = `${selectedMonthYear}-${selectedMonth.toString().padStart(2, '0')}`;
        const monthlyTargets = kr.monthly_targets || {};
        const monthlyActual = kr.monthly_actual || {};
        
        const target = monthlyTargets[monthKey] || 0;
        const actual = monthlyActual[monthKey] || 0;
        
        if (target > 0 && actual > 0) {
          if (kr.target_direction === 'minimize') {
            return ((target - actual) / target) * 100 + 100;
          } else {
            return (actual / target) * 100;
          }
        }
        return 0;
      }
      
      // Usar valor pré-calculado do mês atual
      if (typeof kr.monthly_percentage === 'number') return kr.monthly_percentage;
      return 0;
    }
    if (periodType === 'ytd') {
      if (typeof kr.ytd_percentage === 'number') return kr.ytd_percentage;
      return 0;
    }
    // yearly - calcular para o ano selecionado
    if (periodType === 'yearly') {
      const monthKeys = [];
      for (let m = 1; m <= 12; m++) {
        monthKeys.push(`${selectedYear}-${m.toString().padStart(2, '0')}`);
      }
      
      const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
      const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
      
      const targets = monthKeys.map(key => monthlyTargets[key] || 0);
      const actuals = monthKeys.map(key => monthlyActual[key] || 0);
      
      const totalTarget = calculateAggregatedValue(targets, kr.aggregation_type || 'sum');
      const totalActual = calculateAggregatedValue(actuals, kr.aggregation_type || 'sum');
      
      if (totalTarget > 0) {
        return calculateKRStatus(totalActual, totalTarget, kr.target_direction || 'maximize').percentage;
      }
      return 0;
    }
    
    if (typeof kr.yearly_percentage === 'number') return kr.yearly_percentage;
    return 0;
  };

  const getSelectedActualValue = (kr: KeyResultWithPillar) => {
    if (periodType === 'quarterly') {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      const endMonth = selectedQuarter * 3;
      
      const monthKeys = [];
      for (let m = startMonth; m <= endMonth; m++) {
        monthKeys.push(`${selectedQuarterYear}-${m.toString().padStart(2, '0')}`);
      }
      
      const actuals = monthKeys.map(key => kr.monthly_actual?.[key] || 0);
      return calculateAggregatedValue(actuals, kr.aggregation_type || 'sum');
    }
    
    if (periodType === 'monthly') {
      // Se mês customizado foi selecionado
      if (selectedMonth && selectedMonthYear) {
        const monthKey = `${selectedMonthYear}-${selectedMonth.toString().padStart(2, '0')}`;
        return kr.monthly_actual?.[monthKey] ?? 0;
      }
      // Usar mês atual
      return kr.current_month_actual ?? 0;
    }
    if (periodType === 'ytd') {
      return kr.ytd_actual ?? 0;
    }
    // yearly - calcular para o ano selecionado
    if (periodType === 'yearly') {
      const monthKeys = [];
      for (let m = 1; m <= 12; m++) {
        monthKeys.push(`${selectedYear}-${m.toString().padStart(2, '0')}`);
      }
      
      const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
      const actuals = monthKeys.map(key => monthlyActual[key] || 0);
      return calculateAggregatedValue(actuals, kr.aggregation_type || 'sum');
    }
    
    return kr.yearly_actual ?? kr.current_value ?? 0;
  };

  const handleOpenKRModal = (kr: KeyResultWithPillar) => {
    setSelectedKRForModal(kr);
  };

  const handleCloseKRModal = () => {
    setSelectedKRForModal(null);
  };

  const handleDeleteKR = async () => {
    if (!selectedKRForModal) return;
    
    try {
      const { error } = await supabase
        .from('key_results')
        .delete()
        .eq('id', selectedKRForModal.id);

      if (error) throw error;

      // Refresh data
      await fetchDashboardData();
      handleCloseKRModal();
    } catch (error) {
      console.error('Error deleting KR:', error);
    }
  };

  // Atualiza apenas o KR específico na lista sem mostrar loading
  const refreshKeyResultInList = async (krId: string) => {
    try {
      const { data: updatedKR, error } = await supabase
        .from('key_results')
        .select(`
          id, title, description, due_date, current_value, target_value,
          yearly_target, yearly_actual, monthly_targets, monthly_actual,
          target_direction, aggregation_type, objective_id, unit,
          ytd_target, ytd_actual, ytd_percentage,
          current_month_target, current_month_actual,
          monthly_percentage, yearly_percentage, start_month, end_month,
          strategic_objectives (
            id, title, pillar_id,
            strategic_pillars (name, color)
          )
        `)
        .eq('id', krId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar KR atualizado:', error);
        return;
      }
      if (!updatedKR) return;

      // Atualizar o KR na lista local (sem mostrar loading)
      setKeyResults(prevKRs => 
        prevKRs.map(kr => {
          if (kr.id === krId) {
            return {
              id: updatedKR.id,
              title: updatedKR.title,
              description: updatedKR.description,
              monthly_targets: updatedKR.monthly_targets as Record<string, number> || {},
              monthly_actual: updatedKR.monthly_actual as Record<string, number> || {},
              yearly_target: updatedKR.yearly_target || updatedKR.target_value || 0,
              yearly_actual: updatedKR.yearly_actual || updatedKR.current_value || 0,
              current_value: updatedKR.current_value || 0,
              target_value: updatedKR.target_value || 0,
              due_date: updatedKR.due_date,
              pillar_name: updatedKR.strategic_objectives?.strategic_pillars?.name || kr.pillar_name,
              pillar_color: updatedKR.strategic_objectives?.strategic_pillars?.color || kr.pillar_color,
              objective_title: updatedKR.strategic_objectives?.title || kr.objective_title,
              objective_id: updatedKR.objective_id,
              pillar_id: updatedKR.strategic_objectives?.pillar_id || kr.pillar_id,
              aggregation_type: updatedKR.aggregation_type || 'sum',
              target_direction: (updatedKR.target_direction as 'maximize' | 'minimize') || 'maximize',
              priority: 'medium',
              unit: updatedKR.unit,
              ytd_target: updatedKR.ytd_target,
              ytd_actual: updatedKR.ytd_actual,
              ytd_percentage: updatedKR.ytd_percentage,
              current_month_target: updatedKR.current_month_target,
              current_month_actual: updatedKR.current_month_actual,
              monthly_percentage: updatedKR.monthly_percentage,
              yearly_percentage: updatedKR.yearly_percentage,
            };
          }
          return kr;
        })
      );
    } catch (error) {
      console.error('Erro ao atualizar KR na lista:', error);
      // Não chamar fetchDashboardData para evitar loading flash
    }
  };

  const handleSaveKR = async () => {
    // Atualizar apenas o KR editado sem mostrar loading
    if (selectedKRForModal?.id) {
      await refreshKeyResultInList(selectedKRForModal.id);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage > 105) return 'text-blue-600 font-semibold';  // Excelente (superou a meta)
    if (percentage >= 100) return 'text-green-600';              // Sucesso (no alvo)
    if (percentage >= 71) return 'text-yellow-600';              // Atenção (próximo da meta)
    if (percentage > 0) return 'text-red-600';                   // Crítico (abaixo da meta)
    return 'text-gray-400';                                      // Sem dados
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage > 105) return <CheckCircle className="h-4 w-4 text-blue-500" />;  // Excelente
    if (percentage >= 100) return <CheckCircle className="h-4 w-4 text-green-500" />; // Sucesso
    if (percentage >= 71) return <TrendingUp className="h-4 w-4 text-yellow-500" />; // Atenção
    return <AlertCircle className="h-4 w-4 text-red-500" />;                         // Crítico
  };

  const getMonthsOfYear = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(selectedYear, i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('pt-BR', {
        month: 'short'
      });
      months.push({
        key: monthKey,
        name: monthName
      });
    }
    return months;
  };

  const getMonthlyPerformance = (kr: KeyResultWithPillar, monthKey: string) => {
    const target = kr.monthly_targets?.[monthKey];
    const actual = kr.monthly_actual?.[monthKey];
    
    const hasTarget = typeof target === 'number' && Number.isFinite(target) && target > 0;
    const hasActual = typeof actual === 'number' && Number.isFinite(actual);
    
    // Se não há target válido ou actual, não há dados para calcular
    if (!hasTarget || !hasActual) {
      return {
        target: hasTarget ? target : null,
        actual: hasActual ? actual : null,
        percentage: null
      };
    }
    
    const percentage = Math.round(
      calculateKRStatus(actual, target, kr.target_direction || 'maximize').percentage
    );
    
    return {
      target,
      actual,
      percentage
    };
  };

  const calculateAggregatedValue = (values: number[], aggregationType: string) => {
    if (!values.length) return 0;
    
    switch (aggregationType) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'average':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return values.reduce((sum, val) => sum + val, 0);
    }
  };

  const getAggregatedTotals = (kr: KeyResultWithPillar) => {
    const months = getMonthsOfYear();
    const aggregationType = kr.aggregation_type || 'sum';
    
    // Coletar apenas valores mensais com targets definidos E actual presente
    const monthsWithData = months.filter(month => {
      const target = kr.monthly_targets?.[month.key];
      const actual = kr.monthly_actual?.[month.key];
      const hasTarget = typeof target === 'number' && Number.isFinite(target) && target > 0;
      const hasActual = typeof actual === 'number' && Number.isFinite(actual);
      return hasTarget && hasActual;
    });
    
    const targetValues = monthsWithData.map(month => kr.monthly_targets?.[month.key] || 0);
    const actualValues = monthsWithData.map(month => kr.monthly_actual?.[month.key] || 0);
    
    const totalTarget = calculateAggregatedValue(targetValues, aggregationType);
    const totalActual = calculateAggregatedValue(actualValues, aggregationType);
    const totalPercentage = totalTarget > 0 
      ? calculateKRStatus(totalActual, totalTarget, kr.target_direction || 'maximize').percentage
      : null;
    
    return {
      target: totalTarget,
      actual: totalActual,
      percentage: totalPercentage,
      aggregationType
    };
  };

  const getAggregationTypeLabel = (aggregationType: string) => {
    switch (aggregationType) {
      case 'sum':
        return 'Soma';
      case 'average':
        return 'Média';
      case 'min':
        return 'Mínimo';
      case 'max':
        return 'Máximo';
      default:
        return 'Soma';
    }
  };

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma empresa selecionada
            </h3>
            <p className="text-muted-foreground">
              Selecione uma empresa no menu superior para visualizar o dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy HUB</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral estratégica da empresa - {company.name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="rumo" className="gap-2">
            <Compass className="w-4 h-4" />
            Rumo
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Instrumentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Instrumentos</h2>
                <p className="text-sm text-muted-foreground">Métricas e Indicadores de Performance</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Period Filter */}
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={periodType === 'ytd' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={handleYTDClick}
                      className="gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      YTD
                      {!isYTDCalculable && <AlertCircle className="w-3 h-3 text-blue-400" />}
                    </Button>
                  </TooltipTrigger>
                  {!isYTDCalculable && ytdInfoMessage && (
                    <TooltipContent>
                      <p className="max-w-xs">{ytdInfoMessage}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
  <Button
    variant={periodType === 'yearly' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setPeriodType('yearly')}
    className="gap-2"
  >
    <Target className="w-4 h-4" />
    Ano
  </Button>

  {periodType === 'yearly' && (
    <Select
      value={selectedYear.toString()}
      onValueChange={(value) => setSelectedYear(parseInt(value))}
    >
      <SelectTrigger className="h-9 w-[100px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {yearOptions.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
              
              {/* Quarter - Botão */}
              <Button
                variant={periodType === 'quarterly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriodType('quarterly')}
                className="gap-2 border-l border-border/50 ml-1 pl-2"
              >
                <Calendar className="w-4 h-4" />
                Quarter
              </Button>

              {/* Quarter - Combo (dentro do container, ao lado do botão) */}
              {periodType === 'quarterly' && (
                <Select
                  value={`${selectedQuarterYear}-Q${selectedQuarter}`}
                  onValueChange={(value) => {
                    const [year, q] = value.split('-Q');
                    setSelectedQuarterYear(parseInt(year));
                    setSelectedQuarter(parseInt(q) as 1 | 2 | 3 | 4);
                  }}
                >
                  <SelectTrigger className="h-9 w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredQuarterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Mês - Botão */}
              <Button
                variant={periodType === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriodType('monthly')}
                className="gap-2 border-l border-border/50 ml-1 pl-2"
              >
                <Calendar className="w-4 h-4" />
                Mês
              </Button>
            </div>
              
              {/* Select de Mês - Aparece fora do container quando monthly está selecionado */}
              {periodType === 'monthly' && (
                <Select
                  value={`${selectedMonthYear}-${selectedMonth.toString().padStart(2, '0')}`}
                  onValueChange={(value) => {
                    const [year, month] = value.split('-');
                    setSelectedMonthYear(parseInt(year));
                    setSelectedMonth(parseInt(month));
                  }}
                >
                  <SelectTrigger className="h-9 w-[200px] gap-2">
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
          </div>

          {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getDynamicStats(dashboardStats).map(stat => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                   <div className="flex items-center mt-2">
                     {stat.changeType === 'positive' ? (
                       <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                     ) : (
                       <div className="w-3 h-3 mr-1" />
                     )}
                     <span 
                       className={`text-xs font-medium ${
                         stat.changeType === 'positive' 
                           ? 'text-green-600' 
                           : 'text-muted-foreground'
                       }`}
                     >
                       {stat.change}
                     </span>
                   </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Key Results Progress */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Key Results</CardTitle>
              <CardDescription>Resultados Chave individuais - Previsto vs Realizado ({selectedYear})</CardDescription>
            </CardHeader>
            <CardContent>
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
                      <SelectItem value="above">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          Acima da meta
                        </div>
                      </SelectItem>
                      <SelectItem value="near">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          Próximo da meta
                        </div>
                      </SelectItem>
                      <SelectItem value="below">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          Abaixo da meta
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">Carregando Key Results...</div>
              ) : filteredKeyResults.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {keyResults.length === 0 ? 'Nenhum Key Result encontrado' : 'Nenhum resultado encontrado para os filtros aplicados'}
                  </h3>
                  <p className="text-muted-foreground">
                    {keyResults.length === 0 ? 'Crie Key Results para acompanhar a performance da empresa.' : 'Tente ajustar os filtros para ver mais resultados.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredKeyResults.map(kr => {
                    const months = getMonthsOfYear();
                    const selectedAchievement = getSelectedAchievement(kr);
                    const selectedActualValue = getSelectedActualValue(kr);
                    
                    return (
                      <div key={kr.id} className="border rounded-lg overflow-hidden group">
                        {/* KR Card */}
                        <div className="flex">
                          {/* Barra lateral colorida com a cor do pilar */}
                          <div 
                            className="w-1.5 flex-shrink-0 transition-all duration-300 group-hover:w-2" 
                            style={{ backgroundColor: kr.pillar_color }}
                          />
                          <div className="flex-1 p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium text-foreground">{kr.title}</h4>
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs"
                                      style={{ 
                                        backgroundColor: `${kr.pillar_color}15`, 
                                        color: kr.pillar_color,
                                        borderColor: `${kr.pillar_color}30`
                                      }}
                                    >
                                      {kr.pillar_name}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{kr.objective_title}</p>
                                  <MonthlyPerformanceIndicators
                                    monthlyTargets={kr.monthly_targets}
                                    monthlyActual={kr.monthly_actual}
                                    targetDirection={kr.target_direction || 'maximize'}
                                    selectedYear={selectedYear}
                                    size="sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(selectedAchievement)}
                                  <div className="flex flex-col items-end">
                                     <span className={`text-sm font-medium ${getStatusColor(selectedAchievement)}`}>
                                       {selectedAchievement.toFixed(1)}% {
                                         periodType === 'monthly' 
                                           ? `em ${new Date(selectedMonthYear, selectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long' })}` 
                                           : periodType === 'quarterly'
                                           ? `no Q${selectedQuarter} ${selectedQuarterYear}`
                                           : periodType === 'ytd' 
                                           ? 'YTD' 
                                           : 'no ano'
                                       }
                                     </span>
                                    <span className="text-xs text-muted-foreground">
                                      Atual: {Number(selectedActualValue).toFixed(1)}{kr.unit ? ` ${kr.unit}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenKRModal(kr)}
                                  className="text-muted-foreground hover:text-foreground"
                                  title="Ver detalhes"
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="rumo">
          <RumoDashboard />
        </TabsContent>
      </Tabs>

      {/* KR Overview Modal */}
      {selectedKRForModal && (
        <KROverviewModal
          keyResult={selectedKRForModal as any}
          pillar={{
            name: selectedKRForModal.pillar_name,
            color: selectedKRForModal.pillar_color
          }}
          open={!!selectedKRForModal}
          onClose={handleCloseKRModal}
          onDelete={handleDeleteKR}
          onSave={handleSaveKR}
          objectives={objectives}
          showDeleteButton={true}
          initialPeriod={periodType}
          initialMonth={selectedMonth}
          initialYear={selectedMonthYear}
        />
      )}
    </div>
  );
};