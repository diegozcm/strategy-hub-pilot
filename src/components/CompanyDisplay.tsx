import React from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useMultiTenant';

export const CompanyDisplay: React.FC = () => {
  const { company } = useAuth();

  if (!company) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Building2 className="h-4 w-4" />
      <span className="font-medium">{company.name}</span>
    </div>
  );
};