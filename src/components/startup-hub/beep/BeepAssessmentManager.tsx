
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BeepAssessmentForm } from './BeepAssessmentForm';
import { BeepScoreDisplay } from './BeepScoreDisplay';
import { BeepAssessmentHistory } from './BeepAssessmentHistory';
import { BeepStartScreen } from './BeepStartScreen';
import { useBeepAssessmentCrud, useBeepAnswerCrud } from '@/hooks/useBeepData';

interface BeepAssessment {
  id: string;
  user_id: string;
  company_id: string | null;
  status: 'draft' | 'completed';
  final_score: number | null;
  maturity_level: 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo' | null;
  completed_at: string | null;
  created_at: string;
}

export const BeepAssessmentManager = () => {
  const [currentAssessment, setCurrentAssessment] = useState<BeepAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [savingQuestions, setSavingQuestions] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  const queryClient = useQueryClient();
  const { createAssessment, updateAssessment } = useBeepAssessmentCrud();
  const { saveAnswer, getAssessmentAnswers } = useBeepAnswerCrud();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      timeoutsRef.current = {};
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
      queryClient.invalidateQueries({ queryKey: ['beep-answers', currentAssessment?.id] });
      toast.success('Resposta salva!');
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
    
    // Debounce server save to prevent multiple simultaneous requests
    timeoutsRef.current[questionId] = setTimeout(() => {
      if (currentAssessment?.id && !savingQuestions.has(questionId)) {
        saveAnswerMutation.mutate({ questionId, value });
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

  const handleStartAssessment = (companyId: string) => {
    createAssessmentMutation.mutate(companyId);
  };

  const handleCompleteAssessment = () => {
    completeAssessmentMutation.mutate();
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
          isCompleting={completeAssessmentMutation.isPending}
          savingQuestions={savingQuestions}
        />
    );
  }

  // Show start screen
  return (
    <BeepStartScreen
      onStartAssessment={handleStartAssessment}
      isCreating={createAssessmentMutation.isPending}
      assessments={assessments}
    />
  );
};
