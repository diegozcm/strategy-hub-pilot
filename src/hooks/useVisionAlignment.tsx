import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import type { VisionAlignment, VisionAlignmentHistory, VisionAlignmentFormData } from '@/types/vision-alignment';

export const useVisionAlignment = () => {
  const [loading, setLoading] = useState(false);
  const [visionAlignment, setVisionAlignment] = useState<VisionAlignment | null>(null);
  const [history, setHistory] = useState<VisionAlignmentHistory[]>([]);
  const { company: selectedCompany, user, profile } = useAuth();
  const { toast } = useToast();

  const ensureVisionAlignment = useCallback(async () => {
    if (!selectedCompany?.id || !user?.id) {
      console.log('❌ No selectedCompany ID or user ID, aborting ensure');
      return null;
    }

    console.log('🔍 VisionAlignment: Ensuring vision alignment exists');
    
    try {
      // First try to get existing vision alignment
      const { data: existing, error: fetchError } = await supabase
        .from('vision_alignment')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        console.log('✅ Vision alignment already exists:', existing);
        setVisionAlignment(existing);
        return existing;
      }

      // Create empty vision alignment if none exists
      console.log('✨ Creating empty vision alignment');
      const { data: newVisionAlignment, error: createError } = await supabase
        .from('vision_alignment')
        .insert({
          company_id: selectedCompany.id,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log('✅ Empty vision alignment created:', newVisionAlignment);
      setVisionAlignment(newVisionAlignment);
      return newVisionAlignment;
    } catch (error) {
      console.error('❌ Error ensuring vision alignment:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao inicializar Alinhamento de Visão',
        variant: 'destructive',
      });
      return null;
    }
  }, [selectedCompany?.id, user?.id, toast]);

  const loadVisionAlignment = useCallback(async () => {
    console.log('🔍 VisionAlignment: Starting loadVisionAlignment');
    console.log('🏢 selectedCompany:', selectedCompany);
    console.log('👤 user:', user?.id);
    console.log('📋 profile:', profile?.company_id);

    if (!selectedCompany?.id) {
      console.log('❌ No selectedCompany ID, aborting load');
      return;
    }

    setLoading(true);
    try {
      await ensureVisionAlignment();
    } catch (error) {
      console.error('❌ Error in loadVisionAlignment:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, user?.id, profile?.company_id, ensureVisionAlignment]);

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
    console.log('💾 VisionAlignment: Starting saveVisionAlignment');
    console.log('🏢 selectedCompany:', selectedCompany?.id);
    console.log('👤 user:', user?.id);
    console.log('📝 formData:', formData);

    if (!selectedCompany?.id || !user?.id) {
      console.log('❌ Missing selectedCompany or user, aborting save');
      toast({
        title: 'Erro',
        description: 'Informações de usuário ou empresa não disponíveis',
        variant: 'destructive',
      });
      return false;
    }

    // Debug auth context before saving
    try {
      const { data: debugData } = await supabase.rpc('debug_auth_context');
      console.log('🔍 Save Auth Debug:', debugData);
    } catch (debugError) {
      console.error('Debug function error:', debugError);
    }

    setLoading(true);
    try {
      // Check if we have an existing vision alignment
      const existingVisionAlignment = visionAlignment;
      console.log('📂 Existing vision alignment:', existingVisionAlignment);

      if (existingVisionAlignment) {
        console.log('📝 Updating existing vision alignment');
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

        console.log('📡 Update result:', { data, error });
        if (error) throw error;
        setVisionAlignment(data);
      } else {
        console.log('✨ Creating or upserting vision alignment');
        // Create or update vision alignment in an idempotent way
        const { data, error } = await supabase
          .from('vision_alignment')
          .upsert({
            company_id: selectedCompany.id,
            shared_objectives: formData.shared_objectives,
            shared_commitments: formData.shared_commitments,
            shared_resources: formData.shared_resources,
            shared_risks: formData.shared_risks,
            created_by: user.id,
            updated_by: user.id,
          }, { onConflict: 'company_id' })
          .select()
          .single();

        console.log('📡 Upsert result:', { data, error });
        if (error) throw error;
        setVisionAlignment(data);
      }

      toast({
        title: 'Sucesso',
        description: existingVisionAlignment 
          ? 'Alinhamento de Visão atualizado com sucesso!' 
          : 'Alinhamento de Visão criado com sucesso!',
      });
      console.log('✅ Vision alignment saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving vision alignment:', error);
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
    ensureVisionAlignment,
  };
};