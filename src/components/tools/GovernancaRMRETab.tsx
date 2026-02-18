import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

export const GovernancaRMRETab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Governança RMRE</h2>
        <p className="text-muted-foreground mt-1">
          Calendário de governança para reuniões de monitoramento, revisão e execução
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Calendário de Governança
          </CardTitle>
          <CardDescription>
            Visualize e gerencie as reuniões de governança da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CalendarDays className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Em breve</p>
            <p className="text-sm">O calendário de governança será implementado aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
