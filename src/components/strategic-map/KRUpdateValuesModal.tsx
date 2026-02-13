import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyResult } from '@/types/strategic-map';
import { useToast } from '@/hooks/use-toast';
import { X, AlertTriangle } from 'lucide-react';
import { calculateKRStatus } from '@/lib/krHelpers';
import { cn } from '@/lib/utils';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';
import { KRFCAModal } from './KRFCAModal';
import { useKRFCA } from '@/hooks/useKRFCA';
import { 
  KRFrequency, 
  getPeriodsForFrequency, 
  periodTargetsToMonthly, 
  monthlyTargetsToPeriod, 
  getFrequencyLabel, 
  getFrequencyBadgeColor,
  isFrequencyPeriodBased,
  calculateYearlyFromPeriods,
  isPeriodInValidity
} from '@/lib/krFrequencyHelpers';

// Função para verificar se um mês está dentro da vigência
const isMonthInValidity = (monthKey: string, startMonth?: string | null, endMonth?: string | null): boolean => {
  if (!startMonth || !endMonth) return false;
  return monthKey >= startMonth && monthKey <= endMonth;
};

// Função para formatar a vigência para exibição
const formatValidityPeriod = (startMonth?: string | null, endMonth?: string | null): string | null => {
  if (!startMonth || !endMonth) return null;
  
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };
  
  return `${formatMonth(startMonth)} até ${formatMonth(endMonth)}`;
};

interface KRUpdateValuesModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
  onSave: (keyResultData: Partial<KeyResult>) => Promise<any>;
}

// Helper: get the immediately previous period key for a given frequency
const getPreviousPeriodKey = (currentKey: string, frequency: KRFrequency): string | null => {
  switch (frequency) {
    case 'monthly': {
      // "YYYY-MM" -> previous month; null if MM=01
      const [year, monthStr] = currentKey.split('-');
      const month = parseInt(monthStr);
      if (month === 1) return null; // Jan is exempt
      return `${year}-${(month - 1).toString().padStart(2, '0')}`;
    }
    case 'bimonthly': {
      // "YYYY-BN" -> null if N=1
      const match = currentKey.match(/^(\d{4})-B(\d+)$/);
      if (!match) return null;
      const n = parseInt(match[2]);
      if (n === 1) return null;
      return `${match[1]}-B${n - 1}`;
    }
    case 'quarterly': {
      const match = currentKey.match(/^(\d{4})-Q(\d+)$/);
      if (!match) return null;
      const n = parseInt(match[2]);
      if (n === 1) return null;
      return `${match[1]}-Q${n - 1}`;
    }
    case 'semesterly': {
      const match = currentKey.match(/^(\d{4})-S(\d+)$/);
      if (!match) return null;
      const n = parseInt(match[2]);
      if (n === 1) return null;
      return `${match[1]}-S${n - 1}`;
    }
    case 'yearly':
      return null; // Always exempt
    default:
      return null;
  }
};

export const KRUpdateValuesModal = ({ keyResult, open, onClose, onSave }: KRUpdateValuesModalProps) => {
  const { toast } = useToast();
  const { selectedYear, setSelectedYear, yearOptions } = usePeriodFilter();
  const { createFCA, fcas, loadFCAs } = useKRFCA(keyResult?.id);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyActual, setMonthlyActual] = useState<Record<string, number>>({});
  const [periodActual, setPeriodActual] = useState<Record<string, number>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const hasInitialized = useRef(false);
  
