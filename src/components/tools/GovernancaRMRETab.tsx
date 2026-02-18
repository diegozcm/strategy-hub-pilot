import React from 'react';
import { GovernancaSubTabs } from './governance/GovernancaSubTabs';

export const GovernancaRMRETab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Governança RMRE</h2>
        <p className="text-muted-foreground mt-1">
          Calendário de governança para reuniões de monitoramento, revisão e execução
        </p>
      </div>

      <GovernancaSubTabs />
    </div>
  );
};
