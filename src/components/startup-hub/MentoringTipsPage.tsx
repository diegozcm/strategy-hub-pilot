import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Globe, Lock } from 'lucide-react';
import { useMentoringTips } from '@/hooks/useMentoringTips';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CreateTipModal } from './CreateTipModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MentoringTipsPage: React.FC = () => {
  const { tips, loading, error, deleteTip } = useMentoringTips();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<any>(null);

  const filteredTips = tips.filter(tip => {
    const matchesSearch = tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tip.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tip.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || tip.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'default';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta dica?')) {
      await deleteTip(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dicas de Mentoria</h1>
          <p className="text-muted-foreground">
            Gerencie suas dicas e conselhos para startups
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Dica
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar dicas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="produto">Produto</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="vendas">Vendas</SelectItem>
            <SelectItem value="tecnologia">Tecnologia</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">Erro ao carregar dicas: {error}</p>
          </CardContent>
        </Card>
      )}

      {filteredTips.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Nenhuma dica encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira dica de mentoria'
              }
            </p>
            {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira dica
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTips.map((tip) => (
            <Card key={tip.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <Badge variant={getPriorityColor(tip.priority)}>
                        {tip.priority}
                      </Badge>
                      <Badge variant="outline">
                        {tip.category}
                      </Badge>
                      {tip.is_public ? (
                        <Badge variant="secondary">
                          <Globe className="h-3 w-3 mr-1" />
                          Pública
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Lock className="h-3 w-3 mr-1" />
                          Privada
                        </Badge>
                      )}
                      <Badge variant={tip.status === 'published' ? 'default' : 'secondary'}>
                        {tip.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                    {tip.company?.name && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Para: {tip.company.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Criado em {format(new Date(tip.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingTip(tip);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(tip.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{tip.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTipModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) setEditingTip(null);
        }}
        editingTip={editingTip}
      />
    </div>
  );
};