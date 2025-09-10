import { useState } from 'react';
import { MoreVertical, Target, Calendar, User, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StrategicObjective, KeyResult } from '@/types/strategic-map';
import { ResultadoChaveMiniCard } from './ResultadoChaveMiniCard';
import { AddResultadoChaveModal } from './AddResultadoChaveModal';

interface ObjectiveCardProps {
  objective: StrategicObjective;
  compact?: boolean;
  keyResults?: KeyResult[];
  onAddResultadoChave?: (resultadoChaveData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
}

const getProgressColor = (progress: number) => {
  if (progress < 30) return 'bg-red-500';
  if (progress < 60) return 'bg-yellow-500';
  if (progress < 80) return 'bg-blue-500';
  return 'bg-green-500';
};

const calculateObjectiveProgress = (keyResults: KeyResult[]) => {
  if (keyResults.length === 0) return 0;
  
  const totalProgress = keyResults.reduce((sum, kr) => {
    const currentValue = kr.yearly_actual || kr.current_value || 0;
    const targetValue = kr.yearly_target || kr.target_value || 1;
    const progress = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
    return sum + progress;
  }, 0);
  
  return Math.round(totalProgress / keyResults.length);
};

export const ObjectiveCard = ({ objective, compact = false, keyResults = [], onAddResultadoChave }: ObjectiveCardProps) => {
  const [showResultadoChaveForm, setShowResultadoChaveForm] = useState(false);
  const progressPercentage = calculateObjectiveProgress(keyResults);
  
  const handleAddResultadoChave = async (resultadoChaveData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    if (onAddResultadoChave) {
      await onAddResultadoChave(resultadoChaveData);
      setShowResultadoChaveForm(false);
    }
  };

  if (compact) {
    return (
      <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{objective.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              {objective.responsible && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-20">{objective.responsible}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="text-xs font-medium">{progressPercentage}%</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">{objective.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              {onAddResultadoChave && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowResultadoChaveForm(true)}
                  className="h-6 text-xs px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  RC
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {objective.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {objective.description}
            </p>
          )}

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Progresso</span>
              <span className="text-xs font-bold text-gray-900">{progressPercentage}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${getProgressColor(progressPercentage)}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            {objective.responsible && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{objective.responsible}</span>
              </div>
            )}
            {objective.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(objective.deadline).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>

          {/* Resultados-Chave Section */}
          {!compact && onAddResultadoChave && (
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm font-medium">Resultados-Chave</Label>
                <Badge variant="secondary">{keyResults.length}</Badge>
              </div>
              
              {keyResults.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum resultado-chave cadastrado</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setShowResultadoChaveForm(true)}
                    className="mt-1"
                  >
                    Adicionar o primeiro Resultado-Chave
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {keyResults.map((kr) => (
                    <ResultadoChaveMiniCard key={kr.id} resultadoChave={kr} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Adicionar Resultado-Chave */}
      {showResultadoChaveForm && onAddResultadoChave && (
        <AddResultadoChaveModal
          objectiveId={objective.id}
          open={showResultadoChaveForm}
          onClose={() => setShowResultadoChaveForm(false)}
          onSave={handleAddResultadoChave}
        />
      )}
    </>
  );
};