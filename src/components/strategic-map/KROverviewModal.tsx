import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyResult } from '@/types/strategic-map';
import { KeyResultMetrics } from './KeyResultMetrics';
import { KeyResultChart } from './KeyResultChart';
import { KRFCAUnifiedModal } from './KRFCAUnifiedModal';
import { KRStatusReportModal } from './KRStatusReportModal';
import { KRInitiativesModal } from './KRInitiativesModal';
import { KREditModal } from './KREditModal';
import { KRUpdateValuesModal } from './KRUpdateValuesModal';
import { getDirectionLabel, calculateKRStatus } from '@/lib/krHelpers';
import { formatValueWithUnit, cn } from '@/lib/utils';

import { Edit, Calendar, User, Target, TrendingUp, Trash2, FileEdit, ListChecks, FileBarChart, Rocket, CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useKRInitiatives } from '@/hooks/useKRInitiatives';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
import { supabase } from '@/integrations/supabase/client';

interface KROverviewModalProps {
  keyResult: KeyResult | null;
  pillar?: { name: string; color: string } | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  objectives: Array<{ id: string; title: string }>;
  showDeleteButton?: boolean;
  initialPeriod?: 'ytd' | 'monthly' | 'yearly' | 'quarterly';
  initialMonth?: number;
  initialYear?: number;
  initialQuarter?: 1 | 2 | 3 | 4;
  initialQuarterYear?: number;
  onPeriodChange?: (period: 'ytd' | 'monthly' | 'yearly' | 'quarterly') => void;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  onQuarterChange?: (quarter: 1 | 2 | 3 | 4) => void;
  onQuarterYearChange?: (year: number) => void;
}

