import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, Layers, Building2, Clock, ThumbsUp, FolderKanban, ChevronRight } from 'lucide-react';
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

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring' as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

export const HeroSection: React.FC<Props> = ({ getContent }) => (
  <section className="pt-36 pb-20 lg:pt-44 lg:pb-28 px-4 relative overflow-hidden bg-cofound-blue-dark">
    {/* Background effects */}
    <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cofound-blue-light/[0.04] rounded-full blur-[160px] pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cofound-green/[0.03] rounded-full blur-[120px] pointer-events-none" />

    <div className="container mx-auto relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left – copy */}
        <div>
          <AnimatedGroup
            variants={{
              container: {
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15 },
                },
              },
              item: transitionVariants.item,
            }}
            className="flex flex-col"
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

            {/* Title */}
            <TextEffect
              preset="blur"
              per="word"
              delay={0.2}
              as="h1"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-display font-bold text-white mb-6 leading-[1.1] tracking-tight"
            >
              {getContent('hero', 'title', 'Cocriamos soluções adequadas às complexidades das organizações')}
            </TextEffect>

            {/* Subtitle */}
            <TextEffect
              preset="fade"
              per="word"
              delay={0.5}
              as="p"
              className="text-base lg:text-lg text-white/50 mb-10 leading-relaxed font-sans max-w-lg"
            >
              {getContent('hero', 'subtitle', 'O Strategy HUB conecta consultoria estratégica à tecnologia, transformando sua visão em resultados mensuráveis com inteligência artificial.')}
            </TextEffect>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/auth">
                <Button size="lg" className="text-base px-8 py-6 bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 shadow-lg shadow-cofound-green/20 transition-all hover:scale-[1.03] rounded-full">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  {getContent('hero', 'primary_button', 'Acessar Plataforma')}
                </Button>
              </Link>
              <a href={getContent('hero', 'secondary_button_link', WHATSAPP_URL)} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="text-base px-8 py-6 border-white/15 text-white hover:bg-white/[0.06] font-semibold rounded-full">
                  <Phone className="mr-2 h-5 w-5" />
                  {getContent('hero', 'secondary_button', 'Fale com um consultor')}
                </Button>
              </a>
            </div>

            {/* Inline stats */}
            <div className="flex flex-wrap gap-6">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <s.icon className="h-4 w-4 text-cofound-green" />
                  </div>
                  <div>
                    <p className="text-lg font-display font-bold text-white leading-none">{s.value}</p>
                    <p className="text-[11px] text-white/40 font-sans">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedGroup>
        </div>

        {/* Right – screenshot */}
        <AnimatedGroup
          variants={{
            container: {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.6 },
              },
            },
            item: {
              hidden: { opacity: 0, scale: 0.92, filter: 'blur(8px)' },
              visible: {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                transition: { type: 'spring' as const, bounce: 0.2, duration: 1.2 },
              },
            },
          }}
          className="hidden lg:block"
        >
          <ScreenshotImage
            src={dashboardImg}
            alt="Dashboard RUMO com gráfico de progresso, pilares estratégicos e KPIs em tempo real"
            eager
          />
        </AnimatedGroup>
      </div>
    </div>
  </section>
);
