import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { KanbanCard, ProjectTask } from './KanbanCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: ProjectTask[];
  icon: React.ReactNode;
  accentColor: string;
  getProjectName: (projectId: string) => string | undefined;
  getPillarColor?: (projectId: string) => string | undefined;
  getProjectCoverUrl?: (projectId: string) => string | undefined;
  isOver?: boolean;
  onEditTask?: (task: ProjectTask) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  icon,
  accentColor,
  getProjectName,
  getPillarColor,
  getProjectCoverUrl,
  isOver = false,
  onEditTask,
}) => {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id });

  // Sort tasks by position
  const sortedTasks = [...tasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const taskIds = sortedTasks.map(task => task.id);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-h-[400px] p-4 border-b-4 transition-all duration-200 rounded-lg',
        accentColor,
        (isOver || isDroppableOver) && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{title}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks Container */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[120px]">
          {sortedTasks.length === 0 ? (
            <div className={cn(
              'h-full min-h-[100px] border-2 border-dashed rounded-md flex items-center justify-center',
              'text-sm text-muted-foreground transition-colors',
              (isOver || isDroppableOver) ? 'border-primary bg-primary/10' : 'border-muted'
            )}>
              {(isOver || isDroppableOver) ? 'Solte aqui' : 'Sem tarefas'}
            </div>
          ) : (
            sortedTasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                projectName={getProjectName(task.project_id)}
                projectCoverUrl={getProjectCoverUrl?.(task.project_id)}
                pillarColor={getPillarColor?.(task.project_id)}
                onEdit={onEditTask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </Card>
  );
};
