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
    if (!selectedCompany?.id) return;

    try {
      // First get the golden_circle record for this company
      const { data: goldenCircleData, error: gcError } = await supabase
        .from('golden_circle')
        .select('id')
        .eq('company_id', selectedCompany.id)
        .maybeSingle();

      if (gcError) throw gcError;
      
      if (!goldenCircleData) {
        setHistory([]);
        return;
      }

      // Then get the history for this golden circle
      const { data: historyData, error } = await supabase
        .from('golden_circle_history')
        .select('*')
        .eq('golden_circle_id', goldenCircleData.id)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      if (!historyData || historyData.length === 0) {
        setHistory([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(historyData.map(h => h.changed_by))];

      // Fetch user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Map profiles to history entries
      const historyWithProfiles = historyData.map(historyEntry => ({
        ...historyEntry,
        profiles: profiles?.find(p => p.user_id === historyEntry.changed_by) || null
      }));

      setHistory(historyWithProfiles);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico',
        variant: 'destructive',
      });
    }
  }, [selectedCompany?.id, toast]);

  const saveGoldenCircle = useCallback(async (formData: GoldenCircleFormData) => {
    if (!selectedCompany?.id || !user?.id) return false;

    setLoading(true);
    try {
      // Use UPSERT to handle both insert and update cases
      const { data, error } = await supabase
        .from('golden_circle')
        .upsert({
          company_id: selectedCompany.id,
          why_question: formData.why_question,
          how_question: formData.how_question,
          what_question: formData.what_question,
          created_by: user.id,
          updated_by: user.id,
        }, {
          onConflict: 'company_id'
        })
        .select()
        .single();

      if (error) throw error;
      setGoldenCircle(data);

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