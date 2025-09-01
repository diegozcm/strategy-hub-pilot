import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Users, Plus, Edit, Search, FileText, Clock, Building, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useMentorStartupDetails } from '@/hooks/useMentorStartupDetails';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Json } from '@/integrations/supabase/types';

interface MentoringSession {
  id: string;
  mentor_id: string;
  startup_company_id: string;
  session_date: string;
  duration: number;
  session_type: string;
  notes: string;
  action_items: Json;
  follow_up_date?: string;
  status: string;
  created_at: string;
  startup_name?: string;
}

const sessionTypes = [
  { value: 'general', label: 'Geral' },
  { value: 'strategy', label: 'Estratégia' },
  { value: 'product', label: 'Produto' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'team', label: 'Equipe' },
  { value: 'pitch', label: 'Pitch' }
];

export const MentorSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: startups } = useMentorStartupDetails();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<MentoringSession | null>(null);

  const [formData, setFormData] = useState({
    startup_company_id: '',
    session_date: '',
    duration: 60,
    session_type: 'general',
    notes: '',
    action_items: '',
    follow_up_date: ''
  });

  // Fetch mentoring sessions
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['mentoring-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // First get sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('mentor_id', user.id)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        return [];
      }

      // Get company IDs
      const companyIds = [...new Set(sessionsData.map(s => s.startup_company_id))];

      // Get company names
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      // Create company map
      const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);

      return sessionsData.map(session => ({
        ...session,
        startup_name: companyMap.get(session.startup_company_id) || 'Startup Desconhecida'
      }));
    },
    enabled: !!user?.id
  });

  // Create or update session mutation
  const sessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const actionItems = data.action_items ? data.action_items.split('\n').filter((item: string) => item.trim()) : [];
      
      const sessionData = {
        ...data,
        action_items: actionItems,
        mentor_id: user?.id,
        follow_up_date: data.follow_up_date || null
      };

      if (editingSession) {
        const { data: result, error } = await supabase
          .from('mentoring_sessions')
          .update(sessionData)
          .eq('id', editingSession.id)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('mentoring_sessions')
          .insert(sessionData)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-sessions'] });
      toast({
        title: editingSession ? 'Sessão atualizada' : 'Sessão criada',
        description: editingSession ? 'A sessão foi atualizada com sucesso.' : 'A nova sessão foi criada com sucesso.'
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar a sessão.',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionMutation.mutate(formData);
  };

  const handleEdit = (session: MentoringSession) => {
    setEditingSession(session);
    setFormData({
      startup_company_id: session.startup_company_id,
      session_date: format(new Date(session.session_date), 'yyyy-MM-dd'),
      duration: session.duration || 60,
      session_type: session.session_type,
      notes: session.notes || '',
      action_items: session.action_items ? (Array.isArray(session.action_items) ? session.action_items.join('\n') : '') : '',
      follow_up_date: session.follow_up_date ? format(new Date(session.follow_up_date), 'yyyy-MM-dd') : ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingSession(null);
    setFormData({
      startup_company_id: '',
      session_date: '',
      duration: 60,
      session_type: 'general',
      notes: '',
      action_items: '',
      follow_up_date: ''
    });
  };

  // Filter sessions
  const filteredSessions = sessions?.filter(session => {
    const matchesSearch = session.startup_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || session.session_type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  if (isLoading) {
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
          <h1 className="text-2xl font-bold mb-2">Sessões de Mentoria</h1>
          <p className="text-muted-foreground">
            Gerencie suas sessões de mentoria e acompanhe o progresso das startups
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSession ? 'Editar Sessão' : 'Nova Sessão de Mentoria'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Startup</label>
                  <Select
                    value={formData.startup_company_id}
                    onValueChange={(value) => setFormData(prev => ({...prev, startup_company_id: value}))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar startup" />
                    </SelectTrigger>
                    <SelectContent>
                      {startups?.map(startup => (
                        <SelectItem key={startup.id} value={startup.id}>
                          {startup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Sessão</label>
                  <Select
                    value={formData.session_type}
                    onValueChange={(value) => setFormData(prev => ({...prev, session_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data da Sessão</label>
                  <Input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData(prev => ({...prev, session_date: e.target.value}))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duração (minutos)</label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({...prev, duration: parseInt(e.target.value)}))}
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas da Sessão</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Descreva os principais pontos discutidos..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Itens de Ação (um por linha)</label>
                <Textarea
                  value={formData.action_items}
                  onChange={(e) => setFormData(prev => ({...prev, action_items: e.target.value}))}
                  placeholder="Lista de ações a serem tomadas..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Follow-up (opcional)</label>
                <Input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData(prev => ({...prev, follow_up_date: e.target.value}))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={sessionMutation.isPending}>
                  {sessionMutation.isPending ? 'Salvando...' : (editingSession ? 'Atualizar' : 'Criar Sessão')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por startup ou notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {sessionTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">Erro ao carregar sessões: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || typeFilter !== 'all' ? 'Nenhuma sessão encontrada' : 'Nenhuma sessão registrada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece registrando sua primeira sessão de mentoria'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar primeira sessão
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{session.startup_name}</CardTitle>
                      <Badge variant="outline">
                        {sessionTypes.find(t => t.value === session.session_type)?.label || session.session_type}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(session.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {session.duration}min
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(session)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {session.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">Notas</h4>
                    <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
                  </div>
                )}
                {session.action_items && Array.isArray(session.action_items) && session.action_items.length > 0 && (
                  <div className="mb-4">
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
                {session.follow_up_date && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Follow-up agendado:</strong> {format(new Date(session.follow_up_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};