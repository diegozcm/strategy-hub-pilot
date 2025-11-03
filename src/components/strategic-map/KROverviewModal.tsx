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

import { Edit, Calendar, User, Target, TrendingUp, Trash2, FileEdit, ListChecks, FileBarChart, Rocket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useKRInitiatives } from '@/hooks/useKRInitiatives';
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
  initialPeriod?: 'ytd' | 'monthly' | 'yearly';
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
  initialPeriod = 'ytd'
}: KROverviewModalProps) => {
  const [showFCAModal, setShowFCAModal] = useState(false);
  const [showStatusReportModal, setShowStatusReportModal] = useState(false);
  const [showInitiativesModal, setShowInitiativesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateValuesModal, setShowUpdateValuesModal] = useState(false);
  const [currentKeyResult, setCurrentKeyResult] = useState<KeyResult | null>(keyResult);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<'ytd' | 'monthly' | 'yearly'>(initialPeriod);
  
  // Inicializar com o último mês fechado (mês anterior)
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const [selectedMonth, setSelectedMonth] = useState<number>(previousMonth.getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(previousMonth.getFullYear());
  
  const { initiatives } = useKRInitiatives(keyResult?.id);

  // Generate month options for the last 24 months (formato resumido)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      // Formato resumido: "Nov 2024"
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
        .replace(/^\w/, (c) => c.toUpperCase())
        .replace('.', ''); // Remove ponto se houver
      
      options.push({
        value: `${year}-${month.toString().padStart(2, '0')}`,
        label: `${monthName} ${year}`
      });
    }
    
    return options;
  };

  // Update local state when keyResult prop changes
  useEffect(() => {
    setCurrentKeyResult(keyResult);
  }, [keyResult]);

  // Update selected period when initialPeriod changes
  useEffect(() => {
    setSelectedPeriod(initialPeriod);
  }, [initialPeriod]);

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
  
  // Calculate YTD considering only months with both target and actual data
  const calculateYTD = (targets: Record<string, number>, actuals: Record<string, number>) => {
    // Get months that have both valid target and actual data
    const monthKeys = Object.keys(targets);
    const validMonths = monthKeys.filter(monthKey => {
      const target = targets[monthKey];
      const actual = actuals[monthKey];
      const hasTarget = typeof target === 'number' && Number.isFinite(target) && target > 0;
      const hasActual = typeof actual === 'number' && Number.isFinite(actual);
      return hasTarget && hasActual;
    });

    if (validMonths.length === 0) return { target: 0, actual: 0 };

    const targetValues = validMonths.map(key => targets[key]);
    const actualValues = validMonths.map(key => actuals[key]);

    let ytdTarget = 0;
    let ytdActual = 0;

    switch (aggregationType) {
      case 'sum':
        ytdTarget = targetValues.reduce((sum, value) => sum + value, 0);
        ytdActual = actualValues.reduce((sum, value) => sum + value, 0);
        break;
      case 'average':
        ytdTarget = targetValues.reduce((sum, value) => sum + value, 0) / targetValues.length;
        ytdActual = actualValues.reduce((sum, value) => sum + value, 0) / actualValues.length;
        break;
      case 'max':
        ytdTarget = Math.max(...targetValues);
        ytdActual = Math.max(...actualValues);
        break;
      case 'min':
        ytdTarget = Math.min(...targetValues);
        ytdActual = Math.min(...actualValues);
        break;
      default:
        ytdTarget = targetValues.reduce((sum, value) => sum + value, 0);
        ytdActual = actualValues.reduce((sum, value) => sum + value, 0);
    }

    return { target: ytdTarget, actual: ytdActual };
  };

  // Calculate yearly values (all 12 months)
  const calculateYearly = (targets: Record<string, number>, actuals: Record<string, number>, year: number) => {
    const targetValues: number[] = [];
    const actualValues: number[] = [];

    // Iterate through all 12 months of the year
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const target = targets[monthKey] || 0;
      const actual = actuals[monthKey] || 0;
      
      targetValues.push(target);
      actualValues.push(actual);
    }

    let yearlyTarget = 0;
    let yearlyActual = 0;

    switch (aggregationType) {
      case 'sum':
        yearlyTarget = targetValues.reduce((sum, value) => sum + value, 0);
        yearlyActual = actualValues.reduce((sum, value) => sum + value, 0);
        break;
      case 'average':
        yearlyTarget = targetValues.reduce((sum, value) => sum + value, 0) / 12;
        yearlyActual = actualValues.reduce((sum, value) => sum + value, 0) / 12;
        break;
      case 'max':
        yearlyTarget = Math.max(...targetValues);
        yearlyActual = Math.max(...actualValues);
        break;
      case 'min':
        yearlyTarget = Math.min(...targetValues);
        yearlyActual = Math.min(...actualValues);
        break;
      default:
        yearlyTarget = targetValues.reduce((sum, value) => sum + value, 0);
        yearlyActual = actualValues.reduce((sum, value) => sum + value, 0);
    }

    return { target: yearlyTarget, actual: yearlyActual };
  };

  const ytdValues = calculateYTD(monthlyTargets, monthlyActual);
  const yearlyTarget = ytdValues.target;
  const yearlyActual = ytdValues.actual;
  const achievementPercentage = yearlyTarget > 0 
    ? calculateKRStatus(
        yearlyActual, 
        yearlyTarget, 
        (currentKeyResult.target_direction as 'maximize' | 'minimize') || 'maximize'
      ).percentage
    : 0;

  // Calculate current month values
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthTarget = monthlyTargets[currentMonthKey] || 0;
  const currentMonthActual = monthlyActual[currentMonthKey] || 0;

  // Calculate yearly values (all 12 months)
  const yearlyFullValues = calculateYearly(monthlyTargets, monthlyActual, selectedYear);
  const fullYearTarget = yearlyFullValues.target;
  const fullYearActual = yearlyFullValues.actual;

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
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                <Button
                  variant={selectedPeriod === 'ytd' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPeriod('ytd')}
                  className="h-8 px-3 text-xs"
                >
                  YTD
                </Button>
                <Button
                  variant={selectedPeriod === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPeriod('yearly')}
                  className="h-8 px-3 text-xs"
                >
                  Ano
                </Button>
              </div>
              
              {/* Smart Combo - Visual muda conforme período ativo */}
              <Select
                value={`${selectedMonthYear}-${selectedMonth.toString().padStart(2, '0')}`}
                onValueChange={(value) => {
                  const [year, month] = value.split('-');
                  setSelectedMonthYear(parseInt(year));
                  setSelectedMonth(parseInt(month));
                  // Ao selecionar um mês, automaticamente muda para o período 'monthly'
                  setSelectedPeriod('monthly');
                }}
              >
                <SelectTrigger 
                  className={cn(
                    "w-[130px] h-8 transition-all",
                    selectedPeriod === 'monthly' 
                      ? "border-primary bg-primary/10 ring-1 ring-primary/20 font-medium" 
                      : "border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 text-muted-foreground"
                  )}
                  onClick={() => {
                    // Clicar no combo também ativa o período mensal
                    if (selectedPeriod !== 'monthly') {
                      setSelectedPeriod('monthly');
                    }
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4 pr-2 py-4">

            {/* Key Metrics */}
        <KeyResultMetrics
          keyResult={currentKeyResult}
          selectedPeriod={selectedPeriod}
          selectedMonth={selectedPeriod === 'monthly' ? selectedMonth : undefined}
          selectedYear={selectedPeriod === 'monthly' ? selectedMonthYear : undefined}
        />

            {/* Evolution Chart */}
          <KeyResultChart
              keyResult={currentKeyResult}
              monthlyTargets={monthlyTargets}
              monthlyActual={monthlyActual}
              unit={currentKeyResult.unit || ''}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              targetDirection={(currentKeyResult.target_direction as 'maximize' | 'minimize') || 'maximize'}
              aggregationType={currentKeyResult.aggregation_type || 'sum'}
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