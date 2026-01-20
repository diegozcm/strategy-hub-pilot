import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserSelect } from './UserSelect';
import { Plus, Folder } from 'lucide-react';

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
  objective_ids?: string[];
  pillar_color?: string;
  pillar_name?: string;
  all_pillars?: Array<{ name: string; color: string }>;
}

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: StrategicProject[];
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
          border: pillarColor ? `2px solid ${pillarColor}` : undefined
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            Criar Tarefa
            {selectedProject?.pillar_name && (
              <span 
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${pillarColor}15`,
                  color: pillarColor 
                }}
              >
                {selectedProject.pillar_name}
                {selectedProject?.all_pillars && selectedProject.all_pillars.length > 1 && (
                  <span className="opacity-60"> +{selectedProject.all_pillars.length - 1}</span>
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
                onValueChange={(value) => setForm(prev => ({ ...prev, project_id: value }))}
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
            <Label className="text-xs font-medium text-muted-foreground">Título da Tarefa</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="h-9 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20"
              placeholder="Ex: Implementar nova funcionalidade"
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

          {/* Row 4: Priority, Hours, Due Date */}
          <div className="grid grid-cols-3 gap-4">
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
              <Label className="text-xs font-medium text-muted-foreground">Horas Estimadas</Label>
              <Input
                type="number"
                value={form.estimated_hours}
                onChange={(e) => setForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                className="h-9 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20"
                placeholder="8"
              />
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 px-4">
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={saving || !form.project_id || !form.title.trim()}
              className="h-8 px-4"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
