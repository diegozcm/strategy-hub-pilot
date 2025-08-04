import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  BarChart3, 
  Target as TargetIcon, 
  FileText, 
  Users, 
  TrendingUp,
  ArrowRight,
  Play,
  Star,
  Shield,
  Zap,
  Lock,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
  Map,
  Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [currentScreenshot, setCurrentScreenshot] = React.useState(0);
  
  const screenshots = [
    { title: "Dashboard Executivo", description: "Visão completa das métricas estratégicas com IA" },
    { title: "Mapa Estratégico", description: "Visualize objetivos e resultados-chave" },
    { title: "Gestão de Projetos", description: "Kanban inteligente para iniciativas" },
    { title: "Copiloto de IA", description: "Assistente inteligente para planejamento" },
    { title: "Objetivos", description: "Defina e acompanhe metas estratégicas" },
    { title: "Análise Preditiva", description: "Insights automáticos baseados em IA" }
  ];

  const nextScreenshot = () => {
    setCurrentScreenshot((prev) => (prev + 1) % screenshots.length);
  };

  const prevScreenshot = () => {
    setCurrentScreenshot((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <div className="min-h-screen bg-strategy-gray-light">
      {/* Header */}
      <header className="fixed top-0 w-full bg-strategy-gray-light/95 backdrop-blur-sm border-b border-border shadow-sm z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-strategy-red-dark" />
            <span className="text-2xl font-bold text-strategy-red-dark">StrategyHUB</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-strategy-blue-navy hover:text-accent transition-colors">
              Funcionalidades
            </a>
            <a href="#cases" className="text-strategy-blue-navy hover:text-accent transition-colors">
              Casos de Uso
            </a>
            <a href="#contact" className="text-strategy-blue-navy hover:text-accent transition-colors">
              Contato
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="outline" className="border-strategy-blue-navy text-strategy-blue-navy hover:bg-strategy-blue-navy hover:text-white">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-strategy-gray-light to-white">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-strategy-red-dark mb-6 leading-tight">
              Planejamento Estratégico <span className="text-strategy-red-dark">Inteligente</span> com IA
            </h1>
            
            <p className="text-xl text-strategy-blue-navy mb-8 leading-relaxed">
              Transforme sua estratégia empresarial com insights de IA, mapas estratégicos e gestão de objetivos automatizada
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-strategy-red-light text-white">
                  Fazer Login
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-strategy-blue-navy text-strategy-blue-navy hover:bg-strategy-blue-navy hover:text-white">
                <Play className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6">
              <Badge className="bg-accent text-white px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Segurança SSL
              </Badge>
              <Badge className="bg-accent text-white px-4 py-2">
                <Lock className="h-4 w-4 mr-2" />
                LGPD Compliance
              </Badge>
              <Badge className="bg-accent text-white px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                99.9% Uptime
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section id="features" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-strategy-red-dark mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-strategy-gray-medium max-w-2xl mx-auto">
              Tudo que você precisa para levar sua estratégia empresarial ao próximo nível
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Dashboard Executivo</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Visualize KPIs e métricas estratégicas com insights de IA em tempo real
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Map className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Mapa Estratégico</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Visualize objetivos e resultados-chave em mapas estratégicos inteligentes
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <TargetIcon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Objetivos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Defina e acompanhe objetivos estratégicos com suporte de IA
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Resultados Chave</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Monitore indicadores e métricas com análise preditiva automática
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Gestão de Projetos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Gerencie iniciativas estratégicas com kanban inteligente e automações
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Copiloto de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Assistente inteligente para planejamento estratégico e insights automáticos
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 px-4 bg-strategy-blue-navy">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Veja o StrategyHUB em Ação
            </h2>
            <p className="text-xl text-strategy-gray-light">
              Explore as principais funcionalidades da plataforma
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
              <div className="aspect-video bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{screenshots[currentScreenshot].title}</h3>
                  <p className="text-strategy-gray-light">{screenshots[currentScreenshot].description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={prevScreenshot} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex space-x-2">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentScreenshot ? 'bg-accent' : 'bg-white/30'
                      }`}
                      onClick={() => setCurrentScreenshot(index)}
                    />
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={nextScreenshot} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ROI Benefits */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-strategy-red-dark mb-4">
              Resultados Comprovados com IA
            </h2>
            <p className="text-xl text-strategy-gray-medium">
              Transformação real no planejamento estratégico empresarial
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">70%</div>
              <p className="text-strategy-gray-medium">Melhoria na qualidade das decisões estratégicas</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">85%</div>
              <p className="text-strategy-gray-medium">Redução no tempo de planejamento com IA</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">60%</div>
              <p className="text-strategy-gray-medium">Aumento na precisão de projeções futuras</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">400%</div>
              <p className="text-strategy-gray-medium">ROI médio em 8 meses com automação de IA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="cases" className="py-16 px-4 bg-strategy-gray-light">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-strategy-red-dark mb-4">
              Casos de Uso
            </h2>
            <p className="text-xl text-strategy-gray-medium">
              Planejamento estratégico inteligente para todos os tipos de empresa
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Startups e Scale-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-strategy-gray-medium space-y-2">
                  <li>• Planejamento estratégico ágil com IA</li>
                  <li>• Mapas estratégicos simplificados</li>
                  <li>• Métricas de crescimento automatizadas</li>
                  <li>• Validação de hipóteses com dados</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Empresas Médias</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-strategy-gray-medium space-y-2">
                  <li>• Alinhamento estratégico multi-área</li>
                  <li>• Gestão inteligente de objetivos</li>
                  <li>• Relatórios executivos automatizados</li>
                  <li>• Copiloto de IA para decisões</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Corporações</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-strategy-gray-medium space-y-2">
                  <li>• Governança estratégica corporativa</li>
                  <li>• Análise preditiva avançada</li>
                  <li>• Mapas estratégicos complexos</li>
                  <li>• Integração de múltiplas unidades</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <section className="py-16 px-4 bg-strategy-blue-navy">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Depoimentos de Clientes
            </h2>
            <p className="text-xl text-strategy-gray-light">
              Veja o que nossos clientes dizem sobre o StrategyHUB
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-strategy-gray-light rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-strategy-red-dark">Maria Santos</h4>
                    <p className="text-sm text-strategy-blue-navy">CEO, TechStart</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-strategy-gray-medium italic">
                  "O StrategyHUB transformou nossa gestão estratégica. Conseguimos aumentar nossa eficiência em 40% no primeiro trimestre."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-strategy-gray-light rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-strategy-red-dark">João Silva</h4>
                    <p className="text-sm text-strategy-blue-navy">Diretor, InnovaCorp</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-strategy-gray-medium italic">
                  "A análise preditiva nos ajudou a antecipar tendências de mercado e tomar decisões mais assertivas."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-strategy-gray-light rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-strategy-red-dark">Ana Costa</h4>
                    <p className="text-sm text-strategy-blue-navy">VP Estratégia, MegaCorp</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-strategy-gray-medium italic">
                  "Interface intuitiva e relatórios automáticos que nos poupam horas de trabalho manual todos os meses."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 px-4 bg-strategy-gray-light">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-strategy-red-dark mb-4">
            Segurança e Conformidade de Nível Empresarial
          </h2>
          <p className="text-xl text-strategy-blue-navy mb-12">
            Seus dados protegidos com os mais altos padrões de segurança
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Badge className="bg-white border-accent text-accent px-6 py-3 text-lg">
              <Shield className="h-5 w-5 mr-2" />
              SSL
            </Badge>
            <Badge className="bg-white border-accent text-accent px-6 py-3 text-lg">
              <Lock className="h-5 w-5 mr-2" />
              LGPD
            </Badge>
            <Badge className="bg-white border-accent text-accent px-6 py-3 text-lg">
              <Shield className="h-5 w-5 mr-2" />
              ISO 27001
            </Badge>
            <Badge className="bg-white border-accent text-accent px-6 py-3 text-lg">
              <Zap className="h-5 w-5 mr-2" />
              SOC 2
            </Badge>
          </div>

          <p className="text-strategy-blue-navy max-w-2xl mx-auto">
            Criptografia end-to-end, backup automático em múltiplas regiões e 99.9% de uptime garantido.
          </p>
        </div>
      </section>


      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-strategy-red-dark to-strategy-blue-navy">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Transforme sua Estratégia com IA
          </h2>
          <p className="text-xl text-strategy-gray-light mb-8">
            Descubra como o planejamento estratégico inteligente pode revolucionar seus resultados
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6 bg-accent hover:bg-strategy-blue-bright-hover text-white">
                Acessar Plataforma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-strategy-red-dark">
              Agendar Demonstração
            </Button>
          </div>

          <p className="text-sm text-strategy-gray-light/80">
            Solução completa para planejamento estratégico empresarial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 px-4 bg-strategy-blue-navy border-t">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-6 w-6 text-white" />
                <span className="text-xl font-bold text-white">StrategyHUB</span>
              </div>
              <p className="text-strategy-gray-light">
                Planejamento estratégico inteligente com IA para empresas modernas
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Funcionalidades</h4>
              <ul className="space-y-2 text-strategy-gray-light">
                <li><a href="#features" className="hover:text-accent transition-colors">Dashboard Executivo</a></li>
                <li><a href="#features" className="hover:text-accent transition-colors">Mapa Estratégico</a></li>
                <li><a href="#features" className="hover:text-accent transition-colors">Copiloto de IA</a></li>
                <li><a href="#features" className="hover:text-accent transition-colors">Gestão de Objetivos</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Empresa</h4>
              <ul className="space-y-2 text-strategy-gray-light">
                <li><a href="#cases" className="hover:text-accent transition-colors">Casos de Uso</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-accent transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Suporte</h4>
              <ul className="space-y-2 text-strategy-gray-light">
                <li><a href="#" className="hover:text-accent transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Treinamentos</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">API</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <p className="text-strategy-gray-light/60 mb-4 md:mb-0">
                © 2024 StrategyHUB. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6 text-strategy-gray-light">
                <a href="#" className="hover:text-accent transition-colors">Termos</a>
                <a href="#" className="hover:text-accent transition-colors">Privacidade</a>
                <a href="#" className="hover:text-accent transition-colors">Cookies</a>
              </div>
            </div>
            
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-strategy-gray-light/80 text-sm">
                <span className="font-semibold text-white">StrategyHUB</span>, um produto <span className="font-semibold text-accent">COFOUND</span> - Aceleradora de Negócios
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;