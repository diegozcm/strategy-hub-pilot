import React from 'react';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { KeyResult } from '@/types/strategic-map';

interface KRCardProps {
  keyResult: KeyResult;
  pillar: {
    name: string;
    color: string;
  };
  progress: number;
  onClick: () => void;
  onDelete: () => void;
}

export const KRCard: React.FC<KRCardProps> = ({
  keyResult,
  pillar,
  progress,
  onClick,
  onDelete,
}) => {
  const getProgressBarColor = (value: number): string => {
    if (value < 30) return 'bg-red-500';
    if (value < 60) return 'bg-yellow-500';
    if (value < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <Card 
      className="h-full cursor-pointer hover:shadow-lg transition-all overflow-hidden"
      onClick={onClick}
    >
      {/* Header com cor do pilar */}
      <div 
        style={{ backgroundColor: pillar.color }}
        className="p-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-white font-semibold text-base leading-tight">
              {keyResult.title}
            </h3>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
              {pillar.name}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir KR
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Atingimento da Meta */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Atingimento da Meta</span>
          <span className="text-xs font-bold text-foreground">{progress}%</span>
        </div>

        {/* Barra de progresso */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${getProgressBarColor(progress)}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Valores lado a lado */}
        <div className="flex justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Indicador Atual</p>
            <p className="text-base font-semibold">
              {keyResult.current_value.toLocaleString('pt-BR')} {keyResult.unit}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-base font-semibold">
              {keyResult.target_value.toLocaleString('pt-BR')} {keyResult.unit}
            </p>
          </div>
        </div>

        {/* Última atualização */}
        <p className="text-xs text-primary pt-1">
          Última atualização: {new Date(keyResult.updated_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </Card>
  );
};
