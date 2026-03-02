import React from 'react';
import { motion } from 'motion/react';
import { Quote } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const testimonials = [
  {
    quote: 'O Strategy HUB transformou a forma como enxergamos nossa estratégia. Ter tudo conectado em uma plataforma nos deu velocidade e clareza para tomar decisões.',
    name: 'CEO',
    company: 'Empresa do setor industrial',
  },
  {
    quote: 'A combinação de consultoria com a plataforma foi o que fez a diferença. Não é só ferramenta — é um método que funciona.',
    name: 'Diretor de Operações',
    company: 'Empresa de tecnologia',
  },
  {
    quote: 'O Atlas IA trouxe insights que nossa equipe levaria semanas para identificar. É como ter um consultor estratégico disponível 24h.',
    name: 'Head de Estratégia',
    company: 'Grupo empresarial',
  },
];

export const AuthoritySection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 px-4 bg-cofound-blue-dark" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-sans font-semibold text-cofound-green tracking-widest uppercase mb-3">
            Depoimentos
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-5">
            O que nossos clientes dizem
          </h2>
          <p className="text-base text-white/40 font-sans max-w-2xl mx-auto">
            Empresas que já viveram a transformação com o Strategy HUB.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm"
            >
              <Quote className="h-8 w-8 text-cofound-green/30 mb-4" />
              <p className="text-sm text-white/60 font-sans leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="text-sm font-display font-semibold text-white">{t.name}</p>
                <p className="text-xs text-white/35 font-sans">{t.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
