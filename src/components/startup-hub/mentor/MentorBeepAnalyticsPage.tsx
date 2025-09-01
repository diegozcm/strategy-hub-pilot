import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Award, Eye, Filter, Calendar, Building, ArrowUp, ArrowDown } from 'lucide-react';
import { useMentorStartupDetails } from '@/hooks/useMentorStartupDetails';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BeepAssessmentDetailModal } from '../beep/BeepAssessmentDetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const maturityLevels = {
  'pre_startup': { name: 'Pré-Startup', color: 'bg-gray-100 text-gray-800', order: 1 },
  'startup': { name: 'Startup', color: 'bg-blue-100 text-blue-800', order: 2 },
  'growth': { name: 'Crescimento', color: 'bg-green-100 text-green-800', order: 3 },
  'maturity': { name: 'Maturidade', color: 'bg-purple-100 text-purple-800', order: 4 },
  'scale': { name: 'Escala', color: 'bg-yellow-100 text-yellow-800', order: 5 }
};

const getScoreColor = (score: number): string => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBgClass = (score: number): string => {
  if (score >= 8) return 'bg-green-50 border-green-200';
  if (score >= 6) return 'bg-yellow-50 border-yellow-200';
  if (score >= 4) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};

export const MentorBeepAnalyticsPage: React.FC = () => {
  const { data: startups, isLoading, error } = useMentorStartupDetails();
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<{
    assessmentId: string;
    finalScore: number;
    maturityLevel: string;
    completedAt: string;
  } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewDetails = (assessment: any) => {
    setSelectedAssessment({
      assessmentId: assessment.id,
      finalScore: assessment.final_score,
      maturityLevel: assessment.maturity_level,
      completedAt: assessment.completed_at
    });
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Erro ao carregar dados das avaliações BEEP</p>
        </CardContent>
      </Card>
    );
  }

  // Process data for analytics
  const startupsWithAssessments = startups?.filter(s => s.latest_beep_assessment) || [];
  
  // Sort startups based on selection
  const sortedStartups = [...startupsWithAssessments].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.latest_beep_assessment?.final_score || 0) - (a.latest_beep_assessment?.final_score || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.latest_beep_assessment?.completed_at || 0).getTime() - 
               new Date(a.latest_beep_assessment?.completed_at || 0).getTime();
      default:
        return 0;
    }
  });

  // Filter by maturity level
  const filteredStartups = filterBy === 'all' 
    ? sortedStartups 
    : sortedStartups.filter(s => s.latest_beep_assessment?.maturity_level === filterBy);

  // Calculate statistics
  const totalAssessments = startupsWithAssessments.length;
  const averageScore = totalAssessments > 0 
    ? startupsWithAssessments.reduce((sum, s) => sum + (s.latest_beep_assessment?.final_score || 0), 0) / totalAssessments
    : 0;

  const maturityDistribution = startupsWithAssessments.reduce((acc, startup) => {
    const level = startup.latest_beep_assessment?.maturity_level || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highPerformers = startupsWithAssessments.filter(s => (s.latest_beep_assessment?.final_score || 0) >= 7).length;
  const needsAttention = startupsWithAssessments.filter(s => (s.latest_beep_assessment?.final_score || 0) < 5).length;

  if (totalAssessments === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma avaliação BEEP encontrada</h3>
          <p className="text-muted-foreground">
            As startups que você mentora ainda não realizaram avaliações BEEP.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Avaliações BEEP</h1>
          <p className="text-muted-foreground">
            Análise detalhada dos resultados BEEP das startups mentoradas
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              Startups avaliadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Desempenho</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{highPerformers}</div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 7.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atenção Requerida</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{needsAttention}</div>
            <p className="text-xs text-muted-foreground">
              Score &lt; 5.0
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista de Avaliações</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição por Maturidade</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters and Sorting */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={sortBy} onValueChange={(value: 'score' | 'name' | 'date') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Score (maior primeiro)</SelectItem>
                  <SelectItem value="name">Nome (A-Z)</SelectItem>
                  <SelectItem value="date">Data (mais recente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por maturidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  {Object.entries(maturityLevels).map(([key, level]) => (
                    <SelectItem key={key} value={key}>{level.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {filteredStartups.map((startup) => (
              <Card key={startup.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {startup.logo_url ? (
                        <img 
                          src={startup.logo_url} 
                          alt={`${startup.name} logo`}
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-lg">{startup.name}</h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <Badge 
                            variant="outline" 
                            className={maturityLevels[startup.latest_beep_assessment!.maturity_level]?.color || 'bg-gray-100'}
                          >
                            {maturityLevels[startup.latest_beep_assessment!.maturity_level]?.name || startup.latest_beep_assessment!.maturity_level}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(startup.latest_beep_assessment!.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className={`text-center p-3 rounded-lg border ${getScoreBgClass(startup.latest_beep_assessment!.final_score)}`}>
                        <div className={`text-xl font-bold ${getScoreColor(startup.latest_beep_assessment!.final_score)}`}>
                          {startup.latest_beep_assessment!.final_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(startup.latest_beep_assessment!)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Nível de Maturidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(maturityLevels)
                  .sort(([,a], [,b]) => a.order - b.order)
                  .map(([key, level]) => {
                    const count = maturityDistribution[key] || 0;
                    const percentage = totalAssessments > 0 ? (count / totalAssessments) * 100 : 0;
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className={level.color}>
                            {level.name}
                          </Badge>
                          <span className="text-sm font-medium">
                            {count} startup{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedAssessment && (
        <BeepAssessmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAssessment(null);
          }}
          assessmentId={selectedAssessment.assessmentId}
          finalScore={selectedAssessment.finalScore}
          maturityLevel={selectedAssessment.maturityLevel}
          completedAt={selectedAssessment.completedAt}
        />
      )}
    </div>
  );
};