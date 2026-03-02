import React from 'react';
import { motion } from 'motion/react';
import { Crown, BarChart3, Briefcase, Rocket } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const cases = [
  { icon: Crown, persona: 'CEO / Fundador', desc: 'Visão estratégica unificada com dashboard executivo, OKRs corporativos e acompanhamento de resultados em tempo real.', color: 'bg-cofound-green/15 text-cofound-green' },
  { icon: BarChart3, persona: 'Gestor de Área', desc: 'OKRs departamentais, indicadores de performance e planos de ação conectados aos objetivos organizacionais.', color: 'bg-cofound-blue-light/15 text-cofound-blue-light' },
  { icon: Briefcase, persona: 'Consultor', desc: 'Ferramentas e metodologias integradas para conduzir diagnósticos, workshops e jornadas estratégicas.', color: 'bg-cofound-green/15 text-cofound-green' },
  { icon: Rocket, persona: 'Startup', desc: 'Aceleração com metodologia BEEP, validação de hipóteses e estruturação de modelo de negócio.', color: 'bg-cofound-blue-light/15 text-cofound-blue-light' },
];

export const UseCasesSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-20 px-4 bg-cofound-blue-dark" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Para quem é o Strategy HUB?
          </h2>
          <p className="text-lg text-white/50 font-sans max-w-2xl mx-auto">
            Soluções adaptadas ao perfil e necessidade de cada papel dentro da organização.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {cases.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] hover:border-cofound-green/20 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.color.split(' ')[0]}`}>
                <c.icon className={`h-6 w-6 ${c.color.split(' ')[1]}`} />
              </div>
              <h3 className="text-lg font-display font-semibold text-white mb-2">{c.persona}</h3>
              <p className="text-sm text-white/40 font-sans leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
