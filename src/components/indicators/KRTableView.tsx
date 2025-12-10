import React, { useMemo, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';
import { cn } from '@/lib/utils';
import { ExportModal } from './ExportModal';

interface KRTableViewProps {
  keyResults: KeyResult[];
  objectives: StrategicObjective[];
  pillars: { id: string; name: string; color: string }[];
  periodType: 'ytd' | 'quarterly' | 'monthly' | 'yearly' | 'semesterly';
  selectedYear?: number;
  selectedMonth?: number;
  selectedQuarter?: 1 | 2 | 3 | 4;
  selectedQuarterYear?: number;
  onKRClick: (kr: KeyResult) => void;
  customMetricsMap: Map<string, {
    ytd: { target: number; actual: number; percentage: number };
    monthly: { target: number; actual: number; percentage: number };
    yearly: { target: number; actual: number; percentage: number };
    quarterly: { target: number; actual: number; percentage: number };
  }>;
  // Filter props from parent
  pillarFilter?: string;
  statusFilter?: string;
  searchTerm?: string;
  // Export modal control
  exportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
}

// Period ranges for each frequency type
const getPeriodRanges = (frequency: string): number[][] => {
  switch (frequency) {
    case 'bimonthly':
      return [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12]];
    case 'quarterly':
      return [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];
    case 'semiannual':
      return [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]];
    case 'annual':
      return [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]];
    case 'monthly':
    default:
      return [[1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12]];
  }
};

// Get which period a specific month belongs to for a given frequency
const getMonthPeriodIndex = (month: number, frequency: string): number => {
  const ranges = getPeriodRanges(frequency);
  for (let i = 0; i < ranges.length; i++) {
    if (ranges[i].includes(month)) return i;
  }
  return 0;
};

// Get current period based on frequency
const getCurrentPeriodMonths = (frequency: string, selectedMonth?: number): number[] => {
  const currentMonth = selectedMonth || new Date().getMonth() + 1;
  const periodIndex = getMonthPeriodIndex(currentMonth, frequency);
  const ranges = getPeriodRanges(frequency);
  return ranges[periodIndex] || [currentMonth];
};

// Aggregate monthly values for a specific period range
const aggregateMonthlyValues = (
  monthlyData: Record<string, number> | null,
  months: number[],
  year: number,
  aggregationType: string = 'sum'
): number => {
  if (!monthlyData) return 0;
  
  let values: number[] = [];
  months.forEach(month => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const value = monthlyData[key];
    if (value !== undefined && value !== null) {
      values.push(value);
    }
  });

  if (values.length === 0) return 0;

  switch (aggregationType) {
    case 'average':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    case 'last':
      return values[values.length - 1];
    case 'sum':
    default:
      return values.reduce((a, b) => a + b, 0);
  }
};

