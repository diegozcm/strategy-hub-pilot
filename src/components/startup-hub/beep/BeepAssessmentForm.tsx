
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BeepQuestionCard } from './BeepQuestionCard';
import { useBeepCategories } from '@/hooks/useBeepData';

interface BeepAssessment {
  id: string;
  user_id: string;
  company_id: string | null;
  status: 'draft' | 'completed';
  final_score: number | null;
  maturity_level: string | null;
  completed_at: string | null;
  created_at: string;
}

interface BeepAssessmentFormProps {
  assessment: BeepAssessment;
  answers: Record<string, number>;
  onAnswer: (questionId: string, value: number) => void;
  onComplete: () => void;
  onCancel: () => void;
  isCompleting: boolean;
  savingQuestions?: Set<string>;
  savedQuestions?: Set<string>;
}

export const BeepAssessmentForm: React.FC<BeepAssessmentFormProps> = ({
  assessment,
  answers,
  onAnswer,
  onComplete,
  onCancel,
  isCompleting,
  savingQuestions = new Set(),
  savedQuestions = new Set(),
}) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const { data: categories = [], isLoading: categoriesLoading } = useBeepCategories();

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

  const isAssessmentComplete = () => {
    const { answered, total } = calculateProgress();
    return answered === total && total > 0;
  };

  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    }
  };

  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  if (categoriesLoading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p>Nenhuma categoria encontrada. Verifique os dados do BEEP.</p>
      </div>
    );
  }

  const currentCategory = categories[currentCategoryIndex];
  const progress = calculateProgress();
  const isComplete = isAssessmentComplete();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Avaliação BEEP</h1>
              <p className="text-muted-foreground">Categoria: {currentCategory?.name}</p>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {progress.answered}/{progress.total} perguntas respondidas
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progresso da Avaliação</span>
          <span>{progress.total > 0 ? Math.round((progress.answered / progress.total) * 100) : 0}%</span>
        </div>
        <Progress value={progress.total > 0 ? (progress.answered / progress.total) * 100 : 0} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={handlePreviousCategory}
          disabled={currentCategoryIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        <div className="text-sm text-muted-foreground">
          Categoria {currentCategoryIndex + 1} de {categories.length}
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleNextCategory}
          disabled={currentCategoryIndex === categories.length - 1}
        >
          Próxima
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Category Tabs */}
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
                    <p className="text-sm text-muted-foreground">{subcategory.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {subcategory.questions.map((question) => (
                    <BeepQuestionCard
                      key={question.id}
                      question={question}
                      value={answers[question.id]}
                      onChange={(value) => onAnswer(question.id, value)}
                      isLoading={savingQuestions.has(question.id)}
                      isSaved={savedQuestions.has(question.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Complete Button */}
      {isComplete && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={onComplete}
            disabled={isCompleting}
            size="lg"
            className="px-8"
          >
            {isCompleting ? 'Finalizando...' : 'Finalizar Avaliação'}
          </Button>
        </div>
      )}
    </div>
  );
};
