import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useScrollReveal } from './useScrollReveal';

export const DifferentialsSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-16 px-4 bg-cofound-white" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl bg-gradient-to-br from-cofound-blue-dark via-[#132E4A] to-cofound-blue-dark px-8 md:px-16 py-14 md:py-16 overflow-hidden"
        >
          {/* Glow effects */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cofound-green/[0.06] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cofound-blue-light/[0.04] rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-cofound-green" />
                <span className="text-sm font-sans font-semibold text-cofound-green tracking-wide">Oferta exclusiva</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-3 leading-tight">
                Comece a transformar sua gestão estratégica hoje
              </h2>
              <p className="text-base text-white/45 font-sans max-w-lg">
                Teste o Strategy HUB gratuitamente e descubra como conectar estratégia à execução com inteligência artificial.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link to="/auth">
                <Button size="lg" className="bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 rounded-full px-8 shadow-lg shadow-cofound-green/20 hover:scale-[1.03] transition-all">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Começar agora
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
