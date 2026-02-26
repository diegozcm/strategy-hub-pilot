import React from 'react';
import { TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { AtlasOrb } from './AtlasOrb';

interface AtlasWelcomeProps {
  onQuickAction: (prompt: string) => void;
  quickActions: { label: string; prompt: string; icon: string }[];
}

const iconMap = {
  TrendingUp,
  AlertCircle,
  Lightbulb,
};

export const AtlasWelcome: React.FC<AtlasWelcomeProps> = ({ onQuickAction, quickActions }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 atlas-chat-bg">
      {/* Animated ColorOrb */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mb-8"
      >
        <AtlasOrb size={80} />
      </motion.div>

      {/* Welcome Text */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Atlas Hub
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Seu assistente estratégico. Pergunte qualquer coisa ou escolha uma das ações rápidas abaixo.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg"
      >
        {quickActions.map((action, index) => {
          const Icon = iconMap[action.icon as keyof typeof iconMap] || Lightbulb;
          return (
            <button
              key={index}
              onClick={() => onQuickAction(action.prompt)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[hsl(var(--cofound-blue-light))]/20 bg-card shadow-sm hover:bg-[hsl(var(--cofound-green))]/10 hover:border-[hsl(var(--cofound-green))]/50 transition-colors text-center group"
            >
              <Icon className="h-5 w-5 text-[hsl(var(--cofound-blue-light))] group-hover:text-[hsl(var(--cofound-green))] transition-colors" />
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
