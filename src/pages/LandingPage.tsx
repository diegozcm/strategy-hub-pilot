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
    { title: "Dashboard Executivo", description: "Visão completa das métricas estratégicas com IA", module: "Planejamento Estratégico", placeholder: "strategic-dashboard.png" },
    { title: "Mapa Estratégico", description: "Visualize objetivos e resultados-chave", module: "Planejamento Estratégico", placeholder: "strategic-map.png" },
    { title: "Dashboard Startup", description: "Painel completo para startups", module: "Startup HUB", placeholder: "startup-dashboard.png" },
    { title: "Avaliação BEEP", description: "Business Excellence Evaluation Program", module: "Startup HUB", placeholder: "beep-assessment.png" },
    { title: "Mentoria", description: "Gestão de sessões e mentoria", module: "Startup HUB", placeholder: "mentoring-sessions.png" },
    { title: "Copiloto de IA", description: "Assistente inteligente estratégico", module: "Planejamento Estratégico", placeholder: "ai-copilot.png" },
    { title: "Analytics Startup", description: "Métricas e performance das startups", module: "Startup HUB", placeholder: "startup-analytics.png" },
    { title: "Gestão de Objetivos", description: "OKRs e metas estratégicas", module: "Planejamento Estratégico", placeholder: "objectives-management.png" }
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
            <span className="text-2xl font-bold text-strategy-red-dark">Start Together</span>
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
              Planejamento Estratégico e <span className="text-strategy-red-dark">Aceleração de Startups</span>
            </h1>
            
            <p className="text-xl text-strategy-blue-navy mb-8 leading-relaxed">
              Plataforma completa para empresas que querem crescer de forma estratégica e startups que buscam aceleração. Conecte planejamento inteligente com mentoria especializada.
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
              Dois Módulos, Infinitas Possibilidades
            </h2>
            <p className="text-xl text-strategy-gray-medium max-w-2xl mx-auto">
              Planejamento Estratégico para empresas e Startup HUB para aceleração de startups
            </p>
          </div>

          <div className="space-y-12">
            {/* Módulo Planejamento Estratégico */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-primary text-white px-4 py-2">
                  <TargetIcon className="h-4 w-4 mr-2" />
                  Módulo Planejamento Estratégico
                </Badge>
                <h3 className="text-2xl font-bold text-strategy-blue-navy mb-2">Para Empresas</h3>
                <p className="text-strategy-gray-medium">Transforme sua gestão estratégica com IA</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <BarChart3 className="h-6 w-6 text-primary" />
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
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Map className="h-6 w-6 text-primary" />
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
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Brain className="h-6 w-6 text-primary" />
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

            {/* Módulo Startup HUB */}
            <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-2xl p-8">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-accent text-white px-4 py-2">
                  <Users className="h-4 w-4 mr-2" />
                  Módulo Startup HUB
                </Badge>
                <h3 className="text-2xl font-bold text-strategy-blue-navy mb-2">Para Startups</h3>
                <p className="text-strategy-gray-medium">Aceleração completa para startups inovadoras</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle className="text-strategy-blue-navy">Dashboard Startup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-strategy-gray-medium">
                      Painel completo com métricas essenciais para startups
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <Award className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle className="text-strategy-blue-navy">Avaliação BEEP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-strategy-gray-medium">
                      Business Excellence Evaluation Program para análise completa
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle className="text-strategy-blue-navy">Mentoria Especializada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-strategy-gray-medium">
                      Mentoria qualificada com gestão completa de sessões
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 px-4 bg-strategy-blue-navy">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Veja o Start Together em Ação
            </h2>
            <p className="text-xl text-strategy-gray-light">
              Explore as principais funcionalidades da plataforma
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
              <div className="aspect-video bg-white/20 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="text-center">
                  <div className="absolute top-4 right-4">
                    <Badge className={`text-xs px-3 py-1 ${
                      screenshots[currentScreenshot].module === 'Startup HUB' 
                        ? 'bg-accent text-white' 
                        : 'bg-primary text-white'
                    }`}>
                      {screenshots[currentScreenshot].module}
                    </Badge>
                  </div>
                  <div className="w-16 h-16 bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{screenshots[currentScreenshot].title}</h3>
                  <p className="text-strategy-gray-light mb-4">{screenshots[currentScreenshot].description}</p>
                  <p className="text-xs text-white/60">
                    📸 Substitua por: {screenshots[currentScreenshot].placeholder}
                  </p>
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
              Resultados Comprovados
            </h2>
            <p className="text-xl text-strategy-gray-medium">
              Transformação real no planejamento estratégico e aceleração de startups
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">90%</div>
              <p className="text-strategy-gray-medium">Das startups melhoram seu score BEEP em 6 meses</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">75%</div>
              <p className="text-strategy-gray-medium">Redução no tempo de planejamento estratégico</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">200+</div>
              <p className="text-strategy-gray-medium">Sessões de mentoria realizadas mensalmente</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">300%</div>
              <p className="text-strategy-gray-medium">ROI médio para empresas em planejamento estratégico</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="cases" className="py-16 px-4 bg-strategy-gray-light">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-strategy-red-dark mb-4">
              Para Quem É o Start Together
            </h2>
            <p className="text-xl text-strategy-gray-medium">
              Soluções específicas para cada tipo de organização
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Startups e Empreendedores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-strategy-gray-medium mb-3">Módulo: Startup HUB</p>
                <ul className="text-strategy-gray-medium space-y-2">
                  <li>• Dashboard de métricas essenciais</li>
                  <li>• Avaliação BEEP para evolução</li>
                  <li>• Mentoria especializada</li>
                  <li>• Gestão de sessões e feedback</li>
                  <li>• Analytics de performance</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Empresas em Crescimento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-strategy-gray-medium mb-3">Módulos: Ambos disponíveis</p>
                <ul className="text-strategy-gray-medium space-y-2">
                  <li>• Planejamento estratégico completo</li>
                  <li>• Gestão de objetivos e OKRs</li>
                  <li>• Aceleração de projetos internos</li>
                  <li>• Dashboard executivo com IA</li>
                  <li>• Mentoria para inovação</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Corporações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-strategy-gray-medium mb-3">Módulo: Planejamento Estratégico</p>
                <ul className="text-strategy-gray-medium space-y-2">
                  <li>• Governança estratégica corporativa</li>
                  <li>• Mapas estratégicos complexos</li>
                  <li>• Análise preditiva avançada</li>
                  <li>• Integração multi-unidades</li>
                  <li>• Copiloto de IA estratégico</li>
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
              Veja o que nossos clientes dizem sobre o Start Together
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-strategy-gray-light rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-strategy-red-dark">Carolina Mendes</h4>
                    <p className="text-sm text-strategy-blue-navy">Co-founder, FintechBR</p>
                    <Badge className="mt-1 text-xs bg-accent text-white">Startup HUB</Badge>
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
                  "O BEEP nos ajudou a identificar pontos fracos que não víamos. Evoluímos 65% no score em 4 meses com as mentorias."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-strategy-gray-light rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-strategy-red-dark">Ricardo Almeida</h4>
                    <p className="text-sm text-strategy-blue-navy">CEO, TechGrow</p>
                    <Badge className="mt-1 text-xs bg-primary text-white">Ambos Módulos</Badge>
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
                  "Usamos o planejamento estratégico para a empresa e o Startup HUB para nossos projetos internos. Transformação completa!"
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-strategy-gray-light rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-strategy-red-dark">Ana Paula Costa</h4>
                    <p className="text-sm text-strategy-blue-navy">VP Estratégia, MegaCorp</p>
                    <Badge className="mt-1 text-xs bg-primary text-white">Planejamento Estratégico</Badge>
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
                  "O Copiloto de IA nos poupar 12 horas semanais no planejamento. Relatórios que eram manuais agora são automáticos."
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
            Acelere seu Crescimento Estratégico
          </h2>
          <p className="text-xl text-strategy-gray-light mb-8">
            Planejamento estratégico para empresas e aceleração completa para startups em uma única plataforma
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
            Dois módulos especializados: Planejamento Estratégico e Startup HUB
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
                <span className="text-xl font-bold text-white">Start Together</span>
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
                © 2024 Start Together. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6 text-strategy-gray-light">
                <a href="#" className="hover:text-accent transition-colors">Termos</a>
                <a href="#" className="hover:text-accent transition-colors">Privacidade</a>
                <a href="#" className="hover:text-accent transition-colors">Cookies</a>
              </div>
            </div>
            
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-strategy-gray-light/80 text-sm">
                <span className="font-semibold text-white">Start Together</span>, um produto <span className="font-semibold text-accent">COFOUND</span> - Aceleradora de Negócios
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;