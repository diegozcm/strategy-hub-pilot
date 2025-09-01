import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building, TrendingUp, Calendar, MessageCircle, Award, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useStartupProfile } from '@/hooks/useStartupProfile';
import { useSearchParams } from 'react-router-dom';

export const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useStartupProfile();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Fetch mentor's startups count
  const { data: mentorStartupsCount } = useQuery({
    queryKey: ['mentor-startups-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from('user_company_relations')
        .select('company_id', { count: 'exact' })
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user?.id
  });

  // Fetch mentor's sessions count for current month
  const { data: monthlySessionsCount } = useQuery({
    queryKey: ['mentor-sessions-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from('mentoring_sessions')
        .select('id', { count: 'exact' })
        .eq('mentor_id', user.id)
        .gte('session_date', startOfMonth.toISOString())
        .lte('session_date', endOfMonth.toISOString());

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user?.id
  });

  // Fetch mentor's average rating based on BEEP assessments from mentor's startups
  const { data: mentorRating } = useQuery({
    queryKey: ['mentor-average-rating', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get startup companies where this mentor has a relationship
      const { data: mentorCompanies, error: relationsError } = await supabase
        .from('user_company_relations')
        .select('company_id')
        .eq('user_id', user.id);

      if (relationsError) throw relationsError;

      if (!mentorCompanies || mentorCompanies.length === 0) {
        return 0;
      }

      const companyIds = mentorCompanies.map(rel => rel.company_id);

      // Get BEEP assessments from these companies
      const { data: assessments, error: assessmentsError } = await supabase
        .from('beep_assessments')
        .select('final_score')
        .eq('status', 'completed')
        .in('company_id', companyIds)
        .not('final_score', 'is', null);

      if (assessmentsError) throw assessmentsError;

      if (!assessments || assessments.length === 0) {
        return 0;
      }

      // Calculate average rating
      const totalScore = assessments.reduce((sum, assessment) => sum + (assessment.final_score || 0), 0);
      const averageRating = totalScore / assessments.length;

      return averageRating;
    },
    enabled: !!user?.id
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

      // Fetch startup companies for those users
      const { data: companies, error: companiesError } = await supabase
        .from('user_company_relations')
        .select(`
          user_id,
          companies!inner (
            name,
            company_type
          )
        `)
        .in('user_id', userIds)
        .eq('companies.company_type', 'startup');

      if (companiesError) throw companiesError;

      // Create a map for quick lookup
      const companyMap = new Map(companies?.map(c => [c.user_id, c.companies]) || []);

      // Combine assessments with company data
      return assessments.map(assessment => ({
        ...assessment,
        startup_company: companyMap.get(assessment.user_id)
      }));
    }
  });

  const handleNavigateToBeep = () => {
    setSearchParams({ tab: 'beep-analytics' });
  };

  const handleNavigateToStartups = () => {
    setSearchParams({ tab: 'startups' });
  };

  const handleNavigateToSessions = () => {
    setSearchParams({ tab: 'sessions' });
  };

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
            <CardTitle className="text-sm font-medium">Minhas Startups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentorStartupsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Startups mentoradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlySessionsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mentorRating ? mentorRating.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado nas avaliações BEEP
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
                        {assessment.startup_company?.name || 'Startup'}
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
              <span>Ferramentas de Mentoria</span>
            </CardTitle>
            <CardDescription>
              Acesse as ferramentas para mentorar suas startups.
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
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleNavigateToBeep}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Resultados BEEP
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleNavigateToStartups}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Explorar Startups
              </Button>
              
              <Button 
                className="w-full"
                onClick={handleNavigateToSessions}
              >
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
