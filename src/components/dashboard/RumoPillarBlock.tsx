import { StrategicPillar } from '@/types/strategic-map';
import { getPerformanceColor, getPerformanceStyles } from '@/hooks/useRumoCalculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RumoPillarBlockProps {
  pillar: StrategicPillar;
  progress: number;
}

export const RumoPillarBlock = ({ pillar, progress }: RumoPillarBlockProps) => {
  const performance = getPerformanceColor(progress);
  const styles = getPerformanceStyles(performance);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              ${styles}
              p-6 rounded-lg border-2 shadow-lg
              transition-all duration-300 hover:scale-105 hover:shadow-xl
              cursor-pointer min-h-[120px] flex flex-col justify-between
              animate-fade-in
            `}
          >
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-bold text-lg mb-2 line-clamp-2">
                {pillar.name}
              </h3>
              <p className="text-3xl font-extrabold">
                {progress.toFixed(1).replace('.', ',')}%
              </p>
            </div>
            <div className="text-xs opacity-80 mt-2">
              {pillar.objectives?.length || 0} objetivo(s)
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-semibold mb-1">{pillar.name}</p>
          {pillar.description && (
            <p className="text-xs text-muted-foreground mb-2">{pillar.description}</p>
          )}
          <p className="text-xs">
            Progress: <span className="font-bold">{progress.toFixed(1).replace('.', ',')}%</span>
          </p>
          <p className="text-xs">
            Total de objetivos: {pillar.objectives?.length || 0}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
