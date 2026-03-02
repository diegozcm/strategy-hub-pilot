import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, ChevronRight, Layers, Building2, Clock, ThumbsUp, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScreenshotImage } from './ScreenshotImage';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { TextEffect } from '@/components/ui/text-effect';
import dashboardImg from '@/assets/screenshots/dashboard-rumo.png';

const WHATSAPP_URL = 'https://wa.me/554796342353?text=Tenho%20interesse%20em%20saber%20mais%20sobre%20o%20Strategy%20HUB%20by%20COFOUND';

const stats = [
  { icon: Building2, value: '+200', label: 'Empresas' },
  { icon: Clock, value: '+15', label: 'Anos' },
  { icon: ThumbsUp, value: '95%', label: 'Satisfação' },
  { icon: FolderKanban, value: '+500', label: 'Projetos' },
];

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = 'gray',
  darkLineColor = 'gray',
}) => {
  const gridStyles = {
    '--grid-angle': `${angle}deg`,
    '--cell-size': `${cellSize}px`,
    '--opacity': opacity,
    '--light-line': lightLineColor,
    '--dark-line': darkLineColor,
  } as React.CSSProperties;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]"
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className="animate-grid"
          style={{
            backgroundRepeat: 'repeat',
            backgroundSize: 'var(--cell-size) var(--cell-size)',
            backgroundImage: `linear-gradient(to right, var(--dark-line) 1px, transparent 0), linear-gradient(to bottom, var(--dark-line) 1px, transparent 0)`,
            height: '300vh',
            inset: '-200% 0px',
            marginLeft: '-200%',
            opacity: 'var(--opacity)',
            position: 'absolute',
            transform: 'translateY(0)',
            width: '600vw',
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-cofound-blue-dark to-transparent to-90%" />
    </div>
  );
};

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

export const HeroSection: React.FC<Props> = ({ getContent }) => (
  <section className="relative overflow-hidden bg-cofound-blue-dark pt-36 pb-12 lg:pt-44 lg:pb-16">
    <RetroGrid
      angle={65}
      opacity={0.3}
      cellSize={50}
      darkLineColor="hsl(var(--cofound-blue-light) / 0.15)"
    />

    <div className="container relative z-10 mx-auto px-4">
      <AnimatedGroup
        variants={{
          container: {
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          },
          item: {
            hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
            visible: {
              opacity: 1,
              filter: 'blur(0px)',
              y: 0,
              transition: { type: 'spring' as const, bounce: 0.3, duration: 1.5 },
            },
          },
        }}
        className="flex flex-col items-center text-center"
      >
        {/* Badge */}
        <a
          href="#plataforma"
          className="group mb-8 flex w-fit items-center gap-2 rounded-full border border-cofound-green/25 bg-cofound-green/10 px-4 py-2 text-xs font-sans tracking-wide text-cofound-green transition-all hover:bg-cofound-green/20"
        >
          <Layers className="h-3.5 w-3.5" />
          Plataforma de Gestão Estratégica
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </a>

        {/* Title line 1 */}
        <TextEffect
          preset="blur"
          per="word"
          delay={0.2}
          as="h1"
          className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-display font-bold text-white leading-[1.15] tracking-tight"
        >
          {getContent('hero', 'title', 'Cocriamos soluções adequadas às')}
        </TextEffect>

        {/* Title line 2 – gradient */}
        <TextEffect
          preset="blur"
          per="word"
          delay={0.4}
          as="span"
          className="mt-2 block text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-display font-bold leading-[1.15] tracking-tight text-cofound-green"
        >
          {getContent('hero', 'title_gradient', 'complexidades das organizações')}
        </TextEffect>

        {/* Subtitle */}
        <TextEffect
          preset="fade"
          per="word"
          delay={0.6}
          as="p"
          className="mt-8 max-w-2xl text-sm lg:text-base text-white/50 leading-relaxed font-sans"
        >
          {getContent('hero', 'subtitle', 'O Strategy HUB conecta consultoria estratégica à tecnologia, transformando sua visão em resultados mensuráveis com inteligência artificial.')}
        </TextEffect>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link to="/auth">
            <Button size="lg" className="text-sm px-8 py-6 bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 shadow-lg shadow-cofound-green/20 transition-all hover:scale-[1.03] rounded-full">
              <ArrowRight className="mr-2 h-5 w-5" />
              {getContent('hero', 'primary_button', 'Acessar Plataforma')}
            </Button>
          </Link>
          <a href={getContent('hero', 'secondary_button_link', WHATSAPP_URL)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="text-sm px-8 py-6 border-white/20 text-white/70 hover:text-white hover:bg-white/[0.06] font-semibold rounded-full">
              <Phone className="mr-2 h-5 w-5" />
              {getContent('hero', 'secondary_button', 'Fale com um consultor')}
            </Button>
          </a>
        </div>

        {/* Inline stats */}
        <div className="mt-12 flex flex-wrap justify-center gap-8">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <s.icon className="h-4 w-4 text-cofound-green" />
              </div>
              <div className="text-left">
                <p className="text-lg font-display font-bold text-white leading-none">{s.value}</p>
                <p className="text-[11px] text-white/40 font-sans">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Screenshot */}
        <div className="mt-16 w-full max-w-5xl">
          <ScreenshotImage
            src={dashboardImg}
            alt="Dashboard RUMO com gráfico de progresso, pilares estratégicos e KPIs em tempo real"
            eager
          />
        </div>
      </AnimatedGroup>
    </div>
  </section>
);
