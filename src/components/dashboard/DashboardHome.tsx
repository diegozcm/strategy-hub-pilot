import React, { useState, useEffect } from 'react';
import { Target, Briefcase, TrendingUp, Users, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Award, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

interface ObjectiveWithMetrics {
  id: string;
  title: string;
  description: string;
  monthly_targets: Record<string, number>;
  monthly_actual: Record<string, number>;
  yearly_target: number;
  yearly_actual: number;
  owner_name: string;
  target_date: string;
  keyResults?: KeyResultWithMetrics[];
}

interface KeyResultWithMetrics {
  id: string;
  title: string;
  monthly_targets: Record<string, number>;
  monthly_actual: Record<string, number>;
  yearly_target: number;
  yearly_actual: number;
}

interface DashboardStats {
  activeObjectives: number;
  activeProjects: number;
  onTimeKRs: number;
  onTimeKRsPercentage: number;
  overallScore: number;
}


const getDynamicStats = (stats: DashboardStats) => [
  {
    title: 'Objetivos Ativos',
    value: stats.activeObjectives.toString(),
    change: stats.activeObjectives > 0 ? '+' + stats.activeObjectives : '0',
    changeType: stats.activeObjectives > 0 ? 'positive' as const : 'neutral' as const,
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'Projetos em Andamento',
    value: stats.activeProjects.toString(),
    change: stats.activeProjects > 0 ? '+' + stats.activeProjects : '0',
    changeType: stats.activeProjects > 0 ? 'positive' as const : 'neutral' as const,
    icon: Briefcase,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    title: 'KRs no Prazo',
    value: `${stats.onTimeKRsPercentage}%`,
    change: stats.onTimeKRs > 0 ? `${stats.onTimeKRs} de ${stats.onTimeKRs}` : '0',
    changeType: stats.onTimeKRsPercentage >= 80 ? 'positive' as const : stats.onTimeKRsPercentage >= 60 ? 'neutral' as const : 'negative' as const,
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
];

export const DashboardHome: React.FC = () => {
  const { company } = useAuth();
  const [objectives, setObjectives] = useState<ObjectiveWithMetrics[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    activeObjectives: 0,
    activeProjects: 0,
    onTimeKRs: 0,
    onTimeKRsPercentage: 0,
    overallScore: 0
  });
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (company?.id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [company?.id]);

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
        setObjectives([]);
        setDashboardStats({
          activeObjectives: 0,
          activeProjects: 0,
          onTimeKRs: 0,
          onTimeKRsPercentage: 0,
          overallScore: 0
        });
        setLoading(false);
        return;
      }

      // Buscar objetivos estratégicos dos planos da empresa
      const { data: objectivesData, error: objectivesError } = await supabase
        .from('strategic_objectives')
        .select(`
          id,
          title,
          description,
          monthly_targets,
          monthly_actual,
          yearly_target,
          yearly_actual,
          target_date,
          owner_id,
          status
        `)
        .in('plan_id', planIds);

      if (objectivesError) throw objectivesError;

      // Buscar projetos da empresa
      const { data: projectsData } = await supabase
        .from('strategic_projects')
        .select('id, status')
        .eq('company_id', company.id);

      // Buscar KRs dos objetivos com dados mensais
      const objectiveIds = objectivesData?.map(obj => obj.id) || [];
      const { data: keyResultsData } = await supabase
        .from('key_results')
        .select(`
          id, 
          objective_id,
          title,
          status, 
          due_date, 
          current_value, 
          target_value,
          yearly_target,
          yearly_actual,
          monthly_targets,
          monthly_actual
        `)
        .in('objective_id', objectiveIds);


      // Buscar perfis dos proprietários dos objetivos
      const ownerIds = objectivesData?.map(obj => obj.owner_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', ownerIds);

      // Agrupar Key Results por objetivo e agregar métricas
      const keyResultsByObjective = keyResultsData?.reduce((acc, kr) => {
        if (!acc[kr.objective_id]) {
          acc[kr.objective_id] = [];
        }
        acc[kr.objective_id].push({
          id: kr.id,
          title: kr.title,
          monthly_targets: (kr.monthly_targets as Record<string, number>) || {},
          monthly_actual: (kr.monthly_actual as Record<string, number>) || {},
          yearly_target: kr.yearly_target || kr.target_value || 0,
          yearly_actual: kr.yearly_actual || kr.current_value || 0
        });
        return acc;
      }, {} as Record<string, KeyResultWithMetrics[]>) || {};

      // Processar objetivos com métricas agregadas dos Key Results
      const objectivesWithMetrics: ObjectiveWithMetrics[] = objectivesData?.map(obj => {
        const profile = profilesData?.find(p => p.user_id === obj.owner_id);
        const objectiveKeyResults = keyResultsByObjective[obj.id] || [];
        
        // Agregar metas e realizações mensais dos Key Results
        const aggregatedMonthlyTargets: Record<string, number> = {};
        const aggregatedMonthlyActual: Record<string, number> = {};
        
        objectiveKeyResults.forEach(kr => {
          Object.entries(kr.monthly_targets).forEach(([month, value]) => {
            aggregatedMonthlyTargets[month] = (aggregatedMonthlyTargets[month] || 0) + value;
          });
          Object.entries(kr.monthly_actual).forEach(([month, value]) => {
            aggregatedMonthlyActual[month] = (aggregatedMonthlyActual[month] || 0) + value;
          });
        });

        // Agregar metas e realizações anuais
        const aggregatedYearlyTarget = objectiveKeyResults.reduce((sum, kr) => sum + kr.yearly_target, 0);
        const aggregatedYearlyActual = objectiveKeyResults.reduce((sum, kr) => sum + kr.yearly_actual, 0);

        return {
          id: obj.id,
          title: obj.title,
          description: obj.description || '',
          monthly_targets: Object.keys(aggregatedMonthlyTargets).length > 0 ? aggregatedMonthlyTargets : (obj.monthly_targets as Record<string, number>) || {},
          monthly_actual: Object.keys(aggregatedMonthlyActual).length > 0 ? aggregatedMonthlyActual : (obj.monthly_actual as Record<string, number>) || {},
          yearly_target: aggregatedYearlyTarget > 0 ? aggregatedYearlyTarget : obj.yearly_target || 0,
          yearly_actual: aggregatedYearlyActual > 0 ? aggregatedYearlyActual : obj.yearly_actual || 0,
          target_date: obj.target_date || '',
          owner_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Não atribuído',
          keyResults: objectiveKeyResults
        };
      }) || [];

      // Calcular estatísticas do dashboard
      const activeObjectives = objectivesData?.filter(obj => obj.status !== 'completed').length || 0;
      const activeProjects = projectsData?.filter(proj => proj.status === 'in_progress' || proj.status === 'planning').length || 0;
      
      // Calcular KRs no prazo
      const now = new Date();
      const onTimeKRs = keyResultsData?.filter(kr => {
        if (kr.status === 'completed') return true;
        if (!kr.due_date) return false;
        const dueDate = new Date(kr.due_date);
        const progress = kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0;
        const daysToDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysToDue >= 0 && progress >= 80; // No prazo se tem mais de 0 dias e está 80%+ completo
      }).length || 0;

      const totalKRs = keyResultsData?.length || 1;
      const onTimeKRsPercentage = Math.round((onTimeKRs / totalKRs) * 100);

      // Calcular score geral
      const scores = objectivesWithMetrics.map(obj => {
        const yearlyPercentage = obj.yearly_target > 0 ? (obj.yearly_actual / obj.yearly_target) * 100 : 0;
        return Math.min(yearlyPercentage, 100); // Cap at 100%
      });
      const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

      setObjectives(objectivesWithMetrics);
      setDashboardStats({
        activeObjectives,
        activeProjects,
        onTimeKRs,
        onTimeKRsPercentage,
        overallScore
      });

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyAchievement = (obj: ObjectiveWithMetrics) => {
    const monthlyTarget = obj.monthly_targets?.[currentMonth] || 0;
    const monthlyActual = obj.monthly_actual?.[currentMonth] || 0;
    return monthlyTarget > 0 ? Math.round((monthlyActual / monthlyTarget) * 100) : 0;
  };

  const getYearlyAchievement = (obj: ObjectiveWithMetrics) => {
    return obj.yearly_target > 0 ? Math.round((obj.yearly_actual / obj.yearly_target) * 100) : 0;
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
      const date = new Date(currentYear, i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      months.push({ key: monthKey, name: monthName });
    }
    return months;
  };

  const getMonthlyPerformance = (objective: ObjectiveWithMetrics, monthKey: string) => {
    const target = objective.monthly_targets?.[monthKey] || 0;
    const actual = objective.monthly_actual?.[monthKey] || 0;
    const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
    return { target, actual, percentage };
  };

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma empresa selecionada
            </h3>
            <p className="text-gray-600">
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral do planejamento estratégico - {company.name}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getDynamicStats(dashboardStats).map(stat => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : stat.changeType === 'negative' ? (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    ) : (
                      <div className="w-3 h-3 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
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
        {/* Objectives Progress */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Performance Mensal dos Objetivos</CardTitle>
              <CardDescription>Previsto vs Realizado por mês ({currentYear})</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Carregando objetivos...</div>
              ) : objectives.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum objetivo encontrado
                  </h3>
                  <p className="text-gray-600">
                    Crie objetivos estratégicos para acompanhar a performance da empresa.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {objectives.map((objective) => {
                    const months = getMonthsOfYear();
                    const yearlyAchievement = getYearlyAchievement(objective);
                    
                    return (
                      <div key={objective.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{objective.title}</h4>
                            <p className="text-sm text-gray-600">{objective.owner_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(yearlyAchievement)}
                            <span className={`text-sm font-medium ${getStatusColor(yearlyAchievement)}`}>
                              {yearlyAchievement}% no ano
                            </span>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-32">Indicador</TableHead>
                                {months.map((month) => (
                                  <TableHead key={month.key} className="text-center min-w-20">
                                    {month.name}
                                    {month.key === currentMonth && <span className="block text-xs text-blue-600">(atual)</span>}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium bg-gray-50">Previsto</TableCell>
                                {months.map((month) => {
                                  const performance = getMonthlyPerformance(objective, month.key);
                                  const isCurrentMonth = month.key === currentMonth;
                                  return (
                                    <TableCell key={month.key} className={`text-center ${isCurrentMonth ? "bg-blue-50" : ""}`}>
                                      {performance.target || '-'}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium bg-gray-50">Realizado</TableCell>
                                {months.map((month) => {
                                  const performance = getMonthlyPerformance(objective, month.key);
                                  const isCurrentMonth = month.key === currentMonth;
                                  return (
                                    <TableCell key={month.key} className={`text-center ${isCurrentMonth ? "bg-blue-50" : ""}`}>
                                      {performance.actual || '-'}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium bg-gray-50">% Atingimento</TableCell>
                                {months.map((month) => {
                                  const performance = getMonthlyPerformance(objective, month.key);
                                  const isCurrentMonth = month.key === currentMonth;
                                  return (
                                    <TableCell key={month.key} className={`text-center ${isCurrentMonth ? "bg-blue-50" : ""}`}>
                                      <span className={getStatusColor(performance.percentage)}>
                                        {performance.target > 0 ? `${performance.percentage}%` : '-'}
                                      </span>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium bg-gray-50">Status</TableCell>
                                {months.map((month) => {
                                  const performance = getMonthlyPerformance(objective, month.key);
                                  const isCurrentMonth = month.key === currentMonth;
                                  return (
                                    <TableCell key={month.key} className={`text-center ${isCurrentMonth ? "bg-blue-50" : ""}`}>
                                      {performance.target > 0 ? (
                                        <div className="flex justify-center">
                                          {getStatusIcon(performance.percentage)}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        
                        {/* Yearly Summary */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Meta Anual:</span>
                            <span>{objective.yearly_target}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Realizado Anual:</span>
                            <span>{objective.yearly_actual}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">% Atingimento Anual:</span>
                            <span className={getStatusColor(yearlyAchievement)}>
                              {yearlyAchievement}%
                            </span>
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
    </div>
  );
};