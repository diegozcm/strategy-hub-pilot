
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Calendar, BarChart3, CheckCircle, AlertCircle, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useStartupProfile } from '@/hooks/useStartupProfile';

interface StartupDashboardProps {
  onNavigateToBeep?: () => void;
}

export const StartupDashboard: React.FC<StartupDashboardProps> = ({ onNavigateToBeep }) => {
  const { user } = useAuth();
  const { profile, company } = useStartupProfile();

  // Fetch latest BEEP assessment
  const { data: latestAssessment } = useQuery({
    queryKey: ['latest-beep-assessment', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('beep_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch assessment count
  const { data: assessmentStats } = useQuery({
    queryKey: ['beep-assessment-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, completed: 0 };

      const { data, error } = await supabase
        .from('beep_assessments')
        .select('status')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(a => a.status === 'completed').length;

      return { total, completed };
    },
    enabled: !!user?.id
  });

  const handleStartAssessment = () => {
    if (onNavigateToBeep) {
      onNavigateToBeep();
    }
  };

  const getMaturityLevelInfo = (level: string | null) => {
    const levels = {
      'idealizando': { name: 'Idealizando', color: 'text-gray-600', bg: 'bg-gray-100' },
      'validando_problemas_solucoes': { name: 'Validando Problemas', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      'iniciando_negocio': { name: 'Iniciando Negócio', color: 'text-blue-600', bg: 'bg-blue-100' },
      'validando_mercado': { name: 'Validando Mercado', color: 'text-orange-600', bg: 'bg-orange-100' },
      'evoluindo': { name: 'Evoluindo', color: 'text-green-600', bg: 'bg-green-100' }
    };
    return levels[level as keyof typeof levels] || { name: 'N/A', color: 'text-gray-400', bg: 'bg-gray-50' };
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 4.3) return 'text-green-600';
    if (score >= 3.5) return 'text-orange-600';
    if (score >= 2.7) return 'text-blue-600';
    if (score >= 1.9) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getScoreBg = (score: number | null) => {
    if (!score) return 'bg-gray-50';
    if (score >= 4.3) return 'bg-green-50';
    if (score >= 3.5) return 'bg-orange-50';
    if (score >= 2.7) return 'bg-blue-50';
    if (score >= 1.9) return 'bg-yellow-50';
    return 'bg-gray-50';
  };

  const maturityInfo = getMaturityLevelInfo(latestAssessment?.maturity_level);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Bem-vindo, {company?.name || 'Startup'}!</span>
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso e desenvolvimento da sua startup através do nosso ecossistema.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* BEEP Score Highlight Card */}
      {latestAssessment?.final_score && (
        <Card className={`border-2 ${getScoreBg(latestAssessment.final_score)}`}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-3 text-xl">
              <Award className="h-6 w-6 text-primary" />
              Score BEEP da Sua Startup
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(latestAssessment.final_score)}`}>
              {latestAssessment.final_score.toFixed(1)}
            </div>
            <p className="text-muted-foreground mb-4">de 5.0 pontos</p>
            <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${maturityInfo.bg} ${maturityInfo.color}`}>
              {maturityInfo.name}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Avaliação realizada em {new Date(latestAssessment.created_at).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível de Maturidade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestAssessment ? (
              <div>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${maturityInfo.bg} ${maturityInfo.color}`}>
                  {maturityInfo.name}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Score: {latestAssessment.final_score?.toFixed(1) || 'N/A'}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhuma avaliação realizada
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessmentStats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {assessmentStats?.total || 0} no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Avaliação</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestAssessment ? (
              <div>
                <div className="text-2xl font-bold">
                  {new Date(latestAssessment.created_at).toLocaleDateString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {latestAssessment.status === 'completed' ? 'Concluída' : 'Em andamento'}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhuma avaliação
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Ativo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Avaliação BEEP</span>
            </CardTitle>
            <CardDescription>
              Avalie o nível de maturidade da sua startup através de nossa metodologia estruturada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestAssessment ? (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Última avaliação</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${maturityInfo.bg} ${maturityInfo.color}`}>
                      {maturityInfo.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Score: {latestAssessment.final_score?.toFixed(1)} | {new Date(latestAssessment.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Nenhuma avaliação realizada</span>
                </div>
              )}
              <Button className="w-full" onClick={handleStartAssessment}>
                {latestAssessment ? 'Nova Avaliação' : 'Iniciar Primeira Avaliação'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>
              Recomendações personalizadas para o crescimento da sua startup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Complete sua avaliação BEEP</p>
                  <p className="text-xs text-muted-foreground">
                    Identifique áreas de melhoria e oportunidades de crescimento
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 bg-muted-foreground rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Conecte-se com mentores</p>
                  <p className="text-xs text-muted-foreground">
                    Encontre mentores especializados na sua área de atuação
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 bg-muted-foreground rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Acompanhe métricas</p>
                  <p className="text-xs text-muted-foreground">
                    Configure indicadores de performance da sua startup
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
