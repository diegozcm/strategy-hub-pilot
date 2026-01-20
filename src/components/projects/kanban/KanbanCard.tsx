import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, GripVertical, Edit3, Folder } from 'lucide-react';
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
  projectCoverUrl?: string;
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
  projectCoverUrl,
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
        borderLeftWidth: '3px',
        borderLeftColor: pillarColor || 'hsl(var(--border))'
      }}
      className={cn(
        'relative p-3 cursor-grab active:cursor-grabbing group overflow-hidden',
        'transition-all duration-200 ease-out',
        'hover:shadow-lg hover:-translate-y-1 hover:border-primary/30',
        'bg-card border border-border rounded-md',
        isSortableDragging || isDragging ? 'opacity-60 shadow-2xl scale-[1.02] rotate-1 z-50' : '',
        'touch-none select-none'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Background image overlay */}
      {projectCoverUrl && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
            style={{ backgroundImage: `url(${projectCoverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background/90" />
        </>
      )}
      
      <div className="relative space-y-2.5">
        {/* Header with grip and title */}
        <div className="flex items-start gap-2">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'font-medium text-sm text-foreground leading-snug',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h4>
          </div>
          {/* Edit button - visible on hover */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-0.5"
            onClick={handleEditClick}
          >
            <Edit3 className="w-3 h-3" />
          </Button>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
            {task.description}
          </p>
        )}

        {/* Project name - compact style */}
        {projectName && (
          <div className="pl-5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Folder className="w-3 h-3" />
            <span className="truncate">{projectName}</span>
          </div>
        )}

        {/* Footer with meta info */}
        <div className="flex items-center justify-between pl-5 pt-1">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
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
                  <AvatarFallback className="text-[9px] bg-muted">
                    {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-14">
                  {task.assignee.first_name}
                </span>
              </div>
            )}
            <Badge className={cn('text-[10px] px-1.5 py-0 border-0', priorityConfig.color)}>
              {priorityConfig.label}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
