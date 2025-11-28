import React from 'react';
import { Calendar, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
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
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">Plano Estratégico Ativo</span>
                <Badge variant="default" className="text-xs">Ativo</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="font-medium">{plan.name}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(parseISO(plan.period_start), "dd/MM/yyyy")} - {format(parseISO(plan.period_end), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Objetivos vinculados</p>
            <p className="text-2xl font-semibold">{objectivesCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
