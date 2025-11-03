import { useState, useMemo } from 'react';
import { useStrategicMap } from '@/hooks/useStrategicMap';
import { useRumoCalculations, PeriodType, getPerformanceColor, getPerformanceStyles } from '@/hooks/useRumoCalculations';
import { RumoPillarBlock } from './RumoPillarBlock';
import { RumoObjectiveBlock } from './RumoObjectiveBlock';
import { RumoLegend } from './RumoLegend';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Compass, Calendar, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const RumoDashboard = () => {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const { pillars, objectives, keyResults, loading } = useStrategicMap();
  
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
  } = useRumoCalculations(pillarsWithObjectives, objectives, keyResults, periodType);

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
    if (finalScore >= 100) return 'text-blue-500 border-blue-500 bg-blue-500/10';
    if (finalScore >= 80) return 'text-green-500 border-green-500 bg-green-500/10';
    if (finalScore >= 50) return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
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
              variant={periodType === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodType('monthly')}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + new Date().toLocaleDateString('pt-BR', { month: 'long' }).slice(1)}
            </Button>
            <Button
              variant={periodType === 'ytd' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodType('ytd')}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              YTD
            </Button>
          </div>

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
