import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Map, Rocket, TrendingUp } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const steps = [
  {
    icon: Search,
    num: '01',
    title: 'Diagnóstico',
    desc: 'Avaliação completa do cenário atual, gaps e oportunidades.',
    detail: 'Utilizamos frameworks como BEEP, SWOT e Golden Circle para mapear a maturidade estratégica da sua empresa.',
  },
  {
    icon: Map,
    num: '02',
    title: 'Planejamento',
    desc: 'Pilares estratégicos, OKRs e mapa de objetivos conectados.',
    detail: 'Defina pilares, objetivos e resultados-chave com hierarquia visual clara e metas mensuráveis.',
  },
  {
    icon: Rocket,
    num: '03',
    title: 'Execução',
    desc: 'Projetos, planos de ação e acompanhamento em tempo real.',
    detail: 'Gerencie projetos com Kanban, atribua responsáveis e acompanhe o progresso em dashboards integrados.',
  },
  {
    icon: TrendingUp,
    num: '04',
    title: 'Resultados',
    desc: 'Mensuração contínua e aceleração com insights do Atlas IA.',
    detail: 'O Atlas IA analisa sua performance e sugere ações corretivas para manter a estratégia no rumo certo.',
  },
];

export const HowItWorksSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div ref={ref} className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-sans font-semibold text-cofound-green tracking-widest uppercase mb-3"
          >
            Metodologia
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-display font-bold text-white mb-5"
          >
            Como funciona
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 }}
            className="text-base text-white/40 font-sans max-w-xl mx-auto"
          >
            Um processo estruturado em 4 etapas para transformar sua gestão estratégica.
          </motion.p>
        </div>

        {/* Steps — interactive timeline */}
        <div className="max-w-5xl mx-auto">
          {/* Step indicators with animated progress line */}
          <div className="relative hidden sm:flex items-center justify-between mb-16">
            {/* Background line */}
            <div className="absolute top-7 left-[10%] right-[10%] h-px bg-white/10" />
            {/* Active progress line */}
            <motion.div
              className="absolute top-7 left-[10%] h-px bg-gradient-to-r from-cofound-green to-cofound-blue-light"
              initial={{ width: '0%' }}
              animate={isVisible ? {
                width: `${(activeStep / (steps.length - 1)) * 80}%`
              } : { width: '0%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            {steps.map((step, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                onClick={() => setActiveStep(i)}
                className="relative z-10 flex flex-col items-center gap-3 group cursor-pointer"
              >
                {/* Icon circle */}
                <motion.div
                  animate={{
                    scale: activeStep === i ? 1.15 : 1,
                    borderColor: activeStep === i
                      ? 'hsl(var(--cofound-green))'
                      : i <= activeStep
                        ? 'hsl(var(--cofound-green) / 0.4)'
                        : 'hsl(var(--cofound-blue-light) / 0.15)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-colors duration-300 ${
                    activeStep === i
                      ? 'bg-cofound-green/20 shadow-lg shadow-cofound-green/20'
                      : i <= activeStep
                        ? 'bg-cofound-green/10'
                        : 'bg-white/[0.03]'
                  }`}
                >
                  <step.icon className={`h-6 w-6 transition-colors duration-300 ${
                    activeStep === i ? 'text-cofound-green' : i <= activeStep ? 'text-cofound-green/60' : 'text-white/30'
                  }`} />
                </motion.div>

                {/* Label */}
                <div className="text-center">
                  <span className={`text-[10px] font-display font-bold tracking-[0.25em] block transition-colors duration-300 ${
                    activeStep === i ? 'text-cofound-green' : 'text-white/25'
                  }`}>
                    {step.num}
                  </span>
                  <span className={`text-sm font-display font-semibold block mt-0.5 transition-colors duration-300 ${
                    activeStep === i ? 'text-white' : 'text-white/40'
                  }`}>
                    {step.title}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Mobile step selector */}
          <div className="flex sm:hidden flex-wrap justify-center gap-2 mb-8">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`text-xs font-sans px-3 py-1.5 rounded-full transition-all ${
                  i === activeStep
                    ? 'bg-cofound-green/15 text-cofound-green border border-cofound-green/30'
                    : 'text-white/35 hover:text-white/60 border border-white/10'
                }`}
              >
                {step.num} {step.title}
              </button>
            ))}
          </div>

          {/* Expandable detail card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.97 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-10 md:p-14 overflow-hidden"
            >
              {/* Card glow */}
              <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-cofound-green/[0.06] rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-[200px] h-[200px] bg-cofound-blue-light/[0.04] rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
                {/* Left — step icon large */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cofound-green/20 to-cofound-green/5 border border-cofound-green/20 flex items-center justify-center">
                    {React.createElement(steps[activeStep].icon, { className: 'h-9 w-9 text-cofound-green' })}
                  </div>
                </div>

                {/* Right — content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-display font-bold text-cofound-green tracking-[0.25em]">
                      ETAPA {steps[activeStep].num}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                    {steps[activeStep].title}
                  </h3>
                  <p className="text-base text-white/50 font-sans leading-relaxed mb-2">
                    {steps[activeStep].desc}
                  </p>
                  <p className="text-sm text-white/35 font-sans leading-relaxed">
                    {steps[activeStep].detail}
                  </p>
                </div>
              </div>

              {/* Step counter dots */}
              <div className="mt-8 flex gap-2 relative z-10">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeStep ? 'w-8 bg-cofound-green' : 'w-1.5 bg-white/15 hover:bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
