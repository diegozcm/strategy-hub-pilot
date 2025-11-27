import React from 'react';
import { Calendar, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ActivePlanCardProps {
  plan: {
    id: string;
    name: string;
    period_start: string;
    period_end: string;
    vision?: string;
    mission?: string;
    status: string;
  } | null;
  objectivesCount: number;
}

export const ActivePlanCard: React.FC<ActivePlanCardProps> = ({ plan, objectivesCount }) => {
  const navigate = useNavigate();

  if (!plan) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Nenhum Plano Ativo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Não há nenhum plano estratégico ativo no momento. Para começar a criar objetivos,
                um gerente ou administrador precisa ativar um plano nas configurações do módulo.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/app/settings?tab=modules')}
              >
                Ir para Configurações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Plano Estratégico Ativo
          </CardTitle>
          <Badge variant="default">Ativo</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(plan.period_start), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} 
                {' - '}
                {format(new Date(plan.period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>

          {(plan.vision || plan.mission) && (
            <div className="grid gap-3">
              {plan.vision && (
                <div>
                  <p className="text-sm font-medium mb-1">Visão</p>
                  <p className="text-sm text-muted-foreground">{plan.vision}</p>
                </div>
              )}
              {plan.mission && (
                <div>
                  <p className="text-sm font-medium mb-1">Missão</p>
                  <p className="text-sm text-muted-foreground">{plan.mission}</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Objetivos vinculados</span>
              <span className="font-semibold">{objectivesCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
