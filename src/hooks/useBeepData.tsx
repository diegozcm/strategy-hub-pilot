
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
      // Always use static data for now to ensure questions are always available
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
  });
};

export const useBeepMaturityLevels = () => {
  return useQuery({
    queryKey: ['beep-maturity-levels'],
    queryFn: async () => {
      // Always use static data for now
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
  });
};

// Hook para CRUD de assessments
export const useBeepAssessmentCrud = () => {
  // Create assessment
  const createAssessment = async (startupName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('beep_assessments')
      .insert({
        user_id: user.id,
        startup_name: startupName,
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  // Update assessment
  const updateAssessment = async (id: string, updates: Partial<{
    startup_name: string;
    status: 'draft' | 'completed';
    final_score: number;
    maturity_level: string;
    completed_at: string;
  }>) => {
    const { data, error } = await supabase
      .from('beep_assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  // Delete assessment
  const deleteAssessment = async (id: string) => {
    const { error } = await supabase
      .from('beep_assessments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  };

  // Get user assessments
  const getUserAssessments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('beep_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  return {
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getUserAssessments
  };
};

// Hook para CRUD de answers
export const useBeepAnswerCrud = () => {
  // Save/Update answer
  const saveAnswer = async (assessmentId: string, questionId: string, value: number) => {
    const { data, error } = await supabase
      .from('beep_answers')
      .upsert({
        assessment_id: assessmentId,
        question_id: questionId,
        answer_value: value
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Get answers for assessment
  const getAssessmentAnswers = async (assessmentId: string) => {
    const { data, error } = await supabase
      .from('beep_answers')
      .select('*')
      .eq('assessment_id', assessmentId);
    
    if (error) throw error;
    return data;
  };

  // Delete answer
  const deleteAnswer = async (assessmentId: string, questionId: string) => {
    const { error } = await supabase
      .from('beep_answers')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('question_id', questionId);
    
    if (error) throw error;
  };

  return {
    saveAnswer,
    getAssessmentAnswers,
    deleteAnswer
  };
};
