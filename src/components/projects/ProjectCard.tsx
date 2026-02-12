import React from 'react';
import { Calendar, FolderOpen, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: string;
    priority: string;
    end_date?: string;
    cover_image_url?: string;
    pillar_color?: string;
    pillar_name?: string;
    responsible_id?: string;
    responsible_user?: {
      first_name: string;
      last_name?: string;
      avatar_url?: string;
    };
  };
  taskCount: number;
  completedTasks: number;
  onClick: () => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return { label: 'Concluído', bgClass: 'bg-emerald-500/90' };
    case 'active':
      return { label: 'Ativo', bgClass: 'bg-blue-500/90' };
    case 'on_hold':
      return { label: 'Em Pausa', bgClass: 'bg-amber-500/90' };
    case 'cancelled':
      return { label: 'Cancelado', bgClass: 'bg-red-500/90' };
    default:
      return { label: 'Planejamento', bgClass: 'bg-slate-500/90' };
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  taskCount,
  completedTasks,
  onClick,
}) => {
  const statusConfig = getStatusConfig(project.status);
  const pillarColor = project.pillar_color || '#6366f1';
  
  // Create a gradient for background when no image
  const gradientStyle = !project.cover_image_url ? {
    background: `linear-gradient(135deg, ${pillarColor} 0%, ${adjustColor(pillarColor, -30)} 100%)`,
  } : {};

  return (
    <Card 
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-card"
      onClick={onClick}
      style={{
        boxShadow: `0 4px 20px -4px ${pillarColor}20`,
      }}
    >
      {/* Image/Color Header Area */}
      <div 
        className="relative h-36 overflow-hidden"
        style={gradientStyle}
      >
        {project.cover_image_url ? (
          <img 
            src={project.cover_image_url} 
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-14 h-14 text-white/30" />
          </div>
        )}
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status badge */}
        <Badge 
          className={`absolute top-3 right-3 ${statusConfig.bgClass} text-white border-0 text-xs font-medium shadow-lg`}
        >
          {statusConfig.label}
        </Badge>
        
        {/* Pillar indicator bar */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: pillarColor }}
        />
      </div>

      {/* Content Area */}
      <CardContent className="p-4 space-y-3">
        {/* Project Name */}
        <h3 className="font-semibold text-foreground text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        
        {/* Pillar Tag */}
        {project.pillar_name && (
          <Badge 
            variant="outline" 
            className="text-xs font-normal"
            style={{ 
              borderColor: `${pillarColor}50`,
              color: pillarColor,
              backgroundColor: `${pillarColor}10`
            }}
          >
            {project.pillar_name}
          </Badge>
        )}
        
        {/* Progress Bar */}
        {taskCount > 0 && (() => {
          const percentage = Math.round((completedTasks / taskCount) * 100);
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%`, backgroundColor: pillarColor }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{percentage}%</span>
            </div>
          );
        })()}
        
        {/* Footer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {/* Left side - Tasks and Date */}
          <div className="flex items-center gap-3">
            {/* Tasks count */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedTasks}/{taskCount}</span>
            </div>
            
            {/* End date */}
            {project.end_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(project.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              </div>
            )}
          </div>
          
          {/* Right side - Responsible avatar */}
          {project.responsible_user && (
            <Avatar className="h-6 w-6 border-2 border-background shadow-sm">
              <AvatarImage src={project.responsible_user.avatar_url} />
              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                {project.responsible_user.first_name?.[0]}{project.responsible_user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to darken/lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(Math.min((num >> 16) + amt, 255), 0);
  const G = Math.max(Math.min((num >> 8 & 0x00FF) + amt, 255), 0);
  const B = Math.max(Math.min((num & 0x0000FF) + amt, 255), 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}
