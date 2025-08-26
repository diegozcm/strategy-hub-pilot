
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building, TrendingUp, Calendar, MessageCircle, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useStartupProfile } from '@/hooks/useStartupProfile';

export const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useStartupProfile();

  // Fetch startups count
  const { data: startupsCount } = useQuery({
    queryKey: ['startups-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('startup_hub_profiles')
        .select('id', { count: 'exact' })
        .eq('type', 'startup')
        .eq('status', 'active');

      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Fetch recent BEEP assessments
  const { data: recentAssessments } = useQuery({
    queryKey: ['recent-beep-assessments'],
    queryFn: async () => {
      // First, get the assessments
      const { data: assessments, error: assessmentsError } = await supabase
        .from('beep_assessments')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      if (assessmentsError) throw assessmentsError;

      if (!assessments || assessments.length === 0) {
        return [];
      }

      // Get unique user IDs from assessments
      const userIds = [...new Set(assessments.map(a => a.user_id))];

      // Fetch startup profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('startup_hub_profiles')
        .select('user_id, startup_name')
        .in('user_id', userIds)
        .eq('type', 'startup');

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine assessments with profile data
      return assessments.map(assessment => ({
        ...assessment,
        startup_profile: profileMap.get(assessment.user_id)
      }));
    }
  });

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Dashboard do Mentor</span>
          </CardTitle>
          <CardDescription>
            Acompanhe o ecossistema de startups e suas oportunidades de mentoria.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Startups Ativas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{startupsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              No ecossistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentorias</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.0</div>
            <p className="text-xs text-muted-foreground">
              Rating médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Avaliações Recentes</span>
            </CardTitle>
            <CardDescription>
              Últimas avaliações BEEP concluídas por startups do ecossistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAssessments && recentAssessments.length > 0 ? (
                recentAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        {assessment.startup_profile?.startup_name || assessment.startup_name || 'Startup'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Score: {assessment.final_score?.toFixed(1)} | {assessment.maturity_level}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {assessment.completed_at ? new Date(assessment.completed_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma avaliação recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Oportunidades de Mentoria</span>
            </CardTitle>
            <CardDescription>
              Conecte-se com startups que podem se beneficiar da sua expertise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">Áreas de Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {profile?.areas_of_expertise && profile.areas_of_expertise.length > 0 ? (
                    profile.areas_of_expertise.map((area, index) => (
                      <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Configure suas áreas de expertise no seu perfil
                    </span>
                  )}
                </div>
              </div>
              
              <Button className="w-full" variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Explorar Startups
              </Button>
              
              <Button className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Mentoria
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mentor Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos para Mentores</CardTitle>
          <CardDescription>
            Ferramentas e conteúdos para apoiar sua jornada como mentor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <Building className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Metodologia BEEP</h4>
              <p className="text-xs text-muted-foreground">
                Aprenda sobre nossa metodologia de avaliação de startups
              </p>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Técnicas de Mentoria</h4>
              <p className="text-xs text-muted-foreground">
                Melhores práticas para mentorar empreendedores
              </p>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Análise de Mercado</h4>
              <p className="text-xs text-muted-foreground">
                Ferramentas para análise e validação de negócios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
