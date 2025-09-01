import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Search, Clock, User } from 'lucide-react';
import { useStartupSessions } from '@/hooks/useStartupSessions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Json } from '@/integrations/supabase/types';

const sessionTypes = [
  { value: 'general', label: 'Geral' },
  { value: 'strategy', label: 'Estratégia' },
  { value: 'product', label: 'Produto' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'team', label: 'Equipe' },
  { value: 'pitch', label: 'Pitch' }
];

export const StartupSessionsPage: React.FC = () => {
  console.log('🚀 [StartupSessionsPage] Rendering component');
  
  const { sessions, loading, error, refetch } = useStartupSessions();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  console.log('📊 [StartupSessionsPage] Hook state:', { 
    sessionsCount: sessions?.length || 0, 
    loading, 
    error,
    sessions: sessions?.map(s => ({ id: s.id, mentor: s.mentor_name, date: s.session_date }))
  });

  // Force refresh when component mounts to ensure fresh data
  useEffect(() => {
    console.log('🔄 [StartupSessionsPage] Component mounted, forcing refresh');
    refetch();
  }, [refetch]);

  // Filter sessions
  const filteredSessions = sessions?.filter(session => {
    const matchesSearch = session.mentor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || session.session_type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Suas Sessões de Mentoria</h1>
        <p className="text-muted-foreground">
          Acompanhe suas sessões de mentoria e revise os pontos discutidos
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mentor ou notas..."
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
            <p className="text-destructive">Erro ao carregar sessões: {error}</p>
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
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Suas sessões de mentoria aparecerão aqui quando forem registradas pelo mentor'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'sessão encontrada' : 'sessões encontradas'}
            </p>
          </div>
          
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          {session.mentor_name}
                        </div>
                      </CardTitle>
                      <Badge variant="outline">
                        {sessionTypes.find(t => t.value === session.session_type)?.label || session.session_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(session.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {session.duration}min
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {session.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">Notas da Sessão</h4>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{session.notes}</p>
                  </div>
                )}
                {session.action_items && Array.isArray(session.action_items) && session.action_items.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">Itens de Ação para Você</h4>
                    <div className="bg-primary/5 p-3 rounded-md">
                      <ul className="text-sm space-y-2">
                        {(session.action_items as string[]).map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary mr-2 font-bold">•</span>
                            <span className="flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {session.follow_up_date && (
                  <div className="text-sm">
                    <Badge variant="secondary" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Follow-up: {format(new Date(session.follow_up_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </Badge>
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