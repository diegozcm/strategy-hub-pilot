import React from 'react';
import { cn } from '@/lib/utils';

interface TargetLogoProps {
  className?: string;
  size?: number;
}

export const TargetLogo: React.FC<TargetLogoProps> = ({ className, size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("", className)}
    >
      {/* Outer circle */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      
      {/* Middle circle */}
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      
      {/* Inner circle (filled) */}
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="currentColor"
      />
      
      {/* Crosshairs - horizontal */}
      <line
        x1="2"
        y1="12"
        x2="8"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="12"
        x2="22"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      
      {/* Crosshairs - vertical */}
      <line
        x1="12"
        y1="2"
        x2="12"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="12"
        y1="16"
        x2="12"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
};