
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Eye } from 'lucide-react';
import { BeepAssessmentDetailModal } from './BeepAssessmentDetailModal';

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

interface BeepAssessmentHistoryProps {
  assessments: BeepAssessment[];
}

export const BeepAssessmentHistory: React.FC<BeepAssessmentHistoryProps> = ({
  assessments
}) => {
  const [selectedAssessment, setSelectedAssessment] = useState<BeepAssessment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const completedAssessments = assessments.filter(a => a.status === 'completed');

  const maturityLevels = {
    'idealizando': { name: 'Idealizando', color: 'bg-gray-500' },
    'validando_problemas_solucoes': { name: 'Validando Problemas e Soluções', color: 'bg-yellow-500' },
    'iniciando_negocio': { name: 'Iniciando o Negócio', color: 'bg-blue-500' },
    'validando_mercado': { name: 'Validando o Mercado', color: 'bg-orange-500' },
    'evoluindo': { name: 'Evoluindo', color: 'bg-green-500' }
  };

  const handleViewDetails = (assessment: BeepAssessment) => {
    setSelectedAssessment(assessment);
    setIsDetailModalOpen(true);
  };

  if (completedAssessments.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedAssessments.map((assessment, index) => {
              const level = maturityLevels[assessment.maturity_level as keyof typeof maturityLevels];
              const previousAssessment = completedAssessments[index + 1];
              const improvement = previousAssessment 
                ? ((assessment.final_score || 0) - (previousAssessment.final_score || 0))
                : 0;

              return (
                <div key={assessment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={`${level?.color || 'bg-gray-500'} text-white`}>
                        {level?.name || 'N/A'}
                      </Badge>
                      <span className="font-semibold text-lg">
                        {assessment.final_score?.toFixed(1) || 'N/A'}
                      </span>
                      {improvement !== 0 && (
                        <div className={`flex items-center gap-1 text-sm ${
                          improvement > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="h-4 w-4" />
                          {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {assessment.completed_at 
                          ? new Date(assessment.completed_at).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(assessment)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedAssessment && (
        <BeepAssessmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAssessment(null);
          }}
          assessmentId={selectedAssessment.id}
          finalScore={selectedAssessment.final_score || 0}
          maturityLevel={selectedAssessment.maturity_level || 'idealizando'}
          completedAt={selectedAssessment.completed_at || ''}
        />
      )}
    </>
  );
};
