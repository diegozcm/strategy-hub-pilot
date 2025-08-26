
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Calendar } from 'lucide-react';

interface BeepScoreDisplayProps {
  score: number;
  maturityLevel: string;
  completedAt: string;
}

export const BeepScoreDisplay: React.FC<BeepScoreDisplayProps> = ({
  score,
  maturityLevel,
  completedAt
}) => {
  const maturityLevels = {
    'idealizando': {
      name: 'Idealizando',
      description: 'Fase inicial de concepção da ideia de negócio',
      color: 'bg-gray-500',
      order: 1
    },
    'validando_problemas_solucoes': {
      name: 'Validando Problemas e Soluções',
      description: 'Fase de validação do problema e das soluções propostas',
      color: 'bg-yellow-500',
      order: 2
    },
    'iniciando_negocio': {
      name: 'Iniciando o Negócio',
      description: 'Fase de estruturação e início das operações',
      color: 'bg-blue-500',
      order: 3
    },
    'validando_mercado': {
      name: 'Validando o Mercado',
      description: 'Fase de validação do mercado e modelo de negócio',
      color: 'bg-orange-500',
      order: 4
    },
    'evoluindo': {
      name: 'Evoluindo',
      description: 'Fase de crescimento e expansão do negócio',
      color: 'bg-green-500',
      order: 5
    }
  };

  const currentLevel = maturityLevels[maturityLevel as keyof typeof maturityLevels] || maturityLevels['idealizando'];
  const progressPercentage = (currentLevel.order / 5) * 100;

  const getRecommendations = () => {
    switch (maturityLevel) {
      case 'idealizando':
        return [
          'Foque na validação do problema com potenciais clientes',
          'Realize pesquisas de mercado mais profundas',
          'Desenvolva um MVP para testar suas hipóteses'
        ];
      case 'validando_problemas_solucoes':
        return [
          'Intensifique os testes com usuários reais',
          'Refine sua proposta de valor',
          'Comece a estruturar um modelo de negócio mais sólido'
        ];
      case 'iniciando_negocio':
        return [
          'Estruture processos operacionais',
          'Estabeleça métricas de acompanhamento',
          'Busque os primeiros clientes pagantes'
        ];
      case 'validando_mercado':
        return [
          'Escale suas operações de vendas',
          'Otimize seu modelo de precificação',
          'Prepare-se para expansão de mercado'
        ];
      case 'evoluindo':
        return [
          'Explore novos mercados e segmentos',
          'Invista em inovação contínua',
          'Considere parcerias estratégicas para crescimento'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Resultado da Avaliação BEEP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">
              {score.toFixed(1)}
            </div>
            <p className="text-muted-foreground">de 5.0 pontos</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={`${currentLevel.color} text-white px-4 py-2`}>
                {currentLevel.name}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(completedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <Progress value={progressPercentage} className="w-full h-3" />
            
            <p className="text-center text-muted-foreground">
              {currentLevel.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recomendações para Evolução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {getRecommendations().map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2 shrink-0" />
                <p className="text-sm">{recommendation}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
