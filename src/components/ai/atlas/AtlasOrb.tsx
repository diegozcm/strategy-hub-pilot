import React from 'react';
import { cn } from '@/lib/utils';

interface AtlasOrbProps {
  size?: number;
  className?: string;
}

const orbStyle = {
  '--base': 'oklch(5% 0.01 240)',
  '--accent1': 'oklch(72% 0.28 155)',
  '--accent2': 'oklch(70% 0.25 230)',
  '--accent3': 'oklch(65% 0.22 195)',
  '--blur': '0.3px',
  '--contrast': '1.8',
  '--dot': '0.05rem',
  '--shadow': '1.5rem',
  '--mask': '8%',
  '--spin-duration': '6s',
} as React.CSSProperties;

export const AtlasOrb: React.FC<AtlasOrbProps> = ({ size = 28, className }) => (
  <div
    className={cn("color-orb-atlas shrink-0", className)}
    style={{ ...orbStyle, width: size, height: size }}
  />
);
