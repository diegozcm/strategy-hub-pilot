import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMentoringTips } from '@/hooks/useMentoringTips';
import { useMentorStartups } from '@/hooks/useMentorStartups';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface CreateTipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTip?: any;
}

export const CreateTipModal: React.FC<CreateTipModalProps> = ({
  open,
  onOpenChange,
  editingTip
}) => {
  const { createTip, updateTip } = useMentoringTips();
  const { startups } = useMentorStartups();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'geral',
    priority: 'media' as 'baixa' | 'media' | 'alta',
    startup_company_id: '',
    is_public: false,
    status: 'published' as 'draft' | 'published'
  });

  useEffect(() => {
    if (editingTip) {
      setFormData({
        title: editingTip.title || '',
        content: editingTip.content || '',
        category: editingTip.category || 'geral',
        priority: editingTip.priority || 'media',
        startup_company_id: editingTip.startup_company_id || '',
        is_public: editingTip.is_public || false,
        status: editingTip.status || 'published'
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'geral',
        priority: 'media',
        startup_company_id: '',
        is_public: false,
        status: 'published'
      });
    }
  }, [editingTip, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setLoading(true);
    
    const tipData = {
      ...formData,
      startup_company_id: formData.startup_company_id || null
    };

    try {
      if (editingTip) {
        await updateTip(editingTip.id, tipData);
      } else {
        await createTip(tipData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving tip:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTip ? 'Editar Dica' : 'Nova Dica de Mentoria'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título da dica"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as 'baixa' | 'media' | 'alta' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startup">Startup Específica (Opcional)</Label>
            <Select
              value={formData.startup_company_id}
              onValueChange={(value) => setFormData({ ...formData, startup_company_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma startup ou deixe em branco para todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as startups</SelectItem>
                {startups.map((relation) => (
                  <SelectItem key={relation.startup_company_id} value={relation.startup_company_id}>
                    {relation.company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Digite o conteúdo da sua dica de mentoria..."
              rows={6}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
            <Label htmlFor="is_public">Dica pública (visível para todas as startups)</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as 'draft' | 'published' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {editingTip ? 'Atualizar' : 'Criar'} Dica
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};