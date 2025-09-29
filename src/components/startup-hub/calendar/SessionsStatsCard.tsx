import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import { MentoringSession } from '@/hooks/useMentorSessions';

// Unified session type for calendar display
type CalendarSession = MentoringSession & {
  mentor_name?: string;
};

interface SessionsStatsCardProps {
  sessions: CalendarSession[];
  selectedMonth: Date;
}

export const SessionsStatsCard: React.FC<SessionsStatsCardProps> = ({ sessions, selectedMonth }) => {
  // Filter sessions for the selected month
  const monthSessions = sessions.filter(session => {
    const sessionDate = new Date(session.session_date);
    return sessionDate.getMonth() === selectedMonth.getMonth() && 
           sessionDate.getFullYear() === selectedMonth.getFullYear();
  });

  // Calculate stats
  const totalSessions = monthSessions.length;
  const totalHours = monthSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60;
  const uniqueStartups = new Set(monthSessions.map(s => s.startup_company_id)).size;
  
  // Sessions by startup
  const sessionsByStartup = monthSessions.reduce((acc, session) => {
    const startupName = session.startup_name || 'Startup';
    acc[startupName] = (acc[startupName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topStartup = Object.entries(sessionsByStartup).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    {
      title: 'Total de Sessões',
      value: totalSessions,
      icon: Calendar,
      description: 'sessões neste mês'
    },
    {
      title: 'Horas de Mentoria',
      value: totalHours.toFixed(1),
      icon: Clock,
      description: 'horas investidas'
    },
    {
      title: 'Startups Atendidas',
      value: uniqueStartups,
      icon: Users,
      description: 'startups diferentes'
    },
    {
      title: 'Startup Mais Ativa',
      value: topStartup?.[1] || 0,
      icon: TrendingUp,
      description: topStartup ? `${topStartup[0]}` : 'Nenhuma'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};