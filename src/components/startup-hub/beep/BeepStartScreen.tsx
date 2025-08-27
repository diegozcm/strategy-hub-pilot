
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

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Avaliação BEEP</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          O BEEP (Business Entrepreneur and Evolution Phases) é uma ferramenta de avaliação 
          que ajuda a identificar o nível de maturidade da sua startup através de questões 
          organizadas em categorias estratégicas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">100+</div>
              <p className="text-sm text-muted-foreground">Perguntas estratégicas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">5</div>
              <p className="text-sm text-muted-foreground">Níveis de maturidade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <p className="text-sm text-muted-foreground">Categorias principais</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Assessment Form */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Iniciar Nova Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="startup-select">Selecionar Startup</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma startup para avaliar" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {startupCompanies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {startupCompanies.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nenhuma startup encontrada. Entre em contato com o administrador para associar uma startup ao seu perfil.
                </p>
              )}
            </div>
            <Button 
              type="submit"
              disabled={!selectedCompanyId || isCreating || startupCompanies.length === 0}
              className="w-full"
            >
              {isCreating ? 'Iniciando...' : 'Iniciar Avaliação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Assessment History */}
      {assessments.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <BeepAssessmentHistory assessments={assessments} />
        </div>
      )}
    </div>
  );
};
