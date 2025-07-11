import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, Filter, Calendar, TrendingUp, TrendingDown, Target, Users, Briefcase, BarChart3, PieChart, Activity, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DashboardData {
  indicators: any[];
  projects: any[];
  objectives: any[];
  indicatorValues: any[];
  keyResults: any[];
  projectTasks: any[];
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState<DashboardData>({
    indicators: [],
    projects: [],
    objectives: [],
    indicatorValues: [],
    keyResults: [],
    projectTasks: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const [
        indicatorsRes,
        projectsRes,
        objectivesRes,
        indicatorValuesRes,
        keyResultsRes,
        projectTasksRes
      ] = await Promise.all([
        supabase.from('indicators').select('*'),
        supabase.from('strategic_projects').select('*'),
        supabase.from('strategic_objectives').select('*'),
        supabase.from('indicator_values').select('*').order('period_date', { ascending: false }),
        supabase.from('key_results').select('*'),
        supabase.from('project_tasks').select('*')
      ]);

      setData({
        indicators: indicatorsRes.data || [],
        projects: projectsRes.data || [],
        objectives: objectivesRes.data || [],
        indicatorValues: indicatorValuesRes.data || [],
        keyResults: keyResultsRes.data || [],
        projectTasks: projectTasksRes.data || []
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const calculateKPIs = () => {
    const totalIndicators = data.indicators.length;
    const onTargetIndicators = data.indicators.filter(ind => {
      const progress = ind.target_value > 0 ? (ind.current_value / ind.target_value) * 100 : 0;
      return progress >= 90;
    }).length;
    
    const totalProjects = data.projects.length;
    const activeProjects = data.projects.filter(p => p.status === 'active' || p.status === 'planning').length;
    const completedProjects = data.projects.filter(p => p.status === 'completed').length;
    
    const totalObjectives = data.objectives.length;
    const completedObjectives = data.objectives.filter(o => o.status === 'completed').length;
    
    const totalTasks = data.projectTasks.length;
    const completedTasks = data.projectTasks.filter(t => t.status === 'done').length;

    return {
      totalIndicators,
      onTargetIndicators,
      indicatorsSuccessRate: totalIndicators > 0 ? (onTargetIndicators / totalIndicators) * 100 : 0,
      totalProjects,
      activeProjects,
      completedProjects,
      projectsCompletionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      totalObjectives,
      completedObjectives,
      objectivesCompletionRate: totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0,
      totalTasks,
      completedTasks,
      tasksCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    };
  };

  // Chart data generators
  const getIndicatorsByCategory = (): ChartData[] => {
    const categories = data.indicators.reduce((acc, indicator) => {
      const category = indicator.category || 'outros';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryNames = {
      financial: 'Financeiro',
      operational: 'Operacional',
      customer: 'Cliente',
      people: 'Pessoas',
      quality: 'Qualidade',
      outros: 'Outros'
    };

    return Object.entries(categories).map(([key, value]) => ({
      name: categoryNames[key as keyof typeof categoryNames] || key,
      value: value as number,
      color: getColorForCategory(key)
    }));
  };

  const getProjectsByStatus = (): ChartData[] => {
    const statuses = data.projects.reduce((acc, project) => {
      const status = project.status || 'planning';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusNames = {
      planning: 'Planejamento',
      active: 'Em Andamento',
      completed: 'Concluído',
      paused: 'Pausado',
      cancelled: 'Cancelado'
    };

    return Object.entries(statuses).map(([key, value]) => ({
      name: statusNames[key as keyof typeof statusNames] || key,
      value: value as number,
      color: getColorForStatus(key)
    }));
  };

  const getIndicatorTrends = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        date: date.toISOString().slice(0, 7)
      };
    }).reverse();

    return last6Months.map(month => {
      const monthValues = data.indicatorValues.filter(v => 
        v.period_date.startsWith(month.date)
      );
      
      const avgValue = monthValues.length > 0 
        ? monthValues.reduce((sum, v) => sum + (v.value || 0), 0) / monthValues.length
        : 0;

      return {
        month: month.month,
        value: Math.round(avgValue * 100) / 100,
        count: monthValues.length
      };
    });
  };

  const getColorForCategory = (category: string) => {
    const colors = {
      financial: '#10b981',
      operational: '#3b82f6',
      customer: '#f59e0b',
      people: '#8b5cf6',
      quality: '#ef4444',
      outros: '#6b7280'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const getColorForStatus = (status: string) => {
    const colors = {
      planning: '#f59e0b',
      active: '#3b82f6',
      completed: '#10b981',
      paused: '#6b7280',
      cancelled: '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const kpis = calculateKPIs();
  const indicatorsByCategory = getIndicatorsByCategory();
  const projectsByStatus = getProjectsByStatus();
  const indicatorTrends = getIndicatorTrends();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios Executivos</h1>
            <p className="text-muted-foreground mt-2">Carregando dados...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
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
          <h1 className="text-3xl font-bold">Relatórios Executivos</h1>
          <p className="text-muted-foreground mt-2">Análise completa do desempenho estratégico</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Anterior</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso - Indicadores</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-green-600">{Math.round(kpis.indicatorsSuccessRate)}%</p>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis.onTargetIndicators} de {kpis.totalIndicators} no alvo
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projetos Concluídos</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-blue-600">{Math.round(kpis.projectsCompletionRate)}%</p>
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis.completedProjects} de {kpis.totalProjects} projetos
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Objetivos Alcançados</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-purple-600">{Math.round(kpis.objectivesCompletionRate)}%</p>
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis.completedObjectives} de {kpis.totalObjectives} objetivos
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tarefas Executadas</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-orange-600">{Math.round(kpis.tasksCompletionRate)}%</p>
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis.completedTasks} de {kpis.totalTasks} tarefas
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="indicators">Indicadores</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Indicators by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Indicadores por Categoria</CardTitle>
                <CardDescription>Distribuição dos indicadores cadastrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={indicatorsByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {indicatorsByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Projects by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Projetos por Status</CardTitle>
                <CardDescription>Status atual dos projetos estratégicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Projetos">
                        {projectsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Indicator Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução dos Indicadores</CardTitle>
              <CardDescription>Tendência dos valores dos indicadores nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={indicatorTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      name="Valor Médio"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.indicators.map((indicator) => {
              const progress = indicator.target_value > 0 ? (indicator.current_value / indicator.target_value) * 100 : 0;
              return (
                <Card key={indicator.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{indicator.name}</CardTitle>
                    <CardDescription>{indicator.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span className="font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {indicator.current_value?.toLocaleString('pt-BR') || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Atual</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {indicator.target_value?.toLocaleString('pt-BR') || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Meta</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{indicator.category}</Badge>
                        <Badge variant={progress >= 90 ? 'default' : progress >= 70 ? 'secondary' : 'destructive'}>
                          {progress >= 90 ? 'No Alvo' : progress >= 70 ? 'Atenção' : 'Crítico'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.projects.map((project) => (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-semibold">{project.progress || 0}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={
                          project.status === 'completed' ? 'default' : 
                          project.status === 'active' ? 'secondary' : 
                          'outline'
                        }>
                          {project.status === 'completed' ? 'Concluído' :
                           project.status === 'active' ? 'Ativo' :
                           project.status === 'paused' ? 'Pausado' :
                           'Planejamento'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prioridade:</span>
                        <Badge variant={
                          project.priority === 'high' ? 'destructive' :
                          project.priority === 'medium' ? 'secondary' :
                          'outline'
                        }>
                          {project.priority === 'high' ? 'Alta' :
                           project.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      {project.budget && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Orçamento:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(project.budget)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="objectives" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.objectives.map((objective) => (
              <Card key={objective.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{objective.title}</CardTitle>
                  <CardDescription>{objective.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-semibold">{objective.progress || 0}%</span>
                    </div>
                    <Progress value={objective.progress || 0} className="h-2" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={
                          objective.status === 'completed' ? 'default' : 
                          objective.status === 'in_progress' ? 'secondary' : 
                          'outline'
                        }>
                          {objective.status === 'completed' ? 'Concluído' :
                           objective.status === 'in_progress' ? 'Em Progresso' :
                           'Não Iniciado'}
                        </Badge>
                      </div>
                      {objective.target_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data Meta:</span>
                          <span className="font-medium">
                            {new Date(objective.target_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {objective.weight && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Peso:</span>
                          <span className="font-medium">{objective.weight}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};