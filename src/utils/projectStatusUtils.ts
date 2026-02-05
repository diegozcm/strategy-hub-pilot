export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';

interface TaskForStatus {
  status: string;
}

/**
 * Calcula o status do projeto baseado nas suas tasks
 * Retorna null se o projeto não deve ser atualizado (status manual)
 * 
 * Regras:
 * - Todas as tasks em "todo" → planning
 * - Pelo menos uma task em "in_progress" ou "review" → active
 * - Todas as tasks em "done" → completed
 * - Sem tasks → manter status atual (null)
 * - Status "on_hold" ou "cancelled" → não alterar (null)
 */
export function calculateProjectStatus(
  tasks: TaskForStatus[],
  currentProjectStatus?: string
): ProjectStatus | null {
  // Não alterar status manual (on_hold ou cancelled)
  if (currentProjectStatus === 'on_hold' || currentProjectStatus === 'cancelled') {
    return null;
  }

  // Sem tasks = manter status atual
  if (tasks.length === 0) {
    return null;
  }

  const allTodo = tasks.every(t => t.status === 'todo');
  const allDone = tasks.every(t => t.status === 'done');
  const hasInProgress = tasks.some(t => 
    t.status === 'in_progress' || t.status === 'review'
  );

  if (allDone) return 'completed';
  if (hasInProgress) return 'active';
  if (allTodo) return 'planning';
  
  // Fallback: mixed states (some done, some todo) = active
  return 'active';
}
