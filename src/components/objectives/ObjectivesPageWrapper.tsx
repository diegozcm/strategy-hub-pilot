import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ObjectivesPage } from './ObjectivesPage';

export const ObjectivesPageWrapper: React.FC = () => {
  return (
    <ErrorBoundary>
      <ObjectivesPage />
    </ErrorBoundary>
  );
};