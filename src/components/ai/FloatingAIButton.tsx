import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

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

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[100] animate-fade-in block",
      className
    )}>
      <div className="relative">
        <motion.button
          layoutId="atlas-chat-morph"
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative h-14 w-14 rounded-full shadow-lg cursor-pointer border-0 p-0 overflow-hidden"
          whileHover={{ scale: 1.15 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          style={{ borderRadius: '50%' }}
        >
          <div
            className={cn(
              "color-orb-atlas w-full h-full transition-[filter] duration-300",
              isHovered ? "brightness-150 saturate-200" : ""
            )}
            style={{
              '--base': 'oklch(25% 0.04 240)',
              '--accent1': 'oklch(65% 0.18 155)',
              '--accent2': 'oklch(72% 0.2 230)',
              '--accent3': 'oklch(55% 0.16 250)',
              '--blur': '0.8px',
              '--contrast': '1.6',
              '--dot': '0.08rem',
              '--shadow': '1.5rem',
              '--mask': '10%',
              '--spin-duration': '8s',
              filter: isHovered ? 'brightness(1.5) saturate(2)' : undefined,
            } as React.CSSProperties}
          />
          {/* IA label */}
          <motion.span
            className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm pointer-events-none select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
            animate={{ 
              scale: isHovered ? 1.15 : 1,
              opacity: isHovered ? 1 : 0.9,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            IA
          </motion.span>
        </motion.button>

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
