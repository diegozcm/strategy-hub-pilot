
export const beepQuestionsData = {
  categories: [
    {
      name: 'Modelo de Negócio',
      slug: 'modelo-negocio',
      description: 'Avaliação do modelo de negócio da startup',
      order_index: 1,
      subcategories: [
        {
          name: 'Problema',
          slug: 'problema',
          description: 'Avaliação da identificação e validação do problema',
          order_index: 1,
          questions: [
            { question_text: 'Você consegue descrever claramente qual problema seu negócio resolve?', weight: 1, order_index: 1 },
            { question_text: 'Você validou se este problema realmente existe e é relevante para seu público-alvo?', weight: 1, order_index: 2 },
            { question_text: 'Você conhece outras soluções existentes para este problema?', weight: 1, order_index: 3 },
            { question_text: 'Você consegue quantificar o impacto deste problema na vida das pessoas?', weight: 1, order_index: 4 },
            { question_text: 'Você tem evidências de que as pessoas pagariam para resolver este problema?', weight: 1, order_index: 5 },
            { question_text: 'Você identificou se este problema está crescendo ou diminuindo ao longo do tempo?', weight: 1, order_index: 6 },
            { question_text: 'Você consegue explicar por que este problema ainda não foi resolvido adequadamente?', weight: 1, order_index: 7 },
            { question_text: 'Você tem dados sobre a frequência com que este problema ocorre?', weight: 1, order_index: 8 },
            { question_text: 'Você identificou diferentes segmentos que enfrentam este problema?', weight: 1, order_index: 9 },
            { question_text: 'Você consegue priorizar qual aspecto do problema é mais crítico?', weight: 1, order_index: 10 }
          ]
        },
        {
          name: 'Validação',
          slug: 'validacao',
          description: 'Avaliação do processo de validação do negócio',
          order_index: 2,
          questions: [
            { question_text: 'Você já testou sua ideia com potenciais clientes?', weight: 1, order_index: 1 },
            { question_text: 'Você coletou feedback estruturado sobre sua proposta de valor?', weight: 1, order_index: 2 },
            { question_text: 'Você já fez entrevistas com pelo menos 10 potenciais clientes?', weight: 1, order_index: 3 },
            { question_text: 'Você tem métricas que comprovam o interesse dos clientes em sua solução?', weight: 1, order_index: 4 },
            { question_text: 'Você já criou protótipos ou MVPs para testar suas hipóteses?', weight: 1, order_index: 5 },
            { question_text: 'Você documentou os aprendizados obtidos durante o processo de validação?', weight: 1, order_index: 6 },
            { question_text: 'Você já pivot ou ajustou sua ideia com base nos feedbacks recebidos?', weight: 1, order_index: 7 },
            { question_text: 'Você tem um processo sistemático para validar novas hipóteses?', weight: 1, order_index: 8 },
            { question_text: 'Você consegue medir se sua solução realmente resolve o problema identificado?', weight: 1, order_index: 9 },
            { question_text: 'Você validou se existe demanda suficiente para tornar o negócio viável?', weight: 1, order_index: 10 }
          ]
        },
        {
          name: 'Cliente',
          slug: 'cliente',
          description: 'Avaliação do conhecimento sobre o cliente',
          order_index: 3,
          questions: [
            { question_text: 'Você consegue descrever detalhadamente quem é seu cliente ideal?', weight: 1, order_index: 1 },
            { question_text: 'Você conhece os hábitos e comportamentos dos seus clientes?', weight: 1, order_index: 2 },
            { question_text: 'Você sabe onde encontrar seus clientes potenciais?', weight: 1, order_index: 3 },
            { question_text: 'Você entende as motivações e dores dos seus clientes?', weight: 1, order_index: 4 },
            { question_text: 'Você conhece o poder de compra dos seus clientes?', weight: 1, order_index: 5 },
            { question_text: 'Você identificou diferentes personas de clientes?', weight: 1, order_index: 6 },
            { question_text: 'Você sabe como seus clientes tomam decisões de compra?', weight: 1, order_index: 7 },
            { question_text: 'Você conhece o ciclo de vida e jornada do seu cliente?', weight: 1, order_index: 8 },
            { question_text: 'Você tem canais diretos de comunicação com seus clientes?', weight: 1, order_index: 9 },
            { question_text: 'Você consegue segmentar seus clientes por diferentes critérios?', weight: 1, order_index: 10 }
          ]
        },
        {
          name: 'Mercado',
          slug: 'mercado',
          description: 'Avaliação do conhecimento sobre o mercado',
          order_index: 4,
          questions: [
            { question_text: 'Você conhece o tamanho do mercado que pretende atender?', weight: 1, order_index: 1 },
            { question_text: 'Você identificou seus principais concorrentes diretos e indiretos?', weight: 1, order_index: 2 },
            { question_text: 'Você entende as tendências e direcionamentos do seu mercado?', weight: 1, order_index: 3 },
            { question_text: 'Você conhece as barreiras de entrada do seu mercado?', weight: 1, order_index: 4 },
            { question_text: 'Você identificou oportunidades de crescimento no mercado?', weight: 1, order_index: 5 },
            { question_text: 'Você compreende a regulamentação que afeta seu mercado?', weight: 1, order_index: 6 },
            { question_text: 'Você conhece os canais de distribuição utilizados no seu mercado?', weight: 1, order_index: 7 },
            { question_text: 'Você entende a sazonalidade e ciclos do seu mercado?', weight: 1, order_index: 8 },
            { question_text: 'Você identificou nichos específicos dentro do seu mercado?', weight: 1, order_index: 9 },
            { question_text: 'Você acompanha métricas e indicadores do seu mercado?', weight: 1, order_index: 10 }
          ]
        }
      ]
    },
    {
      name: 'Produto',
      slug: 'produto',
      description: 'Avaliação do produto ou serviço oferecido',
      order_index: 2,
      subcategories: [
        {
          name: 'Solução',
          slug: 'solucao',
          description: 'Avaliação da solução oferecida',
          order_index: 1,
          questions: [
            { question_text: 'Sua solução resolve efetivamente o problema identificado?', weight: 1, order_index: 1 },
            { question_text: 'Você consegue explicar claramente como sua solução funciona?', weight: 1, order_index: 2 },
            { question_text: 'Sua solução oferece vantagens competitivas claras?', weight: 1, order_index: 3 },
            { question_text: 'Você validou que os clientes consideram sua solução superior às alternativas?', weight: 1, order_index: 4 },
            { question_text: 'Sua solução é escalável para atender um grande número de clientes?', weight: 1, order_index: 5 },
            { question_text: 'Você tem um roadmap claro de evolução da sua solução?', weight: 1, order_index: 6 },
            { question_text: 'Sua solução é fácil de usar e compreender pelos clientes?', weight: 1, order_index: 7 },
            { question_text: 'Você consegue desenvolver e entregar sua solução de forma consistente?', weight: 1, order_index: 8 },
            { question_text: 'Você tem mecanismos para coletar feedback sobre sua solução?', weight: 1, order_index: 9 },
            { question_text: 'Sua solução pode ser protegida por propriedade intelectual?', weight: 1, order_index: 10 }
          ]
        },
        {
          name: 'Modelo de Negócio (Monetização)',
          slug: 'monetizacao',
          description: 'Avaliação do modelo de monetização',
          order_index: 2,
          questions: [
            { question_text: 'Você definiu claramente como irá gerar receita?', weight: 1, order_index: 1 },
            { question_text: 'Você testou e validou seu modelo de precificação?', weight: 1, order_index: 2 },
            { question_text: 'Você entende a disposição de pagamento dos seus clientes?', weight: 1, order_index: 3 },
            { question_text: 'Você tem múltiplas fontes de receita identificadas?', weight: 1, order_index: 4 },
            { question_text: 'Seu modelo de receita é sustentável e recorrente?', weight: 1, order_index: 5 },
            { question_text: 'Você calculou corretamente seus custos de aquisição de cliente?', weight: 1, order_index: 6 },
            { question_text: 'Você conhece o lifetime value (LTV) dos seus clientes?', weight: 1, order_index: 7 },
            { question_text: 'Você tem estratégias para aumentar a receita por cliente?', weight: 1, order_index: 8 },
            { question_text: 'Seu modelo de negócio permite margem de lucro adequada?', weight: 1, order_index: 9 },
            { question_text: 'Você consegue prever e projetar suas receitas futuras?', weight: 1, order_index: 10 }
          ]
        },
        {
          name: 'Tecnologia',
          slug: 'tecnologia',
          description: 'Avaliação dos aspectos tecnológicos',
          order_index: 3,
          questions: [
            { question_text: 'Você tem as competências tecnológicas necessárias para desenvolver sua solução?', weight: 1, order_index: 1 },
            { question_text: 'Sua arquitetura tecnológica é robusta e escalável?', weight: 1, order_index: 2 },
            { question_text: 'Você considera aspectos de segurança e privacidade na sua solução?', weight: 1, order_index: 3 },
            { question_text: 'Você tem um plano de desenvolvimento tecnológico estruturado?', weight: 1, order_index: 4 },
            { question_text: 'Sua solução tecnológica é diferenciada da concorrência?', weight: 1, order_index: 5 },
            { question_text: 'Você consegue manter e atualizar sua tecnologia continuamente?', weight: 1, order_index: 6 },
            { question_text: 'Você tem processos de qualidade e testes implementados?', weight: 1, order_index: 7 },
            { question_text: 'Sua tecnologia permite integração com outros sistemas?', weight: 1, order_index: 8 },
            { question_text: 'Você considera aspectos de performance e experiência do usuário?', weight: 1, order_index: 9 },
            { question_text: 'Você tem backup e planos de contingência para sua tecnologia?', weight: 1, order_index: 10 }
          ]
        }
      ]
    },
    {
      name: 'Operação',
      slug: 'operacao',
      description: 'Avaliação dos aspectos operacionais do negócio',
      order_index: 3,
      subcategories: [
        {
          name: 'Financeiro',
          slug: 'financeiro',
          description: 'Avaliação dos aspectos financeiros',
          order_index: 1,
          questions: [
            { question_text: 'Você tem controle detalhado das suas finanças e fluxo de caixa?', weight: 1, order_index: 1 },
            { question_text: 'Você conhece todos os custos envolvidos no seu negócio?', weight: 1, order_index: 2 },
            { question_text: 'Você tem projeções financeiras realistas para os próximos anos?', weight: 1, order_index: 3 },
            { question_text: 'Você identificou e planejou suas necessidades de investimento?', weight: 1, order_index: 4 },
            { question_text: 'Você tem estratégias para captação de recursos financeiros?', weight: 1, order_index: 5 },
            { question_text: 'Você monitora regularmente indicadores financeiros chave?', weight: 1, order_index: 6 },
            { question_text: 'Você tem reservas financeiras para situações imprevistas?', weight: 1, order_index: 7 },
            { question_text: 'Você entende e calcula corretamente a rentabilidade do negócio?', weight: 1, order_index: 8 },
            { question_text: 'Você tem processos de cobrança e gestão de recebíveis?', weight: 1, order_index: 9 },
            { question_text: 'Você conhece as obrigações fiscais e tributárias do seu negócio?', weight: 1, order_index: 10 }
          ]
        },
        {
          name: 'Gente',
          slug: 'gente',
          description: 'Avaliação da equipe e recursos humanos',
          order_index: 2,
          questions: [
            { question_text: 'Você tem uma equipe com as competências necessárias para o negócio?', weight: 1, order_index: 1 },
            { question_text: 'Você definiu claramente os papéis e responsabilidades da equipe?', weight: 1, order_index: 2 },
            { question_text: 'Você tem processos de recrutamento e seleção estruturados?', weight: 1, order_index: 3 },
            { question_text: 'Você oferece treinamento e desenvolvimento para sua equipe?', weight: 1, order_index: 4 },
            { question_text: 'Você tem estratégias de retenção e motivação da equipe?', weight: 1, order_index: 5 },
            { question_text: 'Você consegue avaliar o desempenho da equipe objetivamente?', weight: 1, order_index: 6 },
            { question_text: 'Você tem planos de crescimento e sucessão para posições chave?', weight: 1, order_index: 7 },
            { question_text: 'Você promove uma cultura organizacional positiva?', weight: 1, order_index: 8 },
            { question_text: 'Você tem canais de comunicação eficazes com a equipe?', weight: 1, order_index: 9 },
            { question_text: 'Você consegue delegar responsabilidades adequadamente?', weight: 1, order_index: 10 }
          ]
        },
        {
          name: 'Gestão',
          slug: 'gestao',
          description: 'Avaliação dos processos de gestão',
          order_index: 3,
          questions: [
            { question_text: 'Você tem objetivos e metas claras para o negócio?', weight: 1, order_index: 1 },
            { question_text: 'Você monitora regularmente o progresso em direção aos objetivos?', weight: 1, order_index: 2 },
            { question_text: 'Você tem processos de tomada de decisão estruturados?', weight: 1, order_index: 3 },
            { question_text: 'Você consegue priorizar atividades e focar no que é mais importante?', weight: 1, order_index: 4 },
            { question_text: 'Você tem sistemas de informação adequados para gestão do negócio?', weight: 1, order_index: 5 },
            { question_text: 'Você realiza reuniões produtivas e alinhamento regular com a equipe?', weight: 1, order_index: 6 },
            { question_text: 'Você tem processos de planejamento estratégico implementados?', weight: 1, order_index: 7 },
            { question_text: 'Você consegue identificar e mitigar riscos do negócio?', weight: 1, order_index: 8 },
            { question_text: 'Você tem mecanismos de controle de qualidade nos processos?', weight: 1, order_index: 9 },
            { question_text: 'Você documenta e padroniza os principais processos do negócio?', weight: 1, order_index: 10 }
          ]
        },
        {
          name: 'Processos',
          slug: 'processos',
          description: 'Avaliação dos processos operacionais',
          order_index: 4,
          questions: [
            { question_text: 'Você tem processos operacionais bem definidos e documentados?', weight: 1, order_index: 1 },
            { question_text: 'Você consegue entregar seus produtos/serviços de forma consistente?', weight: 1, order_index: 2 },
            { question_text: 'Você tem processos de atendimento ao cliente estruturados?', weight: 1, order_index: 3 },
            { question_text: 'Você monitora e melhora continuamente seus processos?', weight: 1, order_index: 4 },
            { question_text: 'Você tem processos de vendas e marketing organizados?', weight: 1, order_index: 5 },
            { question_text: 'Você consegue escalar seus processos conforme o crescimento?', weight: 1, order_index: 6 },
            { question_text: 'Você tem processos de controle de estoque e suprimentos?', weight: 1, order_index: 7 },
            { question_text: 'Você utiliza tecnologia para automatizar processos repetitivos?', weight: 1, order_index: 8 },
            { question_text: 'Você tem processos de feedback e melhoria contínua?', weight: 1, order_index: 9 },
            { question_text: 'Você consegue medir a eficiência dos seus processos?', weight: 1, order_index: 10 }
          ]
        }
      ]
    }
  ],
  
  maturityLevels: [
    { level: 'idealizando', name: 'Idealizando', description: 'Fase inicial de concepção da ideia de negócio', min_score: 1.0, max_score: 1.8, order_index: 1 },
    { level: 'validando_problemas_solucoes', name: 'Validando Problemas e Soluções', description: 'Fase de validação do problema e das soluções propostas', min_score: 1.9, max_score: 2.6, order_index: 2 },
    { level: 'iniciando_negocio', name: 'Iniciando o Negócio', description: 'Fase de estruturação e início das operações', min_score: 2.7, max_score: 3.4, order_index: 3 },
    { level: 'validando_mercado', name: 'Validando o Mercado', description: 'Fase de validação do mercado e modelo de negócio', min_score: 3.5, max_score: 4.2, order_index: 4 },
    { level: 'evoluindo', name: 'Evoluindo', description: 'Fase de crescimento e expansão do negócio', min_score: 4.3, max_score: 5.0, order_index: 5 }
  ]
};
