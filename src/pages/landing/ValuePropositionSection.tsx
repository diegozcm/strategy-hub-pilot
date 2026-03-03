import React from 'react';
import { motion } from 'motion/react';
import { Zap, BarChart3, Brain, Target, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const pillars = [
  { icon: Zap, title: 'Estratégia conectada à execução', desc: 'Transforme planejamento em ação com ferramentas que integram objetivos, indicadores e projetos em um fluxo contínuo.', accent: 'from-cofound-green/20 to-cofound-green/5' },
  { icon: BarChart3, title: 'Decisões baseadas em dados', desc: 'Dashboards executivos, OKRs e indicadores em tempo real para tomar decisões fundamentadas.', accent: 'from-blue-400/20 to-blue-400/5' },
  { icon: Brain, title: 'IA como copiloto estratégico', desc: 'O Atlas IA analisa seus dados e sugere ações estratégicas personalizadas para seu negócio.', accent: 'from-purple-400/20 to-purple-400/5' },
  { icon: Target, title: 'OKRs & Resultados-Chave', desc: 'Metodologia OKR integrada com acompanhamento mensal, metas e eficiência YTD automatizada.', accent: 'from-amber-400/20 to-amber-400/5' },
  { icon: Users, title: 'Governança colaborativa', desc: 'Reuniões, atas, regimentos e calendário de governança centralizados para toda a equipe.', accent: 'from-rose-400/20 to-rose-400/5' },
  { icon: ShieldCheck, title: 'Diagnóstico de maturidade', desc: 'Avalie o nível de maturidade estratégica da sua organização com o framework BEEP.', accent: 'from-teal-400/20 to-teal-400/5' },
];

const iconColors = [
  'text-cofound-green',
  'text-blue-400',
  'text-purple-400',
  'text-amber-400',
  'text-rose-400',
  'text-teal-400',
];

const bgIconColors = [
  'bg-cofound-green/10 group-hover:bg-cofound-green/20',
  'bg-blue-400/10 group-hover:bg-blue-400/20',
  'bg-purple-400/10 group-hover:bg-purple-400/20',
  'bg-amber-400/10 group-hover:bg-amber-400/20',
  'bg-rose-400/10 group-hover:bg-rose-400/20',
  'bg-teal-400/10 group-hover:bg-teal-400/20',
];

export const ValuePropositionSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 px-6 bg-cofound-white relative overflow-hidden" ref={ref}>
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-cofound-green/[0.03] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-400/[0.03] blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 rounded-full border border-cofound-green/20 bg-cofound-green/5 px-4 py-1.5 text-xs font-sans font-medium tracking-wide text-cofound-green uppercase mb-6"
          >
            <Zap className="h-3.5 w-3.5" />
            Soluções para crescimento acelerado
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-5 leading-tight"
          >
            Por que o Strategy HUB?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 }}
            className="text-base text-cofound-blue-dark/50 font-sans max-w-xl mx-auto leading-relaxed"
          >
            Tudo que sua empresa precisa para estruturar, executar e mensurar a estratégia.
          </motion.p>
        </div>

        {/* Cards grid — bento-style with featured first card */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group relative p-8 rounded-2xl bg-white border border-cofound-blue-dark/[0.06] hover:border-cofound-blue-dark/[0.12] transition-all duration-500 cursor-default overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]"
            >
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${p.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl ${bgIconColors[i]} flex items-center justify-center mb-6 transition-colors duration-300`}>
                  <p.icon className={`h-5 w-5 ${iconColors[i]}`} />
                </div>
                <h3 className="text-lg font-display font-bold text-cofound-blue-dark mb-3 tracking-tight">{p.title}</h3>
                <p className="text-sm text-cofound-blue-dark/50 font-sans leading-relaxed mb-4">{p.desc}</p>
                <div className="flex items-center gap-1 text-xs font-sans font-medium text-cofound-blue-dark/30 group-hover:text-cofound-green transition-colors duration-300">
                  <span>Saiba mais</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
