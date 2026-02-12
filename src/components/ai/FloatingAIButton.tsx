import React from 'react';
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
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[100] animate-fade-in block",
      className
    )}>
      <div className="relative">
        <motion.button
          layoutId="atlas-chat-morph"
          onClick={onClick}
          className="relative h-14 w-14 rounded-full shadow-lg cursor-pointer border-0 p-0 overflow-hidden transition-[filter] duration-300 hover:brightness-125"
          whileHover={{ scale: 1.15 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          style={{ borderRadius: '50%' }}
        >
          <div
            className="color-orb-atlas w-full h-full"
            style={{
              '--base': 'oklch(22% 0.03 260)',
              '--accent1': 'oklch(55% 0.12 140)',
              '--accent2': 'oklch(60% 0.15 240)',
              '--accent3': 'oklch(40% 0.10 260)',
              '--blur': '1px',
              '--contrast': '1.5',
              '--dot': '0.1rem',
              '--shadow': '2rem',
              '--mask': '15%',
              '--spin-duration': '12s',
            } as React.CSSProperties}
          />
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
