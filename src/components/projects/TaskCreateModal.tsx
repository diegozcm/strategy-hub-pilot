import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserSelect } from './UserSelect';
import { Plus } from 'lucide-react';

interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface StrategicObjective {
  id: string;
  title: string;
  pillar_id: string;
  strategic_pillars?: {
    name: string;
    color: string;
  };
}

interface StrategicProject {
  id: string;
  name: string;
  objective_ids?: string[];
  pillar_color?: string;
  pillar_name?: string;
}

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: StrategicProject[];
  objectives: StrategicObjective[];
  users: CompanyUser[];
  onSave: (data: {
    project_id: string;
    title: string;
    description: string;
    priority: string;
    estimated_hours: string;
    due_date: string;
    assignee_id: string | null;
  }) => Promise<void>;
  defaultProjectId?: string;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  open,
  onOpenChange,
  projects,
  objectives,
  users,
  onSave,
  defaultProjectId
}) => {
  const [form, setForm] = useState({
    project_id: '',
    title: '',
    description: '',
    priority: 'medium',
    estimated_hours: '',
    due_date: '',
    assignee_id: null as string | null
  });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({
        project_id: defaultProjectId || '',
        title: '',
        description: '',
        priority: 'medium',
        estimated_hours: '',
        due_date: '',
        assignee_id: null
      });
    }
  }, [open, defaultProjectId]);

  // Get pillar color from selected project
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === form.project_id);
  }, [projects, form.project_id]);

  const pillarColor = selectedProject?.pillar_color;

  // Get objectives for selected project
  const projectObjectives = useMemo(() => {
    if (!selectedProject?.objective_ids?.length) return [];
    return objectives.filter(obj => selectedProject.objective_ids?.includes(obj.id));
  }, [selectedProject, objectives]);

  const handleSave = async () => {
    if (!form.project_id || !form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-2xl overflow-hidden"
        style={{
          borderLeft: pillarColor ? `4px solid ${pillarColor}` : undefined
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Criar Tarefa
            {selectedProject?.pillar_name && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${pillarColor}20`,
                  color: pillarColor 
                }}
              >
                {selectedProject.pillar_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Row 1: Project + Objective */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Projeto</Label>
              <Select 
                value={form.project_id} 
                onValueChange={(value) => setForm(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        {project.pillar_color && (
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: project.pillar_color }}
                          />
                        )}
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Objetivo Estratégico</Label>
              <div className="mt-1 text-sm text-muted-foreground border rounded-md p-2 min-h-[38px] flex items-center">
                {projectObjectives.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {projectObjectives.slice(0, 2).map(obj => (
                      <span 
                        key={obj.id}
                        className="text-xs px-2 py-0.5 rounded-full bg-accent"
                      >
                        {obj.title.length > 20 ? `${obj.title.slice(0, 20)}...` : obj.title}
                      </span>
                    ))}
                    {projectObjectives.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{projectObjectives.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs italic">Selecione um projeto</span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <Label className="text-xs text-muted-foreground">Título da Tarefa</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1"
              placeholder="Ex: Implementar nova funcionalidade"
            />
          </div>

          {/* Row 3: Description + Assignee */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Row 4: Priority, Hours, Due Date */}
          <div className="grid grid-cols-3 gap-4">
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

            <div>
              <Label className="text-xs text-muted-foreground">Horas Estimadas</Label>
              <Input
                type="number"
                value={form.estimated_hours}
                onChange={(e) => setForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                className="mt-1"
                placeholder="8"
              />
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={saving || !form.project_id || !form.title.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              {saving ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
