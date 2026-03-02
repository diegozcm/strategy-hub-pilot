import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, Phone, Mail, MapPin, Linkedin, Instagram, 
  MessageSquare, Target, Brain, BarChart3, Map, Lightbulb, 
  Briefcase, Building2, Rocket, TrendingUp, Users, Compass,
  Mic, ShieldCheck, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LandingPageBaseProps {
  getContent: (section: string, key: string, fallback?: string) => string;
  theme?: string;
}

const WHATSAPP_URL = 'https://wa.me/554796342353?text=Tenho%20interesse%20em%20saber%20mais%20sobre%20o%20Strategy%20HUB%20by%20COFOUND';

const services = [
  { icon: Compass, title: 'Jornada Estratégica', desc: 'Planejamento estratégico completo com metodologias proprietárias para transformar a visão da sua empresa em resultados concretos.' },
  { icon: TrendingUp, title: 'Aceleração de Vendas', desc: 'Processos comerciais estruturados, funil otimizado e estratégias de crescimento para escalar suas vendas.' },
  { icon: Mic, title: 'Palestras & Workshops', desc: 'Conteúdos transformadores sobre estratégia, inovação e liderança para engajar e capacitar equipes.' },
  { icon: ShieldCheck, title: 'Diagnóstico 360°', desc: 'Avaliação completa do seu negócio identificando gaps, oportunidades e prioridades de ação.' },
  { icon: Users, title: 'Conselho Consultivo', desc: 'Profissionais experientes atuando como conselheiros para orientar decisões estratégicas da sua empresa.' },
  { icon: Rocket, title: 'Aceleração de Startups', desc: 'Programa de aceleração com metodologia BEEP para startups em fase de validação e crescimento.' },
];

const platformFeatures = [
  { icon: BarChart3, title: 'Dashboard RUMO', desc: 'Visão executiva integrada com objetivos, pilares estratégicos e indicadores de desempenho em tempo real.' },
  { icon: Map, title: 'Mapa Estratégico', desc: 'Visualize pilares estratégicos, objetivos corporativos e resultados-chave em uma visão unificada.' },
  { icon: Target, title: 'OKRs & Indicadores', desc: 'Defina objetivos, estabeleça key results mensuráveis e acompanhe o progresso com métricas detalhadas.' },
  { icon: Brain, title: 'Atlas IA', desc: 'Copiloto inteligente que fornece insights, análises preditivas e recomendações estratégicas personalizadas.' },
  { icon: Lightbulb, title: 'Ferramentas Estratégicas', desc: 'SWOT, Golden Circle, Vision Alignment e mais para fortalecer seu planejamento.' },
  { icon: Briefcase, title: 'Gestão de Projetos', desc: 'Gerencie iniciativas, projetos e planos de ação com acompanhamento de responsáveis e prazos.' },
];

const clientLogos = [
  'Copapel', 'Ágora Tech Park', 'Grupo Krona', 'Docol', 'Tupy',
  'Embraco', 'Whirlpool', 'Tigre', 'Schulz', 'Datasul',
  'Copapel', 'Ágora Tech Park', 'Grupo Krona', 'Docol', 'Tupy',
  'Embraco', 'Whirlpool', 'Tigre', 'Schulz', 'Datasul',
];

