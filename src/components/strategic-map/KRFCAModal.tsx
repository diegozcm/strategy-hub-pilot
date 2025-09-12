import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KRFCA } from '@/types/strategic-map';

interface KRFCAModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (fcaData: Omit<KRFCA, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'actions'>) => Promise<void>;
  fca?: KRFCA;
  keyResultId: string;
}

export const KRFCAModal: React.FC<KRFCAModalProps> = ({
  open,
  onClose,
  onSave,
  fca,
  keyResultId,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    fact: '',
    cause: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'active' as 'active' | 'resolved' | 'cancelled',
  });
  
  const [loading, setLoading] = useState(false);

  // Resetar form quando modal abrir/fechar ou fca mudar
  useEffect(() => {
    if (open) {
      if (fca) {
        setFormData({
          title: fca.title,
          fact: fca.fact,
          cause: fca.cause,
          description: fca.description || '',
          priority: fca.priority,
          status: fca.status,
        });
      } else {
        setFormData({
          title: '',
          fact: '',
          cause: '',
          description: '',
          priority: 'medium',
          status: 'active',
        });
      }
    }
  }, [open, fca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.fact.trim() || !formData.cause.trim()) return;

    setLoading(true);
    try {
      await onSave({
        key_result_id: keyResultId,
        title: formData.title.trim(),
        fact: formData.fact.trim(),
        cause: formData.cause.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
      });
      onClose();
    } catch (error) {
      console.error('Error saving FCA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fca ? 'Editar FCA' : 'Novo FCA (Fact, Cause, Action)'}
          </DialogTitle>
          <DialogDescription className="sr-only">Preencha os campos para criar ou editar um FCA vinculado ao KR da empresa</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do FCA *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título resumido do problema/situação"
                required
              />
            </div>

            <div>
              <Label htmlFor="fact">Fato (O que aconteceu?) *</Label>
              <Textarea
                id="fact"
                value={formData.fact}
                onChange={(e) => setFormData(prev => ({ ...prev, fact: e.target.value }))}
                placeholder="Descreva objetivamente o que foi observado ou medido. Ex: 'A conversão de leads caiu 15% no último mês'"
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Seja específico e objetivo. Use dados quantificáveis quando possível.
              </p>
            </div>

            <div>
              <Label htmlFor="cause">Causa (Por que aconteceu?) *</Label>
              <Textarea
                id="cause"
                value={formData.cause}
                onChange={(e) => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                placeholder="Identifique a causa raiz do problema. Ex: 'Mudança no algoritmo da landing page que impactou a experiência do usuário'"
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Foque na causa raiz, não apenas nos sintomas. Use análise de "5 Porquês" se necessário.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Descrição Adicional</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Contexto adicional, impactos, ou informações relevantes"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Baixa</SelectItem>
                    <SelectItem value="medium">🟡 Média</SelectItem>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">🔵 Ativo</SelectItem>
                    <SelectItem value="resolved">✅ Resolvido</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim() || !formData.fact.trim() || !formData.cause.trim()}
            >
              {loading ? 'Salvando...' : (fca ? 'Atualizar' : 'Criar FCA')}
            </Button>
          </div>
        </form>

        {/* Explicação do FCA */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">💡 O que é um FCA?</h4>
          <p className="text-xs text-muted-foreground">
            <strong>Fact (Fato):</strong> O que realmente aconteceu (dados objetivos)<br/>
            <strong>Cause (Causa):</strong> Por que aconteceu (causa raiz)<br/>
            <strong>Action (Ação):</strong> O que fazer para resolver (ações corretivas)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Use FCAs para organizar suas ações de forma lógica e rastreável, conectando problemas às suas soluções.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};