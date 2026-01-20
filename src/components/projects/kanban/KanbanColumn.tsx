import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { KanbanCard, ProjectTask } from './KanbanCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: ProjectTask[];
  icon: React.ReactNode;
  accentColor: string;
  getProjectName: (projectId: string) => string | undefined;
  isOver?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  icon,
  accentColor,
  getProjectName,
  isOver = false,
}) => {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id });

  const taskIds = tasks.map(task => task.id);

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Column Header */}
      <div className={cn(
        'flex items-center justify-between p-3 rounded-t-lg border-b-2',
        'bg-muted/50',
        accentColor
      )}>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <Badge variant="secondary" className="font-bold">
          {tasks.length}
        </Badge>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-3 space-y-3 rounded-b-lg transition-colors duration-200',
          'bg-muted/20 border border-t-0 border-border',
          (isOver || isDroppableOver) && 'bg-primary/10 border-primary/30 border-dashed'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className={cn(
              'flex items-center justify-center h-24 rounded-lg border-2 border-dashed',
              'text-muted-foreground text-sm',
              (isOver || isDroppableOver) ? 'border-primary/50 bg-primary/5' : 'border-border'
            )}>
              {(isOver || isDroppableOver) ? 'Solte aqui' : 'Sem tarefas'}
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                projectName={getProjectName(task.project_id)}
              />
            ))
          )}
        </SortableContext>

        {/* Drop placeholder when dragging over non-empty column */}
        {tasks.length > 0 && (isOver || isDroppableOver) && (
          <div className="h-20 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center text-sm text-muted-foreground">
            Solte aqui
          </div>
        )}
      </div>
    </div>
  );
};
