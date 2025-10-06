import React, { useState, useEffect } from 'react';
import { Target, Briefcase, TrendingUp, Users, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Award, Building, ChevronDown, ChevronUp, Settings, Search, Compass, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { RumoDashboard } from './RumoDashboard';

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
  const [activeTab, setActiveTab] = useState('rumo');
  const [keyResults, setKeyResults] = useState<KeyResultWithPillar[]>([]);
  const [filteredKeyResults, setFilteredKeyResults] = useState<KeyResultWithPillar[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [expandedKRs, setExpandedKRs] = useState<Set<string>>(new Set());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalObjectives: 0,
    totalKRs: 0,
    activeProjects: 0,
    overallScore: 0,
    filledTools: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [objectiveFilter, setObjectiveFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const currentYear = new Date().getFullYear();

  // Calculate progress function
  const calculateProgress = (keyResult: KeyResultWithPillar): number => {
    if (!keyResult.target_value || keyResult.target_value === 0) return 0;
    return Math.min((keyResult.current_value / keyResult.target_value) * 100, 100);
  };

  // Filter and sort logic
  useEffect(() => {
    const filtered = keyResults.filter(keyResult => {
      const matchesSearch = keyResult.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           keyResult.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || keyResult.priority === priorityFilter;
      const matchesObjective = objectiveFilter === 'all' || keyResult.objective_id === objectiveFilter;
      const matchesPillar = pillarFilter === 'all' || keyResult.pillar_id === pillarFilter;
      
      // Check progress match
      let matchesProgress = progressFilter === 'all';
      if (!matchesProgress) {
        const progress = calculateProgress(keyResult);
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
  }, [keyResults, searchTerm, priorityFilter, objectiveFilter, pillarFilter, progressFilter, pillars]);

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
          aggregation_type,
          objective_id,
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
        priority: 'medium'
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
    return kr.yearly_target > 0 ? Math.round(kr.yearly_actual / kr.yearly_target * 100) : 0;
  };

  const toggleKRExpansion = (krId: string) => {
    const newExpanded = new Set(expandedKRs);
    if (newExpanded.has(krId)) {
      newExpanded.delete(krId);
    } else {
      newExpanded.add(krId);
    }
    setExpandedKRs(newExpanded);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (percentage >= 70) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
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
    const target = kr.monthly_targets?.[monthKey] || 0;
    const actual = kr.monthly_actual?.[monthKey] || 0;
    const percentage = target > 0 ? Math.round(actual / target * 100) : 0;
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
    
    // Coletar valores mensais
    const targetValues = months.map(month => kr.monthly_targets?.[month.key] || 0);
    const actualValues = months.map(month => kr.monthly_actual?.[month.key] || 0);
    
    const totalTarget = calculateAggregatedValue(targetValues, aggregationType);
    const totalActual = calculateAggregatedValue(actualValues, aggregationType);
    const totalPercentage = totalTarget > 0 ? Math.round(totalActual / totalTarget * 100) : 0;
    
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ano:</span>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => {
              setSelectedYear(parseInt(value));
              setExpandedKRs(new Set()); // Collapse all KRs when changing year
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: currentYear - 2019 + 5 }, (_, i) => 2020 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    const yearlyAchievement = getYearlyAchievement(kr);
                    const isExpanded = expandedKRs.has(kr.id);
                    
                    return (
                      <div key={kr.id} className="border rounded-lg overflow-hidden group">
                        {/* Collapsed State - Always Visible */}
                        <div className="flex">
                          {/* Barra lateral colorida com a cor do pilar */}
                          <div 
                            className="w-1.5 flex-shrink-0 transition-all duration-300 group-hover:w-2" 
                            style={{ backgroundColor: kr.pillar_color }}
                          />
                          <div className="flex-1 p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="space-y-1">
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
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(yearlyAchievement)}
                                  <div className="flex flex-col items-end">
                                    <span className={`text-sm font-medium ${getStatusColor(yearlyAchievement)}`}>
                                      {yearlyAchievement}% no ano
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Atual: {kr.yearly_actual || kr.current_value || 0}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleKRExpansion(kr.id)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded State - Monthly Details */}
                        {isExpanded && (
                          <div className="border-t bg-muted/50">
                            <div className="p-4">
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground">Tipo de Totalizador:</span>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {getAggregationTypeLabel(kr.aggregation_type || 'sum')}
                                  </Badge>
                                </div>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-32">Indicador</TableHead>
                                       {months.map(month => (
                                         <TableHead key={month.key} className="text-center min-w-20">
                                           {month.name}
                                           {month.key === currentMonth && selectedYear === currentYear && (
                                             <span className="block text-xs text-blue-600">(atual)</span>
                                           )}
                                         </TableHead>
                                       ))}
                                        <TableHead className="text-center min-w-24 bg-muted/50 font-semibold">
                                          Total
                                        </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-medium bg-white">Previsto</TableCell>
                                     {months.map(month => {
                                       const performance = getMonthlyPerformance(kr, month.key);
                                       const isCurrentMonth = month.key === currentMonth && selectedYear === currentYear;
                                       return (
                                         <TableCell 
                                           key={month.key} 
                                           className={`text-center ${isCurrentMonth ? "bg-blue-50" : "bg-white"}`}
                                         >
                                           {performance.target || '-'}
                                         </TableCell>
                                      );
                                    })}
                                     <TableCell className="text-center bg-muted/50 font-semibold">
                                       {getAggregatedTotals(kr).target}
                                     </TableCell>
                                  </TableRow>
                                   <TableRow>
                                     <TableCell className="font-medium bg-white">Realizado</TableCell>
                                     {months.map(month => {
                                       const performance = getMonthlyPerformance(kr, month.key);
                                       const isCurrentMonth = month.key === currentMonth && selectedYear === currentYear;
                                       return (
                                         <TableCell 
                                           key={month.key} 
                                           className={`text-center ${isCurrentMonth ? "bg-blue-50" : "bg-white"}`}
                                         >
                                           {performance.actual || '-'}
                                         </TableCell>
                                       );
                                     })}
                                      <TableCell className="text-center bg-muted/50 font-semibold">
                                        {getAggregatedTotals(kr).actual}
                                      </TableCell>
                                   </TableRow>
                                   <TableRow>
                                     <TableCell className="font-medium bg-white">% Atingimento</TableCell>
                                     {months.map(month => {
                                       const performance = getMonthlyPerformance(kr, month.key);
                                       const isCurrentMonth = month.key === currentMonth && selectedYear === currentYear;
                                       return (
                                         <TableCell 
                                           key={month.key} 
                                           className={`text-center ${isCurrentMonth ? "bg-blue-50" : "bg-white"}`}
                                         >
                                           <span className={getStatusColor(performance.percentage)}>
                                             {performance.percentage > 0 ? `${performance.percentage}%` : '-'}
                                           </span>
                                         </TableCell>
                                       );
                                     })}
                                     <TableCell className="text-center bg-muted/50 font-semibold">
                                       <span className={getStatusColor(getAggregatedTotals(kr).percentage)}>
                                         {getAggregatedTotals(kr).percentage}%
                                       </span>
                                     </TableCell>
                                   </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
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
    </div>
  );
};