import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useGovernanceRules } from '@/hooks/useGovernanceRules';
import { Plus, Save, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const GovernanceRulesSection: React.FC = () => {
  const { rule, ruleItems, isLoading, upsertDescription, addRuleItem, updateRuleItem, deleteRuleItem } = useGovernanceRules();
  const [description, setDescription] = useState('');
  const [descDirty, setDescDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id?: string; title: string; description: string } | null>(null);

  useEffect(() => {
    if (rule?.description !== undefined) {
      setDescription(rule.description || '');
    }
  }, [rule?.description]);

  const handleSaveDescription = () => {
    upsertDescription.mutate(description);
    setDescDirty(false);
  };

  const handleSaveItem = () => {
    if (!editingItem?.title.trim()) return;
    if (editingItem.id) {
      updateRuleItem.mutate({ id: editingItem.id, title: editingItem.title, description: editingItem.description });
    } else {
      addRuleItem.mutate({ title: editingItem.title, description: editingItem.description });
    }
    setEditingItem(null);
    setDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Texto descritivo geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Descrição Geral das Regras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDescDirty(true); }}
            placeholder="Descreva as regras gerais de governança da empresa..."
            className="min-h-[120px]"
          />
          {descDirty && (
            <Button onClick={handleSaveDescription} disabled={upsertDescription.isPending} size="sm">
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lista de regras específicas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Regras Específicas</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingItem({ title: '', description: '' })}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem?.id ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={editingItem?.title || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Título da regra"
                  />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={editingItem?.description || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Detalhamento da regra"
                  />
                </div>
                <Button onClick={handleSaveItem} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {ruleItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhuma regra específica cadastrada</p>
          ) : (
            <div className="space-y-3">
              {ruleItems.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <span className="text-muted-foreground font-medium text-sm mt-0.5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.description && <p className="text-muted-foreground text-xs mt-1">{item.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingItem({ id: item.id, title: item.title, description: item.description || '' }); setDialogOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteRuleItem.mutate(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
