import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRPillar } from '@/types/okr';

export const useOKRPillars = () => {
  const [pillars, setPillars] = useState<OKRPillar[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile, company } = useAuth();

  const fetchPillars = useCallback(async (yearId: string) => {
    if (!yearId || !company?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('okr_pillars')
        .select(`
          *,
          sponsor:profiles!okr_pillars_sponsor_id_fkey(user_id, first_name, last_name, email)
        `)
        .eq('okr_year_id', yearId)
        .eq('company_id', company.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setPillars(data || []);
    } catch (error) {
      console.error('Error fetching pillars:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pilares',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [company?.id, toast]);

  const createPillar = useCallback(async (
    pillarData: Omit<OKRPillar, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'company_id' | 'order_index'>
  ) => {
    if (!profile?.user_id || !company?.id) return;

    try {
      setLoading(true);

      // Get max order_index
      const { data: existingPillars } = await supabase
        .from('okr_pillars')
        .select('order_index')
        .eq('okr_year_id', pillarData.okr_year_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingPillars?.[0]?.order_index ? existingPillars[0].order_index + 1 : 0;

      const { data, error } = await supabase
        .from('okr_pillars')
        .insert({
          ...pillarData,
          company_id: company.id,
          created_by: profile.user_id,
          order_index: nextOrderIndex,
        })
        .select(`
          *,
          sponsor:profiles!okr_pillars_sponsor_id_fkey(user_id, first_name, last_name, email)
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Pilar criado com sucesso',
      });

      setPillars((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating pillar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar pilar',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, company?.id, toast, fetchPillars]);

  const updatePillar = useCallback(async (
    pillarId: string,
    updates: Partial<OKRPillar>
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('okr_pillars')
        .update(updates)
        .eq('id', pillarId)
        .select(`
          *,
          sponsor:profiles!okr_pillars_sponsor_id_fkey(user_id, first_name, last_name, email)
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Pilar atualizado com sucesso',
      });

      setPillars((prev) => prev.map(p => p.id === pillarId ? { ...p, ...updates } : p));
      return data;
    } catch (error) {
      console.error('Error updating pillar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar pilar',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchPillars]);

  const deletePillar = useCallback(async (pillarId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('okr_pillars')
        .delete()
        .eq('id', pillarId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Pilar excluído com sucesso',
      });

      setPillars((prev) => prev.filter(p => p.id !== pillarId));
    } catch (error) {
      console.error('Error deleting pillar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir pilar',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchPillars]);

  const reorderPillars = useCallback(async (reorderedPillars: OKRPillar[]) => {
    try {
      setLoading(true);

      const updates = reorderedPillars.map((pillar, index) => ({
        id: pillar.id,
        order_index: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('okr_pillars')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Pilares reordenados com sucesso',
      });

      setPillars(reorderedPillars);
    } catch (error) {
      console.error('Error reordering pillars:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao reordenar pilares',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchPillars]);

  return {
    pillars,
    loading,
    fetchPillars,
    createPillar,
    updatePillar,
    deletePillar,
    reorderPillars,
  };
};
