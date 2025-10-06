import { StrategicObjective, KeyResult } from '@/types/strategic-map';
import { getPerformanceColor, getPerformanceStyles } from '@/hooks/useRumoCalculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target } from 'lucide-react';

interface RumoObjectiveBlockProps {
  objective: StrategicObjective;
  progress: number;
  keyResults: KeyResult[];
  krProgress: Map<string, number>;
}

export const RumoObjectiveBlock = ({ 
  objective, 
  progress, 
  keyResults,
  krProgress 
}: RumoObjectiveBlockProps) => {
  const performance = getPerformanceColor(progress);
  const styles = getPerformanceStyles(performance);

  const objectiveKRs = keyResults.filter(kr => kr.objective_id === objective.id);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              ${styles}
              p-4 rounded-lg border-2 shadow-md
              transition-all duration-300 hover:scale-105 hover:shadow-lg
              cursor-pointer min-h-[80px] flex items-center justify-between
              animate-fade-in
            `}
          >
            <div className="flex-1 pr-3">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 mt-1 flex-shrink-0" />
                <h4 className="font-semibold text-sm line-clamp-2">
                  {objective.title}
                </h4>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold">
                {progress.toFixed(1)}%
              </p>
              <p className="text-xs opacity-80">
                {objectiveKRs.length} KR(s)
              </p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md">
          <div className="space-y-2">
            <p className="font-semibold">{objective.title}</p>
            {objective.description && (
              <p className="text-xs text-muted-foreground">{objective.description}</p>
            )}
            
            {objectiveKRs.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold mb-2">Resultados-Chave:</p>
                <div className="space-y-1">
                  {objectiveKRs.map(kr => {
                    const krProg = krProgress.get(kr.id) || 0;
                    const krPerf = getPerformanceColor(krProg);
                    
                    return (
                      <div key={kr.id} className="text-xs flex justify-between items-center gap-2">
                        <span className="flex-1 line-clamp-1">{kr.title}</span>
                        <span className={`font-bold ${
                          krPerf === 'excellent' ? 'text-blue-500' :
                          krPerf === 'success' ? 'text-green-500' :
                          krPerf === 'warning' ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {krProg.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
