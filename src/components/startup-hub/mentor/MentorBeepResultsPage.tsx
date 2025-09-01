
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Building, Eye, Users } from 'lucide-react';
import { BeepAssessmentDetailModal } from '../beep/BeepAssessmentDetailModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface BeepResult {
  id: string;
  final_score: number;
  maturity_level: string;
  completed_at: string;
  startup_name: string;
  startup_id: string;
}

export const MentorBeepResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedAssessment, setSelectedAssessment] = React.useState<BeepResult | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  // Fetch BEEP results from mentor's startups
  const { data: beepResults = [], isLoading, error } = useQuery({
    queryKey: ['mentor-beep-results', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get startup companies where this mentor has a relationship via user_company_relations
      const { data: mentorCompanies, error: relationsError } = await supabase
        .from('user_company_relations')
        .select(`
          company_id,
          companies!company_id (
            id,
            name,
            company_type
          )
        `)
        .eq('user_id', user.id);

      if (relationsError) throw relationsError;

      if (!mentorCompanies || mentorCompanies.length === 0) {
        return [];
      }

      // Filter only startup companies
      const startupCompanies = mentorCompanies.filter(
        rel => rel.companies?.company_type === 'startup'
      );

      if (startupCompanies.length === 0) {
        return [];
      }

      const startupIds = startupCompanies.map(rel => rel.company_id);

      // Get BEEP assessments from these startup companies
      const { data: assessments, error: assessmentsError } = await supabase
        .from('beep_assessments')
        .select(`
          id,
          final_score,
          maturity_level,
          completed_at,
          user_id,
          company_id
        `)
        .eq('status', 'completed')
        .in('company_id', startupIds)
        .order('completed_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Combine assessment data with startup names
      const results: BeepResult[] = assessments?.map(assessment => {
        const company = startupCompanies.find(rel => rel.company_id === assessment.company_id);
        return {
          id: assessment.id,
          final_score: assessment.final_score || 0,
          maturity_level: assessment.maturity_level || 'idealizando',
          completed_at: assessment.completed_at || '',
          startup_name: company?.companies?.name || 'Startup',
          startup_id: assessment.company_id || ''
        };
      }) || [];

      return results;
    },
    enabled: !!user?.id
  });

  const maturityLevels = {
    'idealizando': { name: 'Idealizando', color: 'bg-gray-500' },
    'validando_problemas_solucoes': { name: 'Validando Problemas e Soluções', color: 'bg-yellow-500' },
    'iniciando_negocio': { name: 'Iniciando o Negócio', color: 'bg-blue-500' },
    'validando_mercado': { name: 'Validando o Mercado', color: 'bg-orange-500' },
    'evoluindo': { name: 'Evoluindo', color: 'bg-green-500' }
  };

  const handleViewDetails = (assessment: BeepResult) => {
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
        <p className="text-destructive">Erro ao carregar resultados BEEP</p>
      </div>
    );
  }

  if (beepResults.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Resultados BEEP das Startups</h1>
            <p className="text-muted-foreground">
              Acompanhe os resultados das avaliações BEEP das suas startups mentoradas
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground text-center">
              Suas startups ainda não completaram nenhuma avaliação BEEP ou você ainda não foi atribuído a nenhuma startup.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group results by startup
  const resultsByStartup = beepResults.reduce((acc, result) => {
    if (!acc[result.startup_id]) {
      acc[result.startup_id] = {
        startup_name: result.startup_name,
        results: []
      };
    }
    acc[result.startup_id].results.push(result);
    return acc;
  }, {} as Record<string, { startup_name: string; results: BeepResult[] }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resultados BEEP das Startups</h1>
          <p className="text-muted-foreground">
            Acompanhe os resultados das avaliações BEEP das suas startups mentoradas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            {Object.keys(resultsByStartup).length} startup(s)
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(resultsByStartup).map(([startupId, { startup_name, results }]) => {
          const latestResult = results[0]; // Results are already sorted by date (desc)
          
          return (
            <Card key={startupId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{startup_name}</CardTitle>
                      <CardDescription>
                        {results.length} avaliação(ões) concluída(s)
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${maturityLevels[latestResult.maturity_level as keyof typeof maturityLevels]?.color || 'bg-gray-500'} text-white`}>
                    {maturityLevels[latestResult.maturity_level as keyof typeof maturityLevels]?.name || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {latestResult.final_score.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">Score Atual</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {new Date(latestResult.completed_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-muted-foreground">Última Avaliação</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(latestResult)}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Detalhes</span>
                    </Button>
                  </div>

                  {results.length > 1 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Histórico de Avaliações</h4>
                      <div className="space-y-2">
                        {results.slice(1, 4).map((result, index) => (
                          <div key={result.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(result.completed_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium">
                                {result.final_score.toFixed(1)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(result)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {results.length > 4 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{results.length - 4} avaliação(ões) anterior(es)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
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
