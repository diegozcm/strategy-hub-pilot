import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useMultiTenant';
import { toast } from '@/components/ui/use-toast';

export interface AISettings {
  id?: string;
  company_id: string;
  model: string;
  temperature: number;
  max_tokens: number;
  web_search_enabled: boolean;
  agent_profile: string;
  voice_enabled: boolean;
  voice_model: string;
  voice_id: string;
  system_prompt: string;
}

const DEFAULT_SETTINGS: Omit<AISettings, 'id' | 'company_id'> = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1000,
  web_search_enabled: false,
  agent_profile: 'assistant',
  voice_enabled: false,
  voice_model: 'tts-1',
  voice_id: 'alloy',
  system_prompt: 'Você é um assistente especializado em análise estratégica e gestão empresarial. Forneça insights precisos e acionáveis.',
};

export const useAISettings = () => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { company } = useAuth();

  const loadSettings = async () => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ai_company_settings')
        .select('*')
        .eq('company_id', company.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading AI settings:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar configurações da IA",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        setSettings({
          ...DEFAULT_SETTINGS,
          company_id: company.id,
        });
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações da IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<AISettings>) => {
    if (!company?.id || !settings) return;

    setSaving(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      if (settings.id) {
        // Update existing settings
        const { error } = await supabase
          .from('ai_company_settings')
          .update({
            model: updatedSettings.model,
            temperature: updatedSettings.temperature,
            max_tokens: updatedSettings.max_tokens,
            web_search_enabled: updatedSettings.web_search_enabled,
            agent_profile: updatedSettings.agent_profile,
            voice_enabled: updatedSettings.voice_enabled,
            voice_model: updatedSettings.voice_model,
            voice_id: updatedSettings.voice_id,
            system_prompt: updatedSettings.system_prompt,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('ai_company_settings')
          .insert({
            company_id: company.id,
            model: updatedSettings.model,
            temperature: updatedSettings.temperature,
            max_tokens: updatedSettings.max_tokens,
            web_search_enabled: updatedSettings.web_search_enabled,
            agent_profile: updatedSettings.agent_profile,
            voice_enabled: updatedSettings.voice_enabled,
            voice_model: updatedSettings.voice_model,
            voice_id: updatedSettings.voice_id,
            system_prompt: updatedSettings.system_prompt,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        updatedSettings.id = data.id;
      }

      setSettings(updatedSettings);
      toast({
        title: "Sucesso",
        description: "Configurações da IA salvas com sucesso",
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações da IA",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [company?.id]);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    loadSettings,
  };
};