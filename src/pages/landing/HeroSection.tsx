import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, ChevronRight, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScreenshotImage } from './ScreenshotImage';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { TextEffect } from '@/components/ui/text-effect';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { DarkBackground } from './DarkBackground';
import dashboardImg from '@/assets/screenshots/dashboard-rumo.png';

const WHATSAPP_URL = 'https://wa.me/554796342353?text=Tenho%20interesse%20em%20saber%20mais%20sobre%20o%20Strategy%20HUB%20by%20COFOUND';

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

export const HeroSection: React.FC<Props> = ({ getContent }) => (
  <DarkBackground className="pt-16 pb-0 lg:pt-20">
    <div className="mx-auto max-w-6xl px-6">
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

        <TextEffect
          preset="blur"
          per="word"
          delay={0.2}
          as="h1"
          className="max-w-3xl text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-display font-bold text-white leading-[1.2] tracking-tight"
        >
          {getContent('hero', 'title', 'A primeira plataforma que unifica estratégia e aceleração de negócios!')}
        </TextEffect>

        <TextEffect
          preset="blur"
          per="word"
          delay={0.4}
          as="span"
          className="mt-1 block max-w-lg text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-display font-bold leading-[1.2] tracking-tight text-cofound-green"
        >
          {getContent('hero', 'title_gradient', 'Inteligente para seu Negócio')}
        </TextEffect>

        <TextEffect
          preset="fade"
          per="word"
          delay={0.6}
          as="p"
          className="mt-6 max-w-md text-sm lg:text-base text-white/50 leading-relaxed font-sans"
        >
          {getContent('hero', 'subtitle', 'Transforme sua visão em resultados concretos com uma plataforma que acelera o crescimento do seu negócio.')}
        </TextEffect>

        <div className="mt-10 mb-14 flex flex-col sm:flex-row items-center gap-4">
          <Link to="/auth">
            <Button size="lg" className="text-sm px-8 py-6 bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 shadow-lg shadow-cofound-green/20 transition-all hover:scale-[1.03] rounded-full">
              <ArrowRight className="mr-2 h-5 w-5" />
              {getContent('hero', 'primary_button', 'Começar Gratuitamente')}
            </Button>
          </Link>
          <a href={getContent('hero', 'secondary_button_link', WHATSAPP_URL)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="text-sm px-8 py-6 bg-transparent border-white/30 text-white hover:text-white hover:bg-white/10 font-semibold rounded-full">
              <Phone className="mr-2 h-5 w-5" />
              {getContent('hero', 'secondary_button', 'Fale com um consultor')}
            </Button>
          </a>
        </div>
      </AnimatedGroup>

      <ContainerScroll titleComponent={<></>}>
        <ScreenshotImage
          src={dashboardImg}
          alt="Dashboard RUMO com gráfico de progresso, pilares estratégicos e KPIs em tempo real"
          eager
        />
      </ContainerScroll>
    </div>
  </DarkBackground>
);
