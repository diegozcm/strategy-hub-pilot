import React from 'react';
import { GovernanceMeetingsSection } from './governance/GovernanceMeetingsSection';
import { GovernanceRulesSection } from './governance/GovernanceRulesSection';
import { Target, BookOpen, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

export const GovernancaRMRETab: React.FC = () => {
  const [rulesOpen, setRulesOpen] = React.useState(false);

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

      <GovernanceMeetingsSection />

      <Collapsible open={rulesOpen} onOpenChange={setRulesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto border rounded-lg bg-muted/30 hover:bg-muted/50">
            <span className="flex items-center gap-2 font-display font-semibold">
              <BookOpen className="h-5 w-5 text-cofound-blue-light" />
              Regras de Governança
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <GovernanceRulesSection />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
