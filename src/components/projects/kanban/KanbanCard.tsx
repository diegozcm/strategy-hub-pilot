import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, GripVertical, Edit3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  assignee_id: string | null;
  position: number;
  assignee?: {
    first_name: string;
    last_name?: string;
    avatar_url?: string;
  } | null;
}

interface KanbanCardProps {
  task: ProjectTask;
  projectName?: string;
  pillarColor?: string;
  isDragging?: boolean;
  onEdit?: (task: ProjectTask) => void;
}

const getPriorityConfig = (priority: string | null) => {
  switch (priority) {
    case 'high':
      return { color: 'bg-destructive text-destructive-foreground', label: 'Alta' };
    case 'medium':
      return { color: 'bg-amber-500 text-white', label: 'Média' };
    case 'low':
      return { color: 'bg-emerald-500 text-white', label: 'Baixa' };
    case 'critical':
      return { color: 'bg-red-600 text-white', label: 'Crítica' };
    default:
      return { color: 'bg-muted text-muted-foreground', label: 'Normal' };
  }
};

const isOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ 
  task, 
  projectName, 
  pillarColor,
  isDragging = false,
  onEdit 
}) => {
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.(task);
  };

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftWidth: '4px',
        borderLeftColor: pillarColor || '#e2e8f0'
      }}
      className={cn(
        'p-4 cursor-grab active:cursor-grabbing transition-all duration-200 group',
        'hover:shadow-lg hover:scale-[1.02] hover:border-primary/50',
        'bg-card border border-border',
        isSortableDragging || isDragging ? 'opacity-50 shadow-2xl scale-105 rotate-2 z-50' : '',
        'touch-none select-none'
      )}
      {...attributes}
      {...listeners}
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
          {/* Edit button - visible on hover */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleEditClick}
          >
            <Edit3 className="w-3 h-3" />
          </Button>
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
          <div className="flex items-center gap-2">
            {/* Assignee avatar */}
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignee.avatar_url} />
                  <AvatarFallback className="text-[9px]">
                    {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-16">
                  {task.assignee.first_name}
                </span>
              </div>
            )}
            <Badge className={cn('text-xs border-0', priorityConfig.color)}>
              {priorityConfig.label}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
