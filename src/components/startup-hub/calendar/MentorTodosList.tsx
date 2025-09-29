import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { useMentorTodos, type MentorTodo } from '@/hooks/useMentorTodos';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MentorTodosListProps {
  onCreateClick: () => void;
  onEditClick: (todo: MentorTodo) => void;
}

export const MentorTodosList: React.FC<MentorTodosListProps> = ({
  onCreateClick,
  onEditClick
}) => {
  const { todos, loading, updateTodo, deleteTodo } = useMentorTodos();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Progresso';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const handleToggleComplete = async (todo: MentorTodo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    await updateTodo(todo.id, { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este TODO?')) {
      await deleteTodo(id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Minhas Tarefas</h2>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo TODO
        </Button>
      </div>

      {todos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhuma tarefa cadastrada.</p>
            <p className="text-sm mt-2">Clique em "Novo TODO" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todos.map((todo) => (
            <Card key={todo.id} className={todo.status === 'completed' ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={todo.status === 'completed'}
                    onCheckedChange={() => handleToggleComplete(todo)}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`font-medium ${todo.status === 'completed' ? 'line-through' : ''}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {todo.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditClick(todo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(todo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {todo.startup_name}
                      </Badge>
                      <Badge variant={getPriorityColor(todo.priority)} className="text-xs">
                        {getPriorityLabel(todo.priority)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getStatusLabel(todo.status)}
                      </Badge>
                      {todo.due_date && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(todo.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
