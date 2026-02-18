import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GovernanceRulesSection } from './GovernanceRulesSection';
import { GovernanceMeetingsSection } from './GovernanceMeetingsSection';
import { GovernanceAgendaSection } from './GovernanceAgendaSection';
import { GovernanceAtasSection } from './GovernanceAtasSection';

export const GovernancaSubTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('regras');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="regras">Regras</TabsTrigger>
        <TabsTrigger value="pautas">Pautas</TabsTrigger>
        <TabsTrigger value="atas">ATAs</TabsTrigger>
        <TabsTrigger value="agenda">Agenda</TabsTrigger>
      </TabsList>

      <TabsContent value="regras" className="mt-4">
        <GovernanceRulesSection />
      </TabsContent>

      <TabsContent value="pautas" className="mt-4">
        <GovernanceAgendaSection />
      </TabsContent>

      <TabsContent value="atas" className="mt-4">
        <GovernanceAtasSection />
      </TabsContent>

      <TabsContent value="agenda" className="mt-4">
        <GovernanceMeetingsSection />
      </TabsContent>
    </Tabs>
  );
};
