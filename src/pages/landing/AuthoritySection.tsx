import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';

export const AuthoritySection: React.FC = () => (
  <section className="py-20 px-4 bg-gradient-to-br from-cofound-green/10 via-cofound-green/5 to-cofound-white">
    <div className="container mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-cofound-blue-dark mb-4">
          Impacto comprovado
        </h2>
        <p className="text-lg text-cofound-blue-dark/50 font-sans max-w-2xl mx-auto">
          Métricas que demonstram a confiança do mercado na COFOUND.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        <AnimatedCounter end={200} prefix="+" label="Empresas atendidas" />
        <AnimatedCounter end={15} prefix="+" label="Anos de experiência" />
        <AnimatedCounter end={95} suffix="%" label="Satisfação dos clientes" />
        <AnimatedCounter end={500} prefix="+" label="Projetos estratégicos" />
      </div>
    </div>
  </section>
);
