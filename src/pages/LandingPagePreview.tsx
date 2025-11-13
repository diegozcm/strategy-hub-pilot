import React from 'react';
import { useLandingPageContentDraft } from '@/hooks/useLandingPageContentDraft';
import { PublishButton } from '@/components/admin/landing-page/PublishButton';
import { LandingPageBase } from './landing/LandingPageBase';

const LandingPagePreview = () => {
  const { getContent } = useLandingPageContentDraft();

  return (
    <div className="relative">
      {/* Publish Button - Fixed to top right */}
      <div className="fixed top-20 right-4 z-50">
        <PublishButton />
      </div>

      {/* Landing Page Base Component with COFOUND theme */}
      <LandingPageBase getContent={getContent} theme="cofound" />
    </div>
  );
};

export default LandingPagePreview;
