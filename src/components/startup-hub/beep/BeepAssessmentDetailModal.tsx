
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useBeepCategories } from '@/hooks/useBeepData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BeepAssessmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  finalScore: number;
  maturityLevel: string;
  completedAt: string;
}

export const BeepAssessmentDetailModal: React.FC<BeepAssessmentDetailModalProps> = ({
  isOpen,
  onClose,
  assessmentId,
  finalScore,
  maturityLevel,
  completedAt
}) => {
  const { data: categories = [] } = useBeepCategories();
  
  // Get answers for this assessment
  const { data: answers = [] } = useQuery({
    queryKey: ['beep-answers-detail', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beep_answers')
        .select('*')
        .eq('assessment_id', assessmentId);
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!assessmentId
  });

  const maturityLevels = {
    'idealizando': { name: 'Idealizando', color: 'bg-gray-500' },
    'validando_problemas_solucoes': { name: 'Validando Problemas e Soluções', color: 'bg-yellow-500' },
    'iniciando_negocio': { name: 'Iniciando o Negócio', color: 'bg-blue-500' },
    'validando_mercado': { name: 'Validando o Mercado', color: 'bg-orange-500' },
    'evoluindo': { name: 'Evoluindo', color: 'bg-green-500' }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-500';
    if (score >= 3.5) return 'bg-lime-500';
    if (score >= 2.5) return 'bg-yellow-500';
    if (score >= 1.5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreColorText = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-lime-600';
    if (score >= 2.5) return 'text-yellow-600';
    if (score >= 1.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const calculateCategoryScore = (categoryId: string) => {
    const categoryQuestions = categories
      .find(cat => cat.id === categoryId)
      ?.subcategories.flatMap(sub => sub.questions) || [];
    
    const categoryAnswers = answers.filter(answer => 
      categoryQuestions.some(q => q.id === answer.question_id)
    );

    if (categoryAnswers.length === 0) return 0;

    const totalScore = categoryAnswers.reduce((sum, answer) => sum + answer.answer_value, 0);
    return totalScore / categoryAnswers.length;
  };

  const calculateSubcategoryScore = (subcategoryId: string) => {
    const subcategory = categories
      .flatMap(cat => cat.subcategories)
      .find(sub => sub.id === subcategoryId);
    
    if (!subcategory) return 0;

    const subcategoryAnswers = answers.filter(answer =>
      subcategory.questions.some(q => q.id === answer.question_id)
    );

    if (subcategoryAnswers.length === 0) return 0;

    const totalScore = subcategoryAnswers.reduce((sum, answer) => sum + answer.answer_value, 0);
    return totalScore / subcategoryAnswers.length;
  };

  const currentLevel = maturityLevels[maturityLevel as keyof typeof maturityLevels] || maturityLevels['idealizando'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhamento da Avaliação BEEP</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resultado Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold">{finalScore.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground">de 5.0 pontos</p>
                </div>
                <div className="text-right">
                  <Badge className={`${currentLevel.color} text-white mb-2`}>
                    {currentLevel.name}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {new Date(completedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <Progress value={(finalScore / 5) * 100} className="h-3" />
            </CardContent>
          </Card>

          {/* Category Scores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pontuação por Categoria</h3>
            {categories.map(category => {
              const categoryScore = calculateCategoryScore(category.id);
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${getScoreColorText(categoryScore)}`}>
                          {categoryScore.toFixed(1)}
                        </span>
                        <div className={`w-4 h-4 rounded-full ${getScoreColor(categoryScore)}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.subcategories.map(subcategory => {
                        const subcategoryScore = calculateSubcategoryScore(subcategory.id);
                        return (
                          <div key={subcategory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{subcategory.name}</p>
                              {subcategory.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subcategory.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${getScoreColorText(subcategoryScore)}`}>
                                {subcategoryScore.toFixed(1)}
                              </span>
                              <div className={`w-3 h-3 rounded-full ${getScoreColor(subcategoryScore)}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Scale Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legenda da Escala</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 justify-center">
                {[
                  { value: 1, label: 'Discordo Totalmente', color: 'bg-red-500' },
                  { value: 2, label: 'Discordo Parcialmente', color: 'bg-orange-500' },
                  { value: 3, label: 'Neutro', color: 'bg-yellow-500' },
                  { value: 4, label: 'Concordo Parcialmente', color: 'bg-lime-500' },
                  { value: 5, label: 'Concordo Totalmente', color: 'bg-green-500' }
                ].map(item => (
                  <div key={item.value} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {item.value}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
