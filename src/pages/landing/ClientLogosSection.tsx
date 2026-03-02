import React from 'react';

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

const logos = [
  'Copapel', 'Ágora Tech Park', 'Grupo Krona', 'Docol', 'Tupy',
  'Embraco', 'Whirlpool', 'Tigre', 'Schulz', 'Datasul',
  'Copapel', 'Ágora Tech Park', 'Grupo Krona', 'Docol', 'Tupy',
  'Embraco', 'Whirlpool', 'Tigre', 'Schulz', 'Datasul',
];

export const ClientLogosSection: React.FC<Props> = ({ getContent }) => (
  <section className="py-14 px-4 bg-cofound-white border-y border-cofound-blue-dark/5">
    <div className="container mx-auto">
      <h2 className="text-center text-sm font-display font-semibold text-cofound-blue-dark/40 mb-8 tracking-widest uppercase">
        {getContent('clients', 'title', 'Quem já viveu a experiência Cofound')}
      </h2>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-cofound-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-cofound-white to-transparent z-10 pointer-events-none" />
        <div className="flex animate-marquee whitespace-nowrap">
          {logos.map((name, i) => (
            <div key={i} className="flex-shrink-0 mx-6 h-12 px-6 flex items-center justify-center rounded-lg border border-cofound-blue-dark/10 bg-white">
              <span className="text-cofound-blue-dark/30 font-display font-semibold text-sm">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
