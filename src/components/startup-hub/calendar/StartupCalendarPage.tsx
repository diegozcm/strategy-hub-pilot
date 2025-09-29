import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List } from 'lucide-react';
import { useStartupSessions } from '@/hooks/useStartupSessions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CalendarGrid } from './CalendarGrid';
import { SessionsStatsCard } from './SessionsStatsCard';
import { StartupSessionsPage } from '../StartupSessionsPage';

export const StartupCalendarPage: React.FC = () => {
  const { sessions, loading } = useStartupSessions();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Calendário de Mentorias</h1>
        <p className="text-muted-foreground">
          Visualize suas sessões de mentoria e acompanhe o progresso
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <SessionsStatsCard sessions={sessions || []} selectedMonth={selectedMonth} />
          <CalendarGrid
            sessions={sessions || []}
            isMentor={false}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </TabsContent>

        <TabsContent value="list">
          <StartupSessionsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};