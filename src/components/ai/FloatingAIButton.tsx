import React from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[100] animate-fade-in block",
      className
    )}>
      <Button
        onClick={onClick}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 hover:scale-110"
      >
        <Bot className="h-8 w-8" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};
