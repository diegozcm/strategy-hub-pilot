import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ScreenshotPlaceholder } from './ScreenshotPlaceholder';

const screens = [
  { name: 'hero-dashboard.png', title: 'Dashboard RUMO', description: 'Visão executiva integrada com objetivos, pilares estratégicos e KPIs em tempo real' },
  { name: 'mapa-estrategico.png', title: 'Mapa Estratégico', description: 'Visualização dos pilares, objetivos corporativos e resultados-chave conectados' },
  { name: 'okrs-panel.png', title: 'OKRs & Indicadores', description: 'Painel de OKRs com barras de progresso, metas mensais e status por cores' },
  { name: 'atlas-ia-chat.png', title: 'Atlas IA', description: 'Interface de IA conversacional com insights e recomendações estratégicas' },
  { name: 'ferramentas-swot.png', title: 'Ferramentas Estratégicas', description: 'SWOT, Golden Circle e outras ferramentas preenchidas com análise real' },
  { name: 'projetos-kanban.png', title: 'Gestão de Projetos', description: 'Visão Kanban com cards de projetos, responsáveis e prazos' },
];

export const SystemDemoSection: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % screens.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + screens.length) % screens.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <section className="py-20 px-4 bg-cofound-blue-dark">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Conheça a plataforma por dentro
          </h2>
          <p className="text-lg text-white/50 font-sans max-w-2xl mx-auto">
            Navegue pelas principais telas do Strategy HUB e descubra como ele transforma sua gestão.
          </p>
        </div>

        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Carousel */}
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.4 }}
              >
                <ScreenshotPlaceholder
                  name={screens[current].name}
                  description={screens[current].description}
                  className="min-h-[340px]"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Title + indicators */}
          <div className="mt-6 text-center">
            <p className="text-lg font-display font-semibold text-white mb-4">{screens[current].title}</p>
            <div className="flex justify-center gap-2">
              {screens.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-cofound-green' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
