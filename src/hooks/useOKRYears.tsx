import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRYear } from '@/types/okr';

export const useOKRYears = () => {
  const [years, setYears] = useState<OKRYear[]>([]);
  const [currentYear, setCurrentYear] = useState<OKRYear | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { company, profile } = useAuth();

  const fetchYears = useCallback(async () => {
    if (!company?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('okr_years')
        .select('*')
        .eq('company_id', company.id)
        .order('year', { ascending: false });

      if (error) throw error;

      setYears(data || []);
      
      // Auto-select most recent year
      if (data && data.length > 0 && !currentYear) {
        setCurrentYear(data[0]);
      }
    } catch (error) {
      console.error('Error fetching OKR years:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar anos OKR',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [company?.id, currentYear, toast]);

  const createYear = useCallback(async (year: number, theme?: string, description?: string, autoCreateQuarters = true) => {
    if (!company?.id || !profile?.user_id) return null;

    try {
      setLoading(true);
      
      const { data: yearData, error: yearError } = await supabase
        .from('okr_years')
        .insert({
          company_id: company.id,
          year,
          theme,
          description,
          created_by: profile.user_id,
          status: 'active',
        })
        .select()
        .single();

      if (yearError) throw yearError;

      if (autoCreateQuarters && yearData) {
        // Create 4 quarters automatically
        const startYear = new Date(year, 0, 1);
        const quarters = [
          { quarter: 1, start_date: new Date(year, 0, 1).toISOString().split('T')[0], end_date: new Date(year, 2, 31).toISOString().split('T')[0] },
          { quarter: 2, start_date: new Date(year, 3, 1).toISOString().split('T')[0], end_date: new Date(year, 5, 30).toISOString().split('T')[0] },
          { quarter: 3, start_date: new Date(year, 6, 1).toISOString().split('T')[0], end_date: new Date(year, 8, 30).toISOString().split('T')[0] },
          { quarter: 4, start_date: new Date(year, 9, 1).toISOString().split('T')[0], end_date: new Date(year, 11, 31).toISOString().split('T')[0] },
        ];

        const quartersToInsert = quarters.map(q => ({
          okr_year_id: yearData.id,
          ...q,
          status: 'active',
        }));

        const { error: quartersError } = await supabase
          .from('okr_quarters')
          .insert(quartersToInsert);

        if (quartersError) throw quartersError;
      }

      toast({
        title: 'Sucesso',
        description: 'Ano OKR criado com sucesso',
      });

      await fetchYears();
      return yearData;
    } catch (error) {
      console.error('Error creating OKR year:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar ano OKR',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [company?.id, toast, fetchYears]);

  const deleteYear = useCallback(async (yearId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('okr_years')
        .delete()
        .eq('id', yearId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Ano OKR deletado com sucesso',
      });

      await fetchYears();
    } catch (error) {
      console.error('Error deleting OKR year:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao deletar ano OKR',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchYears]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  return {
    years,
    currentYear,
    setCurrentYear,
    loading,
    fetchYears,
    createYear,
    deleteYear,
  };
};
