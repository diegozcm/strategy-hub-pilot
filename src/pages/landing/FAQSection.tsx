import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DarkBackground } from './DarkBackground';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const WHATSAPP_URL = 'https://wa.me/554796342353?text=Tenho%20uma%20dúvida%20sobre%20o%20Strategy%20HUB';

const faqs = [
  { q: 'O que é o Strategy HUB?', a: 'O Strategy HUB é a plataforma de gestão estratégica da COFOUND que integra planejamento, OKRs, indicadores, projetos e inteligência artificial em um único ambiente digital, conectando consultoria à execução.' },
  { q: 'Para quem é indicado?', a: 'Para empresas de médio e grande porte que buscam estruturar sua gestão estratégica, assim como startups em fase de aceleração. CEOs, gestores, consultores e líderes de área são os principais usuários.' },
  { q: 'Como funciona a IA Atlas?', a: 'O Atlas IA é um copiloto estratégico que analisa os dados da sua empresa dentro da plataforma — OKRs, indicadores, projetos — e fornece insights, recomendações e alertas personalizados para melhorar sua tomada de decisão.' },
  { q: 'Posso usar sem a consultoria COFOUND?', a: 'Sim. A plataforma pode ser utilizada de forma independente. Porém, a experiência completa inclui o acompanhamento da consultoria COFOUND para maximizar resultados e garantir a implementação estratégica.' },
  { q: 'Quanto tempo leva para implementar?', a: 'O onboarding básico pode ser realizado em 1 a 2 semanas. Jornadas estratégicas completas com consultoria têm duração de 3 a 6 meses, dependendo do escopo e maturidade da organização.' },
  { q: 'Como posso começar?', a: 'Entre em contato pelo WhatsApp ou agende uma demonstração. Nossa equipe vai entender seu cenário e recomendar a melhor solução entre plataforma, consultoria ou ambos.' },
];

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

export const FAQSection: React.FC<Props> = ({ getContent }) => (
  <section className="py-24 px-6 bg-cofound-white" id="faq">
    <div className="max-w-6xl mx-auto">
      {/* FAQ Grid */}
      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-16">
        {/* Left — title + CTA */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-sm font-sans font-semibold text-cofound-green tracking-widest uppercase mb-3">
            Suporte
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-5">
            Perguntas frequentes
          </h2>
          <p className="text-base text-cofound-blue-dark/50 font-sans mb-8 leading-relaxed">
            Não encontrou o que procura? Fale com nossa equipe e tire todas as suas dúvidas.
          </p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full border-cofound-blue-dark/15 text-cofound-blue-dark font-semibold hover:bg-cofound-blue-dark/[0.04] px-6">
              <MessageSquare className="mr-2 h-4 w-4" />
              Fale conosco
            </Button>
          </a>
        </div>

        {/* Right — accordion */}
        <div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white rounded-2xl border border-cofound-blue-dark/[0.06] shadow-soft px-6 data-[state=open]:shadow-elev data-[state=open]:border-cofound-green/30 transition-all"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-cofound-blue-dark py-5 hover:no-underline text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-cofound-blue-dark/55 font-sans pb-5 leading-relaxed text-sm">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* CTA Card */}
      <DarkBackground className="mt-20 rounded-3xl p-10 md:p-14" as="div">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-cofound-green" />
              <span className="text-sm font-sans font-semibold text-cofound-green tracking-widest uppercase">
                Oferta exclusiva
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3 leading-tight">
              {getContent('cta', 'title', 'Comece a transformar sua gestão estratégica hoje')}
            </h3>
            <p className="text-sm text-white/50 font-sans leading-relaxed">
              {getContent('cta', 'subtitle', 'Teste o Strategy HUB gratuitamente e descubra como conectar estratégia à execução com inteligência artificial.')}
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link to="/auth">
              <Button
                size="lg"
                className="text-base px-8 py-6 bg-cofound-green text-cofound-blue-dark font-bold hover:bg-cofound-green/90 shadow-lg shadow-cofound-green/20 transition-all hover:scale-[1.03] rounded-full"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                {getContent('cta', 'primary_button', 'Começar agora')}
              </Button>
            </Link>
          </div>
        </div>
      </DarkBackground>
    </div>
  </section>
);
