import { useState, useMemo } from 'react';
import { useStrategicMap } from '@/hooks/useStrategicMap';
import { useRumoCalculations, PeriodType, getPerformanceColor, getPerformanceStyles } from '@/hooks/useRumoCalculations';
import { usePlanPeriodOptions } from '@/hooks/usePlanPeriodOptions';
import { RumoPillarBlock } from './RumoPillarBlock';
import { RumoObjectiveBlock } from './RumoObjectiveBlock';
import { RumoLegend } from './RumoLegend';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Compass, Calendar, TrendingUp, Target } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const RumoDashboard = () => {
  const [periodType, setPeriodType] = useState<PeriodType>('ytd');
  
  // Inicializar com o último mês fechado (mês anterior)
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const [selectedMonth, setSelectedMonth] = useState<number>(previousMonth.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(previousMonth.getFullYear());
  const now = new Date();
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(
    Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4
  );
  const [selectedQuarterYear, setSelectedQuarterYear] = useState<number>(new Date().getFullYear());
  
  const { pillars, objectives, keyResults, loading } = useStrategicMap();
  const { quarterOptions, monthOptions, yearOptions } = usePlanPeriodOptions();
  
  // Processar dados para aninhar objetivos dentro dos pilares
  const pillarsWithObjectives = useMemo(() => {
    return pillars.map(pillar => ({
      ...pillar,
      objectives: objectives.filter(obj => obj.pillar_id === pillar.id)
    }));
  }, [pillars, objectives]);
  
  
  const { 
    pillarProgress, 
    objectiveProgress, 
    krProgress, 
    finalScore,
    hasData 
  } = useRumoCalculations(
    pillarsWithObjectives, 
    objectives, 
    keyResults, 
    periodType,
    periodType === 'monthly' 
      ? { selectedMonth, selectedYear } 
      : periodType === 'quarterly'
      ? { selectedQuarter }
      : periodType === 'yearly'
      ? { selectedYear }
      : undefined
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-12 text-center">
        <Compass className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          Defina seu Rumo Estratégico
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Configure seus pilares estratégicos, objetivos e resultados-chave para visualizar
          o progresso do seu planejamento estratégico.
        </p>
      </Card>
    );
  }

  // Get performance color for final score
  const getFinalScoreColor = () => {
    if (finalScore > 105) return 'text-blue-500 border-blue-500 bg-blue-500/10';
    if (finalScore >= 100) return 'text-green-500 border-green-500 bg-green-500/10';
    if (finalScore >= 71) return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
    return 'text-red-500 border-red-500 bg-red-500/10';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with filters and score */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Compass className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Rumo</h2>
            <p className="text-sm text-muted-foreground">Visão Global do Planejamento Estratégico</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Period Filter */}
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <Button
            variant={periodType === 'ytd' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriodType('ytd')}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            YTD
          </Button>
            <Button
              variant={periodType === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodType('yearly')}
              className="gap-2"
            >
              <Target className="w-4 h-4" />
              Ano
            </Button>

            {periodType === 'yearly' && (
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="h-9 w-[100px]">
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
            )}

          {/* Quarter */}
          <Button
            variant={periodType === 'quarterly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriodType('quarterly')}
            className="gap-2 border-l border-border/50 ml-1 pl-2"
          >
            <Calendar className="w-4 h-4" />
            Quarter
          </Button>

          {periodType === 'quarterly' && (
            <Select
              value={`${selectedQuarterYear}-Q${selectedQuarter}`}
              onValueChange={(value) => {
                const [year, q] = value.split('-Q');
                setSelectedQuarterYear(parseInt(year));
                setSelectedQuarter(parseInt(q) as 1 | 2 | 3 | 4);
              }}
            >
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quarterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Mês */}
          <Button
            variant={periodType === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriodType('monthly')}
            className="gap-2 border-l border-border/50 ml-1 pl-2"
          >
            <Calendar className="w-4 h-4" />
            Mês
          </Button>
          </div>
          
          {/* Select de Mês - Aparece ao lado quando monthly está selecionado */}
          {periodType === 'monthly' && (
            <Select
              value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
              onValueChange={(value) => {
                const [year, month] = value.split('-');
                setSelectedYear(parseInt(year));
                setSelectedMonth(parseInt(month));
              }}
            >
              <SelectTrigger className="h-9 w-[200px] gap-2">
                <Calendar className="w-4 h-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Final Score */}
          <Card className={`px-6 py-3 border-2 ${getFinalScoreColor()}`}>
            <div className="text-center">
              <p className="text-xs font-medium opacity-80 mb-1">Score Geral</p>
              <p className="text-3xl font-extrabold">
                {finalScore.toFixed(1)}%
              </p>
            </div>
          </Card>
        </div>
      </div>


      {/* Pillars and Objectives Grid */}
      <div className="space-y-6">
        {pillarsWithObjectives.map((pillar) => {
          const progress = pillarProgress.get(pillar.id) || 0;
          const pillarObjectives = pillar.objectives || [];

          return (
            <Card key={pillar.id} className="p-6 bg-card/50 backdrop-blur animate-scale-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Pillar Block - Left Side */}
                <div className="lg:col-span-3">
                  <RumoPillarBlock pillar={pillar} progress={progress} />
                </div>

                {/* Objectives Grid - Right Side */}
                <div className="lg:col-span-9">
                  {pillarObjectives.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pillarObjectives.map((objective) => {
                        const objProgress = objectiveProgress.get(objective.id) || 0;
                        
                        return (
                  <RumoObjectiveBlock
                    key={objective.id}
                    objective={objective}
                    progress={objProgress}
                    keyResults={keyResults}
                    krProgress={krProgress}
                    selectedPeriod={periodType}
                    selectedMonth={periodType === 'monthly' ? selectedMonth : undefined}
                    selectedYear={periodType === 'monthly' ? selectedYear : undefined}
                    selectedQuarter={periodType === 'quarterly' ? selectedQuarter : undefined}
                  />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[120px] border-2 border-dashed border-muted-foreground/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Nenhum objetivo definido para este pilar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend - Footer */}
      <RumoLegend />
    </div>
  );
};
