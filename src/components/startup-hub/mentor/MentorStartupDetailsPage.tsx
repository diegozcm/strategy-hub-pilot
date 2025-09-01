
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Calendar, 
  TrendingUp, 
  Eye, 
  BarChart3,
  Target,
  Lightbulb,
  Users
} from 'lucide-react';
import { useMentorStartupDetails } from '@/hooks/useMentorStartupDetails';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BeepAssessmentDetailModal } from '../beep/BeepAssessmentDetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getScoreColor = (score: number) => {
  if (score >= 4.3) return 'text-green-600';
  if (score >= 3.5) return 'text-orange-500';
  if (score >= 2.7) return 'text-blue-500';
  if (score >= 1.9) return 'text-yellow-500';
  return 'text-gray-500';
};

const getScoreBg = (score: number) => {
  if (score >= 4.3) return 'bg-green-50 border-green-200';
  if (score >= 3.5) return 'bg-orange-50 border-orange-200';
  if (score >= 2.7) return 'bg-blue-50 border-blue-200';
  if (score >= 1.9) return 'bg-yellow-50 border-yellow-200';
  return 'bg-gray-50 border-gray-200';
};

const maturityLevels = {
  'idealizando': { name: 'Idealizando', color: 'bg-gray-500' },
  'validando_problemas_solucoes': { name: 'Validando Problemas e Soluções', color: 'bg-yellow-500' },
  'iniciando_negocio': { name: 'Iniciando o Negócio', color: 'bg-blue-500' },
  'validando_mercado': { name: 'Validando o Mercado', color: 'bg-orange-500' },
  'evoluindo': { name: 'Evoluindo', color: 'bg-green-500' }
};

export const MentorStartupDetailsPage: React.FC = () => {
  const { data: startups = [], isLoading, error } = useMentorStartupDetails();
  const [selectedAssessment, setSelectedAssessment] = useState<{
    id: string;
    final_score: number;
    maturity_level: string;
    completed_at: string;
  } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewBeepDetails = (assessment: any) => {
    setSelectedAssessment(assessment);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar dados das startups</p>
      </div>
    );
  }

  if (startups.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Minhas Startups</h1>
          <p className="text-muted-foreground">
            Acompanhe o desenvolvimento das startups sob sua mentoria
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma startup atribuída</h3>
            <p className="text-muted-foreground text-center">
              Você ainda não foi associado a nenhuma startup. 
              Entre em contato com um administrador para receber suas atribuições.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minhas Startups</h1>
        <p className="text-muted-foreground">
          Acompanhe o desenvolvimento das {startups.length} startup{startups.length !== 1 ? 's' : ''} sob sua mentoria
        </p>
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
                      alt={`Logo da ${startup.name}`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-xl">{startup.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(startup.created_at), 'MMM yyyy', { locale: ptBR })}
                      </Badge>
                      {startup.latest_beep_assessment && (
                        <Badge 
                          className={`${maturityLevels[startup.latest_beep_assessment.maturity_level as keyof typeof maturityLevels]?.color || 'bg-gray-500'} text-white text-xs`}
                        >
                          {maturityLevels[startup.latest_beep_assessment.maturity_level as keyof typeof maturityLevels]?.name || 'N/A'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {startup.latest_beep_assessment && (
                  <div className={`p-4 rounded-lg border-2 ${getScoreBg(startup.latest_beep_assessment.final_score)}`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(startup.latest_beep_assessment.final_score)}`}>
                        {startup.latest_beep_assessment.final_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">BEEP Score</div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="overview" className="flex items-center space-x-1">
                    <Building2 className="h-4 w-4" />
                    <span>Visão Geral</span>
                  </TabsTrigger>
                  <TabsTrigger value="beep" className="flex items-center space-x-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>BEEP</span>
                  </TabsTrigger>
                  <TabsTrigger value="mentoring" className="flex items-center space-x-1">
                    <Lightbulb className="h-4 w-4" />
                    <span>Mentoria</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  {startup.mission && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Missão
                      </h4>
                      <p className="text-muted-foreground">{startup.mission}</p>
                    </div>
                  )}

                  {startup.vision && (
                    <div>
                      <h4 className="font-semibold mb-2">Visão</h4>
                      <p className="text-muted-foreground">{startup.vision}</p>
                    </div>
                  )}

                  {startup.values && startup.values.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Valores</h4>
                      <div className="flex flex-wrap gap-2">
                        {startup.values.map((value, index) => (
                          <Badge key={index} variant="secondary">{value}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="beep" className="mt-4">
                  {startup.latest_beep_assessment ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className={`text-2xl font-bold ${getScoreColor(startup.latest_beep_assessment.final_score)}`}>
                            {startup.latest_beep_assessment.final_score.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">Score Atual</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-lg font-semibold">
                            {new Date(startup.latest_beep_assessment.completed_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-sm text-muted-foreground">Última Avaliação</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-lg font-semibold">{startup.beep_assessments_count}</div>
                          <div className="text-sm text-muted-foreground">Total de Avaliações</div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleViewBeepDetails(startup.latest_beep_assessment!)}
                        className="w-full"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes da Avaliação BEEP
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-semibold mb-2">Nenhuma avaliação BEEP</h4>
                      <p className="text-muted-foreground">
                        Esta startup ainda não completou nenhuma avaliação BEEP.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="mentoring" className="mt-4">
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Ferramentas de Mentoria</h4>
                    <p className="text-muted-foreground mb-4">
                      Em breve: sessões de mentoria, dicas personalizadas e acompanhamento de progresso.
                    </p>
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
          assessmentId={selectedAssessment.id}
          finalScore={selectedAssessment.final_score}
          maturityLevel={selectedAssessment.maturity_level}
          completedAt={selectedAssessment.completed_at}
        />
      )}
    </div>
  );
};
