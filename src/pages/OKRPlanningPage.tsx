import React from 'react';
import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const OKRPlanningPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">OKR Planning</h1>
          <p className="text-muted-foreground">Planejamento e Gestão de OKRs</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Módulo OKR Planning</CardTitle>
          <CardDescription>
            Este módulo está em desenvolvimento e em breve você poderá gerenciar seus OKRs (Objectives and Key Results) de forma completa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-6 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Funcionalidades Planejadas</h3>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
              <li>• Criação e gestão de Objetivos</li>
              <li>• Definição de Key Results mensuráveis</li>
              <li>• Acompanhamento de progresso em tempo real</li>
              <li>• Alinhamento de OKRs entre times</li>
              <li>• Relatórios e dashboards de performance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OKRPlanningPage;
