import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BeepQuestionCard } from './BeepQuestionCard';
import { BeepScoreDisplay } from './BeepScoreDisplay';
import { BeepAssessmentHistory } from './BeepAssessmentHistory';
import { useBeepCategories, useBeepMaturityLevels } from '@/hooks/useBeepData';

interface BeepAnswer {
  id?: string;
  assessment_id: string;
  question_id: string;
  answer_value: number;
}

interface BeepAssessment {
  id: string;
  user_id: string;
  startup_name: string | null;
  status: 'draft' | 'completed';
  final_score: number | null;
  maturity_level: 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo' | null;
  completed_at: string | null;
  created_at: string;
}

export const BeepAssessmentPage = () => {
  const [currentAssessment, setCurrentAssessment] = useState<BeepAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startupName, setStartupName] = useState('');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading: categoriesLoading } = useBeepCategories();
  const { data: maturityLevels = [] } = useBeepMaturityLevels();

  // Get user's assessments
  const { data: assessments = [] } = useQuery({
    queryKey: ['beep-assessments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('beep_assessments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(assessment => ({
        ...assessment,
        status: assessment.status as 'draft' | 'completed',
        maturity_level: assessment.maturity_level as 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo' | null
      })) as BeepAssessment[];
    }
  });

  // Get answers for current assessment
  const { data: currentAnswers = [] } = useQuery({
    queryKey: ['beep-answers', currentAssessment?.id],
    queryFn: async () => {
      if (!currentAssessment?.id) return [];
      
      const { data, error } = await supabase
        .from('beep_answers')
        .select('*')
        .eq('assessment_id', currentAssessment.id);
      
      if (error) throw error;
      return data as BeepAnswer[];
    },
    enabled: !!currentAssessment?.id
  });

  // Create new assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('beep_assessments')
        .insert({
          user_id: user.id,
          startup_name: name,
          status: 'draft'
        })
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        status: data.status as 'draft' | 'completed',
        maturity_level: data.maturity_level as 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo' | null
      } as BeepAssessment;
    },
    onSuccess: (data) => {
      setCurrentAssessment(data);
      setAnswers({});
      toast.success('Nova avaliação iniciada!');
      queryClient.invalidateQueries({ queryKey: ['beep-assessments'] });
    },
    onError: () => {
      toast.error('Erro ao iniciar avaliação');
    }
  });

  // Save answer
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, value }: { questionId: string; value: number }) => {
      if (!currentAssessment?.id) throw new Error('No current assessment');

      const { data, error } = await supabase
        .from('beep_answers')
        .upsert({
          assessment_id: currentAssessment.id,
          question_id: questionId,
          answer_value: value
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beep-answers', currentAssessment?.id] });
    }
  });

  // Complete assessment
  const completeAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!currentAssessment?.id) throw new Error('No current assessment');

      const score = calculateFinalScore();
      const maturityLevel = getMaturityLevel(score);

      const { data, error } = await supabase
        .from('beep_assessments')
        .update({
          status: 'completed',
          final_score: score,
          maturity_level: maturityLevel,
          completed_at: new Date().toISOString()
        })
        .eq('id', currentAssessment.id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        status: data.status as 'draft' | 'completed',
        maturity_level: data.maturity_level as 'idealizando' | 'validando_problemas_solucoes' | 'iniciando_negocio' | 'validando_mercado' | 'evoluindo' | null
      } as BeepAssessment;
    },
    onSuccess: (data) => {
      setCurrentAssessment(data);
      toast.success('Avaliação concluída!');
      queryClient.invalidateQueries({ queryKey: ['beep-assessments'] });
    }
  });

  useEffect(() => {
    if (currentAssessment?.id) {
      const initialAnswers: Record<string, number> = {};
      currentAnswers.forEach(answer => {
        initialAnswers[answer.question_id] = answer.answer_value;
      });
      setAnswers(initialAnswers);
    }
  }, [currentAssessment?.id, currentAnswers]);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: value,
    }));
    saveAnswerMutation.mutate({ questionId, value });
  };

  const calculateProgress = () => {
    let answered = 0;
    let total = 0;

    categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.questions.forEach(question => {
          total++;
          if (answers[question.id] !== undefined) {
            answered++;
          }
        });
      });
    });

    return { answered, total };
  };

  const calculateFinalScore = (): number => {
    const totalQuestions = categories.reduce((total, category) => 
      total + category.subcategories.reduce((subTotal, subcategory) => 
        subTotal + subcategory.questions.length, 0), 0);
    
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

  const handleStartAssessment = () => {
    createAssessmentMutation.mutate(startupName);
  };

  const isAssessmentComplete = () => {
    const { answered, total } = calculateProgress();
    return answered === total;
  };

  if (categoriesLoading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  if (currentAssessment?.status === 'completed') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Avaliação BEEP Concluída</h1>
          <Button onClick={() => setCurrentAssessment(null)} variant="outline">
            Nova Avaliação
          </Button>
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

  if (!currentAssessment) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Avaliação BEEP</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            O BEEP (Business Entrepreneur and Evolution Phases) é uma ferramenta de avaliação 
            que ajuda a identificar o nível de maturidade da sua startup através de 100 questões 
            organizadas em categorias estratégicas.
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Iniciar Nova Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="startup-name">Nome da Startup</Label>
              <Input
                id="startup-name"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="Digite o nome da sua startup"
              />
            </div>
            <Button 
              onClick={() => createAssessmentMutation.mutate(startupName)}
              disabled={!startupName.trim() || createAssessmentMutation.isPending}
              className="w-full"
            >
              {createAssessmentMutation.isPending ? 'Iniciando...' : 'Iniciar Avaliação'}
            </Button>
          </CardContent>
        </Card>

        {assessments.length > 0 && (
          <BeepAssessmentHistory assessments={assessments} />
        )}
      </div>
    );
  }

  const currentCategory = categories[currentCategoryIndex];
  const progress = calculateProgress();
  const isComplete = isAssessmentComplete();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Avaliação BEEP - {currentAssessment.startup_name}</h1>
          <p className="text-gray-600">Categoria: {currentCategory?.name}</p>
        </div>
        <div className="text-sm text-gray-500">
          {progress.answered}/{progress.total} perguntas respondidas
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progresso da Avaliação</span>
          <span>{Math.round((progress.answered / progress.total) * 100)}%</span>
        </div>
        <Progress value={(progress.answered / progress.total) * 100} />
      </div>

      <Tabs value={currentCategoryIndex.toString()} onValueChange={(value) => setCurrentCategoryIndex(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-3">
          {categories.map((category, index) => (
            <TabsTrigger key={category.id} value={index.toString()}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category, categoryIndex) => (
          <TabsContent key={category.id} value={categoryIndex.toString()} className="space-y-6">
            {category.subcategories.map((subcategory) => (
              <Card key={subcategory.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{subcategory.name}</CardTitle>
                  {subcategory.description && (
                    <p className="text-sm text-gray-600">{subcategory.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {subcategory.questions.map((question) => (
                    <BeepQuestionCard
                      key={question.id}
                      question={question}
                      value={answers[question.id]}
                      onChange={(value) => handleAnswer(question.id, value)}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {isComplete && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={() => completeAssessmentMutation.mutate()}
            disabled={completeAssessmentMutation.isPending}
            size="lg"
          >
            {completeAssessmentMutation.isPending ? 'Finalizando...' : 'Finalizar Avaliação'}
          </Button>
        </div>
      )}
    </div>
  );
};
