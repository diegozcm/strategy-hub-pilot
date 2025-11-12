import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LandingPageContent {
  id: string;
  section_name: string;
  content_key: string;
  content_type: string;
  content_value: string | null;
  display_order: number;
  is_active: boolean;
}

export const useLandingPageContentDraft = () => {
  const [content, setContent] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date>(new Date());

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('landing_page_content_draft')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching draft content:', error);
        toast.error('Erro ao carregar conteúdo draft');
        return;
      }

      // Organize content by section and key
      const organized: Record<string, Record<string, string>> = {};
      data?.forEach((item: LandingPageContent) => {
        if (!organized[item.section_name]) {
          organized[item.section_name] = {};
        }
        organized[item.section_name][item.content_key] = item.content_value || '';
      });

      setContent(organized);
      setLastFetch(new Date());
    } catch (error) {
      console.error('Error fetching draft content:', error);
      toast.error('Erro ao carregar conteúdo draft');
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (
    section: string,
    key: string,
    value: string,
    contentType: string = 'text'
  ) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Você precisa estar autenticado para atualizar o conteúdo');
        return;
      }

      // Check if content exists
      const { data: existing } = await supabase
        .from('landing_page_content_draft')
        .select('id')
        .eq('section_name', section)
        .eq('content_key', key)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('landing_page_content_draft')
          .update({
            content_value: value,
            content_type: contentType,
            updated_by: session.session.user.id,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('landing_page_content_draft')
          .insert({
            section_name: section,
            content_key: key,
            content_value: value,
            content_type: contentType,
            created_by: session.session.user.id,
            updated_by: session.session.user.id,
          });

        if (error) throw error;
      }

      // Update local state immediately
      setContent((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      }));

      // Refresh from database
      await fetchContent();
    } catch (error) {
      console.error('Error updating draft content:', error);
      toast.error('Erro ao atualizar conteúdo draft');
    }
  };

  const getContent = (section: string, key: string, fallback: string = '') => {
    return content[section]?.[key] || fallback;
  };

  const uploadImage = async (file: File, section: string, key: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${section}-${key}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-page')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('landing-page')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
      throw error;
    }
  };

  useEffect(() => {
    fetchContent();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('landing_page_content_draft_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'landing_page_content_draft',
        },
        () => {
          fetchContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refetch = fetchContent;
  const forceRefresh = () => {
    fetchContent();
  };

  return {
    content,
    loading,
    updateContent,
    getContent,
    uploadImage,
    refetch,
    forceRefresh,
    lastFetch,
  };
};