export const KROverviewModal = ({ 
  keyResult, 
  pillar, 
  open, 
  onClose, 
  onDelete, 
  onSave, 
  objectives, 
  showDeleteButton = true,
  initialPeriod = 'ytd',
  initialMonth,
  initialYear,
  initialQuarter,
  initialQuarterYear,
  onPeriodChange,
  onMonthChange,
  onYearChange,
  onQuarterChange,
  onQuarterYearChange
}: KROverviewModalProps) => {
  const [showFCAModal, setShowFCAModal] = useState(false);
  const [showStatusReportModal, setShowStatusReportModal] = useState(false);
  const [showInitiativesModal, setShowInitiativesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateValuesModal, setShowUpdateValuesModal] = useState(false);
  const [currentKeyResult, setCurrentKeyResult] = useState<KeyResult | null>(keyResult);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedYearlyYear, setSelectedYearlyYear] = useState<number>(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<'ytd' | 'monthly' | 'yearly' | 'quarterly'>(initialPeriod);
  
  // Quarter state
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(initialQuarter || currentQuarter);
  const [selectedQuarterYear, setSelectedQuarterYear] = useState<number>(initialQuarterYear || new Date().getFullYear());
  
  // Inicializar com o último mês fechado (mês anterior) ou com os valores fornecidos
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || previousMonth.getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(initialYear || previousMonth.getFullYear());
  
  const { initiatives } = useKRInitiatives(keyResult?.id);
  const { quarterOptions, monthOptions, yearOptions } = usePlanPeriodOptions();

  // Update local state when keyResult prop changes
  useEffect(() => {
    setCurrentKeyResult(keyResult);
  }, [keyResult]);

  // Update selected period when initialPeriod changes
  useEffect(() => {
    setSelectedPeriod(initialPeriod);
  }, [initialPeriod]);

  // Update selected month when initialMonth changes
  useEffect(() => {
    if (initialMonth) {
      setSelectedMonth(initialMonth);
    }
  }, [initialMonth]);

  // Update selected year when initialYear changes
  useEffect(() => {
    if (initialYear) {
      setSelectedMonthYear(initialYear);
    }
  }, [initialYear]);

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
        console.log('[KROverviewModal] Dados recarregados do banco:', {
          kr_id: data.id,
          title: data.title,
          start_month: data.start_month,
          end_month: data.end_month,
          has_validity: !!(data.start_month && data.end_month)
        });
        setCurrentKeyResult(data as KeyResult);
      }
    } catch (error) {
      console.error('Erro ao recarregar resultado-chave:', error);
    }
  };
  
  if (!currentKeyResult) return null;

  // Use ONLY pre-calculated values from database
  const aggregationType = currentKeyResult.aggregation_type || 'sum';
  
  // All values come from database pre-calculated fields
  const yearlyTarget = currentKeyResult.ytd_target || 0;
  const yearlyActual = currentKeyResult.ytd_actual || 0;
  const achievementPercentage = currentKeyResult.ytd_percentage || 0;

  // Current month values from database
  const currentMonthTarget = currentKeyResult.current_month_target || 0;
  const currentMonthActual = currentKeyResult.current_month_actual || 0;

  // Yearly values from database
  const fullYearTarget = currentKeyResult.yearly_target || 0;
  const fullYearActual = currentKeyResult.yearly_actual || 0;

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
      <DialogContent className="sm:max-w-[1000px] w-[calc(100vw-2rem)] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Visão do Resultado-Chave</DialogTitle>
          <DialogDescription>Detalhes e evolução do resultado-chave</DialogDescription>
        </DialogHeader>
        <div className="max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header colorido com pilar */}
          {pillar && (
          <div 
            style={{ backgroundColor: pillar.color }}
            className="p-3 rounded-t-lg flex-shrink-0"
          >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <h2 className="text-white font-semibold text-xl leading-tight">
                    {currentKeyResult.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                      {pillar.name}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                      {getAggregationTypeText(aggregationType)}
                    </Badge>
                    {currentKeyResult.unit && (
                      <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                        <Target className="w-3 h-3 mr-1" />
                        {currentKeyResult.unit}
                      </Badge>
                    )}
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                      Mensal
                    </Badge>
                    {currentKeyResult.responsible && (
                      <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                        <User className="w-3 h-3 mr-1" />
                        {currentKeyResult.responsible}
                      </Badge>
                    )}
                    {currentKeyResult.due_date && (
                      <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(currentKeyResult.due_date).toLocaleDateString('pt-BR')}
                      </Badge>
                    )}
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                      Atualizado: {new Date(currentKeyResult.updated_at).toLocaleDateString('pt-BR')}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                      {getDirectionLabel(currentKeyResult.target_direction || 'maximize')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pr-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEditModal(true)}
                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {showDeleteButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDelete}
                      className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="px-6 flex-shrink-0">
            {currentKeyResult.description && (
              <p className="text-sm text-muted-foreground mb-2 mt-3">
                {currentKeyResult.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-4 flex-shrink-0 px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpdateValuesModal(true)}
                className="text-cyan-600 border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300 hover:text-cyan-600"
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Atualizar Valores
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFCAModal(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-600"
              >
                <ListChecks className="h-4 w-4 mr-2" />
                FCA & Ações
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusReportModal(true)}
                className="text-green-600 border-green-200 hover:bg-green-100 hover:border-green-300 hover:text-green-600"
              >
                <FileBarChart className="h-4 w-4 mr-2" />
                Status Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInitiativesModal(true)}
                className="text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300 hover:text-purple-600"
              >
                <Rocket className="h-4 w-4" />
                Iniciativas
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                <Button
                  variant={selectedPeriod === 'ytd' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectedPeriod('ytd');
                    onPeriodChange?.('ytd');
                  }}
                  className="gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  YTD
                </Button>
                <Button
                  variant={selectedPeriod === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectedPeriod('yearly');
                    onPeriodChange?.('yearly');
                  }}
                  className="gap-2"
                >
                  <Target className="w-4 h-4" />
                  Ano
                </Button>
                <Button
                  variant={selectedPeriod === 'quarterly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectedPeriod('quarterly');
                    onPeriodChange?.('quarterly');
                  }}
                  className="gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Quarter
                </Button>
                <Button
                  variant={selectedPeriod === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectedPeriod('monthly');
                    onPeriodChange?.('monthly');
                  }}
                  className="gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  Mês
                </Button>
              </div>
              
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4 pr-2 py-4">

            {/* Key Metrics */}
            <KeyResultMetrics
              keyResult={currentKeyResult}
              selectedPeriod={selectedPeriod}
              selectedMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
              selectedYear={selectedPeriod === 'monthly' ? selectedMonthYear : 
                            selectedPeriod === 'yearly' ? selectedYearlyYear : undefined}
              selectedQuarter={selectedPeriod === 'quarterly' ? selectedQuarter : undefined}
              selectedQuarterYear={selectedPeriod === 'quarterly' ? selectedQuarterYear : undefined}
              onMonthChange={(month: number) => {
                setSelectedMonth(month);
                onMonthChange?.(month);
              }}
              onYearChange={(year: number) => {
                setSelectedMonthYear(year);
                onYearChange?.(year);
              }}
              onQuarterChange={(quarter: 1 | 2 | 3 | 4) => {
                setSelectedQuarter(quarter);
                onQuarterChange?.(quarter);
              }}
              onQuarterYearChange={(year: number) => {
                setSelectedQuarterYear(year);
                onQuarterYearChange?.(year);
              }}
              onYearlyYearChange={(year: number) => {
                setSelectedYearlyYear(year);
                setSelectedYear(year); // Manter sincronizado com o gráfico
                onYearChange?.(year);
              }}
              monthOptions={monthOptions}
              quarterOptions={quarterOptions}
              yearOptions={yearOptions}
              selectedYearlyYear={selectedYearlyYear}
            />

            {/* Evolution Chart */}
          <KeyResultChart
              keyResult={currentKeyResult}
              monthlyTargets={currentKeyResult.monthly_targets as Record<string, number> || {}}
              monthlyActual={currentKeyResult.monthly_actual as Record<string, number> || {}}
              unit={currentKeyResult.unit || ''}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              targetDirection={(currentKeyResult.target_direction as 'maximize' | 'minimize') || 'maximize'}
              aggregationType={currentKeyResult.aggregation_type || 'sum'}
              yearOptions={yearOptions}
              selectedPeriod={selectedPeriod}
            />
          </div>
        </div>
        </div>
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