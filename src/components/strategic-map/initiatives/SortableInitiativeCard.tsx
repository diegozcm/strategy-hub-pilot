import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSlider } from '@/components/ui/progress-slider';
import { KRInitiative, InitiativeStatus } from '@/types/strategic-map';
import { Calendar, User, DollarSign, Edit, Trash2, GripVertical } from 'lucide-react';

interface SortableInitiativeCardProps {
  initiative: KRInitiative;
  onEdit: (initiative: KRInitiative) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  formatPeriodDisplay: (startDate: string, endDate: string) => string;
  getStatusBadge: (status: InitiativeStatus) => React.ReactNode;
  statusLabels: Record<InitiativeStatus, string>;
  isProgressLocked: (status: InitiativeStatus) => boolean;
}

export const SortableInitiativeCard = ({
  initiative,
  onEdit,
  onDelete,
  onUpdateProgress,
  formatPeriodDisplay,
  getStatusBadge,
  statusLabels,
  isProgressLocked
}: SortableInitiativeCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: initiative.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`group ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            {/* Drag Handle */}
            <div 
              {...attributes} 
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 mt-0.5 rounded hover:bg-muted transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-1">
              <CardTitle className="text-base">{initiative.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatPeriodDisplay(initiative.start_date, initiative.end_date)}
                {initiative.responsible && (
                  <>
                    <User className="h-3 w-3 ml-2" />
                    {initiative.responsible}
                  </>
                )}
                {initiative.budget && (
                  <>
                    <DollarSign className="h-3 w-3 ml-2" />
                    R$ {initiative.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(initiative.status)}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(initiative)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(initiative.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {initiative.description && (
          <div>
            <h4 className="font-medium text-sm mb-1">Descrição</h4>
            <p className="text-sm text-muted-foreground">{initiative.description}</p>
          </div>
        )}
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm">Progresso</h4>
            <span className="text-sm text-muted-foreground">{initiative.progress_percentage}%</span>
          </div>
          <ProgressSlider
            value={initiative.progress_percentage ?? 0}
            onValueCommit={(value) => onUpdateProgress(initiative.id, value)}
            max={100}
            min={0}
            step={5}
            className="w-full"
            colorScheme="initiatives"
            disabled={isProgressLocked(initiative.status)}
          />
          {isProgressLocked(initiative.status) && (
            <p className="text-xs text-muted-foreground italic mt-1">
              Progresso bloqueado — Iniciativa {statusLabels[initiative.status].toLowerCase()}
            </p>
          )}
        </div>

        {initiative.completion_notes && (
          <div>
            <h4 className="font-medium text-sm mb-1">Notas de Acompanhamento</h4>
            <p className="text-sm text-muted-foreground">{initiative.completion_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
