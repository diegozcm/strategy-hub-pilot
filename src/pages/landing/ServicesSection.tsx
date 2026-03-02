import React from 'react';
import { motion } from 'motion/react';
import { Compass, TrendingUp, Mic, ShieldCheck, Users, Rocket } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const services = [
  { icon: Compass, title: 'Jornada Estratégica', desc: 'Planejamento estratégico completo com metodologias proprietárias para transformar a visão da sua empresa em resultados concretos.' },
  { icon: TrendingUp, title: 'Aceleração de Vendas', desc: 'Processos comerciais estruturados, funil otimizado e estratégias de crescimento para escalar suas vendas.' },
  { icon: Mic, title: 'Palestras & Workshops', desc: 'Conteúdos transformadores sobre estratégia, inovação e liderança para engajar e capacitar equipes.' },
  { icon: ShieldCheck, title: 'Diagnóstico 360°', desc: 'Avaliação completa do seu negócio identificando gaps, oportunidades e prioridades de ação.' },
  { icon: Users, title: 'Conselho Consultivo', desc: 'Profissionais experientes atuando como conselheiros para orientar decisões estratégicas da sua empresa.' },
  { icon: Rocket, title: 'Aceleração de Startups', desc: 'Programa de aceleração com metodologia BEEP para startups em fase de validação e crescimento.' },
];

export const ServicesSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-20 px-4 bg-cofound-white" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-4">
            Soluções COFOUND
          </h2>
          <p className="text-lg text-cofound-blue-dark/50 font-sans max-w-3xl mx-auto">
            Impulsione o crescimento da sua empresa com consultoria especializada e ferramentas de gestão estratégica.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-white border border-cofound-blue-dark/8 shadow-soft hover:shadow-elev hover:border-cofound-green/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-cofound-green/15 flex items-center justify-center mb-4 group-hover:bg-cofound-green/25 transition-colors">
                <s.icon className="h-6 w-6 text-cofound-green" />
              </div>
              <h3 className="text-lg font-display font-semibold text-cofound-blue-dark mb-2">{s.title}</h3>
              <p className="text-sm text-cofound-blue-dark/50 font-sans leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
