import React from 'react';
import { motion } from 'motion/react';
import { Zap, BarChart3, Brain } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const pillars = [
  { icon: Zap, title: 'Estratégia conectada à execução', desc: 'Transforme planejamento em ação com ferramentas que integram objetivos, indicadores e projetos em um fluxo contínuo.' },
  { icon: BarChart3, title: 'Decisões baseadas em dados', desc: 'Dashboards executivos, OKRs e indicadores em tempo real para tomar decisões fundamentadas e mensurar impacto.' },
  { icon: Brain, title: 'IA como copiloto estratégico', desc: 'O Atlas IA analisa seus dados, identifica padrões e sugere ações estratégicas personalizadas para seu negócio.' },
];

export const ValuePropositionSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-20 px-4 bg-cofound-white" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-4">
            Por que o Strategy HUB?
          </h2>
          <p className="text-lg text-cofound-blue-dark/50 font-sans max-w-2xl mx-auto">
            Três pilares que transformam a forma como sua empresa faz gestão estratégica.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative p-8 rounded-2xl bg-white border border-cofound-blue-dark/8 shadow-soft hover:shadow-elev hover:border-cofound-green/30 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-cofound-green/15 flex items-center justify-center mb-5 group-hover:bg-cofound-green/25 transition-colors">
                <p.icon className="h-7 w-7 text-cofound-green" />
              </div>
              <h3 className="text-lg font-display font-semibold text-cofound-blue-dark mb-3">{p.title}</h3>
              <p className="text-sm text-cofound-blue-dark/50 font-sans leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
