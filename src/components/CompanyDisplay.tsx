import React from 'react';
import { useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useMultiTenant';
import { useStartupHubUserType } from '@/hooks/useStartupHubUserType';

export const CompanyDisplay: React.FC = () => {
  const { company } = useAuth();
  const { userType } = useStartupHubUserType();
  const location = useLocation();

  if (!company) {
    return null;
  }

  // Hide company display for mentors when in Startup HUB
  const isInStartupHub = location.pathname.includes('/startup-hub');
  const shouldHideForMentor = userType === 'mentor' && isInStartupHub;
  
  if (shouldHideForMentor) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {company.logo_url ? (
        <img 
          src={company.logo_url} 
          alt={`Logo ${company.name}`}
          className="h-8 w-8 object-cover rounded-md border border-border/50"
        />
      ) : (
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
      )}
      <span className="font-medium text-foreground text-sm">{company.name}</span>
    </div>
  );
};