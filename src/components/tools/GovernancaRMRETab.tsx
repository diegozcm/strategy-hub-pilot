import React from 'react';
import { GovernancaSubTabs } from './governance/GovernancaSubTabs';
import { Target } from 'lucide-react';

export const GovernancaRMRETab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Target className="h-6 w-6 text-cofound-blue-light" />
          Governança RMRE
        </h2>
        <p className="text-muted-foreground mt-1 ml-8">
          Calendário de governança para reuniões de monitoramento, revisão e execução
        </p>
      </div>

      <GovernancaSubTabs />
    </div>
  );
};
