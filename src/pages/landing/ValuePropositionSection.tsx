import React from 'react';
import { motion } from 'motion/react';
import { Zap, BarChart3, Brain, Target, Users, ShieldCheck } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const pillars = [
  { icon: Zap, title: 'Estratégia conectada à execução', desc: 'Transforme planejamento em ação com ferramentas que integram objetivos, indicadores e projetos em um fluxo contínuo.' },
  { icon: BarChart3, title: 'Decisões baseadas em dados', desc: 'Dashboards executivos, OKRs e indicadores em tempo real para tomar decisões fundamentadas.' },
  { icon: Brain, title: 'IA como copiloto estratégico', desc: 'O Atlas IA analisa seus dados e sugere ações estratégicas personalizadas para seu negócio.' },
  { icon: Target, title: 'OKRs & Resultados-Chave', desc: 'Metodologia OKR integrada com acompanhamento mensal, metas e eficiência YTD automatizada.' },
  { icon: Users, title: 'Governança colaborativa', desc: 'Reuniões, atas, regimentos e calendário de governança centralizados para toda a equipe.' },
  { icon: ShieldCheck, title: 'Diagnóstico de maturidade', desc: 'Avalie o nível de maturidade estratégica da sua organização com o framework BEEP.' },
];

export const ValuePropositionSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 px-4 bg-cofound-white" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }} animate={isVisible ? { opacity: 1 } : {}}
            className="text-sm font-sans font-semibold text-cofound-green tracking-widest uppercase mb-3"
          >
            Soluções para crescimento acelerado
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-display font-bold text-cofound-blue-dark mb-5"
          >
            Por que o Strategy HUB?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 }}
            className="text-base md:text-lg text-cofound-blue-dark/50 font-sans max-w-2xl mx-auto"
          >
            Tudo que sua empresa precisa para estruturar, executar e mensurar a estratégia.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative p-7 rounded-2xl bg-white border border-cofound-blue-dark/[0.06] shadow-soft hover:shadow-elev hover:border-cofound-green/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-cofound-green/10 flex items-center justify-center mb-5 group-hover:bg-cofound-green/20 transition-colors">
                <p.icon className="h-6 w-6 text-cofound-green" />
              </div>
              <h3 className="text-lg font-display font-semibold text-cofound-blue-dark mb-2">{p.title}</h3>
              <p className="text-sm text-cofound-blue-dark/50 font-sans leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