export const LandingPageBase: React.FC<LandingPageBaseProps> = ({ getContent }) => {
  return (
    <div className="min-h-screen bg-[#0D2338]">
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 w-full bg-[#0D2338]/95 backdrop-blur-md border-b border-white/10 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-[#38B6FF]" />
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold text-white">Strategy HUB</span>
              <span className="text-xs text-white/60 font-sans">by COFOUND</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#servicos" className="text-white/70 hover:text-white transition-colors font-sans text-sm">Serviços</a>
            <a href="#plataforma" className="text-white/70 hover:text-white transition-colors font-sans text-sm">Plataforma</a>
            <a href="#clientes" className="text-white/70 hover:text-white transition-colors font-sans text-sm">Clientes</a>
            <Link to="/releases" className="text-white/70 hover:text-white transition-colors font-sans text-sm">Novidades</Link>
          </nav>

          <Link to="/auth">
            <Button variant="outline" className="border-[#38B6FF] text-[#38B6FF] hover:bg-[#38B6FF] hover:text-[#0D2338] font-semibold transition-all duration-300">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#38B6FF]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-[#CDD966]/15 text-[#CDD966] border-[#CDD966]/30 px-4 py-2 font-sans">
              <Layers className="h-4 w-4 mr-2" />
              Plataforma de Gestão Estratégica
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
              {getContent('hero', 'title', 'Cocriamos soluções adequadas às complexidades das organizações')}
            </h1>

            <p className="text-lg md:text-xl text-white/60 mb-10 leading-relaxed max-w-3xl mx-auto font-sans">
              {getContent('hero', 'subtitle', 'O Strategy HUB é a plataforma que conecta consultoria estratégica COFOUND à tecnologia, transformando sua visão em resultados mensuráveis.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-[#0D2338] font-bold shadow-lg shadow-[#38B6FF]/20">
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
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVIÇOS COFOUND ─── */}
      <section id="servicos" className="py-20 px-4 bg-[#0E263D]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              {getContent('services', 'title', 'Soluções COFOUND')}
            </h2>
            <p className="text-lg text-white/50 max-w-3xl mx-auto font-sans">
              {getContent('services', 'subtitle', 'Impulsione o crescimento da sua empresa com consultoria especializada e ferramentas de gestão estratégica.')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:bg-white/[0.06] hover:border-[#38B6FF]/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#38B6FF]/10 flex items-center justify-center mb-4 group-hover:bg-[#38B6FF]/20 transition-colors">
                  <service.icon className="h-6 w-6 text-[#38B6FF]" />
                </div>
                <h3 className="text-lg font-display font-semibold text-white mb-2">{service.title}</h3>
                <p className="text-sm text-white/50 font-sans leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLATAFORMA STRATEGY HUB ─── */}
      <section id="plataforma" className="py-20 px-4 bg-[#0D2338]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#38B6FF]/15 text-[#38B6FF] border-[#38B6FF]/30 px-4 py-2">
              <Building2 className="h-4 w-4 mr-2" />
              Strategy HUB
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              {getContent('platform', 'title', 'Tudo que você precisa em uma única plataforma')}
            </h2>
            <p className="text-lg text-white/50 max-w-3xl mx-auto font-sans">
              {getContent('platform', 'subtitle', 'Ferramentas integradas de gestão estratégica potencializadas por inteligência artificial.')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {platformFeatures.map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 hover:border-[#CDD966]/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#CDD966]/10 flex items-center justify-center mb-4 group-hover:bg-[#CDD966]/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-[#CDD966]" />
                </div>
                <h3 className="text-lg font-display font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 font-sans leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LOGOS CLIENTES ─── */}
      <section id="clientes" className="py-16 px-4 bg-[#0E263D] border-y border-white/5">
        <div className="container mx-auto">
          <h2 className="text-center text-lg font-display font-semibold text-white/40 mb-10 tracking-wide uppercase">
            {getContent('clients', 'title', 'Quem já viveu a experiência Cofound')}
          </h2>

          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0E263D] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0E263D] to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee whitespace-nowrap">
              {clientLogos.map((name, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 mx-8 h-12 px-6 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]"
                >
                  <span className="text-white/30 font-display font-semibold text-sm">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#0D2338] via-[#112B45] to-[#0D2338]">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            {getContent('cta', 'title', 'Pronto para transformar a estratégia da sua empresa?')}
          </h2>
          <p className="text-lg text-white/60 mb-10 font-sans">
            {getContent('cta', 'subtitle', 'Junte-se às empresas que já estão crescendo com o Strategy HUB by COFOUND.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-[#0D2338] font-bold shadow-lg shadow-[#38B6FF]/20">
                <ArrowRight className="mr-2 h-5 w-5" />
                {getContent('cta', 'primary_button', 'Começar Agora')}
              </Button>
            </Link>
            <a href={getContent('cta', 'secondary_button_link', WHATSAPP_URL)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10 font-semibold">
                <MessageSquare className="mr-2 h-5 w-5" />
                {getContent('cta', 'secondary_button', 'Agendar Demo')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#091A2A] border-t border-white/5">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-6 w-6 text-[#38B6FF]" />
                <span className="text-xl font-display font-bold text-white">Strategy HUB</span>
              </div>
              <p className="text-white/40 text-sm mb-4 font-sans">
                {getContent('footer', 'description', 'Impulsionando o crescimento de empresas através de estratégia, inovação e tecnologia.')}
              </p>
              <div className="flex gap-4">
                <a href={getContent('footer', 'linkedin_url', 'https://www.linkedin.com/company/cofoundbr/')} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#38B6FF] transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href={getContent('footer', 'instagram_url', 'https://instagram.com/cofoundbr')} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#38B6FF] transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="font-display font-semibold text-white mb-4">Navegação</h3>
              <ul className="space-y-2 font-sans text-sm">
                <li><a href="#servicos" className="text-white/40 hover:text-white transition-colors">Serviços</a></li>
                <li><a href="#plataforma" className="text-white/40 hover:text-white transition-colors">Plataforma</a></li>
                <li><a href="#clientes" className="text-white/40 hover:text-white transition-colors">Clientes</a></li>
                <li><Link to="/auth" className="text-white/40 hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-display font-semibold text-white mb-4">Contato</h3>
              <ul className="space-y-3 font-sans text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-white/30" />
                  <a href={`mailto:${getContent('footer', 'email', 'admin@cofound.com.br')}`} className="text-white/40 hover:text-white transition-colors">
                    {getContent('footer', 'email', 'admin@cofound.com.br')}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-white/30" />
                  <a href={`tel:${getContent('footer', 'phone', '+5548336335549')}`} className="text-white/40 hover:text-white transition-colors">
                    {getContent('footer', 'phone', '+55 48 3363-3549')}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-white/30 mt-0.5" />
                  <span className="text-white/40">
                    {getContent('footer', 'address', 'Ágora Tech Park, Joinville/SC')}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/30 text-sm font-sans">
              © {new Date().getFullYear()} COFOUND. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
