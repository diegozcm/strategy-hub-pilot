
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BeepQuestionCard } from "./BeepQuestionCard";
import { BeepScoreDisplay } from "./BeepScoreDisplay";
import { BeepAssessmentHistory } from "./BeepAssessmentHistory";

interface BeepCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  order_index: number;
}

interface BeepSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  order_index: number;
}

interface BeepQuestion {
  id: string;
  subcategory_id: string;
  question_text: string;
  weight: number;
  order_index: number;
}

interface BeepAssessment {
  id: string;
  user_id: string;
  startup_name: string | null;
  status: 'draft' | 'completed';
  final_score: number | null;
  maturity_level: string | null;
  completed_at: string | null;
  created_at: string;
}

interface BeepAnswer {
  question_id: string;
  answer_value: number;
}

export const BeepAssessmentPage = () => {
  const [currentAssessment, setCurrentAssessment] = useState<BeepAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentTab, setCurrentTab] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['beep-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beep_categories')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as BeepCategory[];
    }
  });

  // Fetch subcategories
  const { data: subcategories } = useQuery({
    queryKey: ['beep-subcategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beep_subcategories')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as BeepSubcategory[];
    }
  });

  // Fetch questions
  const { data: questions } = useQuery({
    queryKey: ['beep-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beep_questions')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as BeepQuestion[];
    }
  });

  // Fetch current user's draft assessment
  const { data: assessments } = useQuery({
    queryKey: ['beep-assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beep_assessments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BeepAssessment[];
    }
  });

  // Load existing answers if there's a draft
  useEffect(() => {
    if (assessments && assessments.length > 0) {
      const draft = assessments.find(a => a.status === 'draft') || assessments[0];
      setCurrentAssessment(draft);
      
      if (draft.status === 'draft') {
        loadAnswers(draft.id);
      }
    }
  }, [assessments]);

  // Set initial tab
  useEffect(() => {
    if (categories && categories.length > 0 && !currentTab) {
      setCurrentTab(categories[0].slug);
    }
  }, [categories, currentTab]);

  const loadAnswers = async (assessmentId: string) => {
    const { data, error } = await supabase
      .from('beep_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId);
    
    if (error) {
      console.error('Error loading answers:', error);
      return;
    }

    const answersMap: Record<string, number> = {};
    data?.forEach(answer => {
      answersMap[answer.question_id] = answer.answer_value;
    });
    setAnswers(answersMap);
  };

  // Create or update assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('beep_assessments')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id!,
          status: 'draft'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentAssessment(data);
      queryClient.invalidateQueries({ queryKey: ['beep-assessments'] });
    }
  });

  // Save answer
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, value }: { questionId: string; value: number }) => {
      if (!currentAssessment) {
        throw new Error('No assessment found');
      }

      const { error } = await supabase
        .from('beep_answers')
        .upsert([{
          assessment_id: currentAssessment.id,
          question_id: questionId,
          answer_value: value
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Auto-save feedback
    },
    onError: (error) => {
      toast.error('Erro ao salvar resposta');
      console.error('Error saving answer:', error);
    }
  });

  // Complete assessment
  const completeAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!currentAssessment || !questions) return;

      const finalScore = calculateFinalScore();
      const maturityLevel = getMaturityLevel(finalScore);

      const { error } = await supabase
        .from('beep_assessments')
        .update({
          status: 'completed',
          final_score: finalScore,
          maturity_level: maturityLevel,
          completed_at: new Date().toISOString()
        })
        .eq('id', currentAssessment.id);

      if (error) throw error;
      return { finalScore, maturityLevel };
    },
    onSuccess: () => {
      toast.success('Avaliação concluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['beep-assessments'] });
    }
  });

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    saveAnswerMutation.mutate({ questionId, value });
  };

  const calculateFinalScore = (): number => {
    if (!questions || !subcategories || !categories) return 0;

    let totalScore = 0;
    let totalMaxScore = 0;

    categories.forEach(category => {
      const categorySubcategories = subcategories.filter(sub => sub.category_id === category.id);
      let categoryScore = 0;
      let categoryMaxScore = 0;

      categorySubcategories.forEach(subcategory => {
        const subcategoryQuestions = questions.filter(q => q.subcategory_id === subcategory.id);
        let subcategoryScore = 0;
        let subcategoryMaxScore = 0;

        subcategoryQuestions.forEach(question => {
          const answer = answers[question.id] || 0;
          subcategoryScore += answer * question.weight;
          subcategoryMaxScore += 5 * question.weight;
        });

        categoryScore += subcategoryScore;
        categoryMaxScore += subcategoryMaxScore;
      });

      totalScore += categoryScore;
      totalMaxScore += categoryMaxScore;
    });

    return totalMaxScore > 0 ? (totalScore / totalMaxScore) * 5 : 0;
  };

  const getMaturityLevel = (score: number): string => {
    if (score >= 4.3) return 'evoluindo';
    if (score >= 3.5) return 'validando_mercado';
    if (score >= 2.7) return 'iniciando_negocio';
    if (score >= 1.9) return 'validando_problemas_solucoes';
    return 'idealizando';
  };

  const getProgressPercentage = (): number => {
    if (!questions) return 0;
    const answeredCount = Object.keys(answers).length;
    return (answeredCount / questions.length) * 100;
  };

  const canComplete = (): boolean => {
    return questions ? Object.keys(answers).length === questions.length : false;
  };

  const startNewAssessment = () => {
    createAssessmentMutation.mutate();
    setAnswers({});
  };

  if (!categories || !subcategories || !questions) {
    return <div className="p-6">Carregando avaliação BEEP...</div>;
  }

  // Show results if assessment is completed
  if (currentAssessment?.status === 'completed') {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Avaliação BEEP - Resultados</h1>
          <Button onClick={startNewAssessment}>
            Nova Avaliação
          </Button>
        </div>
        
        <BeepScoreDisplay 
          score={currentAssessment.final_score || 0}
          maturityLevel={currentAssessment.maturity_level || ''}
          completedAt={currentAssessment.completed_at || ''}
        />
        
        <BeepAssessmentHistory assessments={assessments || []} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Avaliação BEEP</h1>
          <p className="text-muted-foreground mt-2">
            Business Entrepreneur and Evolution Phases - Avalie a maturidade da sua startup
          </p>
        </div>
        
        {!currentAssessment && (
          <Button onClick={startNewAssessment}>
            Iniciar Avaliação
          </Button>
        )}
      </div>

      {currentAssessment && (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Progresso da Avaliação</CardTitle>
                <Badge variant="outline">
                  {Object.keys(answers).length} / {questions.length} respondidas
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={getProgressPercentage()} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {getProgressPercentage().toFixed(1)}% concluído
              </p>
            </CardContent>
          </Card>

          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid grid-cols-3 w-full">
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.slug}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(category => (
              <TabsContent key={category.id} value={category.slug} className="space-y-6">
                {subcategories
                  .filter(sub => sub.category_id === category.id)
                  .map(subcategory => (
                    <Card key={subcategory.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {subcategory.name}
                          <Badge variant="secondary">
                            {questions.filter(q => q.subcategory_id === subcategory.id).length} perguntas
                          </Badge>
                        </CardTitle>
                        <p className="text-muted-foreground">{subcategory.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {questions
                          .filter(q => q.subcategory_id === subcategory.id)
                          .map(question => (
                            <BeepQuestionCard
                              key={question.id}
                              question={question}
                              value={answers[question.id] || 0}
                              onChange={(value) => handleAnswerChange(question.id, value)}
                            />
                          ))}
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>

          {canComplete() && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Avaliação completa!</span>
                    <span className="text-muted-foreground">
                      Todas as perguntas foram respondidas.
                    </span>
                  </div>
                  <Button 
                    onClick={() => completeAssessmentMutation.mutate()}
                    disabled={completeAssessmentMutation.isPending}
                  >
                    {completeAssessmentMutation.isPending ? 'Finalizando...' : 'Finalizar Avaliação'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
