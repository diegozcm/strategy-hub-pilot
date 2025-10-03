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
import { useState, useEffect } from 'react';
import { useKRInitiatives } from '@/hooks/useKRInitiatives';
import { supabase } from '@/integrations/supabase/client';

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
  const [currentKeyResult, setCurrentKeyResult] = useState<KeyResult | null>(keyResult);
  
  const { initiatives } = useKRInitiatives(keyResult?.id);

  // Update local state when keyResult prop changes
  useEffect(() => {
    setCurrentKeyResult(keyResult);
  }, [keyResult]);

  // Function to refresh key result data from database
  const refreshKeyResult = async () => {
    if (!keyResult?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('key_results')
        .select('*')
        .eq('id', keyResult.id)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentKeyResult(data as KeyResult);
      }
    } catch (error) {
      console.error('Erro ao recarregar resultado-chave:', error);
    }
  };
  
  if (!currentKeyResult) return null;

  // Calculate values using the same logic as EditKeyResultModal
  const monthlyTargets = currentKeyResult.monthly_targets as Record<string, number> || {};
  const monthlyActual = currentKeyResult.monthly_actual as Record<string, number> || {};
  const aggregationType = currentKeyResult.aggregation_type || 'sum';
  
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
              <DialogTitle className="text-2xl">{currentKeyResult.title}</DialogTitle>
              <DialogDescription>
                {currentKeyResult.description || "Visão geral completa do resultado-chave e evolução dos indicadores"}
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
            className="text-cyan-600 border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300"
          >
            <FileEdit className="h-4 w-4 mr-2" />
            Atualizar Valores
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFCAModal(true)}
            className="text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
          >
            <ListChecks className="h-4 w-4 mr-2" />
            FCA & Ações
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusReportModal(true)}
            className="text-green-600 border-green-200 hover:bg-green-100 hover:border-green-300"
          >
            <FileBarChart className="h-4 w-4 mr-2" />
            Status Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInitiativesModal(true)}
            className="text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300"
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
              {currentKeyResult.unit && (
                <Badge variant="secondary">
                  <Target className="w-3 h-3 mr-1" />
                  {currentKeyResult.unit}
                </Badge>
              )}
              <Badge variant="secondary">
                Mensal
              </Badge>
              {currentKeyResult.responsible && (
                <Badge variant="secondary">
                  <User className="w-3 h-3 mr-1" />
                  {currentKeyResult.responsible}
                </Badge>
              )}
              {currentKeyResult.due_date && (
                <Badge variant="secondary">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(currentKeyResult.due_date).toLocaleDateString('pt-BR')}
                </Badge>
              )}
              <Badge variant="secondary">
                Atualizado: {new Date(currentKeyResult.updated_at).toLocaleDateString('pt-BR')}
              </Badge>
              <Badge variant={achievementPercentage >= 100 ? "default" : achievementPercentage >= 80 ? "secondary" : "destructive"}>
                {achievementPercentage >= 100 ? "Meta alcançada" : achievementPercentage >= 80 ? "No caminho" : "Atenção"}
              </Badge>
            </div>

            {/* Key Metrics */}
            <KeyResultMetrics
              yearlyTarget={yearlyTarget}
              yearlyActual={yearlyActual}
              unit={currentKeyResult.unit || ''}
              achievementPercentage={achievementPercentage}
              currentMonth={new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            />

            {/* Evolution Chart */}
            <KeyResultChart
              monthlyTargets={monthlyTargets}
              monthlyActual={monthlyActual}
              unit={currentKeyResult.unit || ''}
              selectedYear={new Date().getFullYear()}
            />
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Modal FCA Unificado */}
      <KRFCAUnifiedModal
        keyResult={currentKeyResult}
        open={showFCAModal}
        onClose={() => setShowFCAModal(false)}
      />

      {/* Modal Status Report */}
      <KRStatusReportModal
        keyResult={currentKeyResult}
        open={showStatusReportModal}
        onClose={() => setShowStatusReportModal(false)}
      />

      {/* Modal Initiatives */}
      <KRInitiativesModal
        keyResult={currentKeyResult}
        open={showInitiativesModal}
        onClose={() => setShowInitiativesModal(false)}
      />

      {/* Modal Edit */}
      {currentKeyResult && (
        <KREditModal
          keyResult={currentKeyResult}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={async (updates) => {
            try {
              // Persistir os dados no banco antes de fechar o modal
              const { error } = await supabase
                .from('key_results')
                .update(updates)
                .eq('id', currentKeyResult.id);

              if (error) throw error;

              // Refresh local key result data
              await refreshKeyResult();
              
              // Recarregar dados da página pai
              await onSave();
              setShowEditModal(false);
            } catch (error) {
              console.error('Erro ao salvar resultado-chave:', error);
              throw error; // Propagar o erro para o KREditModal mostrar o toast
            }
          }}
          objectives={objectives}
        />
      )}

      {/* Modal Update Values */}
      {currentKeyResult && (
        <KRUpdateValuesModal
          keyResult={currentKeyResult}
          open={showUpdateValuesModal}
          onClose={() => setShowUpdateValuesModal(false)}
          onSave={async (updates) => {
            try {
              // Persistir os valores atualizados no banco
              const { error } = await supabase
                .from('key_results')
                .update(updates)
                .eq('id', currentKeyResult.id);

              if (error) throw error;

              // Refresh local key result data
              await refreshKeyResult();
              
              // Recarregar dados da página pai
              await onSave();
              setShowUpdateValuesModal(false);
            } catch (error) {
              console.error('Erro ao atualizar valores:', error);
              throw error; // Propagar o erro para o KRUpdateValuesModal mostrar o toast
            }
          }}
        />
      )}
    </Dialog>
  );
};