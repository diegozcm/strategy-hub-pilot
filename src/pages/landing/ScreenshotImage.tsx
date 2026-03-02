import React from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export const ScreenshotImage: React.FC<Props> = ({ src, alt, className = '', eager = false }) => (
  <div className={`relative rounded-2xl border border-white/10 bg-cofound-blue-dark overflow-hidden group shadow-2xl ${className}`}>
    {/* Window chrome */}
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
      <div className="flex gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-500/60" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <span className="w-3 h-3 rounded-full bg-green-500/60" />
      </div>
      <span className="text-xs text-white/30 font-sans ml-2">strategyhub.cofound.com.br</span>
    </div>
    <img
      src={src}
      alt={alt}
      className="w-full h-auto block"
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
    />
  </div>
);
