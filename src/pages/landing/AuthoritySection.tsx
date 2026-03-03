import React from 'react';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns';
import { useScrollReveal } from './useScrollReveal';
import { motion } from 'motion/react';

const testimonials = [
  {
    text: 'O Strategy HUB transformou a forma como enxergamos nossa estratégia. Ter tudo conectado em uma plataforma nos deu velocidade e clareza para tomar decisões.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
    name: 'Carlos Mendes',
    role: 'CEO — Empresa do setor industrial',
  },
  {
    text: 'A combinação de consultoria com a plataforma foi o que fez a diferença. Não é só ferramenta — é um método que funciona.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
    name: 'Fernanda Oliveira',
    role: 'Diretora de Operações — Empresa de tecnologia',
  },
  {
    text: 'O Atlas IA trouxe insights que nossa equipe levaria semanas para identificar. É como ter um consultor estratégico disponível 24h.',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
    name: 'Rafael Torres',
    role: 'Head de Estratégia — Grupo empresarial',
  },
  {
    text: 'Conseguimos alinhar toda a equipe em torno dos mesmos objetivos pela primeira vez. Os OKRs ficaram claros e acessíveis para todos.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
    name: 'Ana Beatriz Costa',
    role: 'Gestora de RH — Indústria alimentícia',
  },
  {
    text: 'A governança corporativa melhorou drasticamente. Atas, reuniões e decisões agora ficam registradas e rastreáveis.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    name: 'Marcos Vinícius',
    role: 'Diretor Financeiro — Grupo empresarial',
  },
  {
    text: 'O diagnóstico BEEP nos mostrou exatamente onde estávamos e para onde precisávamos ir. Foi um divisor de águas.',
    image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop&crop=face',
    name: 'Juliana Rezende',
    role: 'Consultora — Aceleradora de startups',
  },
  {
    text: 'Implementamos em duas semanas e já vimos resultados no primeiro mês. A interface é intuitiva e a equipe adotou rapidamente.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    name: 'Pedro Henrique Lima',
    role: 'CTO — Startup SaaS',
  },
  {
    text: 'Os dashboards em tempo real mudaram a dinâmica das nossas reuniões executivas. Agora decidimos com dados, não com achismos.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    name: 'Camila Ferreira',
    role: 'VP de Estratégia — Varejo',
  },
  {
    text: 'A integração entre planejamento estratégico e execução finalmente funciona. Sem planilhas, sem retrabalho.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    name: 'Thiago Nascimento',
    role: 'Diretor de Projetos — Construtora',
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const AuthoritySection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref}>
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          className="text-sm font-sans font-semibold text-cofound-green tracking-widest uppercase mb-3"
        >
          Depoimentos
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl font-display font-bold text-cofound-blue-dark mb-5"
        >
          O que nossos clientes dizem
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15 }}
          className="text-base text-cofound-blue-dark/50 font-sans max-w-xl mx-auto"
        >
          Empresas que já viveram a transformação com o Strategy HUB.
        </motion.p>
      </div>

      <div className="flex justify-center gap-5 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[600px] overflow-hidden">
        <TestimonialsColumn testimonials={firstColumn} duration={15} />
        <TestimonialsColumn testimonials={secondColumn} duration={19} className="hidden md:block" />
        <TestimonialsColumn testimonials={thirdColumn} duration={17} className="hidden lg:block" />
      </div>
    </div>
  );
};
