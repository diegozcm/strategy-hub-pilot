import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ScrollArea } from '@/components/ui/scroll-area';
import { KeyResult } from '@/types/strategic-map';
import { KeyResultMetrics } from './KeyResultMetrics';
import { KeyResultChart } from './KeyResultChart';
import { KRFCAUnifiedModal } from './KRFCAUnifiedModal';
import { KRStatusReportModal } from './KRStatusReportModal';
import { KRInitiativesModal } from './KRInitiativesModal';
import { KREditModal } from './KREditModal';
import { KRUpdateValuesModal } from './KRUpdateValuesModal';

import { Edit, Calendar, User, Target, TrendingUp, Trash2, FileEdit, ListChecks, FileBarChart, Rocket } from 'lucide-react';
import { useState } from 'react';
import { useKRInitiatives } from '@/hooks/useKRInitiatives';

interface KROverviewModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  objectives: Array<{ id: string; title: string }>;
}

export const KROverviewModal = ({ keyResult, open, onClose, onDelete, onSave, objectives }: KROverviewModalProps) => {
  const [showFCAModal, setShowFCAModal] = useState(false);
  const [showStatusReportModal, setShowStatusReportModal] = useState(false);
  const [showInitiativesModal, setShowInitiativesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateValuesModal, setShowUpdateValuesModal] = useState(false);
  
  const { initiatives } = useKRInitiatives(keyResult?.id);
  
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
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{keyResult.title}</DialogTitle>
              <DialogDescription>
                {keyResult.description || "Visão geral completa do resultado-chave e evolução dos indicadores"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditModal(true)}
                className="h-8 w-8 text-orange-600 hover:bg-orange-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpdateValuesModal(true)}
            className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
          >
            <FileEdit className="h-4 w-4 mr-2" />
            Atualizar Valores
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFCAModal(true)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <ListChecks className="h-4 w-4 mr-2" />
            FCA & Ações
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusReportModal(true)}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <FileBarChart className="h-4 w-4 mr-2" />
            Status Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInitiativesModal(true)}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Iniciativas
          </Button>
        </div>
        
        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
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
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Modal FCA Unificado */}
      <KRFCAUnifiedModal
        keyResult={keyResult}
        open={showFCAModal}
        onClose={() => setShowFCAModal(false)}
      />

      {/* Modal Status Report */}
      <KRStatusReportModal
        keyResult={keyResult}
        open={showStatusReportModal}
        onClose={() => setShowStatusReportModal(false)}
      />

      {/* Modal Initiatives */}
      <KRInitiativesModal
        keyResult={keyResult}
        open={showInitiativesModal}
        onClose={() => setShowInitiativesModal(false)}
      />

      {/* Modal Edit */}
      {keyResult && (
        <KREditModal
          keyResult={keyResult}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={async (updates) => {
            await onSave();
            setShowEditModal(false);
          }}
          objectives={objectives}
        />
      )}

      {/* Modal Update Values */}
      {keyResult && (
        <KRUpdateValuesModal
          keyResult={keyResult}
          open={showUpdateValuesModal}
          onClose={() => setShowUpdateValuesModal(false)}
          onSave={async (updates) => {
            await onSave();
            setShowUpdateValuesModal(false);
          }}
        />
      )}
    </Dialog>
  );
};