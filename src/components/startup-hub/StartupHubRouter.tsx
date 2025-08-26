
import React, { useState } from 'react';
import { Building, TrendingUp, User, BarChart3, Users, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStartupProfile } from '@/hooks/useStartupProfile';
import { StartupDashboard } from './StartupDashboard';
import { MentorDashboard } from './MentorDashboard';
import { BeepAssessmentPage } from './beep/BeepAssessmentPage';
import { StartupProfileSetup } from './StartupProfileSetup';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const StartupHubRouter: React.FC = () => {
  const { profile, isLoading, hasProfile, isStartup, isMentor } = useStartupProfile();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If no profile exists, show profile setup
  if (!hasProfile) {
    return <StartupProfileSetup />;
  }

  // Navigation items based on profile type
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'profile', label: 'Perfil', icon: User }
    ];

    if (isStartup) {
      return [
        ...baseItems.slice(0, 1),
        { id: 'beep', label: 'Avaliação BEEP', icon: TrendingUp },
        ...baseItems.slice(1)
      ];
    }

    if (isMentor) {
      return [
        ...baseItems.slice(0, 1),
        { id: 'startups', label: 'Startups', icon: Building },
        { id: 'mentoring', label: 'Mentorias', icon: Users },
        ...baseItems.slice(1)
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Startup HUB</h1>
          <p className="text-muted-foreground">
            {isStartup ? 'Dashboard da Startup' : 'Dashboard do Mentor'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {profile?.type === 'startup' ? 'Startup' : 'Mentor'}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          {navigationItems.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className="flex items-center space-x-2">
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard">
          {isStartup ? <StartupDashboard /> : <MentorDashboard />}
        </TabsContent>

        {isStartup && (
          <TabsContent value="beep">
            <BeepAssessmentPage />
          </TabsContent>
        )}

        {isMentor && (
          <>
            <TabsContent value="startups">
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Lista de Startups</h3>
                <p className="text-muted-foreground">Em desenvolvimento...</p>
              </div>
            </TabsContent>

            <TabsContent value="mentoring">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Mentorias Ativas</h3>
                <p className="text-muted-foreground">Em desenvolvimento...</p>
              </div>
            </TabsContent>
          </>
        )}

        <TabsContent value="profile">
          <StartupProfileSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
};
