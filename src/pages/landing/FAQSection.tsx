import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  { q: 'O que é o Strategy HUB?', a: 'O Strategy HUB é a plataforma de gestão estratégica da COFOUND que integra planejamento, OKRs, indicadores, projetos e inteligência artificial em um único ambiente digital, conectando consultoria à execução.' },
  { q: 'Para quem é indicado?', a: 'Para empresas de médio e grande porte que buscam estruturar sua gestão estratégica, assim como startups em fase de aceleração. CEOs, gestores, consultores e líderes de área são os principais usuários.' },
  { q: 'Como funciona a IA Atlas?', a: 'O Atlas IA é um copiloto estratégico que analisa os dados da sua empresa dentro da plataforma — OKRs, indicadores, projetos — e fornece insights, recomendações e alertas personalizados para melhorar sua tomada de decisão.' },
  { q: 'Posso usar sem a consultoria COFOUND?', a: 'Sim. A plataforma pode ser utilizada de forma independente. Porém, a experiência completa inclui o acompanhamento da consultoria COFOUND para maximizar resultados e garantir a implementação estratégica.' },
  { q: 'Quanto tempo leva para implementar?', a: 'O onboarding básico pode ser realizado em 1 a 2 semanas. Jornadas estratégicas completas com consultoria têm duração de 3 a 6 meses, dependendo do escopo e maturidade da organização.' },
  { q: 'Como posso começar?', a: 'Entre em contato pelo WhatsApp ou agende uma demonstração. Nossa equipe vai entender seu cenário e recomendar a melhor solução entre plataforma, consultoria ou ambos.' },
];

export const FAQSection: React.FC = () => (
  <section className="py-20 px-4 bg-cofound-white">
    <div className="container mx-auto max-w-3xl">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-4">
          Perguntas frequentes
        </h2>
        <p className="text-lg text-cofound-blue-dark/50 font-sans">
          Tire suas dúvidas sobre o Strategy HUB e a COFOUND.
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="bg-white rounded-xl border border-cofound-blue-dark/8 shadow-soft px-6 data-[state=open]:shadow-elev data-[state=open]:border-cofound-green/30 transition-all"
          >
            <AccordionTrigger className="text-left font-display font-semibold text-cofound-blue-dark py-5 hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-cofound-blue-dark/60 font-sans pb-5 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
