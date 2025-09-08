
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BeepAssessmentHistory } from './BeepAssessmentHistory';
import { useStartupProfile } from '@/hooks/useStartupProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Target, AlertTriangle } from 'lucide-react';

interface BeepAssessment {
  id: string;
  user_id: string;
  company_id: string | null;
  status: 'draft' | 'completed';
  final_score: number | null;
  maturity_level: string | null;
  completed_at: string | null;
  created_at: string;
  total_questions?: number;
  answered_questions?: number;
  progress_percentage?: number;
  last_answer_at?: string | null;
  current_category_id?: string | null;
  current_question_index?: number;
}

interface BeepStartScreenProps {
  onStartAssessment: (companyId: string, forceNew?: boolean) => void;
  onContinueAssessment: (assessmentId: string) => void;
  isCreating: boolean;
  assessments: BeepAssessment[];
}

export const BeepStartScreen: React.FC<BeepStartScreenProps> = ({
  onStartAssessment,
  onContinueAssessment,
  isCreating,
  assessments
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [conflictingDraft, setConflictingDraft] = useState<BeepAssessment | null>(null);

  // Get startup companies available to the user
  const { data: startupCompanies = [] } = useQuery({
    queryKey: ['user-startup-companies'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_company_relations')
        .select(`
          company_id,
          companies!inner (
            id,
            name,
            company_type,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('companies.company_type', 'startup')
        .eq('companies.status', 'active');

      if (error) throw error;
      return data?.map(relation => relation.companies).filter(Boolean) || [];
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCompanyId) {
      // Check if there's already a draft for this company
      const existingDraft = assessments.find(
        assessment => assessment.company_id === selectedCompanyId && assessment.status === 'draft'
      );
      
      if (existingDraft) {
        // Show confirmation dialog
        setConflictingDraft(existingDraft);
        setShowConfirmDialog(true);
      } else {
        // No conflict, proceed with new assessment
        onStartAssessment(selectedCompanyId);
      }
    }
  };

  const handleContinueExistingDraft = () => {
    if (conflictingDraft) {
      onContinueAssessment(conflictingDraft.id);
      setShowConfirmDialog(false);
      setConflictingDraft(null);
    }
  };

  const handleForceNewAssessment = () => {
    if (selectedCompanyId) {
      onStartAssessment(selectedCompanyId, true);
      setShowConfirmDialog(false);
      setConflictingDraft(null);
    }
  };

  const handleCancelDialog = () => {
    setShowConfirmDialog(false);
    setConflictingDraft(null);
  };

  const draftAssessments = assessments.filter(assessment => assessment.status === 'draft');
  const completedAssessments = assessments.filter(assessment => assessment.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Avaliação BEEP</h1>
        <p className="text-muted-foreground">
          Avalie o nível de maturidade da sua startup
        </p>
      </div>

      {/* Main Actions */}
      <div className="max-w-4xl grid gap-6 md:grid-cols-2">
        {/* New Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Avaliação</CardTitle>
            <p className="text-sm text-muted-foreground">
              Inicie uma nova avaliação completa para sua startup
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma startup" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {startupCompanies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="submit"
                disabled={!selectedCompanyId || isCreating || startupCompanies.length === 0}
                className="w-full"
              >
                {isCreating ? 'Iniciando...' : 'Iniciar Nova Avaliação'}
              </Button>
            </form>
            {startupCompanies.length === 0 && (
              <p className="text-sm text-muted-foreground mt-4">
                Nenhuma startup encontrada. Entre em contato com o administrador.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Draft Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Rascunhos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Continue avaliações em andamento
            </p>
          </CardHeader>
          <CardContent>
            {draftAssessments.length > 0 ? (
              <div className="space-y-4">
                {draftAssessments.slice(0, 3).map((assessment) => {
                  const company = startupCompanies.find((c: any) => c.id === assessment.company_id);
                  const progress = assessment.progress_percentage || 0;
                  const answeredQuestions = assessment.answered_questions || 0;
                  const totalQuestions = assessment.total_questions || 100;
                  const lastAnswerDate = assessment.last_answer_at 
                    ? new Date(assessment.last_answer_at).toLocaleDateString('pt-BR')
                    : new Date(assessment.created_at).toLocaleDateString('pt-BR');
                  
                  return (
                    <div key={assessment.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{company?.name || 'Startup'}</h4>
                          <p className="text-sm text-gray-600">
                            {answeredQuestions > 0 
                              ? `Última resposta em ${lastAnswerDate}`
                              : `Iniciada em ${new Date(assessment.created_at).toLocaleDateString('pt-BR')}`
                            }
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onContinueAssessment(assessment.id)}
                          className="ml-3"
                        >
                          Continuar
                        </Button>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {answeredQuestions}/{totalQuestions} perguntas respondidas
                          </span>
                          <span className="font-medium text-gray-900">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {progress < 25 && "Avaliação iniciada"}
                          {progress >= 25 && progress < 50 && "Progresso inicial"}
                          {progress >= 50 && progress < 75 && "Meio caminho andado"}
                          {progress >= 75 && progress < 100 && "Quase finalizando"}
                          {progress >= 100 && "Pronto para finalizar"}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {draftAssessments.length > 3 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      +{draftAssessments.length - 3} outros rascunhos disponíveis
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-muted-foreground">Nenhum rascunho encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Inicie uma nova avaliação para começar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Assessments History */}
      {completedAssessments.length > 0 && (
        <div className="max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">Histórico de Avaliações</h2>
          <BeepAssessmentHistory assessments={completedAssessments} />
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Rascunho Existente Encontrado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Já existe uma avaliação em rascunho para esta startup. Você pode:
              </p>
              {conflictingDraft && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">
                    <strong>Progresso atual:</strong> {Math.round(conflictingDraft.progress_percentage || 0)}% concluído
                  </p>
                  <p className="text-sm">
                    <strong>Última atividade:</strong> {
                      conflictingDraft.last_answer_at 
                        ? new Date(conflictingDraft.last_answer_at).toLocaleString('pt-BR')
                        : new Date(conflictingDraft.created_at).toLocaleString('pt-BR')
                    }
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelDialog}>
              Cancelar
            </AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={handleContinueExistingDraft}
              className="w-full sm:w-auto"
            >
              Continuar Rascunho
            </Button>
            <AlertDialogAction 
              onClick={handleForceNewAssessment}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              Começar Nova Avaliação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
