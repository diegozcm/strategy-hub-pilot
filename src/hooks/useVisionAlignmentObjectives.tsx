import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import type { VisionAlignmentObjective, VisionAlignmentObjectiveFormData } from '@/types/vision-alignment';

export const useVisionAlignmentObjectives = (visionAlignmentId?: string) => {
  const [loading, setLoading] = useState(false);
  const [objectives, setObjectives] = useState<VisionAlignmentObjective[]>([]);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const loadObjectives = useCallback(async () => {
    console.log('🎯 VisionAlignmentObjectives: Starting loadObjectives');
    console.log('🆔 visionAlignmentId:', visionAlignmentId);
    console.log('👤 user:', user?.id);

    if (!visionAlignmentId) {
      console.log('❌ No visionAlignmentId, clearing objectives');
      setObjectives([]);
      return;
    }

    if (!user?.id) {
      console.log('❌ No user ID, aborting load objectives');
      return;
    }

    // Check if user session is properly set in Supabase
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    console.log('🔍 Supabase user session in objectives:', supabaseUser?.id);
    
    if (!supabaseUser) {
      console.error('❌ No Supabase user session found in objectives');
      return;
    }

    // Debug auth context
    try {
      const { data: debugData } = await supabase.rpc('debug_auth_context');
      console.log('🔍 Objectives Auth Debug:', debugData);
    } catch (debugError) {
      console.error('Debug function error:', debugError);
    }

    setLoading(true);
    try {
      console.log('📡 Fetching objectives for vision alignment:', visionAlignmentId);
      const { data, error } = await supabase
        .from('vision_alignment_objectives')
        .select('*')
        .eq('vision_alignment_id', visionAlignmentId)
        .order('dimension')
        .order('order_index');

      console.log('📡 Objectives query result:', { data, error });

      if (error) throw error;
      setObjectives((data || []) as VisionAlignmentObjective[]);
      console.log('✅ Objectives loaded successfully:', data?.length, 'items');
    } catch (error) {
      console.error('❌ Error loading vision alignment objectives:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar objetivos do Alinhamento de Visão',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [visionAlignmentId, user?.id, toast]);

  const createObjective = useCallback(async (
    dimension: VisionAlignmentObjective['dimension'], 
    formData: VisionAlignmentObjectiveFormData
  ) => {
    console.log('✨ VisionAlignmentObjectives: Creating objective');
    console.log('📊 dimension:', dimension);
    console.log('📝 formData:', formData);
    console.log('🆔 visionAlignmentId:', visionAlignmentId);
    console.log('👤 user:', user?.id);

    if (!visionAlignmentId || !user?.id) {
      console.log('❌ Missing visionAlignmentId or user, aborting create');
      toast({
        title: 'Erro',
        description: 'Informações necessárias não disponíveis',
        variant: 'destructive',
      });
      return false;
    }

    // Debug auth context before creating
    try {
      const { data: debugData } = await supabase.rpc('debug_auth_context');
      console.log('🔍 Create Auth Debug:', debugData);
    } catch (debugError) {
      console.error('Debug function error:', debugError);
    }

    setLoading(true);
    try {
      console.log('📈 Getting next order index for dimension:', dimension);
      // Get the next order index for this dimension
      const { data: existingObjectives } = await supabase
        .from('vision_alignment_objectives')
        .select('order_index')
        .eq('vision_alignment_id', visionAlignmentId)
        .eq('dimension', dimension)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingObjectives && existingObjectives.length > 0 
        ? existingObjectives[0].order_index + 1 
        : 0;

      console.log('📈 Next order index:', nextOrderIndex);

      const insertData = {
        vision_alignment_id: visionAlignmentId,
        dimension,
        title: formData.title,
        description: formData.description,
        color: formData.color,
        order_index: nextOrderIndex,
        created_by: user.id,
        updated_by: user.id,
      };
      console.log('📝 Insert data:', insertData);

      const { data, error } = await supabase
        .from('vision_alignment_objectives')
        .insert(insertData)
        .select()
        .single();

      console.log('📡 Insert result:', { data, error });

      if (error) throw error;

      setObjectives(prev => [...prev, data as VisionAlignmentObjective]);
      toast({
        title: 'Sucesso',
        description: 'Objetivo criado com sucesso!',
      });
      console.log('✅ Objective created successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Error creating vision alignment objective:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar objetivo',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [visionAlignmentId, user?.id, toast]);

  const updateObjective = useCallback(async (
    objectiveId: string, 
    formData: VisionAlignmentObjectiveFormData
  ) => {
    if (!user?.id) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vision_alignment_objectives')
        .update({
          title: formData.title,
          description: formData.description,
          color: formData.color,
          updated_by: user.id,
        })
        .eq('id', objectiveId)
        .select()
        .single();

      if (error) throw error;

      setObjectives(prev => prev.map(obj => obj.id === objectiveId ? data as VisionAlignmentObjective : obj));
      toast({
        title: 'Sucesso',
        description: 'Objetivo atualizado com sucesso!',
      });
      return true;
    } catch (error) {
      console.error('Error updating vision alignment objective:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar objetivo',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const deleteObjective = useCallback(async (objectiveId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vision_alignment_objectives')
        .delete()
        .eq('id', objectiveId);

      if (error) throw error;

      setObjectives(prev => prev.filter(obj => obj.id !== objectiveId));
      toast({
        title: 'Sucesso',
        description: 'Objetivo excluído com sucesso!',
      });
      return true;
    } catch (error) {
      console.error('Error deleting vision alignment objective:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir objetivo',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const reorderObjectives = useCallback(async (
    dimension: VisionAlignmentObjective['dimension'],
    reorderedObjectives: VisionAlignmentObjective[]
  ) => {
    if (!user?.id) return false;

    setLoading(true);
    try {
      const updates = reorderedObjectives.map((obj, index) => ({
        id: obj.id,
        order_index: index,
        updated_by: user.id,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('vision_alignment_objectives')
          .update({ 
            order_index: update.order_index,
            updated_by: update.updated_by,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      setObjectives(prev => 
        prev.map(obj => {
          const update = updates.find(u => u.id === obj.id);
          return update ? { ...obj, order_index: update.order_index } : obj;
        })
      );

      return true;
    } catch (error) {
      console.error('Error reordering objectives:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao reordenar objetivos',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const getObjectivesByDimension = useCallback((dimension: VisionAlignmentObjective['dimension']) => {
    return objectives
      .filter(obj => obj.dimension === dimension)
      .sort((a, b) => a.order_index - b.order_index);
  }, [objectives]);

  return {
    loading,
    objectives,
    loadObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
    reorderObjectives,
    getObjectivesByDimension,
  };
};