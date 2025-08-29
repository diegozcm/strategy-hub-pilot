import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Users, MessageSquare } from 'lucide-react';
import { useMentorStartups } from '@/hooks/useMentorStartups';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MentorStartupsPage: React.FC = () => {
  const { startups, loading, error } = useMentorStartups();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Erro ao carregar startups: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (startups.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma startup atribuída</h3>
            <p className="text-muted-foreground">
              Você ainda não foi associado a nenhuma startup. 
              Entre em contato com um administrador para receber suas atribuições.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Minhas Startups</h1>
        <p className="text-muted-foreground">
          Startups sob sua mentoria - {startups.length} {startups.length === 1 ? 'startup' : 'startups'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {startups.map((relation) => {
          const startup = relation.company;
          return (
            <Card key={relation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {startup.logo_url ? (
                      <img 
                        src={startup.logo_url} 
                        alt={`Logo da ${startup.name}`}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{startup.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(relation.assigned_at), 'MMM yyyy', { locale: ptBR })}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {startup.mission && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Missão</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {startup.mission}
                    </p>
                  </div>
                )}

                {startup.vision && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Visão</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {startup.vision}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};