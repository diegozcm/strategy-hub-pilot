import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Target, Activity, AlertCircle, CheckCircle, Calendar, CalendarDays, CalendarClock, Scale, Download, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KeyResult, StrategicObjective } from '@/types/strategic-map';
import { cn } from '@/lib/utils';

interface KRTableViewProps {
  keyResults: KeyResult[];
  objectives: StrategicObjective[];
  pillars: { id: string; name: string; color: string }[];
  periodType: 'ytd' | 'quarterly' | 'monthly' | 'yearly';
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
}

type FrequencyType = 'all' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';

const frequencyLabels: Record<string, { label: string; icon: React.ReactNode; short: string }> = {
  monthly: { label: 'Mensal', icon: <Calendar className="h-3.5 w-3.5" />, short: 'M' },
  bimonthly: { label: 'Bimestral', icon: <CalendarDays className="h-3.5 w-3.5" />, short: 'B' },
  quarterly: { label: 'Trimestral', icon: <CalendarDays className="h-3.5 w-3.5" />, short: 'T' },
  semiannual: { label: 'Semestral', icon: <CalendarClock className="h-3.5 w-3.5" />, short: 'S' },
  annual: { label: 'Anual', icon: <CalendarClock className="h-3.5 w-3.5" />, short: 'A' },
};

const formatValue = (value: number, unit: string = '%'): string => {
  if (unit === '%') {
    return `${value.toFixed(1).replace('.', ',')}%`;
  } else if (unit === 'R$') {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency >= 100) return 'text-emerald-600 dark:text-emerald-400';
  if (efficiency >= 80) return 'text-amber-600 dark:text-amber-400';
  if (efficiency >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getEfficiencyBgColor = (efficiency: number): string => {
  if (efficiency >= 100) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (efficiency >= 80) return 'bg-amber-100 dark:bg-amber-900/30';
  if (efficiency >= 50) return 'bg-orange-100 dark:bg-orange-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
};

const getEfficiencyBadge = (efficiency: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string } => {
  if (efficiency >= 100) return { label: 'Atingiu', variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-600 text-white' };
  if (efficiency >= 80) return { label: 'Bom', variant: 'secondary', className: 'bg-amber-500 hover:bg-amber-600 text-white' };
  if (efficiency >= 50) return { label: 'Atenção', variant: 'outline', className: 'border-orange-500 text-orange-600 dark:text-orange-400' };
  return { label: 'Crítico', variant: 'destructive', className: '' };
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
}) => {
  // Filter states
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyType>('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get metrics for a specific KR based on period type
  const getMetrics = (kr: KeyResult) => {
    const metrics = customMetricsMap.get(kr.id);
    if (!metrics) {
      return { target: 0, actual: 0, percentage: 0 };
    }

    switch (periodType) {
      case 'ytd':
        return metrics.ytd;
      case 'monthly':
        return metrics.monthly;
      case 'yearly':
        return metrics.yearly;
      case 'quarterly':
        return metrics.quarterly;
      default:
        return metrics.ytd;
    }
  };

  // Calculate resultado (difference) and efficiency
  const calculateRMRE = (kr: KeyResult) => {
    const metrics = getMetrics(kr);
    const real = metrics.actual;
    const meta = metrics.target;
    const resultado = real - meta;
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

  // Get frequency label for a KR
  const getFrequencyInfo = (kr: KeyResult) => {
    const freq = kr.frequency || 'monthly';
    return frequencyLabels[freq] || frequencyLabels.monthly;
  };

  // Reset all filters
  const resetFilters = () => {
    setFrequencyFilter('all');
    setPillarFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = frequencyFilter !== 'all' || pillarFilter !== 'all' || statusFilter !== 'all';

  // Filter and sort KRs
  const filteredAndSortedKRs = useMemo(() => {
    let filtered = [...keyResults];

    // Apply frequency filter
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(kr => (kr.frequency || 'monthly') === frequencyFilter);
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
  }, [keyResults, objectives, pillars, frequencyFilter, pillarFilter, statusFilter, customMetricsMap]);

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
  }, [filteredAndSortedKRs, customMetricsMap]);

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
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtros:
          </div>

          {/* Frequency Filter */}
          <Select value={frequencyFilter} onValueChange={(v) => setFrequencyFilter(v as FrequencyType)}>
            <SelectTrigger className="w-[160px] h-9 bg-background">
              <SelectValue placeholder="Frequência" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Todas frequências</SelectItem>
              <SelectItem value="monthly">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Mensal
                </div>
              </SelectItem>
              <SelectItem value="bimonthly">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Bimestral
                </div>
              </SelectItem>
              <SelectItem value="quarterly">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Trimestral
                </div>
              </SelectItem>
              <SelectItem value="semiannual">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Semestral
                </div>
              </SelectItem>
              <SelectItem value="annual">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Anual
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Pillar Filter */}
          <Select value={pillarFilter} onValueChange={setPillarFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-background">
              <SelectValue placeholder="Pilar" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Todos os pilares</SelectItem>
              {pillars.map(pillar => (
                <SelectItem key={pillar.id} value={pillar.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: pillar.color }}
                    />
                    {pillar.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="achieved">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Atingidos
                </div>
              </SelectItem>
              <SelectItem value="attention">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  Atenção
                </div>
              </SelectItem>
              <SelectItem value="critical">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  Críticos
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}

          <div className="flex-1" />

          {/* Export Button */}
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-[280px] font-semibold text-foreground">Resultado-Chave</TableHead>
                <TableHead className="w-[180px] font-semibold text-foreground">
                  <div className="flex items-center gap-1">
                    Objetivo
                    <Tooltip>
                      <TooltipTrigger>
                        <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Peso do objetivo (P:X)</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="w-[90px] text-center font-semibold text-foreground">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-center gap-1 w-full">
                      <Calendar className="h-4 w-4" />
                      Freq.
                    </TooltipTrigger>
                    <TooltipContent>Frequência de acompanhamento</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[70px] text-center font-semibold text-foreground">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-center gap-1 w-full">
                      <Scale className="h-4 w-4" />
                      Peso
                    </TooltipTrigger>
                    <TooltipContent>Peso do Resultado-Chave (1-10)</TooltipContent>
                  </Tooltip>
                </TableHead>
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
                <TableHead className="w-[160px] text-right font-semibold text-foreground">
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
                const frequencyInfo = getFrequencyInfo(kr);
                
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-clamp-2 flex-1">
                          {objective?.title || '-'}
                        </span>
                        {objective && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 shrink-0">
                                P:{objective.weight || 1}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Peso do objetivo: {objective.weight || 1}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="gap-1 px-2 py-0.5">
                            {frequencyInfo.icon}
                            <span className="text-xs">{frequencyInfo.short}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>{frequencyInfo.label}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold",
                            "bg-primary/10 text-primary"
                          )}>
                            {kr.weight || 1}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Peso do KR: {kr.weight || 1}</TooltipContent>
                      </Tooltip>
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
                              eficiencia >= 100 ? "bg-emerald-500" :
                              eficiencia >= 80 ? "bg-amber-500" :
                              eficiencia >= 50 ? "bg-orange-500" : "bg-red-500"
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
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    Filtrado
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6">
                {/* Weighted Average */}
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
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
      </div>
    </TooltipProvider>
  );
};