// Variation threshold states
  const [blockedMonths, setBlockedMonths] = useState<Record<string, { variation: number; targetValue: number; newValue: number }>>({});
  const [showFCAModal, setShowFCAModal] = useState(false);
  const [fcaMonthKey, setFcaMonthKey] = useState<string | null>(null);
  const [resolvedMonths, setResolvedMonths] = useState<Set<string>>(new Set());

  // Pre-populate resolvedMonths from existing FCAs with linked_update_month
  useEffect(() => {
    if (fcas && fcas.length > 0) {
      const resolved = new Set<string>();
      fcas.forEach(fca => {
        if ((fca as any).linked_update_month) {
          resolved.add((fca as any).linked_update_month);
        }
      });
      if (resolved.size > 0) {
        setResolvedMonths(prev => {
          const merged = new Set(prev);
          resolved.forEach(m => merged.add(m));
          return merged;
        });
      }
    }
  }, [fcas]);

  const variationThreshold = keyResult?.variation_threshold ?? null;

  const frequency = (keyResult?.frequency as KRFrequency) || 'monthly';

  // Variation threshold check - compares actual vs TARGET of the same period
  const checkVariation = useCallback((periodKey: string, newValue: number) => {
    if (variationThreshold === null || variationThreshold === undefined) return null;
    
    const rawTargets = (keyResult?.monthly_targets as Record<string, number>) || {};

    let targetValue: number | undefined;

    if (isFrequencyPeriodBased(frequency)) {
      const periodTargets = monthlyTargetsToPeriod(rawTargets, frequency, selectedYear);
      targetValue = periodTargets[periodKey];
    } else {
      targetValue = rawTargets[periodKey];
    }

    // Can't calculate variation without a target or if target is zero
    if (targetValue === null || targetValue === undefined || Math.abs(targetValue) === 0) return null;

    const variation = Math.abs(newValue - targetValue) / Math.abs(targetValue) * 100;
    
    if (variation > variationThreshold) {
      return { variation, targetValue, newValue };
    }
    return null;
  }, [variationThreshold, frequency, keyResult?.monthly_targets, selectedYear]);

  // Re-check all blocked periods when actuals change
  useEffect(() => {
    if (variationThreshold === null || variationThreshold === undefined) return;
    
    const newBlocked: Record<string, { variation: number; targetValue: number; newValue: number }> = {};
    
    const actualsToCheck = isFrequencyPeriodBased(frequency) ? periodActual : monthlyActual;
    
    for (const [key, value] of Object.entries(actualsToCheck)) {
      if (value === null || value === undefined) continue;
      const result = checkVariation(key, value);
      if (result && !resolvedMonths.has(key)) {
        newBlocked[key] = result;
      }
    }
    
    setBlockedMonths(newBlocked);
  }, [monthlyActual, periodActual, variationThreshold, checkVariation, resolvedMonths, frequency]);

  const hasBlockedMonths = Object.keys(blockedMonths).length > 0;

  // Inicialização inteligente: usar o ano da vigência do KR quando o modal abre
  useEffect(() => {
    if (!open) {
      hasInitialized.current = false;
      return;
    }
    
    if (hasInitialized.current || yearOptions.length === 0) return;
    
    // Prioridade: ano da vigência do KR > ano selecionado atual
    if (keyResult?.start_month) {
      const krYear = parseInt(keyResult.start_month.split('-')[0]);
      if (yearOptions.some(opt => opt.value === krYear)) {
        setSelectedYear(krYear);
        hasInitialized.current = true;
        return;
      }
    }
    
    // Fallback: verificar se o ano atual do context é válido
    if (!yearOptions.some(opt => opt.value === selectedYear)) {
      setSelectedYear(yearOptions[0].value);
    }
    
    hasInitialized.current = true;
  }, [open, keyResult?.start_month, yearOptions, selectedYear, setSelectedYear]);

  // Formata número para padrão brasileiro (xxx.xxx.xxx,xx)
  const formatBrazilianNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Remove formatação e converte para número
  const parseBrazilianNumber = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    // Remove pontos (separador de milhar) e substitui vírgula por ponto
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const months = [
    { key: `${selectedYear}-01`, name: 'Janeiro', short: 'Jan' },
    { key: `${selectedYear}-02`, name: 'Fevereiro', short: 'Fev' },
    { key: `${selectedYear}-03`, name: 'Março', short: 'Mar' },
    { key: `${selectedYear}-04`, name: 'Abril', short: 'Abr' },
    { key: `${selectedYear}-05`, name: 'Maio', short: 'Mai' },
    { key: `${selectedYear}-06`, name: 'Junho', short: 'Jun' },
    { key: `${selectedYear}-07`, name: 'Julho', short: 'Jul' },
    { key: `${selectedYear}-08`, name: 'Agosto', short: 'Ago' },
    { key: `${selectedYear}-09`, name: 'Setembro', short: 'Set' },
    { key: `${selectedYear}-10`, name: 'Outubro', short: 'Out' },
    { key: `${selectedYear}-11`, name: 'Novembro', short: 'Nov' },
    { key: `${selectedYear}-12`, name: 'Dezembro', short: 'Dez' },
  ];

  // Calculate yearly actual based on aggregation type
  const calculateYearlyActual = (actuals: Record<string, number>) => {
    const values = Object.values(actuals).filter(value => 
      value !== null && value !== undefined && !isNaN(value)
    );
    if (values.length === 0) return 0;

    const aggregationType = keyResult?.aggregation_type || 'sum';
    
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

  // Initialize form when keyResult changes
  useEffect(() => {
    if (keyResult) {
      const existingActual = keyResult.monthly_actual as Record<string, number> || {};
      setMonthlyActual(existingActual);
      
      // Initialize period actuals if frequency is period-based
      if (isFrequencyPeriodBased(frequency)) {
        setPeriodActual(monthlyTargetsToPeriod(existingActual, frequency, selectedYear));
      }
    }
  }, [keyResult, frequency, selectedYear]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyResult || isSaving || hasBlockedMonths) return;
    
    setIsSaving(true);
    
    try {
      // Merge dos dados existentes com os novos dados do ano selecionado
      const existingMonthlyActual = (keyResult.monthly_actual as Record<string, number>) || {};
      
      let finalMonthlyActual: Record<string, number>;
      let yearlyActual: number;
      
      if (isFrequencyPeriodBased(frequency)) {
        // Convert period actuals to monthly format
        const currentYearMonthlyFromPeriods = periodTargetsToMonthly(periodActual, frequency, selectedYear);
        
        // Merge with existing (preserving other years)
        finalMonthlyActual = { ...existingMonthlyActual };
        Object.keys(finalMonthlyActual).forEach(key => {
          if (key.startsWith(`${selectedYear}-`)) {
            delete finalMonthlyActual[key];
          }
        });
        Object.assign(finalMonthlyActual, currentYearMonthlyFromPeriods);
        
        yearlyActual = calculateYearlyFromPeriods(periodActual, keyResult.aggregation_type || 'sum');
      } else {
        // Monthly frequency
        const cleanCurrentYearActual = Object.fromEntries(
          Object.entries(monthlyActual)
            .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
        );
        
        finalMonthlyActual = { ...existingMonthlyActual };
        Object.keys(finalMonthlyActual).forEach(key => {
          if (key.startsWith(`${selectedYear}-`)) {
            delete finalMonthlyActual[key];
          }
        });
        Object.assign(finalMonthlyActual, cleanCurrentYearActual);
        
        yearlyActual = calculateYearlyActual(cleanCurrentYearActual);
      }

      await onSave({
        id: keyResult.id,
        monthly_actual: finalMonthlyActual,
        yearly_actual: yearlyActual,
        current_value: yearlyActual,
      });

      toast({
        title: "Sucesso",
        description: "Valores atualizados com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Error updating values:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os valores. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!keyResult) return null;

  const monthlyTargets = keyResult.monthly_targets as Record<string, number> || {};
  const periodTargets = isFrequencyPeriodBased(frequency) 
    ? monthlyTargetsToPeriod(monthlyTargets, frequency, selectedYear) 
    : {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[920px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Atualizar Valores - {keyResult.title}
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor(frequency))}>
              {getFrequencyLabel(frequency)}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isFrequencyPeriodBased(frequency) 
              ? `Atualize os valores realizados ${getFrequencyLabel(frequency).toLowerCase()}s para este resultado-chave`
              : 'Atualize os valores realizados mensais para este resultado-chave'
            }
          </DialogDescription>
        </DialogHeader>

        {keyResult.start_month && keyResult.end_month && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              📅 Vigência: {formatValidityPeriod(keyResult.start_month, keyResult.end_month)}
            </p>
          </div>
        )}
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="w-32">
              <Label className="text-sm font-medium">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Valores Realizados ({selectedYear})</Label>
              <p className="text-sm text-muted-foreground">
                {isFrequencyPeriodBased(frequency) 
                  ? `Atualize os valores realizados para cada ${frequency === 'quarterly' ? 'trimestre' : frequency === 'semesterly' ? 'semestre' : 'ano'}.`
                  : 'Atualize os valores realizados para cada mês.'
                }
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[150px_180px_240px_140px_50px] gap-4 p-3 bg-muted/30 rounded-lg font-medium text-sm">
              <div>Período</div>
              <div className="text-center">Meta ({selectedYear})</div>
              <div className="text-center">Realizado</div>
              <div className="text-center">% Atingimento</div>
              <div className="text-center">Unidade</div>
            </div>
            
            {isFrequencyPeriodBased(frequency) ? (
              // Period-based display
              getPeriodsForFrequency(frequency, selectedYear).map((period, index) => {
                const target = periodTargets[period.key] || 0;
                const actual = periodActual[period.key] ?? null;
                const status = actual !== null && target !== 0 
                  ? calculateKRStatus(actual, target, keyResult.target_direction || 'maximize')
                  : null;
                const percentage = status?.percentage ?? null;

                return (
                  <div 
                    key={period.key} 
                    className={cn(
                      "grid grid-cols-[150px_180px_240px_140px_50px] gap-4 items-center p-3 border rounded-lg",
                      isPeriodInValidity(period.key, keyResult.start_month, keyResult.end_month) && 
                        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    )}
                  >
                    <div className="font-medium text-sm">
                      {period.label}
                    </div>
                    <div className="text-right text-base font-medium pr-2">
                      {formatBrazilianNumber(target)}
                    </div>
                    <div className="flex gap-1 items-center">
                      <Input
                        type="text"
                        placeholder="0,00"
                        tabIndex={index + 1}
                        value={editingField === period.key 
                          ? tempValue 
                          : (periodActual[period.key] !== undefined 
                              ? formatBrazilianNumber(periodActual[period.key]) 
                              : '')
                        }
                        onFocus={() => {
                          setEditingField(period.key);
                          setTempValue(periodActual[period.key]?.toString() || '');
                        }}
                        onChange={(e) => {
                          setTempValue(e.target.value);
                        }}
                        onBlur={() => {
                          const value = parseBrazilianNumber(tempValue);
                          if (tempValue === '' || tempValue === '-') {
                            setPeriodActual(prev => {
                              const newActual = { ...prev };
                              delete newActual[period.key];
                              return newActual;
                            });
                          } else if (value !== null) {
                            setPeriodActual(prev => ({
                              ...prev,
                              [period.key]: value
                            }));
                          }
                          setEditingField(null);
                          setTempValue('');
                        }}
                        className="flex-1 text-right font-mono text-base"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => {
                          setPeriodActual(prev => {
                            const newActual = { ...prev };
                            delete newActual[period.key];
                            return newActual;
                          });
                        }}
                        title="Limpar valor realizado"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-center">
                      {percentage !== null && status ? (
                        <span className={`text-sm font-medium ${status.color}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {keyResult.unit}
                    </div>
                  </div>
                );
              })
            ) : (
              // Monthly display
              months.map((month, index) => {
                const target = monthlyTargets[month.key] || 0;
                const actual = monthlyActual[month.key] ?? null;
                const status = actual !== null && target !== 0 
                  ? calculateKRStatus(actual, target, keyResult.target_direction || 'maximize')
                  : null;
                const percentage = status?.percentage ?? null;

                return (
                  <div 
                    key={month.key} 
                    className={cn(
                      "grid grid-cols-[150px_180px_240px_140px_50px] gap-4 items-center p-3 border rounded-lg",
                      isMonthInValidity(month.key, keyResult.start_month, keyResult.end_month) && 
                        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                      blockedMonths[month.key] && "border-red-400 bg-red-50 dark:bg-red-900/20"
                    )}
                  >
                    <div className="font-medium text-sm flex items-center gap-1">
                      {blockedMonths[month.key] && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      {month.name}
                    </div>
                    <div className="text-right text-base font-medium pr-2">
                      {formatBrazilianNumber(target)}
                    </div>
                    <div className="flex gap-1 items-center">
                      <Input
                        type="text"
                        placeholder="0,00"
                        tabIndex={index + 1}
                        value={editingField === month.key 
                          ? tempValue 
                          : (monthlyActual[month.key] !== undefined 
                              ? formatBrazilianNumber(monthlyActual[month.key]) 
                              : '')
                        }
                        onFocus={() => {
                          setEditingField(month.key);
                          setTempValue(monthlyActual[month.key]?.toString() || '');
                        }}
                        onChange={(e) => {
                          setTempValue(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab' && !e.shiftKey && index < months.length - 1) {
                            e.preventDefault();
                            const nextInput = document.querySelector(`input[tabindex="${index + 2}"]`) as HTMLInputElement;
                            if (nextInput) {
                              nextInput.focus();
                            }
                          } else if (e.key === 'Tab' && e.shiftKey && index > 0) {
                            e.preventDefault();
                            const prevInput = document.querySelector(`input[tabindex="${index}"]`) as HTMLInputElement;
                            if (prevInput) {
                              prevInput.focus();
                            }
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                            if (index < months.length - 1) {
                              const nextInput = document.querySelector(`input[tabindex="${index + 2}"]`) as HTMLInputElement;
                              if (nextInput) {
                                nextInput.focus();
                              }
                            }
                          }
                        }}
                        onBlur={() => {
                          const value = parseBrazilianNumber(tempValue);
                          if (tempValue === '' || tempValue === '-') {
                            setMonthlyActual(prev => {
                              const newActual = { ...prev };
                              delete newActual[month.key];
                              return newActual;
                            });
                          } else if (value !== null) {
                            setMonthlyActual(prev => ({
                              ...prev,
                              [month.key]: value
                            }));
                          }
                          setEditingField(null);
                          setTempValue('');
                        }}
                        className="flex-1 text-right font-mono text-base"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => {
                          setMonthlyActual(prev => {
                            const newActual = { ...prev };
                            delete newActual[month.key];
                            return newActual;
                          });
                        }}
                        title="Limpar valor realizado"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-center">
                      {percentage !== null && status ? (
                        <span className={`text-sm font-medium ${status.color}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {keyResult.unit}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Variation Threshold Warning Banner */}
          {hasBlockedMonths && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {Object.keys(blockedMonths).length} período(s) excedem a taxa de variação de {variationThreshold}%
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  É obrigatório criar um FCA para cada período bloqueado antes de salvar.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(blockedMonths).map(([key, info]) => {
                    const periodLabel = isFrequencyPeriodBased(frequency)
                      ? (getPeriodsForFrequency(frequency, selectedYear).find(p => p.key === key)?.label || key)
                      : (months.find(m => m.key === key)?.name || key);
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-amber-700 border-amber-300 hover:bg-amber-100 text-xs"
                        onClick={() => {
                          setFcaMonthKey(key);
                          setShowFCAModal(true);
                        }}
                      >
                        Criar FCA - {periodLabel} ({info.variation.toFixed(1)}%)
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || hasBlockedMonths}>
              {isSaving ? 'Salvando...' : hasBlockedMonths ? 'Resolva os FCAs para salvar' : 'Salvar Valores'}
            </Button>
          </div>
        </form>

        {/* FCA Modal for blocked months */}
        {showFCAModal && fcaMonthKey && keyResult && (
          <KRFCAModal
            open={showFCAModal}
            onClose={() => {
              setShowFCAModal(false);
              setFcaMonthKey(null);
            }}
            onSave={async (fcaData) => {
              // Save FCA to database with linked month info
              await createFCA({
                ...fcaData,
                linked_update_month: fcaMonthKey,
                linked_update_value: blockedMonths[fcaMonthKey!]?.newValue ?? null,
              } as any);
              // After FCA is created, unblock the period
              setResolvedMonths(prev => new Set(prev).add(fcaMonthKey));
              setBlockedMonths(prev => {
                const next = { ...prev };
                delete next[fcaMonthKey];
                return next;
              });
              setShowFCAModal(false);
              setFcaMonthKey(null);
              toast({ title: 'FCA criado', description: 'O período foi desbloqueado para atualização.' });
            }}
            fca={(() => {
              const periodLabel = isFrequencyPeriodBased(frequency)
                ? (getPeriodsForFrequency(frequency, selectedYear).find(p => p.key === fcaMonthKey)?.label || fcaMonthKey)
                : (months.find(m => m.key === fcaMonthKey)?.name || fcaMonthKey);
              return {
                key_result_id: keyResult.id,
                title: `Variação acima do limite em ${periodLabel}`,
                fact: `Meta: ${blockedMonths[fcaMonthKey]?.targetValue?.toLocaleString('pt-BR')}, Realizado: ${blockedMonths[fcaMonthKey]?.newValue?.toLocaleString('pt-BR')} (variação de ${blockedMonths[fcaMonthKey]?.variation?.toFixed(1)}% em relação à meta)`,
                cause: '',
                description: '',
                priority: 'high' as const,
                status: 'active' as const,
              };
            })() as any}
            keyResultId={keyResult.id}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};