
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BeepAssessmentForm } from './BeepAssessmentForm';
import { BeepScoreDisplay } from './BeepScoreDisplay';
import { BeepAssessmentHistory } from './BeepAssessmentHistory';
import { BeepStartScreen } from './BeepStartScreen';
import { useBeepAssessmentCrud, useBeepAnswerCrud, useBeepAutoSave } from '@/hooks/useBeepData';

interface BeepAssessment {
  id: string;
  user_id: string;
  company_id: string | null;
  status: 'draft' | 'completed';
  final_score: number | null;
  maturity_level: 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo' | null;
  completed_at: string | null;
  created_at: string;
  total_questions?: number;
  answered_questions?: number;
  progress_percentage?: number;
  last_answer_at?: string | null;
  current_category_id?: string | null;
  current_question_index?: number;
}

export const BeepAssessmentManager = () => {
  const [currentAssessment, setCurrentAssessment] = useState<BeepAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [savingQuestions, setSavingQuestions] = useState<Set<string>>(new Set());
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const savedTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  const queryClient = useQueryClient();
  const { createAssessment, updateAssessment } = useBeepAssessmentCrud();
  const { saveAnswer, getAssessmentAnswers } = useBeepAnswerCrud();
  const { autoSaveAnswer } = useBeepAutoSave(currentAssessment?.id);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      Object.values(savedTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      timeoutsRef.current = {};
      savedTimeoutsRef.current = {};
    };
  }, []);

  // Get user's assessments
  const { data: assessments = [] } = useQuery({
    queryKey: ['beep-assessments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('beep_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BeepAssessment[];
    }
  });

  // Get answers for current assessment
  const { data: currentAnswers = [] } = useQuery({
    queryKey: ['beep-answers', currentAssessment?.id],
    queryFn: async () => {
      if (!currentAssessment?.id) return [];
      return await getAssessmentAnswers(currentAssessment.id);
    },
    enabled: !!currentAssessment?.id
  });

  // Create new assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: createAssessment,
    onSuccess: (data) => {
      setCurrentAssessment(data as BeepAssessment);
      setAnswers({});
      toast.success('Nova avaliação iniciada!');
      queryClient.invalidateQueries({ queryKey: ['beep-assessments'] });
    },
    onError: (error) => {
      console.error('Error creating assessment:', error);
      toast.error('Erro ao iniciar avaliação');
    }
  });

  // Save answer mutation
  const saveAnswerMutation = useMutation({
    mutationFn: ({ questionId, value }: { questionId: string; value: number }) => {
      if (!currentAssessment?.id) throw new Error('No current assessment');
      console.log('Mutation saving answer for question:', questionId, 'with value:', value);
      return saveAnswer(currentAssessment.id, questionId, value);
    },
    onMutate: ({ questionId }) => {
      setSavingQuestions(prev => new Set([...prev, questionId]));
    },
    onSuccess: (data, variables) => {
      console.log('Answer saved successfully via mutation:', data);
      setSavingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.questionId);
        return newSet;
      });
      
      // Add to saved questions (keep permanently visible)
      setSavedQuestions(prev => new Set([...prev, variables.questionId]));
      
      queryClient.invalidateQueries({ queryKey: ['beep-answers', currentAssessment?.id] });
    },
    onError: (error, variables) => {
      console.error('Error saving answer via mutation:', error, 'for question:', variables.questionId);
      setSavingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.questionId);
        return newSet;
      });
      
      // Rollback local state on error
      setAnswers(prevAnswers => {
        const newAnswers = { ...prevAnswers };
        delete newAnswers[variables.questionId];
        return newAnswers;
      });
      
      if (error.message.includes('duplicate key')) {
        toast.error('Resposta já existe, tentando novamente...');
        // Retry after a short delay
        setTimeout(() => {
          saveAnswerMutation.mutate(variables);
        }, 500);
      } else {
        toast.error('Erro ao salvar resposta: ' + error.message);
      }
    },
    retry: false, // Disable automatic retry to handle duplicates manually
  });

  // Complete assessment mutation
  const completeAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!currentAssessment?.id) throw new Error('No current assessment');

      const score = calculateFinalScore();
      const maturityLevel = getMaturityLevel(score);

      return await updateAssessment(currentAssessment.id, {
        status: 'completed',
        final_score: score,
        maturity_level: maturityLevel,
        completed_at: new Date().toISOString()
      });
    },
    onSuccess: (data) => {
      setCurrentAssessment(data as BeepAssessment);
      toast.success('Avaliação concluída!');
      queryClient.invalidateQueries({ queryKey: ['beep-assessments'] });
    },
    onError: (error) => {
      console.error('Error completing assessment:', error);
      toast.error('Erro ao concluir avaliação');
    }
  });

  useEffect(() => {
    if (currentAssessment?.id && currentAnswers.length > 0) {
      const initialAnswers: Record<string, number> = {};
      currentAnswers.forEach(answer => {
        initialAnswers[answer.question_id] = answer.answer_value;
      });
      setAnswers(initialAnswers);
      console.log('Loaded answers from database:', initialAnswers);
    }
  }, [currentAssessment?.id, currentAnswers]);

  const handleAnswer = (questionId: string, value: number) => {
    console.log('Handling answer for question:', questionId, 'with value:', value);
    
    // Clear any existing timeout for this question
    if (timeoutsRef.current[questionId]) {
      clearTimeout(timeoutsRef.current[questionId]);
    }
    
    // Update local state immediately for better UX
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: value,
    }));
    
    // Use auto-save hook with debounce
    timeoutsRef.current[questionId] = setTimeout(async () => {
      if (currentAssessment?.id && !savingQuestions.has(questionId)) {
        try {
          setSavingQuestions(prev => new Set([...prev, questionId]));
          await autoSaveAnswer(questionId, value);
          setSavingQuestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(questionId);
            return newSet;
          });
          setSavedQuestions(prev => new Set([...prev, questionId]));
          queryClient.invalidateQueries({ queryKey: ['beep-answers', currentAssessment?.id] });
        } catch (error) {
          setSavingQuestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(questionId);
            return newSet;
          });
          console.error('Auto-save failed:', error);
          toast.error('Erro ao salvar resposta');
        }
      }
      delete timeoutsRef.current[questionId];
    }, 500);
  };

  const calculateFinalScore = (): number => {
    const totalQuestions = Object.keys(answers).length;
    const totalScore = Object.values(answers).reduce((sum, value) => sum + value, 0);
    const totalMaxScore = totalQuestions * 5;
    
    return totalMaxScore > 0 ? (totalScore / totalMaxScore) * 5 : 0;
  };

  const getMaturityLevel = (score: number): 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo' => {
    if (score >= 4.3) return 'evoluindo';
    if (score >= 3.5) return 'validando_mercado';
    if (score >= 2.7) return 'iniciando_negocio';
    if (score >= 1.9) return 'validando_problemas_solucoes';
    return 'idealizando';
  };

  const handleStartAssessment = async (companyId: string, forceNew: boolean = false) => {
    // Check if there's already a draft for this company
    const existingDraft = assessments.find(
      assessment => assessment.company_id === companyId && assessment.status === 'draft'
    );
    
    if (existingDraft && !forceNew) {
      // Continue existing draft instead of creating new one
      setCurrentAssessment(existingDraft);
      toast.info('Continuando avaliação em rascunho');
      return;
    }
    
    if (existingDraft && forceNew) {
      // Delete the existing draft before creating new one
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Delete the existing draft assessment and its answers
        const { error: deleteAnswersError } = await supabase
          .from('beep_answers')
          .delete()
          .eq('assessment_id', existingDraft.id);

        if (deleteAnswersError) {
          console.error('Error deleting answers:', deleteAnswersError);
        }

        const { error: deleteAssessmentError } = await supabase
          .from('beep_assessments')
          .delete()
          .eq('id', existingDraft.id);

        if (deleteAssessmentError) {
          console.error('Error deleting assessment:', deleteAssessmentError);
          toast.error('Erro ao substituir rascunho anterior');
          return;
        }

        toast.info('Rascunho anterior substituído');
        queryClient.invalidateQueries({ queryKey: ['beep-assessments'] });
      } catch (error) {
        console.error('Error deleting existing draft:', error);
        toast.error('Erro ao substituir rascunho anterior');
        return;
      }
    }
    
    createAssessmentMutation.mutate(companyId);
  };

  const handleContinueAssessment = (assessmentId: string) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    if (assessment) {
      setCurrentAssessment(assessment);
      toast.info('Continuando avaliação');
    }
  };

  const handleCompleteAssessment = () => {
    completeAssessmentMutation.mutate();
  };

  const handleSaveProgress = () => {
    toast.success('Progresso salvo automaticamente!');
  };

  // Show completed assessment result
  if (currentAssessment?.status === 'completed') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Avaliação BEEP Concluída</h1>
          <button 
            onClick={() => setCurrentAssessment(null)} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Nova Avaliação
          </button>
        </div>
        
        <BeepScoreDisplay 
          score={currentAssessment.final_score || 0}
          maturityLevel={currentAssessment.maturity_level || 'idealizando'}
          completedAt={currentAssessment.completed_at || ''}
        />
        
        <BeepAssessmentHistory assessments={assessments} />
      </div>
    );
  }

  // Show assessment form if there's a current draft
  if (currentAssessment && currentAssessment.status === 'draft') {
    return (
        <BeepAssessmentForm
          assessment={currentAssessment}
          answers={answers}
          onAnswer={handleAnswer}
          onComplete={handleCompleteAssessment}
          onCancel={() => setCurrentAssessment(null)}
          onSaveProgress={handleSaveProgress}
          isCompleting={completeAssessmentMutation.isPending}
          isSavingProgress={false}
          savingQuestions={savingQuestions}
          savedQuestions={savedQuestions}
        />
    );
  }

  // Show start screen
  return (
    <BeepStartScreen
      onStartAssessment={handleStartAssessment}
      onContinueAssessment={handleContinueAssessment}
      isCreating={createAssessmentMutation.isPending}
      assessments={assessments}
    />
  );
};
