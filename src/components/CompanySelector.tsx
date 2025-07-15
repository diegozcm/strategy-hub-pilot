import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CompanySelector: React.FC = () => {
  const { isSystemAdmin, company } = useAuth();

  if (!isSystemAdmin) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{company?.name || 'Nenhuma empresa'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Button variant="outline" size="sm">
        {company?.name || 'Selecionar empresa'}
      </Button>
    </div>
  );
};