import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Calendar,
  BarChart3,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  User,
  Search,
  Filter,
  Plus,
  Settings,
  MessageSquare,
  Activity,
  Sparkles,
  X,
  ThumbsUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTeamInsights } from '@/hooks/useTeamInsights';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  skills: string[];
  status: string;
  hire_date: string;
  avatar_url?: string;
}

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  allocation_percentage: number;
  project_name: string;
  project_status: string;
}

interface TeamMetrics {
  totalMembers: number;
  activeProjects: number;
  avgPerformance: number;
  completedTasks: number;
}

export default function TeamPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [metrics, setMetrics] = useState<TeamMetrics>({
    totalMembers: 0,
    activeProjects: 0,
    avgPerformance: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const { toast } = useToast();
  
  // Usar o hook de insights de IA
  const {
    insights,
    metrics: aiMetrics,
    loading: insightsLoading,
    generateInsights,
    dismissInsight,
    markInsightAsResolved
  } = useTeamInsights();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // Buscar profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active');

      if (profilesError) throw profilesError;

      // Buscar membros de projetos com informações dos projetos
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          *,
          strategic_projects!inner(name, status)
        `);

      if (membersError) throw membersError;

      // Calcular métricas
      const activeProjectsCount = new Set(membersData?.map(m => m.project_id)).size;
      
      setProfiles(profilesData || []);
      setProjectMembers(membersData?.map(member => ({
        ...member,
        project_name: member.strategic_projects.name,
        project_status: member.strategic_projects.status
      })) || []);

      setMetrics({
        totalMembers: profilesData?.length || 0,
        activeProjects: activeProjectsCount,
        avgPerformance: 85, // Simulated - would come from performance_reviews
        completedTasks: 145 // Simulated - would come from project_tasks
      });

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da equipe.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || profile.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(profiles.map(p => p.department).filter(Boolean))];

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Colaboradores</h1>
          <p className="text-muted-foreground">
            Gerencie sua equipe com insights de IA para otimizar performance e alocação
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Membro
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              +2 novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              85% no prazo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgPerformance}%</div>
            <p className="text-xs text-muted-foreground">
              +5% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights de IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Insights de IA para Gestão de Pessoas
            </div>
            <Button 
              onClick={() => generateInsights('team_overview')} 
              disabled={insightsLoading}
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Insights
            </Button>
          </CardTitle>
          <CardDescription>
            Análises inteligentes sobre performance e alocação da equipe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Clique em "Gerar Insights" para obter análises de IA sobre sua equipe</p>
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 border rounded-lg ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {insight.severity === 'high' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {insight.severity === 'medium' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {insight.severity === 'low' && <Activity className="h-4 w-4 text-blue-600" />}
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confiança
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <p className="text-sm font-medium">💡 {insight.recommendation}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => markInsightAsResolved(insight.id)}>
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => dismissInsight(insight.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tabs principais */}
      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team">Visão da Equipe</TabsTrigger>
          <TabsTrigger value="projects">Alocação em Projetos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar colaboradores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid de colaboradores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => {
              const userProjects = projectMembers.filter(pm => pm.user_id === profile.user_id);
              const totalAllocation = userProjects.reduce((sum, pm) => sum + pm.allocation_percentage, 0);
              
              return (
                <Card key={profile.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {profile.first_name} {profile.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{profile.position}</p>
                        <Badge variant="secondary" className="text-xs">
                          {profile.department}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Alocação em Projetos</span>
                        <span className={totalAllocation > 100 ? 'text-red-600' : 'text-green-600'}>
                          {totalAllocation}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(totalAllocation, 100)} 
                        className={totalAllocation > 100 ? 'bg-red-100' : ''}
                      />
                    </div>

                    {profile.skills && profile.skills.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Habilidades</p>
                        <div className="flex flex-wrap gap-1">
                          {profile.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <Badge 
                        variant={profile.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {profile.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Ver Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alocação de Colaboradores em Projetos</CardTitle>
              <CardDescription>
                Visualize como os membros da equipe estão distribuídos nos projetos estratégicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.map((profile) => {
                  const userProjects = projectMembers.filter(pm => pm.user_id === profile.user_id);
                  
                  return (
                    <div key={profile.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {profile.first_name?.[0]}{profile.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                            <p className="text-sm text-muted-foreground">{profile.position}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {userProjects.length} projeto{userProjects.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      {userProjects.length > 0 ? (
                        <div className="space-y-2">
                          {userProjects.map((project) => (
                            <div key={project.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <p className="font-medium text-sm">{project.project_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {project.role} • {project.project_status}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                {project.allocation_percentage}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Não alocado em projetos</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance da Equipe</CardTitle>
              <CardDescription>
                Métricas de desempenho e insights para desenvolvimento de talentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Top Performers</h4>
                  {profiles.slice(0, 5).map((profile, index) => {
                    const score = 95 - (index * 5); // Simulated performance score
                    return (
                      <div key={profile.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                            <p className="text-sm text-muted-foreground">{profile.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getPerformanceColor(score)}`}>{score}%</p>
                          <Award className="h-4 w-4 text-yellow-500 ml-auto" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Necessita Atenção</h4>
                  <div className="space-y-3">
                    <div className="p-3 border border-yellow-200 bg-yellow-50 rounded">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <p className="font-medium text-sm">Avaliações Pendentes</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        3 colaboradores sem avaliação há mais de 90 dias
                      </p>
                    </div>
                    
                    <div className="p-3 border border-blue-200 bg-blue-50 rounded">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <p className="font-medium text-sm">Oportunidades de Crescimento</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        5 colaboradores aptos para promoção
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departments.map(dept => {
                    const count = profiles.filter(p => p.department === dept).length;
                    const percentage = Math.round((count / profiles.length) * 100);
                    
                    return (
                      <div key={dept}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{dept}</span>
                          <span>{count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights de Retenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">92%</div>
                    <p className="text-sm text-muted-foreground">Taxa de Retenção</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">2.3</div>
                      <p className="text-xs text-muted-foreground">Anos médio na empresa</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">4.2</div>
                      <p className="text-xs text-muted-foreground">Satisfação média</p>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Relatório Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}