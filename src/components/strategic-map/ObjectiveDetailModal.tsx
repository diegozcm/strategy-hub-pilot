import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StrategicObjective } from '@/types/strategic-map';

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
  if (!objective) return null;

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

          {/* Informações de criação */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Criado em {format(new Date(objective.created_at), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};