import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, Target, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type KRFrequency } from '@/lib/krFrequencyHelpers';

export type PeriodType = 'ytd' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly' | 'monthly';

interface PeriodOption {
  value: string;
  label: string;
}

interface SmartPeriodSelectorProps {
  // Estados atuais
  selectedPeriod: PeriodType;
  selectedYear: number;
  selectedMonth: number;
  selectedQuarter: 1 | 2 | 3 | 4;
  selectedQuarterYear: number;
  selectedSemester: 1 | 2;
  selectedSemesterYear: number;
  selectedBimonth: 1 | 2 | 3 | 4 | 5 | 6;
  selectedBimonthYear: number;
  
  // Setters
  setSelectedPeriod: (period: PeriodType) => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedQuarter: (quarter: 1 | 2 | 3 | 4) => void;
  setSelectedQuarterYear: (year: number) => void;
  setSelectedSemester: (semester: 1 | 2) => void;
  setSelectedSemesterYear: (year: number) => void;
  setSelectedBimonth: (bimonth: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setSelectedBimonthYear: (year: number) => void;
  
  // Opções
  yearOptions: Array<{ value: number; label: string }>;
  quarterOptions: PeriodOption[];
  semesterOptions: PeriodOption[];
  bimonthlyOptions: PeriodOption[];
  monthOptions: PeriodOption[];
  
  // YTD
  isYTDCalculable: boolean;
  ytdInfoMessage?: string;
  onYTDClick: () => void;
  
  // Classes extras
  className?: string;
  
  // Modo compacto: não mostra o select de período específico (usado no modal de KR)
  compact?: boolean;
  
  // Ocultar o select de ano quando yearly está selecionado (usado no modal de KR que já tem seletor próprio)
  hideYearSelect?: boolean;
  
  // Frequência do KR - filtra as opções de período disponíveis
  krFrequency?: KRFrequency;
}

type GranularPeriodType = 'quarterly' | 'semesterly' | 'bimonthly' | 'monthly';

const PERIOD_TYPE_OPTIONS: { value: GranularPeriodType; label: string }[] = [
  { value: 'quarterly', label: 'Trimestre' },
  { value: 'semesterly', label: 'Semestre' },
  { value: 'bimonthly', label: 'Bimestre' },
  { value: 'monthly', label: 'Mês' },
];

// Ordem de granularidade: quanto maior o índice, maior a granularidade (menos períodos)
const GRANULARITY_ORDER: Record<string, number> = {
  'monthly': 0,
  'bimonthly': 1,
  'quarterly': 2,
  'semesterly': 3,
  'yearly': 4,
};

export const SmartPeriodSelector: React.FC<SmartPeriodSelectorProps> = ({
  selectedPeriod,
  selectedYear,
  selectedMonth,
  selectedQuarter,
  selectedQuarterYear,
  selectedSemester,
  selectedSemesterYear,
  selectedBimonth,
  selectedBimonthYear,
  setSelectedPeriod,
  setSelectedYear,
  setSelectedMonth,
  setSelectedQuarter,
  setSelectedQuarterYear,
  setSelectedSemester,
  setSelectedSemesterYear,
  setSelectedBimonth,
  setSelectedBimonthYear,
  yearOptions,
  quarterOptions,
  semesterOptions,
  bimonthlyOptions,
  monthOptions,
  isYTDCalculable,
  ytdInfoMessage,
  onYTDClick,
  className,
  compact = false,
  hideYearSelect = false,
  krFrequency,
}) => {
  // Determinar se é um período granular (não YTD nem yearly)
  const isGranularPeriod = ['quarterly', 'semesterly', 'bimonthly', 'monthly'].includes(selectedPeriod);
  
  // Filtrar opções de período baseado na frequência do KR
  const filteredPeriodTypeOptions = useMemo(() => {
    if (!krFrequency || krFrequency === 'monthly') {
      return PERIOD_TYPE_OPTIONS; // Todas as opções para KRs mensais
    }
    
    const minGranularity = GRANULARITY_ORDER[krFrequency] ?? 0;
    
    // Filtrar para mostrar apenas períodos com granularidade igual ou maior
    return PERIOD_TYPE_OPTIONS.filter(opt => {
      const optGranularity = GRANULARITY_ORDER[opt.value] ?? 0;
      return optGranularity >= minGranularity;
    });
  }, [krFrequency]);
  
  // Valor atual do tipo de período granular
  const granularPeriodType: GranularPeriodType = isGranularPeriod 
    ? (selectedPeriod as GranularPeriodType) 
    : 'quarterly';

  // Opções de período baseadas no tipo selecionado
  const currentPeriodOptions = useMemo(() => {
    switch (granularPeriodType) {
      case 'quarterly': return quarterOptions;
      case 'semesterly': return semesterOptions;
      case 'bimonthly': return bimonthlyOptions;
      case 'monthly': return monthOptions;
      default: return [];
    }
  }, [granularPeriodType, quarterOptions, semesterOptions, bimonthlyOptions, monthOptions]);

  // Valor atual do período específico
  const currentPeriodValue = useMemo(() => {
    switch (granularPeriodType) {
      case 'quarterly': return `${selectedQuarterYear}-Q${selectedQuarter}`;
      case 'semesterly': return `${selectedSemesterYear}-S${selectedSemester}`;
      case 'bimonthly': return `${selectedBimonthYear}-B${selectedBimonth}`;
      case 'monthly': return `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      default: return '';
    }
  }, [granularPeriodType, selectedQuarter, selectedQuarterYear, selectedSemester, selectedSemesterYear, selectedBimonth, selectedBimonthYear, selectedYear, selectedMonth]);

  // Handler para mudança de tipo de período
  const handlePeriodTypeChange = (value: string) => {
    setSelectedPeriod(value as PeriodType);
  };

  // Handler para mudança de período específico
  const handlePeriodValueChange = (value: string) => {
    switch (granularPeriodType) {
      case 'quarterly': {
        const [year, q] = value.split('-Q');
        setSelectedQuarterYear(parseInt(year));
        setSelectedQuarter(parseInt(q) as 1 | 2 | 3 | 4);
        break;
      }
      case 'semesterly': {
        const [year, s] = value.split('-S');
        setSelectedSemesterYear(parseInt(year));
        setSelectedSemester(parseInt(s) as 1 | 2);
        break;
      }
      case 'bimonthly': {
        const [year, b] = value.split('-B');
        setSelectedBimonthYear(parseInt(year));
        setSelectedBimonth(parseInt(b) as 1 | 2 | 3 | 4 | 5 | 6);
        break;
      }
      case 'monthly': {
        const [year, month] = value.split('-');
        setSelectedYear(parseInt(year));
        setSelectedMonth(parseInt(month));
        break;
      }
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Grupo 1: YTD + Ano */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedPeriod === 'ytd' ? 'default' : 'ghost'}
                size="sm"
                onClick={onYTDClick}
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                YTD
                {!isYTDCalculable && <Info className="w-3 h-3 text-blue-400" />}
              </Button>
            </TooltipTrigger>
            {!isYTDCalculable && ytdInfoMessage && (
              <TooltipContent>
                <p className="max-w-xs">{ytdInfoMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <div className="h-6 w-px bg-border" />

        <Button
          variant={selectedPeriod === 'yearly' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedPeriod('yearly')}
          className="gap-2"
        >
          <Target className="w-4 h-4" />
          Ano
        </Button>

        {/* Select de Ano - aparece quando 'yearly' está selecionado E hideYearSelect é false */}
        {selectedPeriod === 'yearly' && yearOptions.length > 0 && !hideYearSelect && (
          <>
            <div className="h-6 w-px bg-border" />
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-[90px] text-sm border-0 bg-transparent font-medium">
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
          </>
        )}
      </div>

      {/* Grupo 2: Tipo de Período + Período Específico */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
        <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
        
        <Select
          value={isGranularPeriod ? granularPeriodType : ''}
          onValueChange={handlePeriodTypeChange}
        >
          <SelectTrigger 
            className={cn(
              "h-8 w-[120px] text-sm border-0 bg-transparent",
              isGranularPeriod && "font-medium"
            )}
          >
            <SelectValue placeholder="Período..." />
          </SelectTrigger>
          <SelectContent>
            {filteredPeriodTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mostra o select de período específico apenas se não estiver em modo compact */}
        {!compact && isGranularPeriod && currentPeriodOptions.length > 0 && (
          <>
            <div className="h-6 w-px bg-border" />
            <Select
              value={currentPeriodValue}
              onValueChange={handlePeriodValueChange}
            >
              <SelectTrigger className="h-8 w-[160px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentPeriodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {!compact && isGranularPeriod && currentPeriodOptions.length === 0 && (
          <span className="text-sm text-muted-foreground px-2">
            Sem dados disponíveis
          </span>
        )}
      </div>
    </div>
  );
};

export default SmartPeriodSelector;
