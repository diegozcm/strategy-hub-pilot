import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserSelect } from './UserSelect';
import { Save, Trash2 } from 'lucide-react';

interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  assignee_id: string | null;
}

interface TaskEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  users: CompanyUser[];
  onSave: (taskId: string, updates: Partial<TaskData>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  open,
  onOpenChange,
  task,
  users,
  onSave,
  onDelete
}) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    actual_hours: '',
    assignee_id: null as string | null
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        estimated_hours: task.estimated_hours?.toString() || '',
        actual_hours: task.actual_hours?.toString() || '',
        assignee_id: task.assignee_id
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await onSave(task.id, {
        title: form.title,
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? parseInt(form.estimated_hours) : null,
        actual_hours: form.actual_hours ? parseInt(form.actual_hours) : null,
        assignee_id: form.assignee_id
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    const confirmed = window.confirm('Tem certeza que deseja excluir esta tarefa?');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(task.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1"
              placeholder="Descreva a tarefa..."
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Responsável</Label>
            <UserSelect
              users={users}
              value={form.assignee_id}
              onValueChange={(val) => setForm(prev => ({ ...prev, assignee_id: val }))}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select 
                value={form.status} 
                onValueChange={(val) => setForm(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="done">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Prioridade</Label>
              <Select 
                value={form.priority} 
                onValueChange={(val) => setForm(prev => ({ ...prev, priority: val }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Horas Estimadas</Label>
              <Input
                type="number"
                value={form.estimated_hours}
                onChange={(e) => setForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                className="mt-1"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Horas Realizadas</Label>
              <Input
                type="number"
                value={form.actual_hours}
                onChange={(e) => setForm(prev => ({ ...prev, actual_hours: e.target.value }))}
                className="mt-1"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim()}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
