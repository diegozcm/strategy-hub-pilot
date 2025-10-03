import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Target, Eye, User, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StrategicObjective } from '@/types/strategic-map';
import { useStrategicMap } from '@/hooks/useStrategicMap';
import { KROverviewModal } from './KROverviewModal';
import { useNavigate } from 'react-router-dom';

interface ObjectiveDetailModalProps {
  objective: StrategicObjective | null;
  isOpen: boolean;
  onClose: () => void;
  keyResultsCount?: number;
}

export const ObjectiveDetailModal: React.FC<ObjectiveDetailModalProps> = ({
  objective,
  isOpen,
  onClose,
  keyResultsCount = 0
}) => {
  const { keyResults } = useStrategicMap();
  const [selectedKeyResult, setSelectedKeyResult] = useState(null);
  const [isKRModalOpen, setIsKRModalOpen] = useState(false);
  const navigate = useNavigate();
  if (!objective) return null;

  // Filter key results for this objective
  const objectiveKeyResults = keyResults.filter(kr => kr.objective_id === objective.id);

  const handleKRClick = (keyResult: any) => {
    setSelectedKeyResult(keyResult);
    setIsKRModalOpen(true);
  };

  const handleKRModalClose = () => {
    setIsKRModalOpen(false);
    setSelectedKeyResult(null);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not_started':
        return {
          className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
          label: 'Não Iniciado'
        };
      case 'in_progress':
        return {
          className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
          label: 'Em Progresso'
        };
      case 'completed':
        return {
          className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
          label: 'Concluído'
        };
      case 'suspended':
        return {
          className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
          label: 'Suspenso'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(objective.status);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Objetivo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Cabeçalho do Objetivo */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold">{objective.title}</h3>
                <Badge className={`${statusConfig.className} border`}>
                  {statusConfig.label}
                </Badge>
              </div>
              
              {/* Informações básicas */}
              <div className="grid grid-cols-1 gap-4 text-sm">
                {objective.responsible && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      <strong>Responsável:</strong> {objective.responsible}
                    </span>
                  </div>
                )}
                {objective.deadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      <strong>Prazo:</strong> {format(new Date(objective.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>
                    <strong>Resultados-Chave:</strong> {keyResultsCount} resultado{keyResultsCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            {objective.description && (
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Descrição</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {objective.description}
                </p>
              </div>
            )}

            {/* Resultados-Chave */}
            {objectiveKeyResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Resultados-Chave ({objectiveKeyResults.length})
                </h4>
                <div className="space-y-2">
                  {objectiveKeyResults.map((kr) => {
                    const progress = kr.aggregation_type === 'average' 
                      ? Math.round(((kr.current_value || 0) / (kr.target_value || 1)) * 100)
                      : Math.round(((kr.yearly_actual || 0) / (kr.yearly_target || 1)) * 100);
                    
                    return (
                      <Button
                        key={kr.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 hover:bg-accent/50"
                        onClick={() => handleKRClick(kr)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1 text-left">
                            <p className="font-medium text-sm">{kr.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {kr.aggregation_type === 'average' 
                                ? `${kr.current_value || 0} de ${kr.target_value || 0} ${kr.unit || ''}`
                                : `${kr.yearly_actual || 0} de ${kr.yearly_target || 0} ${kr.unit || ''}`
                              }
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {progress}%
                            </Badge>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Informações de criação */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Criado em {format(new Date(objective.created_at), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedKeyResult && (
        <KROverviewModal
          keyResult={selectedKeyResult}
          open={isKRModalOpen}
          onClose={handleKRModalClose}
          onDelete={() => {}}
          onSave={async () => {}}
          objectives={objective ? [{ id: objective.id, title: objective.title }] : []}
        />
      )}
    </>
  );
};