import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Calendar, TrendingUp, Award, Users, ExternalLink, Eye, ChevronRight } from 'lucide-react';
import { useMentorStartupDetails } from '@/hooks/useMentorStartupDetails';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BeepAssessmentDetailModal } from '../beep/BeepAssessmentDetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const maturityLevels = {
  'pre_startup': { name: 'Pré-Startup', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  'startup': { name: 'Startup', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'growth': { name: 'Crescimento', color: 'bg-green-100 text-green-800 border-green-200' },
  'maturity': { name: 'Maturidade', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'scale': { name: 'Escala', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
};

const getScoreColor = (score: number): string => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBg = (score: number): string => {
  if (score >= 8) return 'bg-green-50 border-green-200';
  if (score >= 6) return 'bg-yellow-50 border-yellow-200';
  if (score >= 4) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};

export const MentorStartupsOverviewPage: React.FC = () => {
  const { data: startups, isLoading, error } = useMentorStartupDetails();
  const [selectedAssessment, setSelectedAssessment] = useState<{
    assessmentId: string;
    finalScore: number;
    maturityLevel: string;
    completedAt: string;
  } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewAssessmentDetails = (assessmentData: any) => {
    setSelectedAssessment({
      assessmentId: assessmentData.id,
      finalScore: assessmentData.final_score,
      maturityLevel: assessmentData.maturity_level,
      completedAt: assessmentData.completed_at
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
          <p className="text-destructive">Erro ao carregar startups</p>
        </CardContent>
      </Card>
    );
  }

  if (!startups || startups.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma startup atribuída</h3>
          <p className="text-muted-foreground">
            Você ainda não foi atribuído a nenhuma startup para mentoria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Minhas Startups</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso das startups que você mentora
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {startups.length} {startups.length === 1 ? 'Startup' : 'Startups'}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {startups.map((startup) => (
          <Card key={startup.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  {startup.logo_url ? (
                    <img 
                      src={startup.logo_url} 
                      alt={`${startup.name} logo`}
                      className="w-16 h-16 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Building className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-xl mb-1">{startup.name}</CardTitle>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Criada em {format(new Date(startup.created_at), 'MMM yyyy', { locale: ptBR })}
                      </div>
                      {startup.latest_beep_assessment && (
                        <Badge 
                          variant="outline" 
                          className={maturityLevels[startup.latest_beep_assessment.maturity_level]?.color || 'bg-gray-100'}
                        >
                          {maturityLevels[startup.latest_beep_assessment.maturity_level]?.name || startup.latest_beep_assessment.maturity_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {startup.latest_beep_assessment && (
                  <div className={`text-center p-4 rounded-lg border ${getScoreBg(startup.latest_beep_assessment.final_score)}`}>
                    <div className={`text-2xl font-bold ${getScoreColor(startup.latest_beep_assessment.final_score)}`}>
                      {startup.latest_beep_assessment.final_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Score BEEP</div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="beep">BEEP</TabsTrigger>
                  <TabsTrigger value="mentoring">Mentoria</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    {startup.mission && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Missão</h4>
                        <p className="text-sm">{startup.mission}</p>
                      </div>
                    )}
                    {startup.vision && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Visão</h4>
                        <p className="text-sm">{startup.vision}</p>
                      </div>
                    )}
                    {startup.values && startup.values.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Valores</h4>
                        <div className="flex flex-wrap gap-2">
                          {startup.values.map((value, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="beep" className="space-y-4 mt-4">
                  {startup.latest_beep_assessment ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <Award className="h-5 w-5 text-primary" />
                            <span className="font-medium">Última Avaliação BEEP</span>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Score: <span className={`font-medium ${getScoreColor(startup.latest_beep_assessment.final_score)}`}>
                              {startup.latest_beep_assessment.final_score.toFixed(1)}/10
                            </span></p>
                            <p>Nível: <span className="font-medium">
                              {maturityLevels[startup.latest_beep_assessment.maturity_level]?.name || startup.latest_beep_assessment.maturity_level}
                            </span></p>
                            <p>Concluída em: {format(new Date(startup.latest_beep_assessment.completed_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewAssessmentDetails(startup.latest_beep_assessment)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Total de avaliações: {startup.beep_assessments_count}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma avaliação BEEP realizada</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="mentoring" className="space-y-4 mt-4">
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm mb-3">Funcionalidade de mentoria em desenvolvimento</p>
                    <Button variant="outline" size="sm" disabled>
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Mentoria
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

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