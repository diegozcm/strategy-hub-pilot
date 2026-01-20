import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Circle, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard, ProjectTask } from './KanbanCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StrategicProject {
  id: string;
  name: string;
  pillar_color?: string;
  cover_image_url?: string;
}

interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface KanbanBoardProps {
  tasks: ProjectTask[];
  projects: StrategicProject[];
  selectedProject: string;
  onProjectFilterChange: (value: string) => void;
  onTasksUpdate: (tasks: ProjectTask[]) => void;
  companyUsers?: CompanyUser[];
  onEditTask?: (task: ProjectTask) => void;
}

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', icon: <Circle className="w-4 h-4" />, color: 'border-b-muted-foreground' },
  { id: 'in_progress', title: 'Em Progresso', icon: <Clock className="w-4 h-4" />, color: 'border-b-blue-500' },
  { id: 'review', title: 'Em Revisão', icon: <AlertCircle className="w-4 h-4" />, color: 'border-b-amber-500' },
  { id: 'done', title: 'Concluído', icon: <CheckCircle className="w-4 h-4" />, color: 'border-b-emerald-500' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  projects,
  selectedProject,
  onProjectFilterChange,
  onTasksUpdate,
  companyUsers = [],
  onEditTask,
}) => {
  const { toast } = useToast();
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tasks by selected project
  const filteredTasks = useMemo(() => {
    if (selectedProject === 'all') return tasks;
    return tasks.filter(task => task.project_id === selectedProject);
  }, [tasks, selectedProject]);

  // Group tasks by status and sort by position
  const tasksByStatus = useMemo(() => {
    const grouped = {
      todo: filteredTasks.filter(t => t.status === 'todo'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      review: filteredTasks.filter(t => t.status === 'review'),
      done: filteredTasks.filter(t => t.status === 'done'),
    };
    // Sort each group by position
    Object.keys(grouped).forEach(key => {
      grouped[key as keyof typeof grouped].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });
    return grouped;
  }, [filteredTasks]);

  const getProjectName = (projectId: string): string | undefined => {
    return projects.find(p => p.id === projectId)?.name;
  };

  const getPillarColor = (projectId: string): string | undefined => {
    return projects.find(p => p.id === projectId)?.pillar_color;
  };

  const getProjectCoverUrl = (projectId: string): string | undefined => {
    return projects.find(p => p.id === projectId)?.cover_image_url;
  };

  const findColumnByTaskId = (taskId: string): string | null => {
    for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
      if (statusTasks.some(t => t.id === taskId)) {
        return status;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);
    setOverId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overIdValue = over.id as string;

    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    // Determine the target column
    const isOverColumn = COLUMNS.some(col => col.id === overIdValue);
    let targetColumn: string;
    
    if (isOverColumn) {
      targetColumn = overIdValue;
    } else {
      // Dropped on a task, find its column
      const overColumn = findColumnByTaskId(overIdValue);
      if (!overColumn) return;
      targetColumn = overColumn;
    }

    // Get tasks in target column sorted by position
    const columnTasks = tasks
      .filter(t => t.status === targetColumn)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Calculate new index
    let newIndex: number;
    if (isOverColumn) {
      // Dropped on column itself - add to end
      newIndex = columnTasks.length;
    } else {
      // Dropped on a specific task - insert at that position
      const overTaskIndex = columnTasks.findIndex(t => t.id === overIdValue);
      newIndex = overTaskIndex >= 0 ? overTaskIndex : columnTasks.length;
    }

    const previousTasks = [...tasks];

    if (activeTask.status === targetColumn) {
      // Same column - reordering
      const oldIndex = columnTasks.findIndex(t => t.id === activeTaskId);
      if (oldIndex === newIndex || oldIndex === -1) return;

      // Reorder tasks in this column
      const reorderedColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
      
      // Update positions in local state
      const updatedTasks = tasks.map(task => {
        const newPosition = reorderedColumnTasks.findIndex(t => t.id === task.id);
        if (newPosition >= 0 && task.status === targetColumn) {
          return { ...task, position: newPosition };
        }
        return task;
      });
      
      onTasksUpdate(updatedTasks);

      // Update positions in database
      try {
        const updates = reorderedColumnTasks.map((task, index) => 
          supabase
            .from('project_tasks')
            .update({ position: index })
            .eq('id', task.id)
        );
        
        await Promise.all(updates);

        toast({
          title: "Sucesso",
          description: "Ordem das tarefas atualizada",
        });
      } catch (error) {
        console.error('Error updating task positions:', error);
        onTasksUpdate(previousTasks);
        toast({
          title: "Erro",
          description: "Erro ao reordenar tarefas. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      // Different column - moving to new status
      // Remove from source column and add to target at specific position
      const sourceColumnTasks = tasks
        .filter(t => t.status === activeTask.status && t.id !== activeTaskId)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      
      const targetColumnTasks = columnTasks.filter(t => t.id !== activeTaskId);
      
      // Insert at new position
      targetColumnTasks.splice(newIndex, 0, { ...activeTask, status: targetColumn });

      // Update all positions
      const updatedTasks = tasks.map(task => {
        // Update source column positions
        const sourceIndex = sourceColumnTasks.findIndex(t => t.id === task.id);
        if (sourceIndex >= 0 && task.status === activeTask.status) {
          return { ...task, position: sourceIndex };
        }
        
        // Update target column positions
        const targetIndex = targetColumnTasks.findIndex(t => t.id === task.id);
        if (targetIndex >= 0) {
          if (task.id === activeTaskId) {
            return { ...task, status: targetColumn, position: targetIndex };
          }
          return { ...task, position: targetIndex };
        }
        
        return task;
      });

      onTasksUpdate(updatedTasks);

      // Update database
      try {
        // Update moved task's status and position
        await supabase
          .from('project_tasks')
          .update({ status: targetColumn, position: newIndex })
          .eq('id', activeTaskId);

        // Update positions in target column
        const targetUpdates = targetColumnTasks
          .filter(t => t.id !== activeTaskId)
          .map((task, index) => {
            const actualIndex = index >= newIndex ? index + 1 : index;
            return supabase
              .from('project_tasks')
              .update({ position: actualIndex })
              .eq('id', task.id);
          });

        // Update positions in source column
        const sourceUpdates = sourceColumnTasks.map((task, index) =>
          supabase
            .from('project_tasks')
            .update({ position: index })
            .eq('id', task.id)
        );

        await Promise.all([...targetUpdates, ...sourceUpdates]);

        toast({
          title: "Sucesso",
          description: `Tarefa movida para "${COLUMNS.find(c => c.id === targetColumn)?.title}"`,
        });
      } catch (error) {
        console.error('Error updating task status:', error);
        onTasksUpdate(previousTasks);
        toast({
          title: "Erro",
          description: "Erro ao mover tarefa. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Filter */}
      <div className="flex justify-between items-center">
        <Select value={selectedProject} onValueChange={onProjectFilterChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasksByStatus[column.id as keyof typeof tasksByStatus]}
              icon={column.icon}
              accentColor={column.color}
              getProjectName={getProjectName}
              getPillarColor={getPillarColor}
              getProjectCoverUrl={getProjectCoverUrl}
              isOver={overId === column.id}
              onEditTask={onEditTask}
            />
          ))}
        </div>

        {/* Drag Overlay - shows the card being dragged */}
        <DragOverlay>
          {activeTask ? (
            <KanbanCard
              task={activeTask}
              projectName={getProjectName(activeTask.project_id)}
              pillarColor={getPillarColor(activeTask.project_id)}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
