import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  BarChart3, 
  Kanban, 
  FileText, 
  Users, 
  TrendingUp,
  ArrowRight,
  Play,
  Crown,
  CheckSquare,
  BarChart,
  User,
  Star,
  Shield,
  Zap,
  Lock,
  Globe,
  Slack,
  Calendar,
  Smartphone,
  Target,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [currentScreenshot, setCurrentScreenshot] = React.useState(0);
  
  const screenshots = [
    { title: "Dashboard Principal", description: "Visão completa das métricas estratégicas" },
    { title: "Planejamento Estratégico", description: "Ferramenta de planejamento com IA" },
    { title: "Gestão de Projetos", description: "Kanban para gerenciar iniciativas" },
    { title: "Relatórios Analytics", description: "Insights automáticos e personalizados" },
    { title: "Colaboração em Equipe", description: "Trabalhe junto em tempo real" },
    { title: "Análise Preditiva", description: "Antecipe tendências futuras" }
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
            <a href="#pricing" className="text-strategy-blue-navy hover:text-accent transition-colors">
              Preços
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
            <Link to="/auth">
              <Button className="bg-accent hover:bg-strategy-blue-bright-hover text-white">Teste Grátis por 14 dias</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-strategy-gray-light to-white">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-strategy-red-dark mb-6 leading-tight">
              Transforme sua <span className="text-strategy-red-dark">Estratégia Empresarial</span> com IA
            </h1>
            
            <p className="text-xl text-strategy-blue-navy mb-8 leading-relaxed">
              Plataforma completa para planejamento estratégico, monitoramento de KPIs e tomada de decisões baseada em dados
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-strategy-red-light text-white">
                  Começar Teste Gratuito
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
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Planejamento Estratégico IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Crie planos estratégicos com sugestões inteligentes baseadas em IA
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Dashboard Executivo</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Visualize KPIs e métricas estratégicas em tempo real
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Kanban className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Gestão de Projetos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Gerencie iniciativas estratégicas com metodologias ágeis
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Relatórios Inteligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Gere relatórios automatizados com insights de IA
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Colaboração em Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Colabore com sua equipe em tempo real
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 border bg-white">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Análise Preditiva</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-strategy-gray-medium">
                  Antecipe tendências e cenários futuros
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

      {/* User Profiles */}
      <section className="py-16 px-4 bg-strategy-gray-light">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-strategy-red-dark mb-4">
              Perfis de Acesso
            </h2>
            <p className="text-xl text-strategy-gray-medium">
              Permissões e funcionalidades adaptadas para cada tipo de usuário
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">CEO/Diretor</CardTitle>
                <Badge className="bg-primary text-white mx-auto">Acesso Total</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-strategy-gray-medium space-y-2">
                  <li>• Visão completa</li>
                  <li>• Aprovações</li>
                  <li>• Definição de estratégias</li>
                  <li>• Dashboard executivo</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Gerente de Projetos</CardTitle>
                <Badge className="bg-primary text-white mx-auto">Gestão</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-strategy-gray-medium space-y-2">
                  <li>• Gestão de projetos</li>
                  <li>• Acompanhamento KPIs</li>
                  <li>• Kanban</li>
                  <li>• Timeline</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Analista Estratégico</CardTitle>
                <Badge className="bg-primary text-white mx-auto">Análise</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-strategy-gray-medium space-y-2">
                  <li>• Análise de dados</li>
                  <li>• Criação de relatórios</li>
                  <li>• Dashboards personalizados</li>
                  <li>• Analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Colaborador</CardTitle>
                <Badge className="bg-primary text-white mx-auto">Participação</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-strategy-gray-medium space-y-2">
                  <li>• Visualização</li>
                  <li>• Tarefas atribuídas</li>
                  <li>• Comentários</li>
                  <li>• Notificações</li>
                </ul>
              </CardContent>
            </Card>
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
              Impacto real nos resultados das empresas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">40%</div>
              <p className="text-strategy-gray-medium">Aumento na eficiência do planejamento estratégico</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">60%</div>
              <p className="text-strategy-gray-medium">Redução no tempo de geração de relatórios</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">35%</div>
              <p className="text-strategy-gray-medium">Melhoria na tomada de decisões</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">300%</div>
              <p className="text-strategy-gray-medium">ROI médio em 6 meses</p>
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
              Soluções adaptadas para diferentes tipos de empresa
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Startups e Scale-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-strategy-gray-medium space-y-2">
                  <li>• Planejamento ágil</li>
                  <li>• Métricas de crescimento</li>
                  <li>• Gestão de recursos</li>
                  <li>• Validação de hipóteses</li>
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
                  <li>• Alinhamento estratégico</li>
                  <li>• Gestão de múltiplos projetos</li>
                  <li>• Reporting estruturado</li>
                  <li>• Governança corporativa</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white border">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-strategy-blue-navy">Corporações</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-strategy-gray-medium space-y-2">
                  <li>• Governança estratégica</li>
                  <li>• Compliance</li>
                  <li>• Análise preditiva avançada</li>
                  <li>• Integração empresarial</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-strategy-red-dark mb-4">
              Planos e Preços
            </h2>
            <p className="text-xl text-strategy-gray-medium mb-8">
              Escolha o plano ideal para sua empresa
            </p>
            <p className="text-sm text-strategy-gray-medium">
              Todos os planos incluem 14 dias de teste gratuito
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="hover:shadow-lg transition-all duration-300 bg-strategy-gray-light border">
              <CardHeader>
                <CardTitle className="text-2xl text-strategy-blue-navy">Starter</CardTitle>
                <div className="text-4xl font-bold text-strategy-red-dark">R$ 89<span className="text-lg text-strategy-gray-medium">/mês</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-strategy-gray-medium">
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Até 5 usuários</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />3 projetos ativos</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Dashboard básico</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Relatórios mensais</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Suporte por email</li>
                </ul>
                <Link to="/auth">
                  <Button className="w-full bg-strategy-blue-navy hover:bg-strategy-blue-navy-light text-white">Começar Teste Grátis</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-accent shadow-accent/20 relative bg-white">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-accent text-white">MAIS POPULAR</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl text-strategy-blue-navy">Professional</CardTitle>
                <div className="text-4xl font-bold text-strategy-red-dark">R$ 199<span className="text-lg text-strategy-gray-medium">/mês</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-strategy-gray-medium">
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Até 15 usuários</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Projetos ilimitados</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />IA avançada</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Relatórios personalizados</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Análise preditiva</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Suporte prioritário</li>
                </ul>
                <Link to="/auth">
                  <Button className="w-full bg-accent hover:bg-strategy-blue-bright-hover text-white">Começar Teste Grátis</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-strategy-gray-light border">
              <CardHeader>
                <CardTitle className="text-2xl text-strategy-blue-navy">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-strategy-red-dark">Sob Consulta</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-strategy-gray-medium">
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Usuários ilimitados</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Customizações</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Integração avançada</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Suporte dedicado</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />Treinamento incluído</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-accent" />SLA garantido</li>
                </ul>
                <Button className="w-full bg-primary hover:bg-strategy-red-light text-white">Falar com Vendas</Button>
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

      {/* Integrations */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-strategy-red-dark mb-4">
            Integre com suas ferramentas favoritas
          </h2>
          <p className="text-xl text-strategy-gray-medium mb-12">
            Conecte o StrategyHUB com as ferramentas que sua equipe já usa
          </p>

          <div className="flex flex-wrap justify-center gap-8">
            <div className="w-16 h-16 bg-strategy-gray-light hover:bg-accent/10 transition-colors rounded-lg flex items-center justify-center border">
              <Slack className="h-8 w-8 text-strategy-gray-medium" />
            </div>
            <div className="w-16 h-16 bg-strategy-gray-light hover:bg-accent/10 transition-colors rounded-lg flex items-center justify-center border">
              <Calendar className="h-8 w-8 text-strategy-gray-medium" />
            </div>
            <div className="w-16 h-16 bg-strategy-gray-light hover:bg-accent/10 transition-colors rounded-lg flex items-center justify-center border">
              <Smartphone className="h-8 w-8 text-strategy-gray-medium" />
            </div>
            <div className="w-16 h-16 bg-strategy-gray-light hover:bg-accent/10 transition-colors rounded-lg flex items-center justify-center border">
              <BarChart3 className="h-8 w-8 text-strategy-gray-medium" />
            </div>
            <div className="w-16 h-16 bg-strategy-gray-light hover:bg-accent/10 transition-colors rounded-lg flex items-center justify-center border">
              <Globe className="h-8 w-8 text-strategy-gray-medium" />
            </div>
            <div className="w-16 h-16 bg-strategy-gray-light hover:bg-accent/10 transition-colors rounded-lg flex items-center justify-center border">
              <FileText className="h-8 w-8 text-strategy-gray-medium" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-strategy-red-dark to-strategy-blue-navy">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto para Revolucionar sua Estratégia?
          </h2>
          <p className="text-xl text-strategy-gray-light mb-8">
            Junte-se a mais de 1.000 empresas que já transformaram seus resultados
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6 bg-accent hover:bg-strategy-blue-bright-hover text-white">
                Começar Teste Gratuito de 14 Dias
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-strategy-red-dark">
              Agendar Demonstração
            </Button>
          </div>

          <p className="text-sm text-strategy-gray-light/80">
            Sem compromisso • Cancelamento fácil • Suporte incluído
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
                Transformando estratégias empresariais com inteligência artificial
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Produto</h4>
              <ul className="space-y-2 text-strategy-gray-light">
                <li><a href="#features" className="hover:text-accent transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-accent transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Demonstração</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Empresa</h4>
              <ul className="space-y-2 text-strategy-gray-light">
                <li><a href="#" className="hover:text-accent transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Suporte</h4>
              <ul className="space-y-2 text-strategy-gray-light">
                <li><a href="#" className="hover:text-accent transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Comunidade</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-strategy-gray-light/60 mb-4 md:mb-0">
              © 2024 StrategyHUB. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 text-strategy-gray-light">
              <a href="#" className="hover:text-accent transition-colors">Termos</a>
              <a href="#" className="hover:text-accent transition-colors">Privacidade</a>
              <a href="#" className="hover:text-accent transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;