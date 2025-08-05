import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Function to apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  // Load theme from database
  const loadThemeFromDB = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('theme_preference')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading theme:', error);
        return;
      }

      const savedTheme = (data?.theme_preference as Theme) || 'light';
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save theme to database
  const saveThemeToDB = async (newTheme: Theme) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving theme:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar a preferência de tema',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Tema atualizado',
        description: 'Sua preferência de tema foi salva com sucesso',
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao salvar tema',
        variant: 'destructive',
      });
    }
  };

  // Set theme function
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    await saveThemeToDB(newTheme);
  };

  // Load theme on mount and user change
  useEffect(() => {
    if (user?.id) {
      loadThemeFromDB();
    } else {
      // If no user, apply default theme
      setThemeState('light');
      applyTheme('light');
      setIsLoading(false);
    }
  }, [user?.id]);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};