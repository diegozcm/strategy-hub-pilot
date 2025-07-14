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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">StrategyHUB</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <a href="#cases" className="text-muted-foreground hover:text-foreground transition-colors">
              Casos de Uso
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/auth">
              <Button>Teste Grátis por 14 dias</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transforme sua <span className="text-primary">Estratégia Empresarial</span> com IA
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Plataforma completa para planejamento estratégico, monitoramento de KPIs e tomada de decisões baseada em dados
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6">
                  Começar Teste Gratuito
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Play className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Segurança SSL
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                LGPD Compliance
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                99.9% Uptime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section id="features" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para levar sua estratégia empresarial ao próximo nível
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Planejamento Estratégico IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Crie planos estratégicos com sugestões inteligentes baseadas em IA
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Dashboard Executivo</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Visualize KPIs e métricas estratégicas em tempo real
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Kanban className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Gestão de Projetos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Gerencie iniciativas estratégicas com metodologias ágeis
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Relatórios Inteligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Gere relatórios automatizados com insights de IA
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Colaboração em Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Colabore com sua equipe em tempo real
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Análise Preditiva</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Antecipe tendências e cenários futuros
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Veja o StrategyHUB em Ação
            </h2>
            <p className="text-xl text-muted-foreground">
              Explore as principais funcionalidades da plataforma
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 mb-8">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{screenshots[currentScreenshot].title}</h3>
                  <p className="text-muted-foreground">{screenshots[currentScreenshot].description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={prevScreenshot}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex space-x-2">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentScreenshot ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                      onClick={() => setCurrentScreenshot(index)}
                    />
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={nextScreenshot}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Profiles */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Perfis de Acesso
            </h2>
            <p className="text-xl text-muted-foreground">
              Permissões e funcionalidades adaptadas para cada tipo de usuário
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>CEO/Diretor</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Visão completa</li>
                  <li>• Aprovações</li>
                  <li>• Definição de estratégias</li>
                  <li>• Dashboard executivo</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Gerente de Projetos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Gestão de projetos</li>
                  <li>• Acompanhamento KPIs</li>
                  <li>• Kanban</li>
                  <li>• Timeline</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Analista Estratégico</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Análise de dados</li>
                  <li>• Criação de relatórios</li>
                  <li>• Dashboards personalizados</li>
                  <li>• Analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Colaborador</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
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
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Resultados Comprovados
            </h2>
            <p className="text-xl text-muted-foreground">
              Impacto real nos resultados das empresas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">40%</div>
              <p className="text-muted-foreground">Aumento na eficiência do planejamento estratégico</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">60%</div>
              <p className="text-muted-foreground">Redução no tempo de geração de relatórios</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">35%</div>
              <p className="text-muted-foreground">Melhoria na tomada de decisões</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">300%</div>
              <p className="text-muted-foreground">ROI médio em 6 meses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="cases" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Casos de Uso
            </h2>
            <p className="text-xl text-muted-foreground">
              Soluções adaptadas para diferentes tipos de empresa
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Startups e Scale-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Planejamento ágil</li>
                  <li>• Métricas de crescimento</li>
                  <li>• Gestão de recursos</li>
                  <li>• Validação de hipóteses</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Empresas Médias</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Alinhamento estratégico</li>
                  <li>• Gestão de múltiplos projetos</li>
                  <li>• Reporting estruturado</li>
                  <li>• Governança corporativa</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Corporações</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground space-y-2">
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
      <section id="pricing" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Planos e Preços
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Escolha o plano ideal para sua empresa
            </p>
            <p className="text-sm text-muted-foreground">
              Todos os planos incluem 14 dias de teste gratuito
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold text-primary">R$ 89<span className="text-lg text-muted-foreground">/mês</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Até 5 usuários</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />3 projetos ativos</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Dashboard básico</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Relatórios mensais</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Suporte por email</li>
                </ul>
                <Link to="/auth">
                  <Button className="w-full" variant="outline">Começar Teste Grátis</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">MAIS POPULAR</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-4xl font-bold text-primary">R$ 199<span className="text-lg text-muted-foreground">/mês</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Até 15 usuários</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Projetos ilimitados</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />IA avançada</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Relatórios personalizados</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Análise preditiva</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Suporte prioritário</li>
                </ul>
                <Link to="/auth">
                  <Button className="w-full">Começar Teste Grátis</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-primary">Sob Consulta</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Usuários ilimitados</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Customizações</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Integração avançada</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Suporte dedicado</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />Treinamento incluído</li>
                  <li className="flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-primary" />SLA garantido</li>
                </ul>
                <Button className="w-full" variant="outline">Falar com Vendas</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Depoimentos de Clientes
            </h2>
            <p className="text-xl text-muted-foreground">
              Veja o que nossos clientes dizem sobre o StrategyHUB
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div>
                    <h4 className="font-semibold">Maria Santos</h4>
                    <p className="text-sm text-muted-foreground">CEO, TechStart</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">
                  "O StrategyHUB transformou nossa gestão estratégica. Conseguimos aumentar nossa eficiência em 40% no primeiro trimestre."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div>
                    <h4 className="font-semibold">João Silva</h4>
                    <p className="text-sm text-muted-foreground">Diretor, InnovaCorp</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">
                  "A análise preditiva nos ajudou a antecipar tendências de mercado e tomar decisões mais assertivas."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div>
                    <h4 className="font-semibold">Ana Costa</h4>
                    <p className="text-sm text-muted-foreground">VP Estratégia, MegaCorp</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">
                  "Interface intuitiva e relatórios automáticos que nos poupam horas de trabalho manual todos os meses."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Segurança e Conformidade de Nível Empresarial
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Seus dados protegidos com os mais altos padrões de segurança
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Badge variant="outline" className="px-4 py-2 text-lg">SSL</Badge>
            <Badge variant="outline" className="px-4 py-2 text-lg">LGPD</Badge>
            <Badge variant="outline" className="px-4 py-2 text-lg">ISO 27001</Badge>
            <Badge variant="outline" className="px-4 py-2 text-lg">SOC 2</Badge>
          </div>

          <p className="text-muted-foreground max-w-2xl mx-auto">
            Criptografia end-to-end, backup automático em múltiplas regiões e 99.9% de uptime garantido.
          </p>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Integre com suas ferramentas favoritas
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Conecte o StrategyHUB com as ferramentas que sua equipe já usa
          </p>

          <div className="flex flex-wrap justify-center gap-8">
            <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
              <Slack className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Pronto para Revolucionar sua Estratégia?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a mais de 1.000 empresas que já transformaram seus resultados
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Começar Teste Gratuito de 14 Dias
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Agendar Demonstração
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Sem compromisso • Cancelamento fácil • Suporte incluído
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 px-4 bg-muted/50 border-t">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">StrategyHUB</span>
              </div>
              <p className="text-muted-foreground">
                Transformando estratégias empresariais com inteligência artificial
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Demonstração</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Comunidade</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground mb-4 md:mb-0">
              © 2024 StrategyHUB. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;