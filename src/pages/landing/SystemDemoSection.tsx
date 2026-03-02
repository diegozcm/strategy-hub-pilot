import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ScreenshotImage } from './ScreenshotImage';
import dashboardImg from '@/assets/screenshots/dashboard-rumo.png';
import objetivosImg from '@/assets/screenshots/objetivos-estrategicos.png';
import resultadosImg from '@/assets/screenshots/resultados-chave.png';
import atlasImg from '@/assets/screenshots/atlas-insights.png';
import ferramentasImg from '@/assets/screenshots/ferramentas-governanca.png';
import projetosImg from '@/assets/screenshots/projetos-kanban.png';
import krDetalheImg from '@/assets/screenshots/kr-detalhe.png';

const WHATSAPP_URL = 'https://wa.me/554796342353?text=Quero%20agendar%20uma%20demonstração%20do%20Strategy%20HUB';

const screens = [
  { src: dashboardImg, title: 'Dashboard RUMO', alt: 'Visão executiva integrada' },
  { src: objetivosImg, title: 'Objetivos Estratégicos', alt: 'Gestão de objetivos por pilar' },
  { src: resultadosImg, title: 'Resultados-Chave', alt: 'Painel de KRs com status' },
  { src: krDetalheImg, title: 'Detalhe do Indicador', alt: 'Evolução mensal previsto vs realizado' },
  { src: atlasImg, title: 'Atlas IA', alt: 'Assistente de IA com análise de performance' },
  { src: ferramentasImg, title: 'Ferramentas & Governança', alt: 'Golden Circle, SWOT, Governança' },
  { src: projetosImg, title: 'Gestão de Projetos', alt: 'Visão Kanban com cards de tarefas' },
];

export const SystemDemoSection: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Preload all images on mount for instant switching
  useEffect(() => {
    screens.forEach(s => {
      const img = new Image();
      img.src = s.src;
    });
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % screens.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + screens.length) % screens.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <section className="py-24 px-4 bg-cofound-blue-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cofound-blue-dark via-[#0F2A42] to-cofound-blue-dark pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16 items-center">
          {/* Left – copy */}
          <div>
            <Badge className="mb-6 bg-cofound-blue-light/10 text-cofound-blue-light border-cofound-blue-light/20 px-4 py-2 font-sans text-xs tracking-wide rounded-full">
              <Play className="h-3.5 w-3.5 mr-2" />
              Tour pela plataforma
            </Badge>

            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-5 leading-tight">
              Conheça a plataforma por dentro
            </h2>
            <p className="text-base text-white/45 font-sans mb-10 leading-relaxed max-w-md">
              Navegue pelas principais telas do Strategy HUB e descubra como ele transforma sua gestão estratégica em resultados mensuráveis.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth">
                <Button size="lg" className="bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 rounded-full px-7">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Testar grátis
                </Button>
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="border-white/15 text-white hover:bg-white/[0.06] font-semibold rounded-full px-7">
                  Agendar demo
                </Button>
              </a>
            </div>

            {/* Screen tabs */}
            <div className="mt-10 flex flex-wrap gap-2">
              {screens.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`text-xs font-sans px-3 py-1.5 rounded-full transition-all ${i === current ? 'bg-cofound-green/15 text-cofound-green border border-cofound-green/30' : 'text-white/35 hover:text-white/60 border border-transparent'}`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Right – carousel */}
          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.35 }}
                >
                  <ScreenshotImage src={screens[current].src} alt={screens[current].alt} eager />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nav arrows */}
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors backdrop-blur-sm">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors backdrop-blur-sm">
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="mt-5 flex justify-center gap-1.5">
              {screens.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-7 bg-cofound-green' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
