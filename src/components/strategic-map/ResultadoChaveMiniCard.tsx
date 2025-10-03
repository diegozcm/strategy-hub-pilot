import React from 'react';
import { KeyResult } from '@/types/strategic-map';

interface ResultadoChaveMiniCardProps {
  resultadoChave: KeyResult;
  pillar?: { name: string; color: string } | null;
  onUpdate?: () => void;
  onOpenDetails?: (keyResult: KeyResult) => void;
}

export const ResultadoChaveMiniCard = ({ resultadoChave, pillar, onUpdate, onOpenDetails }: ResultadoChaveMiniCardProps) => {
  // Calcular progresso usando yearly_actual se disponível, senão current_value
  const currentValue = resultadoChave.yearly_actual || resultadoChave.current_value || 0;
  const targetValue = resultadoChave.yearly_target || resultadoChave.target_value;
  
  // Progresso real sem limitar a 100%
  const progress = targetValue > 0 
    ? (currentValue / targetValue) * 100
    : 0;

  // Determinar cor do badge baseado no progresso
  const getProgressColor = (prog: number) => {
    if (prog >= 100) return 'text-green-600';
    if (prog >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDetails) {
      onOpenDetails(resultadoChave);
    }
  };

  return (
    <div 
      className="border rounded-lg overflow-hidden hover:shadow-sm transition-all cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="flex">
        {/* Barra lateral colorida com a cor do pilar */}
        {pillar && (
          <div 
            className="w-1.5 flex-shrink-0 transition-all duration-300 group-hover:w-2" 
            style={{ backgroundColor: pillar.color }}
          />
        )}
        <div className="flex-1 p-3 hover:bg-muted/50 transition-colors" onClick={handleCardClick}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="space-y-1">
                <h4 className="font-medium text-sm truncate">{resultadoChave.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Atual: {currentValue.toFixed(1)} {resultadoChave.unit}</span>
                  <span>•</span>
                  <span>Meta: {targetValue} {resultadoChave.unit}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};