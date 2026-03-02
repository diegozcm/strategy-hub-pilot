import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Map, Target, Brain, Lightbulb, Briefcase } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';
import { ScreenshotImage } from './ScreenshotImage';
import resultadosImg from '@/assets/screenshots/resultados-chave.png';

const features = [
  { icon: BarChart3, title: 'Dashboard RUMO', desc: 'Visão executiva integrada com objetivos e indicadores em tempo real.' },
  { icon: Map, title: 'Mapa Estratégico', desc: 'Pilares, objetivos corporativos e KRs em uma visão unificada.' },
  { icon: Target, title: 'OKRs & Indicadores', desc: 'Key results mensuráveis com acompanhamento mensal detalhado.' },
  { icon: Brain, title: 'Atlas IA', desc: 'Copiloto inteligente com insights e recomendações personalizadas.' },
  { icon: Lightbulb, title: 'Ferramentas Estratégicas', desc: 'SWOT, Golden Circle, Vision Alignment e mais.' },
  { icon: Briefcase, title: 'Gestão de Projetos', desc: 'Iniciativas, planos de ação com responsáveis e prazos.' },
];

export const PlatformFeaturesSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-20 px-4 bg-cofound-white" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-4">
            Tudo que você precisa em uma plataforma
          </h2>
          <p className="text-lg text-cofound-blue-dark/50 font-sans max-w-2xl mx-auto">
            Ferramentas integradas de gestão estratégica potencializadas por inteligência artificial.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Features grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-5 rounded-xl bg-white border border-cofound-blue-dark/8 shadow-soft hover:shadow-elev hover:border-cofound-blue-light/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-cofound-blue-light/10 flex items-center justify-center mb-3 group-hover:bg-cofound-blue-light/20 transition-colors">
                  <f.icon className="h-5 w-5 text-cofound-blue-light" />
                </div>
                <h3 className="text-sm font-display font-semibold text-cofound-blue-dark mb-1">{f.title}</h3>
                <p className="text-xs text-cofound-blue-dark/50 font-sans leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ScreenshotImage
              src={resultadosImg}
              alt="Painel de Resultados-Chave com barras de progresso, metas mensais e indicadores de status"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
