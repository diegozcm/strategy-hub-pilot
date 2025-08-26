
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { beepQuestionsData } from '@/data/beepQuestions';

export interface BeepQuestion {
  id: string;
  subcategory_id: string;
  question_text: string;
  weight: number;
  order_index: number;
}

export interface BeepSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
  questions: BeepQuestion[];
}

export interface BeepCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
  subcategories: BeepSubcategory[];
}

export interface BeepMaturityLevel {
  id: string;
  level: 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo';
  name: string;
  description: string | null;
  min_score: number;
  max_score: number;
  order_index: number;
}

export const useBeepCategories = () => {
  return useQuery({
    queryKey: ['beep-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beep_categories')
        .select(`
          *,
          subcategories:beep_subcategories(
            *,
            questions:beep_questions(*)
          )
        `)
        .order('order_index');
      
      if (error) throw error;
      
      // If no data in database, return static data
      if (!data || data.length === 0) {
        return beepQuestionsData.categories.map(cat => ({
          id: cat.slug,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          order_index: cat.order_index,
          subcategories: cat.subcategories.map(sub => ({
            id: sub.slug,
            category_id: cat.slug,
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            order_index: sub.order_index,
            questions: sub.questions.map((q, index) => ({
              id: `${sub.slug}-${index}`,
              subcategory_id: sub.slug,
              question_text: q.question_text,
              weight: q.weight,
              order_index: q.order_index
            }))
          }))
        })) as BeepCategory[];
      }
      
      return data as BeepCategory[];
    }
  });
};

export const useBeepMaturityLevels = () => {
  return useQuery({
    queryKey: ['beep-maturity-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beep_maturity_levels')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      
      // If no data in database, return static data
      if (!data || data.length === 0) {
        return beepQuestionsData.maturityLevels.map(level => ({
          id: level.level,
          level: level.level as 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo',
          name: level.name,
          description: level.description,
          min_score: level.min_score,
          max_score: level.max_score,
          order_index: level.order_index
        })) as BeepMaturityLevel[];
      }
      
      return data as BeepMaturityLevel[];
    }
  });
};
