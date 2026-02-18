import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GovernanceRulesSection } from './GovernanceRulesSection';
import { GovernanceMeetingsSection } from './GovernanceMeetingsSection';
import { GovernanceAgendaSection } from './GovernanceAgendaSection';
import { GovernanceAtasSection } from './GovernanceAtasSection';
import { BookOpen, ClipboardList, FileText, CalendarDays } from 'lucide-react';

export const GovernancaSubTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('regras');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-muted/50">
        <TabsTrigger
          value="regras"
          className="data-[state=active]:bg-cofound-green data-[state=active]:text-cofound-blue-dark font-medium"
        >
          <BookOpen className="h-4 w-4 mr-1.5" /> Regras
        </TabsTrigger>
        <TabsTrigger
          value="pautas"
          className="data-[state=active]:bg-cofound-green data-[state=active]:text-cofound-blue-dark font-medium"
        >
          <ClipboardList className="h-4 w-4 mr-1.5" /> Pautas
        </TabsTrigger>
        <TabsTrigger
          value="atas"
          className="data-[state=active]:bg-cofound-green data-[state=active]:text-cofound-blue-dark font-medium"
        >
          <FileText className="h-4 w-4 mr-1.5" /> ATAs
        </TabsTrigger>
        <TabsTrigger
          value="agenda"
          className="data-[state=active]:bg-cofound-green data-[state=active]:text-cofound-blue-dark font-medium"
        >
          <CalendarDays className="h-4 w-4 mr-1.5" /> Agenda
        </TabsTrigger>
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
