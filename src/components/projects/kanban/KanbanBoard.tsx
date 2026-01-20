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
}

interface KanbanBoardProps {
  tasks: ProjectTask[];
  projects: StrategicProject[];
  selectedProject: string;
  onProjectFilterChange: (value: string) => void;
  onTasksUpdate: (tasks: ProjectTask[]) => void;
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

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return {
      todo: filteredTasks.filter(t => t.status === 'todo'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      review: filteredTasks.filter(t => t.status === 'review'),
      done: filteredTasks.filter(t => t.status === 'done'),
    };
  }, [filteredTasks]);

  const getProjectName = (projectId: string): string | undefined => {
    return projects.find(p => p.id === projectId)?.name;
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
    const overId = over.id as string;

    // Determine the target column
    let targetColumn: string;
    
    // Check if dropped on a column directly
    if (COLUMNS.some(col => col.id === overId)) {
      targetColumn = overId;
    } else {
      // Dropped on a task, find its column
      const overColumn = findColumnByTaskId(overId);
      if (!overColumn) return;
      targetColumn = overColumn;
    }

    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    // If status hasn't changed, just handle reordering within column
    if (activeTask.status === targetColumn) {
      // Reorder logic could be added here if we track order
      return;
    }

    // Optimistic update - update local state immediately
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map(t =>
      t.id === activeTaskId ? { ...t, status: targetColumn } : t
    );
    onTasksUpdate(updatedTasks);

    // Update database in background
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status: targetColumn })
        .eq('id', activeTaskId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Tarefa movida para "${COLUMNS.find(c => c.id === targetColumn)?.title}"`,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert on error
      onTasksUpdate(previousTasks);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da tarefa. Tente novamente.",
        variant: "destructive",
      });
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
              isOver={overId === column.id}
            />
          ))}
        </div>

        {/* Drag Overlay - shows the card being dragged */}
        <DragOverlay>
          {activeTask ? (
            <KanbanCard
              task={activeTask}
              projectName={getProjectName(activeTask.project_id)}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
