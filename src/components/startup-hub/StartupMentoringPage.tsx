import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageSquare, Globe, Lock, Calendar } from 'lucide-react';
import { useStartupMentoring } from '@/hooks/useStartupMentoring';
import { useStartupSessions } from '@/hooks/useStartupSessions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TipCard } from './TipCard';
import { StartupSessionsPage } from './StartupSessionsPage';
import { MentorInfo } from './MentorInfo';

export const StartupMentoringPage: React.FC = () => {
  console.log('📱 [StartupMentoringPage] Rendering component');
  
  const { tips, loading: tipsLoading, error: tipsError } = useStartupMentoring();
  const { sessions, loading: sessionsLoading, error: sessionsError } = useStartupSessions();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  console.log('📱 [StartupMentoringPage] State:', { 
    tipsCount: tips.length, 
    tipsLoading, 
    tipsError,
    sessionsCount: sessions.length,
    sessionsLoading,
    sessionsError
  });

  const filteredTips = tips.filter(tip => {
    const matchesSearch = tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tip.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tip.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || tip.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  if (tipsLoading && sessionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentoria Startup</h1>
        <p className="text-muted-foreground mt-2">
          Acesse dicas personalizadas e histórico de sessões de mentoria
        </p>
      </div>

      <MentorInfo />

      <Tabs defaultValue="tips" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tips" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Dicas
            {tips.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {tips.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sessões
            {sessions.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {sessions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="space-y-6 mt-6">
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
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipsError && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <p className="text-destructive">Erro ao carregar dicas: {tipsError}</p>
              </CardContent>
            </Card>
          )}

          {filteredTips.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma dica encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Você ainda não recebeu dicas de mentoria. Aguarde até que um mentor compartilhe conselhos com você.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredTips.length} {filteredTips.length === 1 ? 'dica encontrada' : 'dicas encontradas'}
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    {filteredTips.filter(tip => tip.is_public).length} públicas
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    {filteredTips.filter(tip => !tip.is_public).length} direcionadas
                  </Badge>
                </div>
              </div>
              
              <div className="grid gap-4">
                {filteredTips.map((tip) => (
                  <TipCard key={tip.id} tip={tip} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <StartupSessionsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};