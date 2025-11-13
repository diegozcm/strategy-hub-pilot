import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, BarChart3, Target as TargetIcon, FileText, Users, TrendingUp, ArrowRight, Play, Star, Shield, Zap, Lock, Target, Award, ChevronLeft, ChevronRight, Map, Lightbulb, Building2, Rocket, CheckCircle, Phone, Mail, MapPin, Linkedin, Twitter, MessageSquare, UserCheck, TrendingDown, Activity, PieChart, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

type Theme = 'cofound' | 'strategy';

interface LandingPageBaseProps {
  getContent: (section: string, key: string, fallback?: string) => string;
  theme?: Theme;
}

// Theme tokens for dynamic color application
const themes = {
  cofound: {
    // Layout backgrounds
    pageBg: 'bg-cofound-light-gray',
    sectionBg: 'bg-white',
    sectionAltBg: 'bg-gradient-to-br from-gray-50 via-white to-gray-50',
    sectionDarkBg: 'bg-cofound-navy',
    
    // Header
    headerBg: 'bg-cofound-cyan/95',
    headerBorder: 'border-white/10',
    logoColor: 'text-white',
    logoSubtext: 'text-white/90',
    navLink: 'text-white hover:text-cofound-navy',
    loginBtn: 'border-2 border-white text-white hover:bg-white hover:text-cofound-navy shadow-md transition-all duration-300',
    
    // Hero section
    heroBg: 'bg-gradient-to-br from-white via-gray-50 to-cofound-cyan/5',
    heroTitle: 'text-cofound-navy',
    heroSubtitle: 'text-gray-700',
    primaryBtn: 'bg-cofound-cyan hover:bg-cofound-navy text-white shadow-lg',
    secondaryBtn: 'border-2 border-cofound-navy text-cofound-navy hover:bg-cofound-navy hover:text-white shadow-md',
    trustBadge: 'bg-cofound-cyan/10 text-cofound-cyan border-cofound-cyan/20',
    
    // Features section
    featureTitle: 'text-cofound-cyan',
    featureSubtitle: 'text-gray-600',
    strategyBadge: 'bg-cofound-cyan text-white',
    strategyCardBg: 'bg-gradient-to-r from-cofound-cyan/5 to-cofound-lime/5',
    strategyCardIconBg: 'bg-cofound-cyan/10 group-hover:bg-cofound-cyan/20',
    strategyCardIcon: 'text-cofound-cyan',
    strategyCardTitle: 'text-cofound-navy',
    strategyCardDesc: 'text-gray-600',
    strategyInfoBox: 'bg-cofound-cyan/10 text-cofound-navy',
    strategyInfoText: 'text-gray-600',
    
    startupBadge: 'bg-cofound-lime text-cofound-navy',
    startupCardBg: 'bg-gradient-to-r from-cofound-lime/5 to-cofound-cyan/5',
    startupCardIconBg: 'bg-cofound-lime/10 group-hover:bg-cofound-lime/20',
    startupCardIcon: 'text-cofound-lime',
    startupInfoBox: 'bg-cofound-lime/10 text-cofound-navy',
    
    beepTitle: 'text-cofound-navy',
    beepText: 'text-gray-600',
    beepBox: 'bg-cofound-lime/10 text-cofound-navy',
    
    // Demo section
    demoBg: 'bg-gradient-to-br from-gray-50 via-white to-gray-50',
    demoTitle: 'text-cofound-navy',
    demoSubtitle: 'text-gray-600',
    demoCard: 'bg-gradient-to-br from-cofound-cyan/10 to-cofound-navy/5 border-2 border-cofound-cyan/20',
    demoImageBg: 'bg-white border-gray-200',
    demoModuleBadge: 'bg-cofound-cyan/10 text-cofound-cyan border-cofound-cyan/20',
    demoNavBtn: 'bg-cofound-cyan hover:bg-cofound-navy text-white',
    demoDescTitle: 'text-cofound-navy',
    demoDescText: 'text-gray-600',
    
    // Benefits section
    benefitsBg: 'bg-cofound-navy',
    benefitsTitle: 'text-white',
    benefitsSubtitle: 'text-cofound-light-gray',
    benefitCard: 'bg-white/10 border-white/20 hover:bg-white/20',
    benefitIcon: 'text-cofound-cyan',
    benefitValue: 'text-white',
    benefitLabel: 'text-cofound-light-gray',
    
    // Testimonials section
    testimonialsBg: 'bg-gradient-to-br from-white via-gray-50 to-white',
    testimonialsTitle: 'text-cofound-navy',
    testimonialsSubtitle: 'text-gray-600',
    testimonialCard: 'bg-white border-cofound-cyan/20 hover:shadow-cofound-cyan/20',
    testimonialQuote: 'text-gray-700',
    testimonialName: 'text-cofound-navy',
    testimonialRole: 'text-gray-600',
    testimonialStars: 'text-cofound-cyan',
    
    // CTA section
    ctaBg: 'bg-gradient-to-r from-cofound-cyan to-cofound-navy',
    ctaTitle: 'text-white',
    ctaSubtitle: 'text-white/90',
    ctaPrimaryBtn: 'bg-white text-cofound-navy hover:bg-gray-100',
    ctaSecondaryBtn: 'border-2 border-white text-white hover:bg-white hover:text-cofound-navy',
    
    // Footer
    footerBg: 'bg-cofound-navy',
    footerTitle: 'text-white',
    footerText: 'text-cofound-light-gray',
    footerLink: 'text-cofound-light-gray hover:text-white',
    footerLogoColor: 'text-white',
    footerBorder: 'border-white/20',
    footerCopyright: 'text-cofound-light-gray',
  },
  strategy: {
    // Layout backgrounds
    pageBg: 'bg-strategy-gray-light',
    sectionBg: 'bg-white',
    sectionAltBg: 'bg-gradient-to-br from-strategy-gray-light to-white',
    sectionDarkBg: 'bg-strategy-blue-navy',
    
    // Header
    headerBg: 'bg-strategy-gray-light/95',
    headerBorder: 'border-border',
    logoColor: 'text-strategy-red-dark',
    logoSubtext: 'text-strategy-gray-medium',
    navLink: 'text-strategy-blue-navy hover:text-accent',
    loginBtn: 'border-strategy-blue-navy text-strategy-blue-navy hover:bg-strategy-blue-navy hover:text-white',
    
    // Hero section
    heroBg: 'bg-gradient-to-br from-strategy-gray-light to-white',
    heroTitle: 'text-strategy-red-dark',
    heroSubtitle: 'text-strategy-blue-navy',
    primaryBtn: 'bg-strategy-red-dark hover:bg-strategy-red-dark/90 text-white',
    secondaryBtn: 'border-strategy-blue-navy text-strategy-blue-navy hover:bg-strategy-blue-navy hover:text-white',
    trustBadge: 'bg-primary/10 text-primary border-primary/20',
    
    // Features section
    featureTitle: 'text-strategy-red-dark',
    featureSubtitle: 'text-strategy-gray-medium',
    strategyBadge: 'bg-primary text-white',
    strategyCardBg: 'bg-gradient-to-r from-primary/5 to-accent/5',
    strategyCardIconBg: 'bg-primary/10 group-hover:bg-primary/20',
    strategyCardIcon: 'text-primary',
    strategyCardTitle: 'text-strategy-blue-navy',
    strategyCardDesc: 'text-strategy-gray-medium',
    strategyInfoBox: 'bg-primary/10 text-strategy-blue-navy',
    strategyInfoText: 'text-strategy-gray-medium',
    
    startupBadge: 'bg-accent text-white',
    startupCardBg: 'bg-gradient-to-r from-accent/5 to-primary/5',
    startupCardIconBg: 'bg-accent/10 group-hover:bg-accent/20',
    startupCardIcon: 'text-accent',
    startupInfoBox: 'bg-accent/10 text-strategy-blue-navy',
    
    beepTitle: 'text-strategy-blue-navy',
    beepText: 'text-strategy-gray-medium',
    beepBox: 'bg-accent/10 text-strategy-blue-navy',
    
    // Demo section
    demoBg: 'bg-strategy-blue-navy',
    demoTitle: 'text-white',
    demoSubtitle: 'text-strategy-gray-light',
    demoCard: 'bg-white/10',
    demoImageBg: 'bg-white/20',
    demoModuleBadge: 'bg-accent/20 text-white border-white/20',
    demoNavBtn: 'bg-accent hover:bg-accent/80 text-white',
    demoDescTitle: 'text-white',
    demoDescText: 'text-strategy-gray-light',
    
    // Benefits section
    benefitsBg: 'bg-gradient-to-br from-white via-strategy-gray-light to-white',
    benefitsTitle: 'text-strategy-blue-navy',
    benefitsSubtitle: 'text-strategy-gray-medium',
    benefitCard: 'bg-white hover:shadow-accent/20',
    benefitIcon: 'text-accent',
    benefitValue: 'text-strategy-blue-navy',
    benefitLabel: 'text-strategy-gray-medium',
    
    // Testimonials section
    testimonialsBg: 'bg-white',
    testimonialsTitle: 'text-strategy-blue-navy',
    testimonialsSubtitle: 'text-strategy-gray-medium',
    testimonialCard: 'bg-white hover:shadow-accent/20',
    testimonialQuote: 'text-strategy-gray-medium',
    testimonialName: 'text-strategy-blue-navy',
    testimonialRole: 'text-strategy-gray-medium',
    testimonialStars: 'text-accent',
    
    // CTA section
    ctaBg: 'bg-gradient-to-r from-primary to-accent',
    ctaTitle: 'text-white',
    ctaSubtitle: 'text-white/90',
    ctaPrimaryBtn: 'bg-white text-strategy-blue-navy hover:bg-strategy-gray-light',
    ctaSecondaryBtn: 'border-2 border-white text-white hover:bg-white hover:text-strategy-blue-navy',
    
    // Footer
    footerBg: 'bg-strategy-blue-navy',
    footerTitle: 'text-white',
    footerText: 'text-strategy-gray-light',
    footerLink: 'text-strategy-gray-light hover:text-white',
    footerLogoColor: 'text-white',
    footerBorder: 'border-white/20',
    footerCopyright: 'text-strategy-gray-light',
  },
};

