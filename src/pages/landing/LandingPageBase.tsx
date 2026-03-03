import React from 'react';
import { HeaderSection } from './HeaderSection';
import { HeroSection } from './HeroSection';
import { ClientLogosSection } from './ClientLogosSection';
import { ValuePropositionSection } from './ValuePropositionSection';
import { SystemDemoSection } from './SystemDemoSection';
import { HowItWorksSection } from './HowItWorksSection';
import { PlatformFeaturesSection } from './PlatformFeaturesSection';
import { AtlasHighlightSection } from './AtlasHighlightSection';
import { AuthoritySection } from './AuthoritySection';
import { FAQSection } from './FAQSection';
import { FooterSection } from './FooterSection';
import { DarkSectionsBackground } from './DarkSectionsBackground';

interface LandingPageBaseProps {
  getContent: (section: string, key: string, fallback?: string) => string;
}

export const LandingPageBase: React.FC<LandingPageBaseProps> = ({ getContent }) => {
  return (
    <div className="min-h-screen">
      {/* 1  */} <HeaderSection />
      {/* 2  */} <HeroSection getContent={getContent} />
      {/* 3  */} <ClientLogosSection getContent={getContent} />
      {/* 4  */} <div id="proposta"><ValuePropositionSection /></div>
      {/* 5+7 */} <DarkSectionsBackground>
                    <SystemDemoSection />
                    <HowItWorksSection />
                  </DarkSectionsBackground>
      {/* 8  */} <div id="plataforma"><PlatformFeaturesSection /></div>
      {/* 9  */} <AtlasHighlightSection />
      {/* 12 */} <section className="py-24 px-6 bg-cofound-white">
                   <div className="max-w-6xl mx-auto">
                     <AuthoritySection />
                   </div>
                 </section>
      {/* 13 */} <FAQSection getContent={getContent} />
      {/* 15 */} <FooterSection getContent={getContent} />
    </div>
  );
};
