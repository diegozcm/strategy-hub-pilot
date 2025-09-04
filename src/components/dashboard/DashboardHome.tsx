import React, { useState, useEffect } from 'react';
import { Target, Briefcase, TrendingUp, Users, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Award, Building, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useNavigate } from 'react-router-dom';

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
}

interface DashboardStats {
  totalObjectives: number;
  totalKRs: number;
  activeProjects: number;
  overallScore: number;
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
}];

export const DashboardHome: React.FC = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [keyResults, setKeyResults] = useState<KeyResultWithPillar[]>([]);
  const [expandedKRs, setExpandedKRs] = useState<Set<string>>(new Set());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalObjectives: 0,
    totalKRs: 0,
    activeProjects: 0,
    overallScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const currentYear = new Date().getFullYear();

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
        setDashboardStats({
          totalObjectives: 0,
          totalKRs: 0,
          activeProjects: 0,
          overallScore: 0
        });
        setLoading(false);
        return;
      }

      // Buscar objetivos primeiro para obter os IDs
      const { data: objectivesData } = await supabase
        .from('strategic_objectives')
        .select('id')
        .in('plan_id', planIds);
      
      const objectiveIds = objectivesData?.map(obj => obj.id) || [];
      
      if (objectiveIds.length === 0) {
        setKeyResults([]);
        setDashboardStats({
          totalObjectives: 0,
          totalKRs: 0,
          activeProjects: 0,
          overallScore: 0
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
        objective_title: kr.strategic_objectives.title
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

      setKeyResults(keyResultsWithPillars);
      setDashboardStats({
        totalObjectives,
        totalKRs,
        activeProjects,
        overallScore
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

  const navigateToKREdit = (krId: string) => {
    navigate('/app/indicators');
    // You could add a query parameter or hash to focus on specific KR
    // navigate(`/app/indicators#${krId}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Strategy HUB</h1>
          <p className="text-gray-600 mt-1">
            Visão geral estratégica da empresa - {company.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ano:</span>
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
                     ) : (
                       <div className="w-3 h-3 mr-1" />
                     )}
                     <span 
                       className={`text-xs font-medium ${
                         stat.changeType === 'positive' 
                           ? 'text-green-600' 
                           : 'text-gray-600'
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
              {loading ? (
                <div className="text-center py-4">Carregando Key Results...</div>
              ) : keyResults.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum Key Result encontrado
                  </h3>
                  <p className="text-gray-600">
                    Crie Key Results para acompanhar a performance da empresa.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {keyResults.map(kr => {
                    const months = getMonthsOfYear();
                    const yearlyAchievement = getYearlyAchievement(kr);
                    const isExpanded = expandedKRs.has(kr.id);
                    
                    return (
                      <div key={kr.id} className="border rounded-lg">
                        {/* Collapsed State - Always Visible */}
                        <div className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: kr.pillar_color }}
                                />
                                <div>
                                  <h4 className="font-medium text-gray-900">{kr.title}</h4>
                                  <p className="text-sm text-gray-600">{kr.pillar_name} • {kr.objective_title}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(yearlyAchievement)}
                                <span className={`text-sm font-medium ${getStatusColor(yearlyAchievement)}`}>
                                  {yearlyAchievement}% no ano
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateToKREdit(kr.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleKRExpansion(kr.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded State - Monthly Details */}
                        {isExpanded && (
                          <div className="border-t bg-gray-50">
                            <div className="p-4">
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
    </div>
  );
};