export const LandingPageBase: React.FC<LandingPageBaseProps> = ({ getContent, theme = 'cofound' }) => {
  const [currentScreenshot, setCurrentScreenshot] = React.useState(0);
  const t = themes[theme];

  // Helper function to parse boolean values from content
  const parseBoolean = (value: string, defaultValue: boolean = false) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return defaultValue;
  };

  // Generate screenshots array from dynamic content
  const screenshots = React.useMemo(() => {
    return Array.from({ length: 8 }, (_, index) => {
      const num = index + 1;
      return {
        title: getContent('demo', `screenshot_${num}_title`, `Screenshot ${num}`),
        description: getContent('demo', `screenshot_${num}_description`, 'Descrição do screenshot'),
        module: getContent('demo', `screenshot_${num}_module`, 'Strategy HUB'),
        image: getContent('demo', `screenshot_${num}_image`, ''),
        placeholder: `screenshot-${num}.png`
      };
    }).filter(screenshot => screenshot.title && screenshot.description);
  }, [getContent]);

  // BEEP Maturity Levels
  const beepLevels = [{
    level: 1,
    name: "Idealizando",
    range: "1.0-1.8",
    color: "bg-red-500",
    description: "Conceituação inicial"
  }, {
    level: 2,
    name: "Validando",
    range: "1.9-2.6",
    color: "bg-orange-500",
    description: "Problemas e soluções"
  }, {
    level: 3,
    name: "Iniciando",
    range: "2.7-3.4",
    color: "bg-yellow-500",
    description: "Estruturação do negócio"
  }, {
    level: 4,
    name: "Validando Mercado",
    range: "3.5-4.2",
    color: "bg-blue-500",
    description: "Tração e escalabilidade"
  }, {
    level: 5,
    name: "Evoluindo",
    range: "4.3-5.0",
    color: "bg-green-500",
    description: "Crescimento sustentável"
  }];

  const nextScreenshot = () => {
    setCurrentScreenshot(prev => (prev + 1) % screenshots.length);
  };

  const prevScreenshot = () => {
    setCurrentScreenshot(prev => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <div className={`min-h-screen ${t.pageBg}`}>
      {/* Header */}
      <header className={`fixed top-0 w-full ${t.headerBg} backdrop-blur-sm border-b ${t.headerBorder} shadow-sm z-50`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className={`h-8 w-8 ${t.logoColor}`} />
            <div className="flex flex-col">
              <span className={`text-2xl font-bold ${t.logoColor}`}>Start Together</span>
              <span className={`text-xs ${t.logoSubtext}`}>by COFOUND</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className={t.navLink}>
              Funcionalidades
            </a>
            <a href="#cases" className={t.navLink}>
              Casos de Uso
            </a>
            <a href="#contact" className={t.navLink}>
              Contato
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="outline" className={t.loginBtn}>Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`pt-24 pb-16 px-4 ${t.heroBg}`}>
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className={`text-5xl md:text-6xl font-bold ${t.heroTitle} mb-6 leading-tight`}>
              {getContent('hero', 'title', 'A primeira plataforma que unifica Strategy HUB e Startup HUB')}
            </h1>
            
            <p className={`text-xl ${t.heroSubtitle} mb-8 leading-relaxed`}>
              {getContent('hero', 'subtitle', 'Transforme sua visão em resultados concretos com uma plataforma que acelera o crescimento do seu negócio e conecta startups aos melhores mentores do mercado.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {parseBoolean(getContent('hero', 'primary_button_active', 'false')) && (
                <Link to={getContent('hero', 'primary_button_link', '/auth')}>
                  <Button size="lg" className={`text-lg px-8 py-6 ${t.primaryBtn}`}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {getContent('hero', 'primary_button', 'Começar Gratuitamente')}
                  </Button>
                </Link>
              )}
              {parseBoolean(getContent('hero', 'secondary_button_active', 'false')) && (
                <a 
                  href={getContent('hero', 'secondary_button_link', 'https://wa.me//554796342353?text=Tenho%20interesse%20em%20saber%20mais%20sobre%20o%20Start%20Together%20by%20COFOUND')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" className={`text-lg px-8 py-6 ${t.secondaryBtn}`}>
                    <Phone className="mr-2 h-5 w-5" />
                    {getContent('hero', 'secondary_button', 'Fale com um consultor!')}
                  </Button>
                </a>
              )}
            </div>

            {/* Trust Badges */}
            {getContent('hero', 'trust_badges_active', 'true') === 'true' && (
              <div className="flex flex-wrap justify-center gap-6">
                {[1, 2, 3].map((num) => {
                  const badgeActive = getContent('hero', `badge_${num}_active`, 'true') === 'true';
                  if (!badgeActive) return null;
                  
                  const iconName = getContent('hero', `badge_${num}_icon`, num === 1 ? 'Target' : num === 2 ? 'TrendingUp' : 'Rocket');
                  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
                  
                  return (
                    <Badge key={num} className={`${t.trustBadge} border px-4 py-2 font-medium`}>
                      {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                      {getContent('hero', `badge_${num}_text`, num === 1 ? 'Estratégia' : num === 2 ? 'Crescimento' : 'Aceleração')}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section id="features" className={`py-16 px-4 ${t.sectionBg}`}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${t.featureTitle} mb-4`}>
              {getContent('features', 'title', 'Soluções Corporativas COFOUND')}
            </h2>
            <p className={`text-xl ${t.featureSubtitle} max-w-3xl mx-auto`}>
              {getContent('features', 'subtitle', 'Impulsione o crescimento da sua empresa com nossas ferramentas especializadas')}
            </p>
          </div>

          <div className="space-y-16">
            {/* Strategy HUB */}
            <div className={`${t.strategyCardBg} rounded-3xl p-8`}>
              <div className="text-center mb-8">
                <Badge className={`mb-4 ${t.strategyBadge} px-6 py-3 text-base`}>
                  <Building2 className="h-5 w-5 mr-2" />
                  {getContent('features', 'strategy_hub_title', 'Strategy HUB')} - Consultoria Estratégica COFOUND
                </Badge>
                <h3 className={`text-3xl font-bold ${t.strategyCardTitle} mb-4`}>Consultoria Integrada com Tecnologia</h3>
                <p className={`text-lg ${t.strategyCardDesc} max-w-2xl mx-auto`}>
                  {getContent('features', 'strategy_hub_description', 'Ferramentas avançadas para planejamento estratégico empresarial')}
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((num) => {
                  const iconName = getContent('features', `strategy_feature_${num}_icon`, num === 1 ? 'BarChart3' : num === 2 ? 'Target' : 'Brain');
                  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
                  
                  return (
                    <Card key={num} className="group hover:shadow-xl transition-all duration-300 border bg-white">
                      <CardHeader>
                        <div className={`w-12 h-12 ${t.strategyCardIconBg} rounded-lg flex items-center justify-center mb-4 transition-colors`}>
                          {IconComponent ? <IconComponent className={`h-6 w-6 ${t.strategyCardIcon}`} /> : <BarChart3 className={`h-6 w-6 ${t.strategyCardIcon}`} />}
                        </div>
                        <CardTitle className={t.strategyCardTitle}>
                          {getContent('features', `strategy_feature_${num}_title`, num === 1 ? 'Dashboard Executivo' : num === 2 ? 'Mapa Estratégico' : 'Copiloto com IA')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className={`text-base ${t.strategyCardDesc}`}>
                          {getContent('features', `strategy_feature_${num}_description`, 
                            num === 1 ? 'Visão centralizada de todos os indicadores estratégicos da empresa' : 
                            num === 2 ? 'Visualize e gerencie objetivos, resultados-chave e iniciativas' :
                            'Assistente inteligente para análises e insights estratégicos'
                          )}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className={`${t.strategyInfoBox} rounded-xl p-6 text-center`}>
                <p className="font-semibold mb-2">
                  <Building2 className="inline h-5 w-5 mr-2" />
                  Consultoria COFOUND + Tecnologia
                </p>
                <p className={t.strategyInfoText}>
                  Combine a expertise de nossos consultores especializados com uma plataforma tecnológica avançada para execução e monitoramento contínuo da estratégia empresarial.
                </p>
              </div>
            </div>

            {/* Startup HUB */}
            <div className={`${t.startupCardBg} rounded-3xl p-8`}>
              <div className="text-center mb-8">
                <Badge className={`mb-4 ${t.startupBadge} px-6 py-3 text-base`}>
                  <Rocket className="h-5 w-5 mr-2" />
                  {getContent('features', 'startup_hub_title', 'Startup HUB')} - Aceleração COFOUND
                </Badge>
                <h3 className={`text-3xl font-bold ${t.strategyCardTitle} mb-4`}>Aceleração Profissional com Metodologia BEEP</h3>
                <p className={`text-lg ${t.strategyCardDesc} max-w-2xl mx-auto`}>
                  {getContent('features', 'startup_hub_description', 'Ecossistema completo para startups em crescimento')}
                </p>
              </div>

              {/* BEEP Visual */}
              <div className="bg-white rounded-xl p-6 mb-8">
                <h4 className={`text-xl font-bold ${t.beepTitle} mb-6 text-center`}>
                  Metodologia BEEP - 5 Fases de Evolução Empresarial
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  {beepLevels.map((level, index) => (
                    <div key={level.level} className="text-center">
                      <div className={`w-16 h-16 ${level.color} rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg`}>
                        {level.level}
                      </div>
                      <h5 className={`font-semibold ${t.beepTitle} mb-1`}>{level.name}</h5>
                      <p className={`text-xs ${t.beepText} mb-2`}>{level.range}</p>
                      <p className={`text-xs ${t.beepText}`}>{level.description}</p>
                      {index < beepLevels.length - 1 && (
                        <div className="hidden md:block absolute translate-x-8 translate-y-8">
                          <ArrowRight className={`h-4 w-4 ${t.beepText}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className={`${t.beepBox} rounded-lg p-4 text-center`}>
                  <p className="font-semibold mb-1">Avaliação Contínua BEEP</p>
                  <p className={`text-sm ${t.beepText}`}>
                    3 Dimensões principais: <span className="font-semibold">Modelo de Negócio</span> • <span className="font-semibold">Produto</span> • <span className="font-semibold">Operação</span>
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((num) => {
                  const iconName = getContent('features', `startup_feature_${num}_icon`, num === 1 ? 'TrendingUp' : num === 2 ? 'CheckCircle' : 'Users');
                  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
                  
                  return (
                    <Card key={num} className="group hover:shadow-xl transition-all duration-300 border bg-white">
                      <CardHeader>
                        <div className={`w-12 h-12 ${t.startupCardIconBg} rounded-lg flex items-center justify-center mb-4 transition-colors`}>
                          {IconComponent ? <IconComponent className={`h-6 w-6 ${t.startupCardIcon}`} /> : <Activity className={`h-6 w-6 ${t.startupCardIcon}`} />}
                        </div>
                        <CardTitle className={t.strategyCardTitle}>
                          {getContent('features', `startup_feature_${num}_title`, 
                            num === 1 ? 'Analytics BEEP' : num === 2 ? 'Avaliação BEEP' : 'Mentoria Especializada'
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className={`text-base ${t.strategyCardDesc}`}>
                          {getContent('features', `startup_feature_${num}_description`,
                            num === 1 ? 'Análise avançada de performance para startups' :
                            num === 2 ? 'Metodologia proprietária de avaliação de maturidade' :
                            'Conecte-se com mentores especialistas do mercado'
                          )}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className={`${t.startupInfoBox} rounded-xl p-6 text-center`}>
                <p className="font-semibold mb-2">
                  <Rocket className="inline h-5 w-5 mr-2" />
                  Aceleração COFOUND + Metodologia BEEP
                </p>
                <p className={t.strategyInfoText}>
                  Programa completo de aceleração baseado na metodologia BEEP, com mentoria especializada e acompanhamento personalizado para startups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className={`py-16 px-4 ${t.demoBg}`}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${t.demoTitle} mb-4`}>
              {getContent('demo', 'title', 'Veja o Start Together em Ação')}
            </h2>
            <p className={`text-xl ${t.demoSubtitle}`}>
              {getContent('demo', 'subtitle', 'Explore as principais funcionalidades da plataforma')}
            </p>
          </div>

          {screenshots.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <div className={`relative ${t.demoCard} backdrop-blur-sm rounded-3xl p-8 mb-8`}>
                <div className={`aspect-video ${t.demoImageBg} rounded-lg flex items-center justify-center mb-4 relative overflow-hidden border shadow-lg`}>
                  {screenshots[currentScreenshot]?.image ? (
                    <img 
                      src={screenshots[currentScreenshot].image} 
                      alt={screenshots[currentScreenshot].title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Play className={`h-16 w-16 ${t.demoSubtitle} mx-auto mb-4`} />
                      <p className={`text-lg ${t.demoSubtitle}`}>
                        {screenshots[currentScreenshot]?.placeholder}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mb-4">
                  <Button 
                    onClick={prevScreenshot}
                    className={t.demoNavBtn}
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <Badge className={`${t.demoModuleBadge} border px-3 py-1`}>
                    {screenshots[currentScreenshot]?.module}
                  </Badge>
                  
                  <Button 
                    onClick={nextScreenshot}
                    className={t.demoNavBtn}
                    size="sm"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {/* Screenshot Description */}
                <div className="text-center">
                  <h3 className={`text-2xl font-bold ${t.demoDescTitle} mb-2`}>
                    {screenshots[currentScreenshot]?.title}
                  </h3>
                  <p className={`text-lg ${t.demoDescText}`}>
                    {screenshots[currentScreenshot]?.description}
                  </p>
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentScreenshot(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentScreenshot ? `${t.demoNavBtn} w-8` : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ROI Benefits Section */}
      <section className={`py-16 px-4 ${t.benefitsBg}`}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${t.benefitsTitle} mb-4`}>
              {getContent('benefits', 'title', 'Resultados Mensuráveis')}
            </h2>
            <p className={`text-xl ${t.benefitsSubtitle} max-w-3xl mx-auto`}>
              {getContent('benefits', 'subtitle', 'Impacto direto nos principais indicadores do seu negócio')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3, 4].map((num) => {
              const iconName = getContent('benefits', `benefit_${num}_icon`, 
                num === 1 ? 'TrendingUp' : num === 2 ? 'Target' : num === 3 ? 'Clock' : 'Award'
              );
              const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
              
              return (
                <Card key={num} className={`${t.benefitCard} border transition-all duration-300 text-center`}>
                  <CardContent className="pt-6">
                    {IconComponent && <IconComponent className={`h-12 w-12 ${t.benefitIcon} mx-auto mb-4`} />}
                    <div className={`text-4xl font-bold ${t.benefitValue} mb-2`}>
                      {getContent('benefits', `benefit_${num}_value`, num === 1 ? '+40%' : num === 2 ? '3x' : num === 3 ? '-50%' : '90%')}
                    </div>
                    <p className={`text-sm ${t.benefitLabel}`}>
                      {getContent('benefits', `benefit_${num}_label`, 
                        num === 1 ? 'Crescimento' : num === 2 ? 'Mais Rápido' : num === 3 ? 'Tempo Reduzido' : 'Taxa de Sucesso'
                      )}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-16 px-4 ${t.testimonialsBg}`}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${t.testimonialsTitle} mb-4`}>
              {getContent('testimonials', 'title', 'O que nossos clientes dizem')}
            </h2>
            <p className={`text-xl ${t.testimonialsSubtitle}`}>
              {getContent('testimonials', 'subtitle', 'Histórias de sucesso de empresas que transformaram sua estratégia')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((num) => (
              <Card key={num} className={`${t.testimonialCard} border hover:shadow-xl transition-all duration-300`}>
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${t.testimonialStars} fill-current`} />
                    ))}
                  </div>
                  <p className={`${t.testimonialQuote} mb-6 italic`}>
                    "{getContent('testimonials', `testimonial_${num}_quote`, 'Excelente plataforma!')}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {getContent('testimonials', `testimonial_${num}_name`, 'Cliente').charAt(0)}
                    </div>
                    <div>
                      <p className={`font-semibold ${t.testimonialName}`}>
                        {getContent('testimonials', `testimonial_${num}_name`, 'Cliente Satisfeito')}
                      </p>
                      <p className={`text-sm ${t.testimonialRole}`}>
                        {getContent('testimonials', `testimonial_${num}_role`, 'CEO, Empresa')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`py-20 px-4 ${t.ctaBg}`}>
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className={`text-4xl md:text-5xl font-bold ${t.ctaTitle} mb-6`}>
            {getContent('cta', 'title', 'Pronto para transformar sua empresa?')}
          </h2>
          <p className={`text-xl ${t.ctaSubtitle} mb-8`}>
            {getContent('cta', 'subtitle', 'Junte-se a centenas de empresas que já estão crescendo com o Start Together')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className={`text-lg px-8 py-6 ${t.ctaPrimaryBtn} shadow-xl`}>
                <ArrowRight className="mr-2 h-5 w-5" />
                {getContent('cta', 'primary_button', 'Começar Agora')}
              </Button>
            </Link>
            <a 
              href={getContent('cta', 'secondary_button_link', 'https://wa.me//554796342353')} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className={`text-lg px-8 py-6 ${t.ctaSecondaryBtn} shadow-xl`}>
                <MessageSquare className="mr-2 h-5 w-5" />
                {getContent('cta', 'secondary_button', 'Agendar Demo')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={t.footerBg}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className={`h-6 w-6 ${t.footerLogoColor}`} />
                <span className={`text-xl font-bold ${t.footerTitle}`}>Start Together</span>
              </div>
              <p className={`${t.footerText} text-sm mb-4`}>
                {getContent('footer', 'description', 'Impulsionando o crescimento de empresas através de estratégia e inovação.')}
              </p>
              <div className="flex gap-4">
                <a href={getContent('footer', 'linkedin_url', '#')} target="_blank" rel="noopener noreferrer" className={t.footerLink}>
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href={getContent('footer', 'twitter_url', '#')} target="_blank" rel="noopener noreferrer" className={t.footerLink}>
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <h3 className={`font-semibold ${t.footerTitle} mb-4`}>Navegação</h3>
              <ul className="space-y-2">
                <li><a href="#features" className={t.footerLink}>Funcionalidades</a></li>
                <li><a href="#cases" className={t.footerLink}>Casos de Uso</a></li>
                <li><Link to="/auth" className={t.footerLink}>Login</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className={`font-semibold ${t.footerTitle} mb-4`}>Suporte</h3>
              <ul className="space-y-2">
                <li><a href={getContent('footer', 'help_center_url', '#')} className={t.footerLink}>Central de Ajuda</a></li>
                <li><a href={getContent('footer', 'documentation_url', '#')} className={t.footerLink}>Documentação</a></li>
                <li><a href={getContent('footer', 'contact_url', '#contact')} className={t.footerLink}>Contato</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div id="contact">
              <h3 className={`font-semibold ${t.footerTitle} mb-4`}>Contato</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Mail className={`h-4 w-4 ${t.footerText}`} />
                  <a href={`mailto:${getContent('footer', 'email', 'contato@starttogether.com')}`} className={t.footerLink}>
                    {getContent('footer', 'email', 'contato@starttogether.com')}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className={`h-4 w-4 ${t.footerText}`} />
                  <a href={`tel:${getContent('footer', 'phone', '+55479634-2353')}`} className={t.footerLink}>
                    {getContent('footer', 'phone', '+55 47 9634-2353')}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className={`h-4 w-4 ${t.footerText} mt-1`} />
                  <span className={t.footerText}>
                    {getContent('footer', 'address', 'Florianópolis, SC - Brasil')}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className={`border-t ${t.footerBorder} pt-8`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className={`text-sm ${t.footerCopyright}`}>
                © 2024 Start Together by COFOUND. Todos os direitos reservados.
              </p>
              <div className="flex gap-6">
                <a href={getContent('footer', 'privacy_url', '#')} className={`text-sm ${t.footerLink}`}>
                  Política de Privacidade
                </a>
                <a href={getContent('footer', 'terms_url', '#')} className={`text-sm ${t.footerLink}`}>
                  Termos de Uso
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
