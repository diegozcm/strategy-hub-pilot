import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { OKRObjective, OKRKeyResult } from '@/types/okr';
import { useOKRKeyResults } from '@/hooks/useOKRKeyResults';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';
import { CreateKeyResultModal } from './CreateKeyResultModal';
import { KeyResultCard } from './KeyResultCard';

interface ObjectiveCardProps {
  objective: OKRObjective;
}

export const ObjectiveCard = ({ objective }: ObjectiveCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showCreateKR, setShowCreateKR] = useState(false);
  const { keyResults, createKeyResult } = useOKRKeyResults(expanded ? objective.id : null);
  const { canCreateKeyResult } = useOKRPermissions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'completed':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'at_risk':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'on_hold':
        return 'Pausado';
      default:
        return status;
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mt-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <div className="flex-1 space-y-2">
                <CardTitle className="text-lg font-semibold">{objective.title}</CardTitle>
                {objective.description && (
                  <p className="text-sm text-muted-foreground">{objective.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(objective.status)}>{getStatusLabel(objective.status)}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{objective.progress_percentage}%</span>
            </div>
            <Progress value={objective.progress_percentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {objective.completed_key_results} de {objective.total_key_results} Key Results concluídos
            </span>
            {objective.responsible && (
              <span className="text-muted-foreground">Resp: {objective.responsible}</span>
            )}
          </div>

          {expanded && (
            <div className="pt-4 space-y-3 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Key Results</h4>
                {canCreateKeyResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateKR(true)}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar KR
                  </Button>
                )}
              </div>

              {keyResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum Key Result cadastrado
                </p>
              ) : (
                <div className="space-y-3">
                  {keyResults.map((kr) => (
                    <KeyResultCard key={kr.id} keyResult={kr} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateKeyResultModal
        open={showCreateKR}
        onOpenChange={setShowCreateKR}
        objectiveId={objective.id}
        onKeyResultCreated={createKeyResult}
      />
    </>
  );
};
