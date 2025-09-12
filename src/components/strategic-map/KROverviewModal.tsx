import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { KeyResult } from '@/types/strategic-map';
import { KeyResultMetrics } from './KeyResultMetrics';
import { KeyResultChart } from './KeyResultChart';
import { Edit, Calendar, User, Target, TrendingUp, MoreVertical, Trash2, FileEdit } from 'lucide-react';

interface KROverviewModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onUpdateValues: () => void;
  onDelete: () => void;
}

export const KROverviewModal = ({ keyResult, open, onClose, onEdit, onUpdateValues, onDelete }: KROverviewModalProps) => {
  if (!keyResult) return null;

  // Calculate values using the same logic as EditKeyResultModal
  const monthlyTargets = keyResult.monthly_targets as Record<string, number> || {};
  const monthlyActual = keyResult.monthly_actual as Record<string, number> || {};
  const aggregationType = keyResult.aggregation_type || 'sum';
  
  const calculateYearlyTarget = (targets: Record<string, number>) => {
    const values = Object.values(targets).filter(value => value > 0);
    if (values.length === 0) return 0;

    switch (aggregationType) {
      case 'sum':
        return values.reduce((sum, value) => sum + value, 0);
      case 'average':
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return values.reduce((sum, value) => sum + value, 0);
    }
  };

  const calculateYearlyActual = (actuals: Record<string, number>) => {
    const values = Object.values(actuals).filter(value => value > 0);
    if (values.length === 0) return 0;

    switch (aggregationType) {
      case 'sum':
        return values.reduce((sum, value) => sum + value, 0);
      case 'average':
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return values.reduce((sum, value) => sum + value, 0);
    }
  };

  const yearlyTarget = calculateYearlyTarget(monthlyTargets);
  const yearlyActual = calculateYearlyActual(monthlyActual);
  const achievementPercentage = yearlyTarget > 0 ? (yearlyActual / yearlyTarget) * 100 : 0;

  const getAggregationTypeText = (type: string) => {
    switch (type) {
      case 'sum': return 'Soma';
      case 'average': return 'Média';
      case 'max': return 'Maior valor';
      case 'min': return 'Menor valor';
      default: return 'Soma';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{keyResult.title}</DialogTitle>
              <DialogDescription>
                Visão geral completa do resultado-chave e evolução dos indicadores
              </DialogDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border shadow-md z-50">
                <DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editar Informações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onUpdateValues} className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4" />
                  Atualizar Valores
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete} 
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir KR
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>
        
        {/* Header Info */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline">
            {getAggregationTypeText(aggregationType)}
          </Badge>
          {keyResult.unit && (
            <Badge variant="secondary">
              <Target className="w-3 h-3 mr-1" />
              {keyResult.unit}
            </Badge>
          )}
          <Badge variant="secondary">
            Mensal
          </Badge>
          {keyResult.responsible && (
            <Badge variant="secondary">
              <User className="w-3 h-3 mr-1" />
              {keyResult.responsible}
            </Badge>
          )}
          {keyResult.due_date && (
            <Badge variant="secondary">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(keyResult.due_date).toLocaleDateString('pt-BR')}
            </Badge>
          )}
          <Badge variant="secondary">
            Atualizado: {new Date(keyResult.updated_at).toLocaleDateString('pt-BR')}
          </Badge>
          <Badge variant={achievementPercentage >= 100 ? "default" : achievementPercentage >= 80 ? "secondary" : "destructive"}>
            {achievementPercentage >= 100 ? "Meta alcançada" : achievementPercentage >= 80 ? "No caminho" : "Atenção"}
          </Badge>
        </div>

        {/* Description */}
        {keyResult.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{keyResult.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <KeyResultMetrics
          yearlyTarget={yearlyTarget}
          yearlyActual={yearlyActual}
          unit={keyResult.unit || ''}
          achievementPercentage={achievementPercentage}
          currentMonth={new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        />

        {/* Evolution Chart */}
        <KeyResultChart
          monthlyTargets={monthlyTargets}
          monthlyActual={monthlyActual}
          unit={keyResult.unit || ''}
          selectedYear={new Date().getFullYear()}
        />

      </DialogContent>
    </Dialog>
  );
};