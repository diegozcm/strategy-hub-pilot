import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Target, Linkedin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { ServiceCard } from '@/components/admin/landing-page/preview/ServiceCard';
import { ProcessStep } from '@/components/admin/landing-page/preview/ProcessStep';
import { CofounderCard } from '@/components/admin/landing-page/preview/CofounderCard';

const LandingPage = () => {
  const { getContent } = useLandingPageContent();

  // Parse array/json content
  const parseArray = (content: string, fallback: string[] = []) => {
    try {
      return JSON.parse(content);
    } catch {
      return fallback;
    }
  };

  const menuItems = parseArray(
    getContent('header', 'menu_items', '["HOME", "CASOS", "JORNADAS", "EVENTOS", "DOCUMENTOS"]'),
    ['HOME', 'CASOS', 'JORNADAS', 'EVENTOS', 'DOCUMENTOS']
  );

  const trustLogos = Array.from({ length: 12 }, (_, i) => 
    getContent('trust_badges', `logo_${i + 1}`, '')
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-cofound-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-cofound-cyan backdrop-blur-sm z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-cofound-white" />
            <span className="text-2xl font-bold text-cofound-white">COFOUND</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item, idx) => (
              <a 
                key={idx}
                href={`#${item.toLowerCase()}`} 
                className="text-cofound-white hover:text-cofound-navy transition-colors font-medium"
              >
                {item}
              </a>
            ))}
          </nav>

          <Link to="/auth">
            <Button variant="outline" className="border-cofound-white text-cofound-white hover:bg-cofound-white hover:text-cofound-cyan">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-cofound-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {getContent('hero', 'background_image') && (
            <img 
              src={getContent('hero', 'background_image')} 
              alt="Background"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-cofound-white mb-6 leading-tight animate-fade-in">
              {getContent('hero', 'title', 'Cocriamos soluções adequadas às complexidades das organizações')}
            </h1>
            
            <p className="text-xl text-cofound-white/90 mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {getContent('hero', 'subtitle', 'Transforme sua visão em resultados concretos')}
            </p>

            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-cofound-cyan hover:bg-cofound-cyan/90 text-cofound-white border-none hover-scale"
                onClick={() => window.open(getContent('hero', 'primary_button_link', '/auth'), '_self')}
              >
                {getContent('hero', 'primary_button', 'ACESSAR SITE')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges / Marcas */}
      {trustLogos.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <Card className="bg-cofound-cyan rounded-3xl p-12 border-none shadow-xl hover-scale">
              <h2 className="text-3xl font-bold text-cofound-white text-center mb-8">
                {getContent('trust_badges', 'title', 'Marcas que acreditam na Cofound')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
                {trustLogos.map((logo, idx) => (
                  <div key={idx} className="flex items-center justify-center bg-cofound-white rounded-lg p-4 h-20 hover-scale">
                    <img src={logo} alt={`Logo ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Large COFOUND Text Overlay */}
      <section className="py-20 px-4 bg-cofound-navy relative overflow-hidden">
        <div className="container mx-auto">
          <h2 className="text-[120px] md:text-[200px] font-black text-cofound-white/10 text-center leading-none select-none">
            COFOUND
          </h2>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-cofound-light-gray" id="services">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-cofound-navy mb-4">
              {getContent('services', 'title', 'O que a COFOUND faz')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {getContent('services', 'subtitle', 'Soluções integradas para o crescimento do seu negócio')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const title = getContent('services', `service_${num}_title`, '');
              if (!title) return null;
              
              return (
                <ServiceCard
                  key={num}
                  icon={getContent('services', `service_${num}_icon`, 'Lightbulb')}
                  title={title}
                  description={getContent('services', `service_${num}_description`, '')}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section - Começamos Ouvindo */}
      <section className="py-20 px-4 bg-cofound-white" id="process">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-cofound-navy mb-2">
              {getContent('process', 'title', 'Começamos ouvindo.')}
            </h2>
            <p className="text-xl text-cofound-lime font-semibold">
              {getContent('process', 'subtitle', 'Essa é a base da nossa Jornada Estratégica.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12 lg:gap-8 max-w-7xl mx-auto relative">
            {[1, 2, 3, 4, 5].map((num) => {
              const title = getContent('process', `step_${num}_title`, '');
              if (!title) return null;
              
              return (
                <ProcessStep
                  key={num}
                  number={`0${num}`}
                  phase={getContent('process', `step_${num}_phase`, 'ETAPA')}
                  title={title}
                  description={getContent('process', `step_${num}_description`, '')}
                  isLast={num === 5}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="py-20 px-4 bg-cofound-navy" id="education">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-cofound-white mb-6">
              {getContent('education', 'title', 'Educação Executiva & Empreendedora')}
            </h2>
            <p className="text-xl text-cofound-white/90 mb-8 leading-relaxed">
              {getContent('education', 'description', 'Programas de desenvolvimento para executivos e empreendedores')}
            </p>
            
            {getContent('education', 'event_image') && (
              <div className="rounded-2xl overflow-hidden shadow-2xl hover-scale">
                <img 
                  src={getContent('education', 'event_image')} 
                  alt="Education Event"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LAB Section */}
      <section className="py-20 px-4 bg-cofound-light-gray" id="lab">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-cofound-navy mb-6">
                {getContent('lab', 'title', 'LAB de Criatividade by Cofound')}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                {getContent('lab', 'description', 'Espaço de inovação e cocriação para soluções transformadoras')}
              </p>
            </div>
            
            {getContent('lab', 'image') && (
              <div className="rounded-2xl overflow-hidden shadow-xl hover-scale">
                <img 
                  src={getContent('lab', 'image')} 
                  alt="LAB"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cofounders Section */}
      <section className="py-20 px-4 bg-cofound-cyan" id="team">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-cofound-white mb-4">
              {getContent('cofounders', 'title', 'Nossos Cofounders')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((num) => {
              const name = getContent('cofounders', `cofounder_${num}_name`, '');
              if (!name) return null;
              
              return (
                <CofounderCard
                  key={num}
                  name={name}
                  role={getContent('cofounders', `cofounder_${num}_role`, '')}
                  company={getContent('cofounders', `cofounder_${num}_company`, '')}
                  photo={getContent('cofounders', `cofounder_${num}_photo`, '')}
                  linkedin={getContent('cofounders', `cofounder_${num}_linkedin`, '')}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-cofound-navy" id="contact">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-cofound-white mb-6">
              {getContent('final_cta', 'title', 'Venha acelerar o seu negócio com a gente!')}
            </h2>
            <p className="text-2xl text-cofound-cyan font-semibold mb-8">
              {getContent('final_cta', 'subtitle', 'Gestão, Design, & Inovação')}
            </p>
            
            <Button 
              size="lg" 
              className="text-lg px-12 py-6 bg-cofound-cyan hover:bg-cofound-cyan/90 text-cofound-white border-none hover-scale"
              onClick={() => window.open(getContent('final_cta', 'button_link', 'https://wa.me/554796342353'), '_blank')}
            >
              {getContent('final_cta', 'button', 'Conhecer e mais!')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-cofound-navy border-t border-cofound-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-cofound-cyan" />
              <span className="text-xl font-bold text-cofound-white">COFOUND</span>
            </div>
            
            <div className="flex items-center space-x-6">
              {getContent('footer', 'linkedin') && (
                <a 
                  href={getContent('footer', 'linkedin')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cofound-white hover:text-cofound-cyan transition-colors hover-scale"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
              )}
              {getContent('footer', 'instagram') && (
                <a 
                  href={getContent('footer', 'instagram')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cofound-white hover:text-cofound-cyan transition-colors hover-scale"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
            </div>
            
            <p className="text-sm text-cofound-white/70">
              {getContent('footer', 'copyright', 'Todos os direitos reservados ® CofounD LTDA')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
