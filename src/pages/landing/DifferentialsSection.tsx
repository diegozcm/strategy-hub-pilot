import React from 'react';
import { motion } from 'motion/react';
import { Building2, Clock, ThumbsUp, FolderKanban } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

const stats = [
  { icon: Building2, value: '+200', label: 'Empresas atendidas' },
  { icon: Clock, value: '+15', label: 'Anos de experiência' },
  { icon: ThumbsUp, value: '95%', label: 'Satisfação dos clientes' },
  { icon: FolderKanban, value: '+500', label: 'Projetos estratégicos' },
];

export const DifferentialsSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-20 px-4 bg-cofound-white" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-4">
            Resultados que falam por si
          </h2>
          <p className="text-lg text-cofound-blue-dark/50 font-sans max-w-2xl mx-auto">
            Números que refletem nossa trajetória de impacto real em organizações de todos os portes.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white border border-cofound-blue-dark/8 shadow-soft hover:shadow-elev hover:border-cofound-green/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-cofound-green/15 flex items-center justify-center mx-auto mb-4">
                <s.icon className="h-6 w-6 text-cofound-green" />
              </div>
              <p className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-1">{s.value}</p>
              <p className="text-sm text-cofound-blue-dark/50 font-sans">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
