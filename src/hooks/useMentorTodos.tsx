import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from 'sonner';

export interface MentorTodo {
  id: string;
  mentor_id: string;
  startup_company_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  startup_name?: string;
}

export const useMentorTodos = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<MentorTodo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mentor_todos')
        .select(`
          *,
          companies:startup_company_id (
            name
          )
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const todosWithStartupName = data?.map(todo => ({
        ...todo,
        startup_name: todo.companies?.name
      })) || [];

      setTodos(todosWithStartupName);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Erro ao carregar TODOs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [user]);

  const createTodo = async (todo: Omit<MentorTodo, 'id' | 'mentor_id' | 'created_at' | 'updated_at' | 'startup_name'>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data, error } = await supabase
        .from('mentor_todos')
        .insert({
          ...todo,
          mentor_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('TODO criado com sucesso');
      await fetchTodos();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating todo:', error);
      toast.error('Erro ao criar TODO');
      return { error: 'Erro ao criar TODO', data: null };
    }
  };

  const updateTodo = async (id: string, updates: Partial<MentorTodo>) => {
    try {
      const { data, error } = await supabase
        .from('mentor_todos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('TODO atualizado com sucesso');
      await fetchTodos();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Erro ao atualizar TODO');
      return { error: 'Erro ao atualizar TODO', data: null };
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mentor_todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('TODO removido com sucesso');
      await fetchTodos();
      return { error: null };
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Erro ao remover TODO');
      return { error: 'Erro ao remover TODO' };
    }
  };

  return {
    todos,
    loading,
    createTodo,
    updateTodo,
    deleteTodo,
    refetch: fetchTodos
  };
};
