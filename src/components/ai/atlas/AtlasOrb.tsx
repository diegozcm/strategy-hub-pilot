import React from 'react';
import { cn } from '@/lib/utils';

interface AtlasOrbProps {
  size?: number;
  className?: string;
}

const orbStyle = {
  '--base': 'oklch(10% 0.02 240)',
  '--accent1': 'oklch(68% 0.22 150)',
  '--accent2': 'oklch(75% 0.22 230)',
  '--accent3': 'oklch(72% 0.20 200)',
  '--blur': '0.5px',
  '--contrast': '1.6',
  '--dot': '0.05rem',
  '--shadow': '0.8rem',
  '--mask': '10%',
  '--spin-duration': '6s',
} as React.CSSProperties;

export const AtlasOrb: React.FC<AtlasOrbProps> = ({ size = 28, className }) => (
  <div
    className={cn("color-orb-atlas shrink-0", className)}
    style={{ ...orbStyle, width: size, height: size }}
  />
);
