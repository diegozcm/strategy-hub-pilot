import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from './useScrollReveal';

const WHATSAPP_URL = 'https://wa.me/554796342353?text=Tenho%20interesse%20em%20saber%20mais%20sobre%20o%20Strategy%20HUB%20by%20COFOUND';

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

export const CTASection: React.FC<Props> = ({ getContent }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-28 px-4 bg-gradient-to-br from-cofound-blue-dark via-[#112B45] to-cofound-blue-dark relative overflow-hidden" ref={ref}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cofound-green/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cofound-blue-light/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="container mx-auto text-center max-w-3xl relative z-10"
      >
        <p className="text-sm font-sans font-semibold text-cofound-green tracking-widest uppercase mb-4">
          Comece agora
        </p>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
          {getContent('cta', 'title', 'Pronto para transformar a estratégia da sua empresa?')}
        </h2>
        <p className="text-base text-white/45 mb-10 font-sans max-w-xl mx-auto leading-relaxed">
          {getContent('cta', 'subtitle', 'Junte-se às empresas que já estão crescendo com o Strategy HUB by COFOUND.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="text-base px-8 py-6 bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 shadow-lg shadow-cofound-green/20 transition-all hover:scale-[1.03] rounded-full">
              <ArrowRight className="mr-2 h-5 w-5" />
              {getContent('cta', 'primary_button', 'Começar Agora')}
            </Button>
          </Link>
          <a href={getContent('cta', 'secondary_button_link', WHATSAPP_URL)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="text-base px-8 py-6 bg-transparent border-white/30 text-white hover:text-white hover:bg-white/10 font-semibold rounded-full">
              <MessageSquare className="mr-2 h-5 w-5" />
              {getContent('cta', 'secondary_button', 'Agendar Demo')}
            </Button>
          </a>
        </div>
      </motion.div>
    </section>
  );
};