const formatValue = (value: number, unit: string = '%'): string => {
  if (unit === '%') {
    return `${value.toFixed(1).replace('.', ',')}%`;
  } else if (unit === 'R$') {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

// Performance legend colors based on efficiency percentage
// < 71% = Crítico (Red)
// 71-99% = Atenção (Yellow)
// 100-105% = No Alvo (Green)
// > 105% = Excelente (Blue)
const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency > 105) return 'text-blue-600 dark:text-blue-400';
  if (efficiency >= 100) return 'text-green-600 dark:text-green-400';
  if (efficiency >= 71) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getEfficiencyBgColor = (efficiency: number): string => {
  if (efficiency > 105) return 'bg-blue-100 dark:bg-blue-900/30';
  if (efficiency >= 100) return 'bg-green-100 dark:bg-green-900/30';
  if (efficiency >= 71) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
};

const getEfficiencyBadge = (efficiency: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string } => {
  if (efficiency > 105) return { label: 'Excelente', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600 text-white' };
  if (efficiency >= 100) return { label: 'No Alvo', variant: 'default', className: 'bg-green-500 hover:bg-green-600 text-white' };
  if (efficiency >= 71) return { label: 'Atenção', variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' };
  return { label: 'Crítico', variant: 'destructive', className: 'bg-red-500 hover:bg-red-600 text-white' };
};

export const KRTableView: React.FC<KRTableViewProps> = ({
  keyResults,
  objectives,
  pillars,
  periodType,
  selectedYear,
  selectedMonth,
  selectedQuarter,
  selectedQuarterYear,
  onKRClick,
  customMetricsMap,
  pillarFilter = 'all',
  statusFilter = 'all',
  searchTerm = '',
  exportModalOpen,
  setExportModalOpen,
}) => {
  // Ref for table export
  const tableRef = useRef<HTMLDivElement>(null);

  // Calculate metrics by frequency - aggregates monthly data based on KR frequency
  const calculateMetricsByFrequency = (kr: KeyResult) => {
    const frequency = kr.frequency || 'monthly';
    const year = selectedYear || new Date().getFullYear();
    const aggregationType = kr.aggregation_type || 'sum';
    const isMinimize = kr.target_direction === 'minimize';
    
    const monthlyTargets = kr.monthly_targets as Record<string, number> | null;
    const monthlyActual = kr.monthly_actual as Record<string, number> | null;

    let months: number[] = [];
    
    // Determine which months to aggregate based on period type and frequency
    if (periodType === 'ytd') {
      // YTD: from January to current month
      const currentMonth = new Date().getMonth() + 1;
      const ranges = getPeriodRanges(frequency);
      const currentPeriodIdx = getMonthPeriodIndex(currentMonth, frequency);
      for (let i = 0; i <= currentPeriodIdx; i++) {
        months = [...months, ...ranges[i]];
      }
    } else if (periodType === 'quarterly') {
      // Map quarter to months
      const quarterMonths: Record<number, number[]> = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
        4: [10, 11, 12],
      };
      months = quarterMonths[selectedQuarter || 1];
    } else if (periodType === 'monthly') {
      // Single month - but need to check if it aligns with frequency period
      months = getCurrentPeriodMonths(frequency, selectedMonth);
    } else if (periodType === 'yearly') {
      // Full year
      months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    const targetYear = periodType === 'quarterly' ? (selectedQuarterYear || year) : year;
    const target = aggregateMonthlyValues(monthlyTargets, months, targetYear, aggregationType);
    const actual = aggregateMonthlyValues(monthlyActual, months, targetYear, aggregationType);

    // Calculate percentage based on direction
    let percentage = 0;
    if (target > 0 && actual > 0) {
      if (isMinimize) {
        percentage = (target / actual) * 100;
      } else {
        percentage = (actual / target) * 100;
      }
    } else if (target === 0 && actual === 0) {
      percentage = 100;
    }

    return {
      target,
      actual,
      percentage,
      result: actual - target,
    };
  };

  // Get metrics for a specific KR - use frequency-based calculation
  const getMetrics = (kr: KeyResult) => {
    return calculateMetricsByFrequency(kr);
  };

  // Calculate resultado (difference) and efficiency
  const calculateRMRE = (kr: KeyResult) => {
    const metrics = getMetrics(kr);
    const real = metrics.actual;
    const meta = metrics.target;
    const resultado = metrics.result;
    const eficiencia = metrics.percentage;

    return {
      real,
      meta,
      resultado,
      eficiencia,
      isMinimize: kr.target_direction === 'minimize',
    };
  };

  // Get objective and pillar info
  const getObjectiveInfo = (objectiveId: string | undefined) => {
    if (!objectiveId) return { objective: null, pillar: null };
    const objective = objectives.find(o => o.id === objectiveId);
    if (!objective) return { objective: null, pillar: null };
    const pillar = pillars.find(p => p.id === objective.pillar_id);
    return { objective, pillar };
  };

  // Filter and sort KRs
  const filteredAndSortedKRs = useMemo(() => {
    let filtered = [...keyResults];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(kr => 
        kr.title.toLowerCase().includes(term) ||
        kr.description?.toLowerCase().includes(term)
      );
    }

    // Apply pillar filter
    if (pillarFilter !== 'all') {
      filtered = filtered.filter(kr => {
        const { pillar } = getObjectiveInfo(kr.objective_id);
        return pillar?.id === pillarFilter;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(kr => {
        const { eficiencia } = calculateRMRE(kr);
        if (statusFilter === 'achieved') return eficiencia >= 100;
        if (statusFilter === 'attention') return eficiencia >= 50 && eficiencia < 100;
        if (statusFilter === 'critical') return eficiencia < 50;
        return true;
      });
    }

    // Sort by pillar, then objective, then title
    return filtered.sort((a, b) => {
      const infoA = getObjectiveInfo(a.objective_id);
      const infoB = getObjectiveInfo(b.objective_id);
      
      const pillarIndexA = pillars.findIndex(p => p.id === infoA.pillar?.id);
      const pillarIndexB = pillars.findIndex(p => p.id === infoB.pillar?.id);
      if (pillarIndexA !== pillarIndexB) return pillarIndexA - pillarIndexB;
      
      const objTitleA = infoA.objective?.title || '';
      const objTitleB = infoB.objective?.title || '';
      if (objTitleA !== objTitleB) return objTitleA.localeCompare(objTitleB);
      
      return a.title.localeCompare(b.title);
    });
  }, [keyResults, objectives, pillars, pillarFilter, statusFilter, searchTerm, selectedYear, selectedMonth, selectedQuarter, selectedQuarterYear, periodType]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = filteredAndSortedKRs.length;
    let achieved = 0;
    let attention = 0;
    let critical = 0;
    let totalEfficiency = 0;
    let totalWeight = 0;

    filteredAndSortedKRs.forEach(kr => {
      const { eficiencia } = calculateRMRE(kr);
      const weight = kr.weight || 1;
      totalEfficiency += eficiencia * weight;
      totalWeight += weight;

      if (eficiencia >= 100) achieved++;
      else if (eficiencia >= 50) attention++;
      else critical++;
    });

    const weightedAverage = totalWeight > 0 ? totalEfficiency / totalWeight : 0;

    return { total, achieved, attention, critical, weightedAverage };
  }, [filteredAndSortedKRs, selectedYear, selectedMonth, selectedQuarter, selectedQuarterYear, periodType]);

  // Prepare export data (simplified - no frequency or weight)
  const exportData = useMemo(() => {
    return filteredAndSortedKRs.map(kr => {
      const { real, meta, resultado, eficiencia } = calculateRMRE(kr);
      const { objective, pillar } = getObjectiveInfo(kr.objective_id);
      
      return {
        krTitle: kr.title,
        objective: objective?.title || '-',
        pillar: pillar?.name || '-',
        target: meta,
        actual: real,
        result: resultado,
        efficiency: eficiencia,
        unit: kr.unit || '%',
      };
    });
  }, [filteredAndSortedKRs, selectedYear, selectedMonth, selectedQuarter, selectedQuarterYear, periodType]);

  // Get period label for header
  const getPeriodLabel = (): string => {
    switch (periodType) {
      case 'ytd':
        return 'YTD';
      case 'monthly':
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${monthNames[(selectedMonth || 1) - 1]} ${selectedYear}`;
      case 'yearly':
        return `Ano ${selectedYear}`;
      case 'quarterly':
        return `Q${selectedQuarter} ${selectedQuarterYear}`;
      default:
        return '';
    }
  };

  if (keyResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mb-4 opacity-50" />
        <p>Nenhum resultado-chave encontrado</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Table */}
        <div ref={tableRef} className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-[300px] font-semibold text-foreground">Resultado-Chave</TableHead>
                <TableHead className="w-[200px] font-semibold text-foreground">Objetivo</TableHead>
                <TableHead className="w-[100px] text-right font-semibold text-foreground">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                      <Target className="h-4 w-4" />
                      Meta
                    </TooltipTrigger>
                    <TooltipContent>Valor meta para o período</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[100px] text-right font-semibold text-foreground">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                      <Activity className="h-4 w-4" />
                      Real
                    </TooltipTrigger>
                    <TooltipContent>Valor realizado no período</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[100px] text-right font-semibold text-foreground">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                      <TrendingUp className="h-4 w-4" />
                      Resultado
                    </TooltipTrigger>
                    <TooltipContent>Diferença entre Real e Meta</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[180px] text-right font-semibold text-foreground">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                      Eficiência ({getPeriodLabel()})
                    </TooltipTrigger>
                    <TooltipContent>Percentual de atingimento da meta</TooltipContent>
                  </Tooltip>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedKRs.map((kr, index) => {
                const { real, meta, resultado, eficiencia, isMinimize } = calculateRMRE(kr);
                const { objective, pillar } = getObjectiveInfo(kr.objective_id);
                const efficiencyBadge = getEfficiencyBadge(eficiencia);
                
                const isResultadoPositive = isMinimize ? resultado <= 0 : resultado >= 0;

                return (
                  <TableRow 
                    key={kr.id} 
                    className={cn(
                      "cursor-pointer transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/20",
                      "hover:bg-accent/10"
                    )}
                    onClick={() => onKRClick(kr)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-foreground line-clamp-2">
                          {kr.title}
                        </span>
                        {pillar && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full ring-2 ring-background shadow-sm" 
                              style={{ backgroundColor: pillar.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {pillar.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {objective?.title || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatValue(meta, kr.unit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatValue(real, kr.unit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isResultadoPositive ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className={cn(
                          'font-mono text-sm',
                          isResultadoPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {resultado >= 0 ? '+' : ''}{formatValue(resultado, kr.unit)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-bold text-sm', getEfficiencyColor(eficiencia))}>
                            {eficiencia.toFixed(1).replace('.', ',')}%
                          </span>
                          <Badge className={cn("text-xs px-2 py-0", efficiencyBadge.className)}>
                            {efficiencyBadge.label}
                          </Badge>
                        </div>
                        <div className={cn("h-1.5 w-24 rounded-full overflow-hidden", getEfficiencyBgColor(eficiencia))}>
                          <div 
                            className={cn(
                              "h-full transition-all duration-300",
                              eficiencia > 105 ? "bg-blue-500" :
                              eficiencia >= 100 ? "bg-green-500" :
                              eficiencia >= 71 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(eficiencia, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {/* Enhanced Summary Footer */}
          <div className="border-t bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {summaryStats.total} resultado{summaryStats.total !== 1 ? 's' : ''}-chave
                </span>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Weighted Average */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Média ponderada:</span>
                  <span className={cn("font-bold text-sm", getEfficiencyColor(summaryStats.weightedAverage))}>
                    {summaryStats.weightedAverage.toFixed(1).replace('.', ',')}%
                  </span>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Status Counts */}
                <div className="flex items-center gap-4">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {summaryStats.achieved}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Atingidos (≥100%)</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        {summaryStats.attention}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Atenção (50-99%)</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {summaryStats.critical}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Críticos (&lt;50%)</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Modal */}
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          tableRef={tableRef}
          exportData={exportData}
          title={`Tabela RMRE - ${getPeriodLabel()}`}
        />
      </div>
    </TooltipProvider>
  );
};
