import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building } from 'lucide-react';
import { useStartupProfile } from '@/hooks/useStartupProfile';
import { StartupDashboard } from './StartupDashboard';
import { MentorDashboard } from './MentorDashboard';
import { BeepAssessmentPage } from './beep/BeepAssessmentPage';
import { StartupProfileSetup } from './StartupProfileSetup';
import { MentorStartupsPage } from './MentorStartupsPage';
import { MentoringTipsPage } from './MentoringTipsPage';
import { StartupMentoringPage } from './StartupMentoringPage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MentorBeepResultsPage } from './mentor/MentorBeepResultsPage';

export const StartupHubRouter: React.FC = () => {
  const { profile, company, isLoading, hasProfile, isStartup, isMentor, hasStartupCompany } = useStartupProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const handleNavigateToBeep = () => {
    setSearchParams({ tab: 'beep' });
  };

  // Set default tab if none specified
  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'dashboard' });
    }
  }, [searchParams, setSearchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show profile setup if no profile exists or if startup but no company
  if (!hasProfile || (isStartup && !hasStartupCompany)) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {!hasProfile ? 'Configure seu Perfil' : 'Aguardando Associação à Startup'}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {!hasProfile 
              ? 'Complete seu perfil para começar a usar o Startup HUB.'
              : 'Você precisa estar associado a uma startup para acessar o dashboard. Entre em contato com o administrador.'
            }
          </p>
        </div>
        {!hasProfile && <StartupProfileSetup />}
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isStartup ? (
          <StartupDashboard onNavigateToBeep={handleNavigateToBeep} />
        ) : (
          <MentorDashboard />
        );

      case 'beep':
        if (isStartup) {
          return <BeepAssessmentPage />;
        }
        if (isMentor) {
          return <MentorBeepResultsPage />;
        }
        return <div className="text-center py-12">Acesso não autorizado</div>;

      case 'startups':
        if (isMentor) {
          return <MentorStartupsPage />;
        }
        return <div className="text-center py-12">Acesso não autorizado</div>;

      case 'mentoring':
        return isStartup ? <StartupMentoringPage /> : <MentoringTipsPage />;

      case 'profile':
        return <StartupProfileSetup />;

      default:
        return isStartup ? (
          <StartupDashboard onNavigateToBeep={handleNavigateToBeep} />
        ) : (
          <MentorDashboard />
        );
    }
  };

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

      {renderContent()}
    </div>
  );
};
