import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Save, X, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResultadoChaveMiniCard } from '@/components/strategic-map/ResultadoChaveMiniCard';
import { KeyResult } from '@/types/strategic-map';

// Flexible interface for objective to support both ObjectivesPage and StrategicMap
interface ObjectiveData {
  id: string;
  plan_id: string;
  pillar_id: string;
  title: string;
  description?: string;
  responsible?: string;
  deadline?: string;
  status?: string;
  progress: number;
  owner_id: string;
  target_date?: string;
  created_at: string;
  updated_at?: string;
}

interface StrategicPillar {
  id: string;
  name: string;
  description?: string;
  color: string;
  company_id?: string;
}

interface StrategicPlan {
  id: string;
  name: string;
  status?: string;
  period_start?: string;
  period_end?: string;
  vision?: string;
  mission?: string;
  company_id?: string;
  created_at?: string;
}

interface ObjectiveDetailModalProps {
  objective: ObjectiveData | null;
  open: boolean;
  onClose: () => void;
  keyResults: KeyResult[];
  pillar: StrategicPillar | null;
  plan: StrategicPlan | null;
  onUpdate: (data: Partial<ObjectiveData>) => Promise<void>;
  onDelete: () => Promise<void>;
  onOpenKeyResultDetails: (kr: KeyResult) => void;
  pillars: StrategicPillar[];
  progressPercentage: number;
}

export const ObjectiveDetailModal: React.FC<ObjectiveDetailModalProps> = ({
  objective,
  open,
  onClose,
  keyResults,
  pillar,
  plan,
  onUpdate,
  onDelete,
  onOpenKeyResultDetails,
  pillars,
  progressPercentage,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    target_date: '',
    pillar_id: '',
  });

  useEffect(() => {
    if (objective) {
      setEditForm({
        title: objective.title,
        description: objective.description || '',
        target_date: objective.target_date || '',
        pillar_id: objective.pillar_id || '',
      });
    }
  }, [objective]);

  const handleUpdate = async () => {
    await onUpdate(editForm);
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!objective) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {objective.title}
              </DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  {pillar && (
                    <Badge 
                      variant="secondary" 
                      style={{ 
                        backgroundColor: `${pillar.color}20`, 
                        color: pillar.color 
                      }}
                    >
                      {pillar.name}
                    </Badge>
                  )}
                  {plan && (
                    <Badge variant="outline">
                      {plan.name}
                    </Badge>
                  )}
                  <Badge 
                    className={`font-semibold ${
                      progressPercentage < 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                      progressPercentage < 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                      progressPercentage < 80 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}
                  >
                    {progressPercentage}% de avanço
                  </Badge>
                </div>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-target-date">Data Meta</Label>
                  <Input
                    id="edit-target-date"
                    type="date"
                    value={editForm.target_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, target_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-pillar">Pilar Estratégico</Label>
                  <Select value={editForm.pillar_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, pillar_id: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pillars.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">{objective.description || 'Nenhuma descrição fornecida.'}</p>
              </div>
              
              {objective.target_date && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Data Meta</h4>
                  <p className="text-xs">{new Date(objective.target_date).toLocaleDateString('pt-BR')}</p>
                </div>
              )}

              <div>
                <div className="mb-3">
                  <h3 className="font-medium">Resultados-Chave</h3>
                </div>
                <div className="space-y-2">
                  {keyResults.map((kr) => (
                    <ResultadoChaveMiniCard 
                      key={kr.id} 
                      resultadoChave={kr}
                      pillar={pillar}
                      onOpenDetails={onOpenKeyResultDetails}
                    />
                  ))}
                  {keyResults.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Nenhum resultado-chave definido.
                      </p>
                      <Button 
                        onClick={() => navigate('/app/indicators')}
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Criar Primeiro Resultado-Chave
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
