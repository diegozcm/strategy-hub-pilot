import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useKRMetrics, formatMetricValue } from '@/hooks/useKRMetrics';
import { KeyResult } from '@/types/strategic-map';
import { calculateKRStatus, getStatusBackgroundColors, getDefaultBackgroundColors } from '@/lib/krHelpers';

interface KeyResultMetricsProps {
  keyResult: KeyResult;
  selectedPeriod?: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly';
  selectedMonth?: number;
  selectedYear?: number;
  selectedQuarter?: 1 | 2 | 3 | 4;
  selectedQuarterYear?: number;
  selectedSemester?: 1 | 2;
  selectedSemesterYear?: number;
  selectedBimonth?: 1 | 2 | 3 | 4 | 5 | 6;
  selectedBimonthYear?: number;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  onQuarterChange?: (quarter: 1 | 2 | 3 | 4) => void;
  onQuarterYearChange?: (year: number) => void;
  onYearlyYearChange?: (year: number) => void;
  onSemesterChange?: (semester: 1 | 2) => void;
  onSemesterYearChange?: (year: number) => void;
  onBimonthChange?: (bimonth: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onBimonthYearChange?: (year: number) => void;
  monthOptions?: Array<{ value: string; label: string }>;
  quarterOptions?: Array<{ value: string; label: string; quarter: number; year: number }>;
  yearOptions?: Array<{ value: number; label: string }>;
  semesterOptions?: Array<{ value: string; label: string }>;
  bimonthlyOptions?: Array<{ value: string; label: string }>;
  selectedYearlyYear?: number;
}

export const KeyResultMetrics = ({ 
  keyResult,
  selectedPeriod = 'ytd',
  selectedMonth,
  selectedYear,
  selectedQuarter,
  selectedQuarterYear,
  selectedSemester,
  selectedSemesterYear,
  selectedBimonth,
  selectedBimonthYear,
  onMonthChange,
  onYearChange,
  onQuarterChange,
  onQuarterYearChange,
  onYearlyYearChange,
  onSemesterChange,
  onSemesterYearChange,
  onBimonthChange,
  onBimonthYearChange,
  monthOptions = [],
  quarterOptions = [],
  yearOptions = [],
  semesterOptions = [],
  bimonthlyOptions = [],
  selectedYearlyYear
}: KeyResultMetricsProps) => {
  const [isComboOpen, setIsComboOpen] = useState(false);

  const metrics = useKRMetrics(keyResult, {
    selectedMonth,
    selectedYear,
    selectedQuarter,
    selectedQuarterYear,
    selectedSemester,
    selectedSemesterYear,
    selectedBimonth,
    selectedBimonthYear,
  });
  
  const currentMetrics = 
    selectedPeriod === 'monthly' ? metrics.monthly :
    selectedPeriod === 'yearly' ? metrics.yearly :
    selectedPeriod === 'quarterly' ? metrics.quarterly :
    selectedPeriod === 'semesterly' ? metrics.semesterly :
    selectedPeriod === 'bimonthly' ? metrics.bimonthly :
    metrics.ytd;

  const hasActualData = currentMetrics.actual !== null && currentMetrics.actual !== undefined;
  const hasTarget = currentMetrics.target !== null && currentMetrics.target !== undefined && currentMetrics.target !== 0;
  const hasData = hasTarget && hasActualData;

  const krStatus = hasData
    ? calculateKRStatus(
        currentMetrics.actual,
        currentMetrics.target,
        keyResult.target_direction || 'maximize'
      )
    : { percentage: 0, isExcellent: false, isGood: false, color: 'text-muted-foreground' };

  const statusBgColors = hasData
    ? getStatusBackgroundColors(
        currentMetrics.actual,
        currentMetrics.target,
        keyResult.target_direction || 'maximize'
      )
    : getDefaultBackgroundColors();

  const isExcellent = krStatus.isExcellent;
  const isGood = krStatus.isGood;
  const isOverTarget = krStatus.percentage >= 100;

  const targetLabel = selectedPeriod === 'ytd' ? 'Meta YTD' : 
    selectedPeriod === 'yearly' ? 'Meta Anual' : 
    selectedPeriod === 'quarterly' ? 'Meta Quarter' :
    selectedPeriod === 'semesterly' ? 'Meta Semestre' :
    selectedPeriod === 'bimonthly' ? 'Meta Bimestre' : 'Meta Mensal';

  const actualLabel = selectedPeriod === 'ytd' ? 'Realizado YTD' : 
    selectedPeriod === 'yearly' ? 'Realizado Anual' : 
    selectedPeriod === 'quarterly' ? 'Realizado Quarter' :
    selectedPeriod === 'semesterly' ? 'Realizado Semestre' :
    selectedPeriod === 'bimonthly' ? 'Realizado Bimestre' : 'Realizado Mensal';

  const percentLabel = selectedPeriod === 'ytd' ? '% Atingimento YTD' : 
    selectedPeriod === 'yearly' ? '% Atingimento Anual' : 
    selectedPeriod === 'quarterly' ? '% Atingimento Quarter' :
    selectedPeriod === 'semesterly' ? '% Atingimento Semestre' :
    selectedPeriod === 'bimonthly' ? '% Atingimento Bimestre' : '% Atingimento Mensal';

  const currentPeriodDisplay = selectedPeriod === 'ytd'
    ? `YTD ${new Date().getFullYear()}`
    : selectedPeriod === 'yearly'
    ? `Ano ${selectedYear || new Date().getFullYear()}`
    : selectedPeriod === 'quarterly'
    ? `Q${selectedQuarter || Math.ceil((new Date().getMonth() + 1) / 3)} ${selectedQuarterYear || new Date().getFullYear()}`
    : selectedPeriod === 'semesterly'
    ? `S${selectedSemester || 1} ${selectedSemesterYear || new Date().getFullYear()}`
    : selectedPeriod === 'bimonthly'
    ? `B${selectedBimonth || 1} ${selectedBimonthYear || new Date().getFullYear()}`
    : selectedMonth && selectedYear
    ? new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const renderPeriodSelector = () => {
    if (selectedPeriod === 'monthly' && onMonthChange && onYearChange) {
      return (
        <Select
          value={`${selectedYear}-${selectedMonth?.toString().padStart(2, '0')}`}
          onValueChange={(value) => {
            const [year, month] = value.split('-');
            onYearChange(parseInt(year));
            onMonthChange(parseInt(month));
          }}
          onOpenChange={setIsComboOpen}
        >
          <SelectTrigger className="w-full h-8 text-xl font-bold border-0 shadow-none px-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (selectedPeriod === 'quarterly' && onQuarterChange && onQuarterYearChange) {
      return (
        <Select
          value={`${selectedQuarterYear}-Q${selectedQuarter}`}
          onValueChange={(value) => {
            const [year, q] = value.split('-Q');
            onQuarterYearChange(parseInt(year));
            onQuarterChange(parseInt(q) as 1 | 2 | 3 | 4);
          }}
          onOpenChange={setIsComboOpen}
          disabled={quarterOptions.length === 0}
        >
          <SelectTrigger className="w-full h-8 text-xl font-bold border-0 shadow-none px-0">
            <SelectValue placeholder={quarterOptions.length === 0 ? "Sem quarters" : undefined} />
          </SelectTrigger>
          <SelectContent>
            {quarterOptions.length > 0 ? (
              quarterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>Nenhum quarter disponível</SelectItem>
            )}
          </SelectContent>
        </Select>
      );
    }
    if (selectedPeriod === 'yearly' && onYearlyYearChange && yearOptions && yearOptions.length > 0) {
      return (
        <Select
          value={selectedYearlyYear?.toString()}
          onValueChange={(value) => onYearlyYearChange(parseInt(value))}
          onOpenChange={setIsComboOpen}
        >
          <SelectTrigger className="w-full h-8 text-xl font-bold border-0 shadow-none px-0">
            <SelectValue placeholder="Selecione o ano" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (selectedPeriod === 'semesterly' && onSemesterChange && onSemesterYearChange && semesterOptions.length > 0) {
      return (
        <Select
          value={`${selectedSemesterYear}-S${selectedSemester}`}
          onValueChange={(value) => {
            const [year, s] = value.split('-S');
            onSemesterYearChange(parseInt(year));
            onSemesterChange(parseInt(s) as 1 | 2);
          }}
          onOpenChange={setIsComboOpen}
        >
          <SelectTrigger className="w-full h-8 text-xl font-bold border-0 shadow-none px-0">
            <SelectValue placeholder="Selecione o semestre" />
          </SelectTrigger>
          <SelectContent>
            {semesterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (selectedPeriod === 'bimonthly' && onBimonthChange && onBimonthYearChange && bimonthlyOptions.length > 0) {
      return (
        <Select
          value={`${selectedBimonthYear}-B${selectedBimonth}`}
          onValueChange={(value) => {
            const [year, b] = value.split('-B');
            onBimonthYearChange(parseInt(year));
            onBimonthChange(parseInt(b) as 1 | 2 | 3 | 4 | 5 | 6);
          }}
          onOpenChange={setIsComboOpen}
        >
          <SelectTrigger className="w-full h-8 text-xl font-bold border-0 shadow-none px-0">
            <SelectValue placeholder="Selecione o bimestre" />
          </SelectTrigger>
          <SelectContent>
            {bimonthlyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return <span className="text-xl font-bold">{currentPeriodDisplay}</span>;
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-4 divide-x">
        {/* Meta */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{targetLabel}</span>
          </div>
          <div className="text-xl font-bold">
            {formatMetricValue(currentMetrics.target, keyResult.unit)}
          </div>
        </div>

        {/* Realizado */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            {hasData ? (
              isOverTarget ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground font-medium">{actualLabel}</span>
          </div>
          <div className="text-xl font-bold">
            {currentMetrics.actual === null || currentMetrics.actual === undefined
              ? <span className="text-muted-foreground">N/A</span>
              : formatMetricValue(currentMetrics.actual, keyResult.unit)}
          </div>
        </div>

        {/* % Atingimento */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground font-medium">{percentLabel}</span>
          </div>
          {hasData ? (
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${krStatus.color}`}>
                {krStatus.percentage.toFixed(1)}%
              </span>
              <Badge 
                variant={
                  isExcellent || (isGood && krStatus.percentage >= 100) ? "default" : 
                  isGood ? "secondary" : 
                  "destructive"
                } 
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {isExcellent || (isGood && krStatus.percentage >= 100) ? "✓" : 
                 isGood ? "~" : "!"}
              </Badge>
            </div>
          ) : (
            <span className="text-xl font-bold text-muted-foreground">—</span>
          )}
        </div>

        {/* Período Atual */}
        <div className={`px-4 py-3 transition-colors duration-300 ${statusBgColors.bg} ${statusBgColors.border}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className={`h-3.5 w-3.5 ${statusBgColors.icon}`} />
            <span className="text-xs text-muted-foreground font-medium">Período Atual</span>
          </div>
          {renderPeriodSelector()}
        </div>
      </div>
    </Card>
  );
};
