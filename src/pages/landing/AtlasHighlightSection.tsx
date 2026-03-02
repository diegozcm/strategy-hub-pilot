import React from 'react';
import { motion } from 'motion/react';
import { Brain, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';
import { ScreenshotImage } from './ScreenshotImage';
import atlasImg from '@/assets/screenshots/atlas-insights.png';

const capabilities = [
  { icon: Sparkles, text: 'Análises preditivas e recomendações personalizadas' },
  { icon: TrendingUp, text: 'Identificação de tendências e padrões nos seus dados' },
  { icon: ShieldCheck, text: 'Diagnósticos automatizados de saúde estratégica' },
];

export const AtlasHighlightSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-cofound-blue-dark via-[#112B45] to-cofound-blue-dark relative overflow-hidden" ref={ref}>
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cofound-blue-light/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Screenshot */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <ScreenshotImage
              src={atlasImg}
              alt="Interface do Atlas IA com análise de performance e insights estratégicos em tempo real"
            />
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="w-14 h-14 rounded-xl bg-cofound-blue-light/15 flex items-center justify-center mb-5">
              <Brain className="h-7 w-7 text-cofound-blue-light" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Atlas IA: seu copiloto estratégico
            </h2>
            <p className="text-lg text-white/50 font-sans mb-8 leading-relaxed">
              Inteligência artificial integrada que analisa seus dados estratégicos, identifica oportunidades e sugere próximos passos para acelerar seus resultados.
            </p>
            <ul className="space-y-4">
              {capabilities.map((c, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cofound-green/15 flex items-center justify-center flex-shrink-0">
                    <c.icon className="h-4 w-4 text-cofound-green" />
                  </div>
                  <span className="text-sm text-white/70 font-sans">{c.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
