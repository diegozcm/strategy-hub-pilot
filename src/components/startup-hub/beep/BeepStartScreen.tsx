
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BeepAssessmentHistory } from './BeepAssessmentHistory';
import { useStartupProfile } from '@/hooks/useStartupProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

interface BeepStartScreenProps {
  onStartAssessment: (companyId: string) => void;
  isCreating: boolean;
  assessments: BeepAssessment[];
}

export const BeepStartScreen: React.FC<BeepStartScreenProps> = ({
  onStartAssessment,
  isCreating,
  assessments
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

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
      onStartAssessment(selectedCompanyId);
    }
  };

  const draftAssessments = assessments.filter(assessment => assessment.status === 'draft');
  const completedAssessments = assessments.filter(assessment => assessment.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Avaliação BEEP</h1>
        <p className="text-muted-foreground">
          Avalie o nível de maturidade da sua startup
        </p>
      </div>

      {/* Main Actions */}
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
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
              <div className="space-y-3">
                {draftAssessments.slice(0, 3).map((assessment) => {
                  const company = startupCompanies.find((c: any) => c.id === assessment.company_id);
                  return (
                    <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{company?.name || 'Startup'}</p>
                        <p className="text-sm text-muted-foreground">
                          Iniciada em {new Date(assessment.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onStartAssessment(assessment.company_id || '')}
                      >
                        Continuar
                      </Button>
                    </div>
                  );
                })}
                {draftAssessments.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{draftAssessments.length - 3} outros rascunhos
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
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
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Histórico de Avaliações</h2>
          <BeepAssessmentHistory assessments={completedAssessments} />
        </div>
      )}
    </div>
  );
};
