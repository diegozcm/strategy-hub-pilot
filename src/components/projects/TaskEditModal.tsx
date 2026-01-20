import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserSelect } from './UserSelect';
import { Save, Trash2, Folder } from 'lucide-react';

interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface StrategicProject {
  id: string;
  name: string;
  pillar_color?: string;
  pillar_name?: string;
  objective_ids?: string[];
  all_pillars?: Array<{ name: string; color: string }>;
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
  project_id?: string;
}

interface TaskEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  users: CompanyUser[];
  projects?: StrategicProject[];
  pillarColor?: string;
  pillarName?: string;
  onSave: (taskId: string, updates: Partial<TaskData>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  open,
  onOpenChange,
  task,
  users,
  projects = [],
  pillarColor,
  pillarName,
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
    assignee_id: null as string | null,
    project_id: ''
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
        assignee_id: task.assignee_id,
        project_id: task.project_id || ''
      });
    }
  }, [task]);

  // Get current project info based on form.project_id
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === form.project_id);
  }, [projects, form.project_id]);

  const currentPillarColor = currentProject?.pillar_color || pillarColor;
  const currentPillarName = currentProject?.pillar_name || pillarName;

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
        assignee_id: form.assignee_id,
        project_id: form.project_id || undefined
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
      <DialogContent 
        className="sm:max-w-2xl overflow-hidden"
        style={{
          border: currentPillarColor ? `2px solid ${currentPillarColor}` : undefined
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            Editar Tarefa
            {currentPillarName && (
              <span 
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${currentPillarColor}15`,
                  color: currentPillarColor 
                }}
              >
                {currentPillarName}
                {currentProject?.all_pillars && currentProject.all_pillars.length > 1 && (
                  <span className="opacity-60"> +{currentProject.all_pillars.length - 1}</span>
                )}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Row 1: Project + Responsável */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Folder className="w-3 h-3" />
                Projeto
              </Label>
              <Select 
                value={form.project_id} 
                onValueChange={(val) => setForm(prev => ({ ...prev, project_id: val }))}
              >
                <SelectTrigger className="h-9 text-sm bg-background border-border/60 focus:ring-1 focus:ring-primary/20">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        {project.all_pillars && project.all_pillars.length > 0 ? (
                          <div className="flex -space-x-1">
                            {project.all_pillars.slice(0, 3).map((pillar, idx) => (
                              <div 
                                key={idx}
                                className="w-2.5 h-2.5 rounded-full border border-background flex-shrink-0" 
                                style={{ backgroundColor: pillar.color }}
                              />
                            ))}
                          </div>
                        ) : project.pillar_color && (
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: project.pillar_color }}
                          />
                        )}
                        <span className="truncate">{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Responsável</Label>
              <UserSelect
                users={users}
                value={form.assignee_id}
                onValueChange={(val) => setForm(prev => ({ ...prev, assignee_id: val }))}
                className="h-9"
              />
            </div>
          </div>

          {/* Row 2: Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="h-9 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20"
              placeholder="Título da tarefa"
            />
          </div>

          {/* Row 3: Description (full width) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="text-sm resize-none bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20"
              placeholder="Descreva a tarefa..."
            />
          </div>

          {/* Row 4: Status, Priority, Due Date */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select 
                value={form.status} 
                onValueChange={(val) => setForm(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="h-9 text-sm bg-background border-border/60 focus:ring-1 focus:ring-primary/20">
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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Prioridade</Label>
              <Select 
                value={form.priority} 
                onValueChange={(val) => setForm(prev => ({ ...prev, priority: val }))}
              >
                <SelectTrigger className="h-9 text-sm bg-background border-border/60 focus:ring-1 focus:ring-primary/20">
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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Data de Vencimento</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                className="h-9 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          {/* Row 5: Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Horas Estimadas</Label>
              <Input
                type="number"
                value={form.estimated_hours}
                onChange={(e) => setForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                className="h-9 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Horas Realizadas</Label>
              <Input
                type="number"
                value={form.actual_hours}
                onChange={(e) => setForm(prev => ({ ...prev, actual_hours: e.target.value }))}
                className="h-9 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20"
                placeholder="0"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-3 border-t border-border/60">
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 px-4">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim()} className="h-8 px-4">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
