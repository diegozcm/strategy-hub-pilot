

# Plano: Atualização Automática de Status de Projetos Baseado em Tasks

## Resumo

Implementar uma função utilitária que calcula automaticamente o status de um projeto estratégico baseado no status de suas tarefas, executando essa lógica sempre que uma task for criada, atualizada (status) ou excluída.

---

## Regras de Negócio

| Condição | Status do Projeto |
|----------|-------------------|
| Todas as tasks em "todo" | `planning` |
| Pelo menos uma task em "in_progress" ou "review" | `active` |
| Todas as tasks em "done" | `completed` |
| Nenhuma task | Manter status atual |
| Status "on_hold" ou "cancelled" | **Não alterar** (manual) |

---

## Arquivos a Criar/Modificar

### 1. Criar Função Utilitária

**Novo arquivo: `src/utils/projectStatusUtils.ts`**

```typescript
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';

interface TaskForStatus {
  status: string;
}

/**
 * Calcula o status do projeto baseado nas suas tasks
 * Retorna null se o projeto não deve ser atualizado (status manual)
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
  
  // Fallback: mixed states = active
  return 'active';
}
```

---

### 2. Modificar ProjectsPage.tsx

**Importar a função:**
```typescript
import { calculateProjectStatus } from '@/utils/projectStatusUtils';
```

**Criar função auxiliar para atualizar status do projeto:**
```typescript
const updateProjectStatusIfNeeded = async (projectId: string) => {
  // Buscar projeto atual
  const project = projects.find(p => p.id === projectId);
  if (!project) return;
  
  // Buscar todas as tasks do projeto (do estado local)
  const projectTasks = tasks.filter(t => t.project_id === projectId);
  
  // Calcular novo status
  const newStatus = calculateProjectStatus(projectTasks, project.status);
  
  // Se não precisa atualizar, retornar
  if (!newStatus || newStatus === project.status) return;
  
  // Atualizar no banco
  await supabase
    .from('strategic_projects')
    .update({ status: newStatus })
    .eq('id', projectId);
  
  // Atualizar estado local
  setProjects(prev => prev.map(p => 
    p.id === projectId ? { ...p, status: newStatus } : p
  ));
};
```

**Integrar nos handlers existentes:**

| Função | Alteração |
|--------|-----------|
| `createTask` | Adicionar chamada após inserção: `await updateProjectStatusIfNeeded(taskForm.project_id)` |
| `createQuickTask` | Adicionar chamada após inserção: `await updateProjectStatusIfNeeded(projectId)` |
| `updateTask` | Verificar se status mudou e chamar: `await updateProjectStatusIfNeeded(updates.project_id \|\| currentTask.project_id)` |
| `deleteTask` | Adicionar chamada após exclusão: `await updateProjectStatusIfNeeded(deletedTask.project_id)` |
| `updateTaskStatus` | Adicionar chamada após atualização: `await updateProjectStatusIfNeeded(task.project_id)` |

---

### 3. Modificar KanbanBoard.tsx

No `handleDragEnd`, quando uma task muda de coluna (status), precisamos propagar essa mudança para atualizar o status do projeto.

**Alteração:** Adicionar prop `onProjectStatusUpdate` ao KanbanBoard e chamá-la após mover tasks entre colunas.

```typescript
interface KanbanBoardProps {
  // ... props existentes
  onProjectStatusUpdate?: (projectId: string) => void;
}
```

No `handleDragEnd`, após atualizar o status da task no banco:
```typescript
// Após mover task para nova coluna com sucesso
if (onProjectStatusUpdate && currentTask?.project_id) {
  onProjectStatusUpdate(currentTask.project_id);
}
```

---

### 4. Atualizar chamada do KanbanBoard em ProjectsPage.tsx

```tsx
<KanbanBoard
  tasks={kanbanFilteredTasks}
  projects={kanbanProjects}
  selectedProject={selectedProject}
  onProjectFilterChange={setSelectedProject}
  onTasksUpdate={setTasks}
  companyUsers={companyUsers}
  onEditTask={handleEditTask}
  onProjectStatusUpdate={updateProjectStatusIfNeeded}  // Nova prop
/>
```

---

## Fluxo Visual

```text
┌─────────────────────────────────────────────────────────────┐
│                    EVENTOS DE TASK                          │
├─────────────────────────────────────────────────────────────┤
│  Criar Task    │  Atualizar Status  │  Excluir Task         │
│       ↓        │         ↓          │        ↓              │
└───────┬────────┴─────────┬──────────┴────────┬──────────────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           ↓
          ┌────────────────────────────────────┐
          │  updateProjectStatusIfNeeded()     │
          ├────────────────────────────────────┤
          │ 1. Buscar tasks do projeto         │
          │ 2. calculateProjectStatus()        │
          │ 3. Se mudou: atualizar banco       │
          │ 4. Atualizar estado local          │
          └────────────────────────────────────┘
                           ↓
          ┌────────────────────────────────────┐
          │     REGRAS DE CÁLCULO              │
          ├────────────────────────────────────┤
          │ • Todas todo → planning            │
          │ • Alguma in_progress → active      │
          │ • Todas done → completed           │
          │ • on_hold/cancelled → não alterar  │
          └────────────────────────────────────┘
```

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/utils/projectStatusUtils.ts` | **Criar** |
| `src/components/projects/ProjectsPage.tsx` | Modificar |
| `src/components/projects/kanban/KanbanBoard.tsx` | Modificar |

---

## Considerações Técnicas

1. **Performance**: A função `updateProjectStatusIfNeeded` utiliza o estado local para obter as tasks, evitando queries adicionais ao banco
2. **Consistência**: Atualização é feita tanto no banco quanto no estado local para manter a UI sincronizada
3. **Status Manuais**: Os status "on_hold" e "cancelled" são protegidos e só podem ser alterados manualmente pelo usuário
4. **Projeto sem Tasks**: Se um projeto não tiver tasks, seu status não é alterado automaticamente

