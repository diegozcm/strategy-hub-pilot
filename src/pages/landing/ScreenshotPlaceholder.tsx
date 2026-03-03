import React from 'react';
import { Monitor } from 'lucide-react';

interface Props {
  name: string;
  description: string;
  className?: string;
}

export const ScreenshotPlaceholder: React.FC<Props> = ({ name, description, className = '' }) => (
  <div className={`relative rounded-2xl border border-white/10 bg-cofound-blue-dark overflow-hidden group ${className}`}>
    {/* Window chrome */}
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
      <div className="flex gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-500/60" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <span className="w-3 h-3 rounded-full bg-green-500/60" />
      </div>
      <span className="text-xs text-white/30 font-sans ml-2">app.cofound.com.br</span>
    </div>
    {/* Content placeholder */}
    <div className="flex flex-col items-center justify-center p-12 min-h-[280px]">
      <Monitor className="h-12 w-12 text-cofound-blue-light/30 mb-4" />
      <p className="text-sm font-display font-semibold text-white/50 mb-1">{name}</p>
      <p className="text-xs text-white/30 font-sans text-center max-w-xs">{description}</p>
    </div>
  </div>
);
