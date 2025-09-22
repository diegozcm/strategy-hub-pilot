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
  const { toast } = useToast();

  const fetchContent = async () => {
    try {
      setLoading(true);
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

      const { error } = await supabase
        .from('landing_page_content')
        .upsert({
          section_name: section,
          content_key: key,
          content_value: value,
          content_type: type,
          created_by: user.id,
          updated_by: user.id,
          is_active: true,
        });

      if (error) throw error;

      // Update local state
      setContent(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));

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

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    updateContent,
    getContent,
    uploadImage,
    refetch: fetchContent,
  };
};