import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import type { SwotAnalysis, SwotHistory, SwotFormData } from '@/types/swot';

export const useSwotAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [swotAnalysis, setSwotAnalysis] = useState<SwotAnalysis | null>(null);
  const [history, setHistory] = useState<SwotHistory[]>([]);
  const { company: selectedCompany, user } = useAuth();
  const { toast } = useToast();

  const loadSwotAnalysis = useCallback(async () => {
    if (!selectedCompany?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('swot_analysis')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .maybeSingle();

      if (error) throw error;
      setSwotAnalysis(data);
    } catch (error) {
      console.error('Error loading SWOT analysis:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar análise SWOT',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, toast]);

  const loadHistory = useCallback(async () => {
    if (!swotAnalysis?.id) return;

    try {
      const { data, error } = await supabase
        .from('swot_history')
        .select(`
          *,
          profiles:changed_by (
            first_name,
            last_name,
            email
          )
        `)
        .eq('swot_analysis_id', swotAnalysis.id)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico',
        variant: 'destructive',
      });
    }
  }, [swotAnalysis?.id, toast]);

  const saveSwotAnalysis = useCallback(async (formData: SwotFormData) => {
    if (!selectedCompany?.id || !user?.id) return false;

    setLoading(true);
    try {
      // Use UPSERT to handle both insert and update cases
      const { data, error } = await supabase
        .from('swot_analysis')
        .upsert({
          company_id: selectedCompany.id,
          strengths: formData.strengths,
          weaknesses: formData.weaknesses,
          opportunities: formData.opportunities,
          threats: formData.threats,
          created_by: user.id,
          updated_by: user.id,
        }, {
          onConflict: 'company_id'
        })
        .select()
        .single();

      if (error) throw error;
      setSwotAnalysis(data);

      toast({
        title: 'Sucesso',
        description: 'Análise SWOT salva com sucesso',
      });

      await loadSwotAnalysis();
      return true;
    } catch (error) {
      console.error('Error saving SWOT analysis:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar análise SWOT',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, user?.id, toast, loadSwotAnalysis]);

  const deleteSwotAnalysis = useCallback(async () => {
    if (!swotAnalysis?.id) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('swot_analysis')
        .delete()
        .eq('id', swotAnalysis.id);

      if (error) throw error;

      setSwotAnalysis(null);
      setHistory([]);
      toast({
        title: 'Sucesso',
        description: 'Análise SWOT removida com sucesso',
      });
      return true;
    } catch (error) {
      console.error('Error deleting SWOT analysis:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover análise SWOT',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [swotAnalysis?.id, toast]);

  return {
    loading,
    swotAnalysis,
    history,
    loadSwotAnalysis,
    loadHistory,
    saveSwotAnalysis,
    deleteSwotAnalysis,
  };
};