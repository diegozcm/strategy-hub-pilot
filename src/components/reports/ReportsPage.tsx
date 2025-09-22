import React, { useState } from 'react';
import { FileBarChart, Download, Target, Briefcase, BarChart3, Activity, Award, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportsData } from '@/hooks/useReportsData';

export const ReportsPage: React.FC = () => {
  const { 
    loading, 
    company, 
    hasData,
    keyResults, 
    objectives, 
    projects,
    kpis,
    chartData 
  } = useReportsData();
  
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Show message if no company or data
  if (!loading && (!company || !hasData)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios Executivos</h1>
            <p className="text-muted-foreground mt-2">
              {!company ? 'Selecione uma empresa para visualizar relatórios' : 'Nenhum dado encontrado para esta empresa'}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <FileBarChart className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">
                  {!company ? 'Empresa Não Selecionada' : 'Nenhum Dado Disponível'}
                </h3>
                <p className="text-muted-foreground">
                  {!company 
                    ? 'Para visualizar relatórios, primeiro selecione uma empresa no painel superior.'
                    : 'Comece criando pilares estratégicos, objetivos e resultados-chave para ver relatórios detalhados aqui.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <p className="text-muted-foreground mt-2">
              Análise completa do desempenho estratégico - {company?.name}
            </p>
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
                <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso - KRs</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-green-600">{Math.round(kpis.keyResultsSuccessRate)}%</p>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis.onTargetKeyResults} de {kpis.totalKeyResults} no alvo
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

      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="key-results">Resultados-Chave</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Results by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados-Chave por Tipo</CardTitle>
                <CardDescription>Distribuição dos KRs por tipo de métrica</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chartData.keyResultsByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.keyResultsByCategory.map((entry, index) => (
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
                    <BarChart data={chartData.projectsByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Projetos">
                        {chartData.projectsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress by Pillar */}
          <Card>
            <CardHeader>
              <CardTitle>Progresso por Pilar Estratégico</CardTitle>
              <CardDescription>Progresso médio dos objetivos em cada pilar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.progressByPillar} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="pillar" type="category" width={120} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Progresso']} />
                    <Bar dataKey="progress" name="Progresso (%)">
                      {chartData.progressByPillar.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="key-results" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {keyResults.map((keyResult) => {
              const progress = keyResult.target_value > 0 ? (keyResult.current_value / keyResult.target_value) * 100 : 0;
              return (
                <Card key={keyResult.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{keyResult.title}</CardTitle>
                    <CardDescription>{keyResult.description}</CardDescription>
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
                            {keyResult.current_value?.toLocaleString('pt-BR') || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Atual</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {keyResult.target_value?.toLocaleString('pt-BR') || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Meta</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{keyResult.metric_type || 'Numérico'}</Badge>
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
            {projects.map((project) => (
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
                          project.status === 'in_progress' ? 'secondary' : 
                          'outline'
                        }>
                          {project.status === 'completed' ? 'Concluído' :
                           project.status === 'in_progress' ? 'Em Progresso' :
                           project.status === 'suspended' ? 'Suspenso' :
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
            {objectives.map((objective) => (
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