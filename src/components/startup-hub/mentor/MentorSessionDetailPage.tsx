import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit2, Trash2, MessageSquare, Calendar, Clock, User } from 'lucide-react';
import { useMentorSessionWithTips } from '@/hooks/useMentorSessionWithTips';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sessionTypes = [
  { value: 'general', label: 'Geral' },
  { value: 'strategy', label: 'Estratégia' },
  { value: 'product', label: 'Produto' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'team', label: 'Equipe' },
  { value: 'pitch', label: 'Pitch' }
];

const tipCategories = [
  { value: 'geral', label: 'Geral' },
  { value: 'estrategia', label: 'Estratégia' },
  { value: 'produto', label: 'Produto' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'equipe', label: 'Equipe' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'validacao', label: 'Validação' }
];

const priorityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' }
];

const getPriorityColor = (priority: string): 'destructive' | 'default' | 'secondary' => {
  switch (priority.toLowerCase()) {
    case 'alta': return 'destructive';
    case 'media': return 'default';
    case 'baixa': return 'secondary';
    default: return 'default';
  }
};

export const MentorSessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { sessions, loading, createTipInSession, updateTip, deleteTip } = useMentorSessionWithTips();
  
  const [isCreateTipModalOpen, setIsCreateTipModalOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<any | null>(null);
  const [tipFormData, setTipFormData] = useState({
    title: '',
    content: '',
    category: 'geral',
    priority: 'media',
    is_public: false
  });

  const session = sessions.find(s => s.id === sessionId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Sessão não encontrada</h2>
        <Button onClick={() => navigate('/app/startup-hub/mentor/sessions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Sessões
        </Button>
      </div>
    );
  }

  const handleCreateTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;

    const result = await createTipInSession(sessionId, {
      ...tipFormData,
      status: 'published'
    });

    if (!result.error) {
      handleCloseTipModal();
    }
  };

  const handleEditTip = (tip: any) => {
    setEditingTip(tip);
    setTipFormData({
      title: tip.title,
      content: tip.content,
      category: tip.category,
      priority: tip.priority,
      is_public: tip.is_public
    });
    setIsCreateTipModalOpen(true);
  };

  const handleUpdateTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTip) return;

    const result = await updateTip(editingTip.id, tipFormData);
    if (!result.error) {
      handleCloseTipModal();
    }
  };

  const handleDeleteTip = async (tipId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta dica?')) {
      await deleteTip(tipId);
    }
  };

  const handleCloseTipModal = () => {
    setIsCreateTipModalOpen(false);
    setEditingTip(null);
    setTipFormData({
      title: '',
      content: '',
      category: 'geral',
      priority: 'media',
      is_public: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/app/startup-hub/mentor/sessions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sessão com {session.startup_name}</h1>
            <p className="text-muted-foreground">
              Gerencie as dicas desta sessão de mentoria
            </p>
          </div>
        </div>
        <Dialog open={isCreateTipModalOpen} onOpenChange={setIsCreateTipModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Dica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTip ? 'Editar Dica' : 'Nova Dica para esta Sessão'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingTip ? handleUpdateTip : handleCreateTip} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título da Dica</label>
                <Input
                  value={tipFormData.title}
                  onChange={(e) => setTipFormData(prev => ({...prev, title: e.target.value}))}
                  placeholder="Ex: Como validar seu MVP"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={tipFormData.category}
                    onValueChange={(value) => setTipFormData(prev => ({...prev, category: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tipCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select
                    value={tipFormData.priority}
                    onValueChange={(value) => setTipFormData(prev => ({...prev, priority: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo da Dica</label>
                <Textarea
                  value={tipFormData.content}
                  onChange={(e) => setTipFormData(prev => ({...prev, content: e.target.value}))}
                  placeholder="Descreva a dica detalhadamente..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={tipFormData.is_public}
                  onChange={(e) => setTipFormData(prev => ({...prev, is_public: e.target.checked}))}
                />
                <label htmlFor="is_public" className="text-sm">
                  Tornar esta dica pública (visível para outras startups)
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseTipModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTip ? 'Atualizar Dica' : 'Criar Dica'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              {session.startup_name}
              <Badge variant="outline">
                {sessionTypes.find(t => t.value === session.session_type)?.label || session.session_type}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(session.session_date), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {session.duration}min
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {session.notes && (
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Notas</h4>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{session.notes}</p>
            </div>
          )}
          {session.action_items && Array.isArray(session.action_items) && session.action_items.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Itens de Ação</h4>
              <ul className="text-sm space-y-1">
                {(session.action_items as string[]).map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Dicas desta Sessão
            {session.tips_count! > 0 && (
              <Badge variant="secondary">{session.tips_count}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!session.tips || session.tips.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma dica criada</h3>
              <p className="text-muted-foreground mb-4">
                Adicione dicas relacionadas a esta sessão de mentoria
              </p>
              <Button onClick={() => setIsCreateTipModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira dica
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {session.tips.map((tip) => (
                <Card key={tip.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{tip.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(tip.priority)} className="text-xs">
                          {tip.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tip.category}
                        </Badge>
                        {tip.is_public && (
                          <Badge variant="secondary" className="text-xs">Pública</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTip(tip)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTip(tip.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm whitespace-pre-wrap mb-2">{tip.content}</p>
                    <p className="text-xs text-muted-foreground">
                      Criada em {format(new Date(tip.created_at), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};