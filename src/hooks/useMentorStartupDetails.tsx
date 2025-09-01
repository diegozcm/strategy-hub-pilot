
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

export interface StartupDetails {
  id: string;
  name: string;
  mission?: string;
  vision?: string;
  values?: string[];
  logo_url?: string;
  created_at: string;
  latest_beep_assessment?: {
    id: string;
    final_score: number;
    maturity_level: string;
    completed_at: string;
    status: string;
  };
  beep_assessments_count: number;
}

export const useMentorStartupDetails = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mentor-startup-details', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Buscar startups mentoradas via user_company_relations
      const { data: mentorCompanies, error: relationsError } = await supabase
        .from('user_company_relations')
        .select(`
          company_id,
          companies!company_id (
            id,
            name,
            mission,
            vision,
            values,
            logo_url,
            created_at,
            company_type
          )
        `)
        .eq('user_id', user.id);

      if (relationsError) throw relationsError;

      if (!mentorCompanies || mentorCompanies.length === 0) {
        return [];
      }

      // Filtrar apenas startups
      const startupCompanies = mentorCompanies.filter(
        rel => rel.companies?.company_type === 'startup'
      );

      if (startupCompanies.length === 0) {
        return [];
      }

      const startupIds = startupCompanies.map(rel => rel.company_id);

      // Buscar avaliações BEEP para cada startup
      const { data: beepAssessments, error: assessmentsError } = await supabase
        .from('beep_assessments')
        .select(`
          id,
          company_id,
          final_score,
          maturity_level,
          completed_at,
          status
        `)
        .in('company_id', startupIds)
        .order('completed_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Combinar dados das startups com suas avaliações BEEP
      const startupsWithDetails: StartupDetails[] = startupCompanies.map(rel => {
        const company = rel.companies;
        if (!company) return null;

        // Buscar avaliações desta startup
        const companyAssessments = beepAssessments?.filter(
          assessment => assessment.company_id === company.id
        ) || [];

        // Pegar a mais recente completada
        const latestCompleted = companyAssessments.find(
          assessment => assessment.status === 'completed' && assessment.final_score != null
        );

        return {
          id: company.id,
          name: company.name,
          mission: company.mission,
          vision: company.vision,
          values: company.values,
          logo_url: company.logo_url,
          created_at: company.created_at,
          latest_beep_assessment: latestCompleted ? {
            id: latestCompleted.id,
            final_score: latestCompleted.final_score,
            maturity_level: latestCompleted.maturity_level,
            completed_at: latestCompleted.completed_at,
            status: latestCompleted.status
          } : undefined,
          beep_assessments_count: companyAssessments.length
        };
      }).filter(Boolean) as StartupDetails[];

      return startupsWithDetails;
    },
    enabled: !!user?.id
  });
};
