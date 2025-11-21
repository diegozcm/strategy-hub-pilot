import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRYear, CreateOKRYearData } from '@/types/okr';

/**
 * Hook para gerenciar Anos OKR
 */
export const useOKRYears = () => {
  const [years, setYears] = useState<OKRYear[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { company } = useAuth();

  /**
   * Carregar todos os anos OKR da empresa
   */
  const loadYears = useCallback(async () => {
    if (!company?.id) return;

    // ETAPA 2: Validação okr_enabled
    if (!company.okr_enabled) {
      console.log('📊 [OKR Years] OKR not enabled for company:', company.id);
      setYears([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📊 [OKR Years] Loading years for company:', company.id);

      const { data, error } = await supabase
        .from('okr_years')
        .select('*')
        .eq('company_id', company.id)
        .order('year', { ascending: false });

      if (error) throw error;

      setYears(data as OKRYear[]);
    } catch (error) {
      console.error('Error loading OKR years:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar anos OKR',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [company?.id, toast]);

  /**
   * Criar novo ano OKR com trimestres automáticos
   */
  const createYear = useCallback(
    async (data: CreateOKRYearData): Promise<OKRYear | null> => {
      if (!company?.id) return null;

      try {
        setLoading(true);

        // 1. Criar o ano
        const { data: yearData, error: yearError } = await supabase
          .from('okr_years')
          .insert({
            company_id: company.id,
            year: data.year,
            start_date: data.start_date,
            end_date: data.end_date,
            status: 'draft',
            created_by: (await supabase.auth.getUser()).data.user?.id || '',
          })
          .select()
          .single();

        if (yearError) throw yearError;

        const newYear = yearData as OKRYear;

        // 2. Criar os 4 trimestres automaticamente
        const quarters = [
          { quarter: 'Q1', start: `${data.year}-01-01`, end: `${data.year}-03-31` },
          { quarter: 'Q2', start: `${data.year}-04-01`, end: `${data.year}-06-30` },
          { quarter: 'Q3', start: `${data.year}-07-01`, end: `${data.year}-09-30` },
          { quarter: 'Q4', start: `${data.year}-10-01`, end: `${data.year}-12-31` },
        ];

        const { error: periodsError } = await supabase.from('okr_periods').insert(
          quarters.map((q) => ({
            okr_year_id: newYear.id,
            company_id: company.id,
            quarter: q.quarter,
            start_date: q.start,
            end_date: q.end,
            status: 'draft',
          }))
        );

        if (periodsError) throw periodsError;

        toast({
          title: 'Sucesso',
          description: `Ano OKR ${data.year} criado com sucesso`,
        });

        await loadYears(); // Recarregar lista
        return newYear;
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
    },
    [company?.id, toast, loadYears]
  );

  /**
   * Obter ano ativo
   */
  const getActiveYear = useCallback((): OKRYear | null => {
    return years.find((y) => y.status === 'active') || null;
  }, [years]);

  /**
   * Obter ano por número
   */
  const getYearByNumber = useCallback(
    (yearNumber: number): OKRYear | null => {
      return years.find((y) => y.year === yearNumber) || null;
    },
    [years]
  );

  /**
   * Carregar anos ao montar ou quando empresa mudar
   */
  useEffect(() => {
    loadYears();
  }, [loadYears]);

  return {
    years,
    loading,
    loadYears,
    createYear,
    getActiveYear,
    getYearByNumber,
  };
};
