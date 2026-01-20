import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  project_id: string;
  assignee_id: string;
  position: number;
}

interface KanbanCardProps {
  task: ProjectTask;
  projectName?: string;
  isDragging?: boolean;
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'high':
      return { color: 'bg-destructive text-destructive-foreground', label: 'Alta' };
    case 'medium':
      return { color: 'bg-amber-500 text-white', label: 'Média' };
    case 'low':
      return { color: 'bg-emerald-500 text-white', label: 'Baixa' };
    default:
      return { color: 'bg-muted text-muted-foreground', label: 'Normal' };
  }
};

const isOverdue = (dueDate: string) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, projectName, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'p-4 cursor-grab active:cursor-grabbing transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02] hover:border-primary/50',
        'bg-card border border-border',
        isSortableDragging || isDragging ? 'opacity-50 shadow-2xl scale-105 rotate-2 z-50' : '',
        'touch-none select-none'
      )}
    >
      <div className="space-y-3">
        {/* Header with grip and title */}
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'font-medium text-sm text-foreground leading-tight',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h4>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
            {task.description}
          </p>
        )}

        {/* Project name */}
        {projectName && (
          <div className="pl-6">
            <Badge variant="outline" className="text-xs font-normal">
              {projectName}
            </Badge>
          </div>
        )}

        {/* Footer with meta info */}
        <div className="flex items-center justify-between pl-6 pt-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{task.estimated_hours}h</span>
              </div>
            )}
            {task.due_date && (
              <div className={cn(
                'flex items-center gap-1',
                overdue && 'text-destructive font-medium'
              )}>
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
          <Badge className={cn('text-xs border-0', priorityConfig.color)}>
            {priorityConfig.label}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
