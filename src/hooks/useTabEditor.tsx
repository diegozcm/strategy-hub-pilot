import { useState, useCallback, useEffect } from 'react';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { useToast } from '@/hooks/use-toast';

interface TabData {
  [key: string]: string;
}

export const useTabEditor = (section: string) => {
  const { content, updateContent, getContent } = useLandingPageContent();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState<TabData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local data when content changes or when starting to edit
  const initializeLocalData = useCallback(() => {
    const sectionContent = content[section] || {};
    setLocalData({ ...sectionContent });
    setHasChanges(false);
  }, [content, section]);

  // Initialize local data when content loads
  useEffect(() => {
    if (content[section]) {
      initializeLocalData();
    }
  }, [content, section, initializeLocalData]);

  const startEdit = useCallback(() => {
    setIsEditing(true);
    initializeLocalData();
  }, [initializeLocalData]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    initializeLocalData();
  }, [initializeLocalData]);

  const updateLocalField = useCallback((key: string, value: string) => {
    setLocalData(prev => {
      const newData = { ...prev, [key]: value };
      return newData;
    });
    setHasChanges(true);
  }, []);

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      let allSuccess = true;
      
      // Save all changed fields in sequence (to avoid database conflicts)
      for (const [key, value] of Object.entries(localData)) {
        const currentValue = getContent(section, key, '');
        if (value !== currentValue) {
          const success = await updateContent(section, key, value);
          if (!success) {
            allSuccess = false;
            break;
          }
        }
      }

      if (allSuccess) {
        setIsEditing(false);
        setHasChanges(false);
        toast({
          title: "Salvo com sucesso",
          description: "Todas as alterações foram salvas.",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Algumas alterações não foram salvas.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [localData, section, getContent, updateContent, toast]);

  const getFieldValue = useCallback((key: string, fallback: string = '') => {
    if (isEditing) {
      return localData[key] ?? getContent(section, key, fallback);
    }
    return getContent(section, key, fallback);
  }, [isEditing, localData, section, getContent]);

  return {
    isEditing,
    hasChanges,
    isSaving,
    localData,
    startEdit,
    cancelEdit,
    saveChanges,
    updateLocalField,
    getFieldValue,
  };
};