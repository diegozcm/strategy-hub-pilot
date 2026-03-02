import React from 'react';
import { motion } from 'motion/react';
import { Search, Map, Rocket, TrendingUp } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const steps = [
  { icon: Search, num: '01', title: 'Diagnóstico', desc: 'Avaliação completa do cenário atual, gaps e oportunidades da sua organização.' },
  { icon: Map, num: '02', title: 'Planejamento', desc: 'Definição de pilares estratégicos, OKRs e mapa de objetivos conectados.' },
  { icon: Rocket, num: '03', title: 'Execução', desc: 'Implementação com projetos, planos de ação e acompanhamento em tempo real.' },
  { icon: TrendingUp, num: '04', title: 'Resultados', desc: 'Mensuração contínua, ajustes e aceleração com insights do Atlas IA.' },
];

export const HowItWorksSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-20 px-4 bg-cofound-blue-dark" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Como funciona
          </h2>
          <p className="text-lg text-white/50 font-sans max-w-2xl mx-auto">
            Um processo estruturado em 4 etapas para transformar sua gestão estratégica.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-cofound-green/30 via-cofound-blue-light/30 to-cofound-green/30" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center relative z-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-cofound-green/15 border border-cofound-green/20 flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-7 w-7 text-cofound-green" />
              </div>
              <span className="text-xs font-display font-bold text-cofound-blue-light/50 tracking-widest">{step.num}</span>
              <h3 className="text-lg font-display font-semibold text-white mt-1 mb-2">{step.title}</h3>
              <p className="text-sm text-white/40 font-sans leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
