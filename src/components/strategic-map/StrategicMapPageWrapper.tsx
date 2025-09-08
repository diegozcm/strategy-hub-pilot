import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { StrategicMapPage } from './StrategicMapPage';

export const StrategicMapPageWrapper: React.FC = () => {
  return (
    <ErrorBoundary>
      <StrategicMapPage />
    </ErrorBoundary>
  );
};