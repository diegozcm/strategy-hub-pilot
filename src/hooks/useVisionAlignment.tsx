import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import type { VisionAlignment, VisionAlignmentHistory, VisionAlignmentFormData } from '@/types/vision-alignment';

export const useVisionAlignment = () => {
  const [loading, setLoading] = useState(false);
  const [visionAlignment, setVisionAlignment] = useState<VisionAlignment | null>(null);
  const [history, setHistory] = useState<VisionAlignmentHistory[]>([]);
  const { company: selectedCompany, user } = useAuth();
  const { toast } = useToast();

  const loadVisionAlignment = useCallback(async () => {
    if (!selectedCompany?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vision_alignment')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .maybeSingle();

      if (error) throw error;
      setVisionAlignment(data);
    } catch (error) {
      console.error('Error loading vision alignment:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar Alinhamento de Visão',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, toast]);

  const loadHistory = useCallback(async () => {
    if (!selectedCompany?.id) return;

    try {
      // First get the vision_alignment record for this company
      const { data: visionAlignmentData, error: vaError } = await supabase
        .from('vision_alignment')
        .select('id')
        .eq('company_id', selectedCompany.id)
        .maybeSingle();

      if (vaError) throw vaError;

      if (!visionAlignmentData) {
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('vision_alignment_history')
        .select('*')
        .eq('vision_alignment_id', visionAlignmentData.id)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      
      // Get profile data for each history entry
      const historyWithProfiles = await Promise.all(
        (data || []).map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .eq('user_id', item.changed_by)
            .maybeSingle();
            
          return {
            ...item,
            profiles: profile
          } as VisionAlignmentHistory;
        })
      );
      
      setHistory(historyWithProfiles);
    } catch (error) {
      console.error('Error loading vision alignment history:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico do Alinhamento de Visão',
        variant: 'destructive',
      });
    }
  }, [selectedCompany?.id, toast]);

  const saveVisionAlignment = useCallback(async (formData: VisionAlignmentFormData) => {
    if (!selectedCompany?.id || !user?.id) return false;

    setLoading(true);
    try {
      // Check if we have an existing vision alignment
      const existingVisionAlignment = visionAlignment;

      if (existingVisionAlignment) {
        // Save history before updating
        await supabase.from('vision_alignment_history').insert({
          vision_alignment_id: existingVisionAlignment.id,
          previous_shared_objectives: existingVisionAlignment.shared_objectives,
          previous_shared_commitments: existingVisionAlignment.shared_commitments,
          previous_shared_resources: existingVisionAlignment.shared_resources,
          previous_shared_risks: existingVisionAlignment.shared_risks,
          changed_by: user.id,
          change_reason: formData.change_reason,
        });

        // Update existing vision alignment
        const { data, error } = await supabase
          .from('vision_alignment')
          .update({
            shared_objectives: formData.shared_objectives,
            shared_commitments: formData.shared_commitments,
            shared_resources: formData.shared_resources,
            shared_risks: formData.shared_risks,
            updated_by: user.id,
          })
          .eq('id', existingVisionAlignment.id)
          .select()
          .single();

        if (error) throw error;
        setVisionAlignment(data);
      } else {
        // Create new vision alignment
        const { data, error } = await supabase
          .from('vision_alignment')
          .insert({
            company_id: selectedCompany.id,
            shared_objectives: formData.shared_objectives,
            shared_commitments: formData.shared_commitments,
            shared_resources: formData.shared_resources,
            shared_risks: formData.shared_risks,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setVisionAlignment(data);
      }

      toast({
        title: 'Sucesso',
        description: existingVisionAlignment 
          ? 'Alinhamento de Visão atualizado com sucesso!' 
          : 'Alinhamento de Visão criado com sucesso!',
      });
      return true;
    } catch (error) {
      console.error('Error saving vision alignment:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar Alinhamento de Visão',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, user?.id, visionAlignment, toast]);

  const deleteVisionAlignment = useCallback(async () => {
    if (!visionAlignment?.id) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vision_alignment')
        .delete()
        .eq('id', visionAlignment.id);

      if (error) throw error;

      setVisionAlignment(null);
      toast({
        title: 'Sucesso',
        description: 'Alinhamento de Visão excluído com sucesso!',
      });
      return true;
    } catch (error) {
      console.error('Error deleting vision alignment:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir Alinhamento de Visão',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [visionAlignment?.id, toast]);

  return {
    loading,
    visionAlignment,
    history,
    loadVisionAlignment,
    loadHistory,
    saveVisionAlignment,
    deleteVisionAlignment,
  };
};