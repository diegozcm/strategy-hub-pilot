import React from 'react';
import { HeaderSection } from './HeaderSection';
import { HeroSection } from './HeroSection';
import { ClientLogosSection } from './ClientLogosSection';
import { ValuePropositionSection } from './ValuePropositionSection';
import { SystemDemoSection } from './SystemDemoSection';
import { DifferentialsSection } from './DifferentialsSection';
import { HowItWorksSection } from './HowItWorksSection';
import { PlatformFeaturesSection } from './PlatformFeaturesSection';
import { AtlasHighlightSection } from './AtlasHighlightSection';
import { ServicesSection } from './ServicesSection';
import { UseCasesSection } from './UseCasesSection';
import { AuthoritySection } from './AuthoritySection';
import { FAQSection } from './FAQSection';
import { CTASection } from './CTASection';
import { FooterSection } from './FooterSection';

interface LandingPageBaseProps {
  getContent: (section: string, key: string, fallback?: string) => string;
}

export const LandingPageBase: React.FC<LandingPageBaseProps> = ({ getContent }) => {
  return (
    <div className="min-h-screen">
      {/* 1  */ } <HeaderSection />
      {/* 2  */ } <HeroSection getContent={getContent} />
      {/* 3  */ } <ClientLogosSection getContent={getContent} />
      {/* 4  */ } <div id="proposta"><ValuePropositionSection /></div>
      {/* 5  */ } <SystemDemoSection />
      {/* 6  */ } <DifferentialsSection />
      {/* 7  */ } <HowItWorksSection />
      {/* 8  */ } <div id="plataforma"><PlatformFeaturesSection /></div>
      {/* 9  */ } <AtlasHighlightSection />
      {/* 12 */ } <section className="py-24 px-4 bg-cofound-white">
                    <div className="container mx-auto max-w-6xl">
                      <AuthoritySection />
                    </div>
                  </section>
      {/* 13 */ } <FAQSection />
      {/* 14 */ } <CTASection getContent={getContent} />
      {/* 15 */ } <FooterSection getContent={getContent} />
    </div>
  );
};
