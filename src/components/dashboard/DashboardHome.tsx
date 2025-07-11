import React, { useState, useEffect } from 'react';
import { Target, Briefcase, TrendingUp, Users, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { AICopilotWidget } from './AICopilotWidget';

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
}


const getDynamicStats = (overallScore: number, objectivesCount: number) => [
  {
    title: 'Objetivos Ativos',
    value: objectivesCount.toString(),
    change: '+2',
    changeType: 'positive' as const,
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'Projetos em Andamento',
    value: '8',
    change: '+1',
    changeType: 'positive' as const,
    icon: Briefcase,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    title: 'KRs no Prazo',
    value: '85%',
    change: '-5%',
    changeType: 'negative' as const,
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    title: 'Nota Geral de Atingimento',
    value: (overallScore / 10).toFixed(1),
    change: overallScore >= 80 ? '+0.3' : '-0.2',
    changeType: overallScore >= 80 ? 'positive' as const : 'negative' as const,
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
];

export const DashboardHome: React.FC = () => {
  const [objectives, setObjectives] = useState<ObjectiveWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchObjectives();
  }, []);

  const fetchObjectives = async () => {
    try {
      const { data: objectivesData, error } = await supabase
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
          owner_id
        `);

      if (error) throw error;

      // Get owner names separately
      const ownerIds = objectivesData?.map(obj => obj.owner_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', ownerIds);

      const objectivesWithMetrics: ObjectiveWithMetrics[] = objectivesData?.map(obj => {
        const profile = profilesData?.find(p => p.user_id === obj.owner_id);
        return {
          id: obj.id,
          title: obj.title,
          description: obj.description || '',
          monthly_targets: (obj.monthly_targets as Record<string, number>) || {},
          monthly_actual: (obj.monthly_actual as Record<string, number>) || {},
          yearly_target: obj.yearly_target || 0,
          yearly_actual: obj.yearly_actual || 0,
          target_date: obj.target_date || '',
          owner_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Não atribuído'
        };
      }) || [];

      setObjectives(objectivesWithMetrics);
      calculateOverallScore(objectivesWithMetrics);
    } catch (error) {
      console.error('Erro ao buscar objetivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = (objectives: ObjectiveWithMetrics[]) => {
    if (objectives.length === 0) {
      setOverallScore(0);
      return;
    }

    const scores = objectives.map(obj => {
      const yearlyPercentage = obj.yearly_target > 0 ? (obj.yearly_actual / obj.yearly_target) * 100 : 0;
      return Math.min(yearlyPercentage, 100); // Cap at 100%
    });

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    setOverallScore(Math.round(averageScore * 10) / 10); // Round to 1 decimal place and convert to 0-10 scale
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

  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu planejamento estratégico</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getDynamicStats(overallScore, objectives.length).map(stat => <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? <ArrowUp className="h-3 w-3 text-green-500 mr-1" /> : <ArrowDown className="h-3 w-3 text-red-500 mr-1" />}
                    <span className={`text-xs font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Objectives Progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Objetivos Estratégicos</CardTitle>
              <CardDescription>Progresso dos principais objetivos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4">Carregando objetivos...</div>
              ) : objectives.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Nenhum objetivo encontrado</div>
              ) : (
                objectives.map((objective) => {
                  const monthlyAchievement = getMonthlyAchievement(objective);
                  const yearlyAchievement = getYearlyAchievement(objective);
                  
                  return (
                    <div key={objective.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{objective.title}</h4>
                          <p className="text-sm text-gray-600">
                            {objective.owner_name} • {objective.target_date ? `Vence em ${new Date(objective.target_date).toLocaleDateString()}` : 'Sem prazo definido'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(yearlyAchievement)}
                        </div>
                      </div>
                      
                      {/* Monthly Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Meta do Mês</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${getStatusColor(monthlyAchievement)}`}>
                              {monthlyAchievement}%
                            </span>
                          </div>
                        </div>
                        <Progress value={Math.min(monthlyAchievement, 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Realizado: {objective.monthly_actual?.[currentMonth] || 0}</span>
                          <span>Meta: {objective.monthly_targets?.[currentMonth] || 0}</span>
                        </div>
                      </div>
                      
                      {/* Yearly Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Meta do Ano</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${getStatusColor(yearlyAchievement)}`}>
                              {yearlyAchievement}%
                            </span>
                          </div>
                        </div>
                        <Progress value={Math.min(yearlyAchievement, 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Realizado: {objective.yearly_actual}</span>
                          <span>Meta: {objective.yearly_target}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Copilot */}
        <div className="space-y-6">
          <AICopilotWidget />
        </div>
      </div>
    </div>;
};