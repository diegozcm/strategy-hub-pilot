import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Phone, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScreenshotImage } from './ScreenshotImage';
import dashboardImg from '@/assets/screenshots/dashboard-rumo.png';

const WHATSAPP_URL = 'https://wa.me/554796342353?text=Tenho%20interesse%20em%20saber%20mais%20sobre%20o%20Strategy%20HUB%20by%20COFOUND';

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

export const HeroSection: React.FC<Props> = ({ getContent }) => (
  <section className="pt-32 pb-24 px-4 relative overflow-hidden bg-cofound-blue-dark">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-cofound-blue-light/5 rounded-full blur-[140px] pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cofound-green/5 rounded-full blur-[100px] pointer-events-none" />

    <div className="container mx-auto relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left – copy */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 bg-cofound-green/15 text-cofound-green border-cofound-green/30 px-4 py-2 font-sans">
              <Layers className="h-4 w-4 mr-2" />
              Plataforma de Gestão Estratégica
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight"
          >
            {getContent('hero', 'title', 'Cocriamos soluções adequadas às complexidades das organizações')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/60 mb-8 leading-relaxed font-sans max-w-xl"
          >
            {getContent('hero', 'subtitle', 'O Strategy HUB conecta consultoria estratégica à tecnologia, transformando sua visão em resultados mensuráveis com inteligência artificial.')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6 bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 shadow-lg shadow-cofound-green/20 transition-all hover:scale-105">
                <ArrowRight className="mr-2 h-5 w-5" />
                {getContent('hero', 'primary_button', 'Acessar Plataforma')}
              </Button>
            </Link>
            <a href={getContent('hero', 'secondary_button_link', WHATSAPP_URL)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10 font-semibold">
                <Phone className="mr-2 h-5 w-5" />
                {getContent('hero', 'secondary_button', 'Fale com um consultor')}
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Right – screenshot */}
        <motion.div
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden lg:block"
        >
          <ScreenshotImage
            src={dashboardImg}
            alt="Dashboard RUMO com gráfico de progresso, pilares estratégicos e KPIs em tempo real"
          />
        </motion.div>
      </div>
    </div>
  </section>
);
