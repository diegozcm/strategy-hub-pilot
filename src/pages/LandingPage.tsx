import React from 'react';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { LandingPageBase } from './landing/LandingPageBase';

const LandingPage = () => {
  const { getContent } = useLandingPageContent();

  return (
    <LandingPageBase getContent={getContent} theme="cofound" />
  );
};

export default LandingPage;
