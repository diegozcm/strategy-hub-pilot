import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import type { GoldenCircle, GoldenCircleHistory, GoldenCircleFormData } from '@/types/golden-circle';

export const useGoldenCircle = () => {
  const [loading, setLoading] = useState(false);
  const [goldenCircle, setGoldenCircle] = useState<GoldenCircle | null>(null);
  const [history, setHistory] = useState<GoldenCircleHistory[]>([]);
  const { company: selectedCompany, user } = useAuth();
  const { toast } = useToast();

  const loadGoldenCircle = useCallback(async () => {
    if (!selectedCompany?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('golden_circle')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .maybeSingle();

      if (error) throw error;
      setGoldenCircle(data);
    } catch (error) {
      console.error('Error loading golden circle:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar Golden Circle',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, toast]);

  const loadHistory = useCallback(async () => {
    if (!goldenCircle?.id) return;

    try {
      const { data, error } = await supabase
        .from('golden_circle_history')
        .select(`
          *,
          profiles:changed_by (
            first_name,
            last_name,
            email
          )
        `)
        .eq('golden_circle_id', goldenCircle.id)
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
  }, [goldenCircle?.id, toast]);

  const saveGoldenCircle = useCallback(async (formData: GoldenCircleFormData) => {
    if (!selectedCompany?.id || !user?.id) return false;

    setLoading(true);
    try {
      if (goldenCircle) {
        // Update existing
        const { error } = await supabase
          .from('golden_circle')
          .update({
            why_question: formData.why_question,
            how_question: formData.how_question,
            what_question: formData.what_question,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', goldenCircle.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('golden_circle')
          .insert({
            company_id: selectedCompany.id,
            why_question: formData.why_question,
            how_question: formData.how_question,
            what_question: formData.what_question,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setGoldenCircle(data);
      }

      toast({
        title: 'Sucesso',
        description: 'Golden Circle salvo com sucesso',
      });

      await loadGoldenCircle();
      return true;
    } catch (error) {
      console.error('Error saving golden circle:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar Golden Circle',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, user?.id, goldenCircle, toast, loadGoldenCircle]);

  const deleteGoldenCircle = useCallback(async () => {
    if (!goldenCircle?.id) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('golden_circle')
        .delete()
        .eq('id', goldenCircle.id);

      if (error) throw error;

      setGoldenCircle(null);
      setHistory([]);
      toast({
        title: 'Sucesso',
        description: 'Golden Circle removido com sucesso',
      });
      return true;
    } catch (error) {
      console.error('Error deleting golden circle:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover Golden Circle',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [goldenCircle?.id, toast]);

  return {
    loading,
    goldenCircle,
    history,
    loadGoldenCircle,
    loadHistory,
    saveGoldenCircle,
    deleteGoldenCircle,
  };
};