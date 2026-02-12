import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FloatingAIButtonProps {
  onClick: () => void;
  unreadCount?: number;
  className?: string;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({
  onClick,
  unreadCount = 0,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = 3;
    const factor = Math.min(dist / 200, 1);
    const angle = Math.atan2(dy, dx);
    setEyeOffset({
      x: Math.cos(angle) * maxOffset * factor,
      y: Math.sin(angle) * maxOffset * factor,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const eyeRadius = isHovered ? 3.5 : 3;
  const pupilRadius = isHovered ? 2 : 1.8;

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[100] animate-fade-in block",
      className
    )}>
      {/* LED glow ring */}
      <div className="relative">
        <div
          className="absolute -inset-[3px] rounded-full animate-spin-glow"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, #38B6FF 25%, transparent 50%, #0EA5E9 75%, transparent 100%)',
          }}
        />
        <div className="absolute -inset-[3px] rounded-full animate-spin-glow opacity-50 blur-sm"
          style={{
            background: 'conic-gradient(from 180deg, transparent 0%, #38B6FF 25%, transparent 50%, #0EA5E9 75%, transparent 100%)',
          }}
        />
        <button
          ref={buttonRef}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer border-0 p-0 overflow-hidden"
          style={{ background: 'hsl(var(--cofound-blue-dark))' }}
        >
          <svg viewBox="0 0 56 56" className="w-full h-full">
            {/* Face background */}
            <circle cx="28" cy="28" r="28" fill="url(#faceGradient)" />
            
            {/* Left eye white */}
            <circle cx="19" cy="24" r={eyeRadius} fill="white"
              style={{ transition: 'r 0.2s ease' }} />
            {/* Left pupil */}
            <circle
              cx={19 + eyeOffset.x}
              cy={24 + eyeOffset.y}
              r={pupilRadius}
              fill="hsl(208, 67%, 14%)"
              style={{ transition: 'cx 0.1s ease, cy 0.1s ease, r 0.2s ease' }}
            />
            
            {/* Right eye white */}
            <circle cx="37" cy="24" r={eyeRadius} fill="white"
              style={{ transition: 'r 0.2s ease' }} />
            {/* Right pupil */}
            <circle
              cx={37 + eyeOffset.x}
              cy={24 + eyeOffset.y}
              r={pupilRadius}
              fill="hsl(208, 67%, 14%)"
              style={{ transition: 'cx 0.1s ease, cy 0.1s ease, r 0.2s ease' }}
            />
            
            {/* Mouth */}
            <path
              d={isHovered
                ? "M 19 35 Q 28 46 37 35"
                : "M 20 35 Q 28 42 36 35"
              }
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ transition: 'd 0.3s ease' }}
            />
            
            {/* Cheek blush on hover */}
            {isHovered && (
              <>
                <circle cx="14" cy="32" r="4" fill="rgba(255,255,255,0.15)" />
                <circle cx="42" cy="32" r="4" fill="rgba(255,255,255,0.15)" />
              </>
            )}
            
            <defs>
              <radialGradient id="faceGradient" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#38B6FF" />
                <stop offset="100%" stopColor="#0E7CC0" />
              </radialGradient>
            </defs>
          </svg>
        </button>

        {/* Notification badge */}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in z-10"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
};
