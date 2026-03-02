import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, ChevronRight, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScreenshotImage } from './ScreenshotImage';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { TextEffect } from '@/components/ui/text-effect';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { motion } from 'motion/react';
import dashboardImg from '@/assets/screenshots/dashboard-rumo.png';

const WHATSAPP_URL = 'https://wa.me/554796342353?text=Tenho%20interesse%20em%20saber%20mais%20sobre%20o%20Strategy%20HUB%20by%20COFOUND';

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  darkLineColor = 'gray',
}) => {
  const gridStyles = {
    '--grid-angle': `${angle}deg`,
    '--cell-size': `${cellSize}px`,
    '--opacity': opacity,
    '--dark-line': darkLineColor,
  } as React.CSSProperties;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]"
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          style={{
            backgroundRepeat: 'repeat',
            backgroundSize: 'var(--cell-size) var(--cell-size)',
            backgroundImage: `linear-gradient(to right, var(--dark-line) 1px, transparent 0), linear-gradient(to bottom, var(--dark-line) 1px, transparent 0)`,
            height: '300vh',
            inset: '-200% 0px',
            marginLeft: '-200%',
            opacity: 'var(--opacity)',
            position: 'absolute',
            width: '600vw',
            animation: 'grid-scroll 20s linear infinite',
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-cofound-blue-dark via-cofound-blue-dark/60 to-transparent to-90%" />
    </div>
  );
};

/* Floating decorative elements – more numerous and more visible */
const floatingElements = [
  { size: 90, top: '8%', left: '6%', delay: 0, duration: 6, shape: 'circle' },
  { size: 60, top: '18%', right: '8%', delay: 1, duration: 8, shape: 'hexagon' },
  { size: 40, top: '55%', left: '4%', delay: 2, duration: 7, shape: 'square' },
  { size: 70, top: '65%', right: '5%', delay: 0.5, duration: 9, shape: 'circle' },
  { size: 30, top: '35%', left: '12%', delay: 3, duration: 5, shape: 'diamond' },
  { size: 50, top: '10%', right: '16%', delay: 1.5, duration: 7, shape: 'square' },
  { size: 45, top: '45%', right: '12%', delay: 2.5, duration: 6.5, shape: 'circle' },
  { size: 55, top: '75%', left: '10%', delay: 0.8, duration: 8, shape: 'hexagon' },
  { size: 35, top: '28%', left: '20%', delay: 1.2, duration: 5.5, shape: 'diamond' },
  { size: 65, top: '80%', right: '15%', delay: 3.5, duration: 7, shape: 'square' },
  { size: 25, top: '5%', left: '25%', delay: 0.3, duration: 6, shape: 'circle' },
  { size: 38, top: '50%', right: '22%', delay: 2.2, duration: 8.5, shape: 'diamond' },
  { size: 48, top: '22%', left: '3%', delay: 1.8, duration: 7.5, shape: 'hexagon' },
  { size: 32, top: '90%', right: '3%', delay: 4, duration: 6, shape: 'circle' },
];

const FloatingShape: React.FC<{ el: typeof floatingElements[0] }> = ({ el }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    width: el.size,
    height: el.size,
    top: el.top,
    left: (el as any).left,
    right: (el as any).right,
  };

  const borderRadius =
    el.shape === 'circle' ? '50%' :
    el.shape === 'diamond' ? '4px' :
    el.shape === 'hexagon' ? '30%' : '8px';

  const rotation = el.shape === 'diamond' ? 45 : 0;

  return (
    <motion.div
      style={{ ...style, borderRadius, rotate: rotation }}
      className="border border-cofound-green/15 bg-cofound-green/[0.05]"
      animate={{
        y: [0, -25, 0],
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: el.duration,
        delay: el.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

export const HeroSection: React.FC<Props> = ({ getContent }) => (
  <section className="relative overflow-hidden bg-cofound-blue-dark pt-36 pb-0 lg:pt-44">
    <RetroGrid
      angle={65}
      opacity={0.5}
      cellSize={50}
      darkLineColor="rgba(56,182,255,0.2)"
    />

    {/* Floating elements */}
    {floatingElements.map((el, i) => (
      <FloatingShape key={i} el={el} />
    ))}

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

        {/* Title – inverted triangle shape: long first line, shorter second, shortest third */}
        <TextEffect
          preset="blur"
          per="word"
          delay={0.2}
          as="h1"
          className="max-w-3xl text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-display font-bold text-white leading-[1.2] tracking-tight"
        >
          {getContent('hero', 'title', 'A primeira plataforma que unifica estratégia e aceleração de negócios!')}
        </TextEffect>

        {/* Title line 2 – green, shorter */}
        <TextEffect
          preset="blur"
          per="word"
          delay={0.4}
          as="span"
          className="mt-1 block max-w-lg text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-display font-bold leading-[1.2] tracking-tight text-cofound-green"
        >
          {getContent('hero', 'title_gradient', 'Inteligente para seu Negócio')}
        </TextEffect>

        {/* Subtitle */}
        <TextEffect
          preset="fade"
          per="word"
          delay={0.6}
          as="p"
          className="mt-6 max-w-md text-sm lg:text-base text-white/50 leading-relaxed font-sans"
        >
          {getContent('hero', 'subtitle', 'Transforme sua visão em resultados concretos com uma plataforma que acelera o crescimento do seu negócio.')}
        </TextEffect>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link to="/auth">
            <Button size="lg" className="text-sm px-8 py-6 bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 shadow-lg shadow-cofound-green/20 transition-all hover:scale-[1.03] rounded-full">
              <ArrowRight className="mr-2 h-5 w-5" />
              {getContent('hero', 'primary_button', 'Começar Gratuitamente')}
            </Button>
          </Link>
          <a href={getContent('hero', 'secondary_button_link', WHATSAPP_URL)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="text-sm px-8 py-6 border-cofound-green/30 text-cofound-green hover:text-cofound-green hover:bg-cofound-green/10 font-semibold rounded-full">
              <Phone className="mr-2 h-5 w-5" />
              {getContent('hero', 'secondary_button', 'Fale com um consultor')}
            </Button>
          </a>
        </div>
      </AnimatedGroup>

      {/* Screenshot with scroll animation */}
      <ContainerScroll titleComponent={<></>}>
        <ScreenshotImage
          src={dashboardImg}
          alt="Dashboard RUMO com gráfico de progresso, pilares estratégicos e KPIs em tempo real"
          eager
        />
      </ContainerScroll>
    </div>
  </section>
);
