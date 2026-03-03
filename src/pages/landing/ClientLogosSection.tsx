import React from 'react';
import logosRow1 from '@/assets/logos/logos-row-1.png';
import logosRow2 from '@/assets/logos/logos-row-2.png';
import logosRow3 from '@/assets/logos/logos-row-3.png';
import logosRow4 from '@/assets/logos/logos-row-4.png';

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

const logoImages = [logosRow1, logosRow2, logosRow3, logosRow4];

export const ClientLogosSection: React.FC<Props> = ({ getContent }) => (
  <section className="py-12 px-6 bg-cofound-blue-dark overflow-hidden">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-center text-sm font-display font-semibold text-white/30 mb-8 tracking-widest uppercase">
        {getContent('clients', 'title', 'Quem já viveu a experiência Cofound')}
      </h2>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-cofound-blue-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-cofound-blue-dark to-transparent z-10 pointer-events-none" />
        <div className="flex animate-marquee items-center">
          {/* Double the images for seamless loop */}
          {[...logoImages, ...logoImages].map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Client logos"
              className="h-10 w-auto flex-shrink-0 mx-8 opacity-60"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);
