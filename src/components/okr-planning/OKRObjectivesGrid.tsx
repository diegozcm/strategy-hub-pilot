import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OKRObjective } from '@/types/okr';
import { OKRObjectiveCard } from './OKRObjectiveCard';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';

interface OKRObjectivesGridProps {
  objectives: OKRObjective[];
  onObjectiveClick: (objective: OKRObjective) => void;
  onCreateClick: () => void;
}

export const OKRObjectivesGrid: React.FC<OKRObjectivesGridProps> = ({
  objectives,
  onObjectiveClick,
  onCreateClick,
}) => {
  const { canCreateObjective } = useOKRPermissions();

  if (objectives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Plus className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhum objetivo criado</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Comece criando seu primeiro objetivo para este trimestre
        </p>
        {canCreateObjective && (
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Objetivo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Objetivos</h2>
          <span className="text-sm text-muted-foreground">
            ({objectives.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          {canCreateObjective && (
            <Button size="sm" onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Objetivo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {objectives.map((objective) => (
          <OKRObjectiveCard
            key={objective.id}
            objective={objective}
            onClick={() => onObjectiveClick(objective)}
          />
        ))}
      </div>
    </div>
  );
};
