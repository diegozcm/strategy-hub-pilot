import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LandingPageContent {
  id: string;
  section_name: string;
  content_key: string;
  content_type: 'text' | 'image' | 'icon' | 'json' | 'array';
  content_value: string;
  display_order: number;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export const useLandingPageContent = () => {
  const [content, setContent] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const { toast } = useToast();

  const fetchContent = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Add timestamp to force cache refresh
      const now = Date.now();
      if (forceRefresh) {
        console.log('🔄 Force refreshing landing page content');
      }
      
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // Transform data into nested structure
      const organized: Record<string, Record<string, string>> = {};
      data?.forEach((item) => {
        if (!organized[item.section_name]) {
          organized[item.section_name] = {};
        }
        organized[item.section_name][item.content_key] = item.content_value || '';
      });

      setContent(organized);
      setLastFetch(now);
      
      if (forceRefresh) {
        console.log('✅ Content refreshed:', organized);
      }
    } catch (error) {
      console.error('Error fetching landing page content:', error);
      toast({
        title: "Erro ao carregar conteúdo",
        description: "Não foi possível carregar o conteúdo da landing page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (
    section: string, 
    key: string, 
    value: string, 
    type: LandingPageContent['content_type'] = 'text'
  ) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      console.log(`📝 Updating content: ${section}.${key} = "${value}"`);

      // First, try to update existing record
      const { data: existingData, error: selectError } = await supabase
        .from('landing_page_content')
        .select('id')
        .eq('section_name', section)
        .eq('content_key', key)
        .maybeSingle();

      if (selectError) throw selectError;

      let error;
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('landing_page_content')
          .update({
            content_value: value,
            content_type: type,
            updated_by: user.id,
            is_active: true,
          })
          .eq('id', existingData.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('landing_page_content')
          .insert({
            section_name: section,
            content_key: key,
            content_value: value,
            content_type: type,
            created_by: user.id,
            updated_by: user.id,
            is_active: true,
          });
        error = insertError;
      }

      if (error) throw error;

      // Update local state immediately
      setContent(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));

      // Force refresh to ensure sync
      setTimeout(() => {
        fetchContent(true);
      }, 100);

      toast({
        title: "Conteúdo atualizado",
        description: "O conteúdo foi atualizado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o conteúdo.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getContent = (section: string, key: string, fallback: string = '') => {
    return content?.[section]?.[key] || fallback;
  };

  const uploadImage = async (file: File, path: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('landing-page')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('landing-page')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
      return null;
    }
  };

  const forceRefresh = () => {
    fetchContent(true);
  };

  useEffect(() => {
    fetchContent();

    // Set up real-time listener for content changes
    const channel = supabase
      .channel('landing_page_content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'landing_page_content',
        },
        (payload) => {
          console.log('📡 Landing page content changed, refreshing...', payload);
          // Small delay to ensure database consistency
          setTimeout(() => {
            fetchContent(true);
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    content,
    loading,
    updateContent,
    getContent,
    uploadImage,
    refetch: fetchContent,
    forceRefresh,
    lastFetch,
  };
};