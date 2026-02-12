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
    const maxOffset = 2.5;
    const factor = Math.min(dist / 250, 1);
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

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[100] animate-fade-in block",
      className
    )}>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer border-0 p-0 overflow-hidden"
        >
          <svg viewBox="0 0 56 56" className="w-full h-full">
            <defs>
              <radialGradient id="atlasGrad" cx="38%" cy="36%" r="60%">
                <stop offset="0%" stopColor="#5BC8FF" />
                <stop offset="50%" stopColor="#38B6FF" />
                <stop offset="100%" stopColor="#1A8AD4" />
              </radialGradient>
              <filter id="eyeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="#0a4a7a" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Background circle */}
            <circle cx="28" cy="28" r="28" fill="url(#atlasGrad)" />
            
            {/* Subtle highlight arc */}
            <ellipse cx="24" cy="18" rx="14" ry="9" fill="rgba(255,255,255,0.12)" />

            {/* Left eye */}
            <ellipse
              cx={20 + eyeOffset.x * 0.3}
              cy={23 + eyeOffset.y * 0.3}
              rx={isHovered ? 5 : 4.5}
              ry={isHovered ? 5.5 : 5}
              fill="white"
              filter="url(#eyeShadow)"
              style={{ transition: 'all 0.15s ease-out' }}
            />
            <circle
              cx={20 + eyeOffset.x}
              cy={23.5 + eyeOffset.y}
              r={isHovered ? 2.8 : 2.4}
              fill="#0E263D"
              style={{ transition: 'all 0.1s ease-out' }}
            />
            <circle
              cx={20 + eyeOffset.x + 0.8}
              cy={22.5 + eyeOffset.y - 0.5}
              r={0.8}
              fill="rgba(255,255,255,0.8)"
            />

            {/* Right eye */}
            <ellipse
              cx={36 + eyeOffset.x * 0.3}
              cy={23 + eyeOffset.y * 0.3}
              rx={isHovered ? 5 : 4.5}
              ry={isHovered ? 5.5 : 5}
              fill="white"
              filter="url(#eyeShadow)"
              style={{ transition: 'all 0.15s ease-out' }}
            />
            <circle
              cx={36 + eyeOffset.x}
              cy={23.5 + eyeOffset.y}
              r={isHovered ? 2.8 : 2.4}
              fill="#0E263D"
              style={{ transition: 'all 0.1s ease-out' }}
            />
            <circle
              cx={36 + eyeOffset.x + 0.8}
              cy={22.5 + eyeOffset.y - 0.5}
              r={0.8}
              fill="rgba(255,255,255,0.8)"
            />

            {/* Mouth */}
            <path
              d={isHovered
                ? "M 21 34 Q 28 43 35 34"
                : "M 22 34 Q 28 40 34 34"
              }
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ transition: 'd 0.25s ease' }}
            />

            {/* Cheeks on hover */}
            {isHovered && (
              <>
                <circle cx="13" cy="30" r="3.5" fill="rgba(255,255,255,0.13)" />
                <circle cx="43" cy="30" r="3.5" fill="rgba(255,255,255,0.13)" />
              </>
            )}
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
