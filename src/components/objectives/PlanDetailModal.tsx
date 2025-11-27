import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
  period_start: string;
  period_end: string;
  vision?: string;
  mission?: string;
  created_at: string;
}

interface PlanDetailModalProps {
  plan: StrategicPlan | null;
  isOpen: boolean;
  onClose: () => void;
  objectivesCount: number;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  plan,
  isOpen,
  onClose,
  objectivesCount
}) => {
  if (!plan) return null;

  const getStatusConfig = (status: string) => {
    if (status === 'active') {
      return {
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
        label: 'Ativo'
      };
    }
    // Todos os outros status são "Inativo"
    return {
      className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
      label: 'Inativo'
    };
  };

  const statusConfig = getStatusConfig(plan.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes do Plano Estratégico
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cabeçalho do Plano */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <Badge className={`${statusConfig.className} border`}>
                {statusConfig.label}
              </Badge>
            </div>
            
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  <strong>Período:</strong> {format(new Date(plan.period_start), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(plan.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>
                  <strong>Objetivos:</strong> {objectivesCount} objetivo{objectivesCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Visão */}
          {plan.vision && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Visão</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {plan.vision}
              </p>
            </div>
          )}

          {/* Missão */}
          {plan.mission && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Missão</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {plan.mission}
              </p>
            </div>
          )}

          {/* Informações de criação */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Criado em {format(new Date(plan.created_at), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};