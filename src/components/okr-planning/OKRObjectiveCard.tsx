import React from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { OKRObjective } from '@/types/okr';

interface OKRObjectiveCardProps {
  objective: OKRObjective;
  onClick: () => void;
}

export const OKRObjectiveCard: React.FC<OKRObjectiveCardProps> = ({
  objective,
  onClick,
}) => {
  const getStatusIcon = (status: string) => {
    const icons = {
      completed: <CheckCircle2 className="h-4 w-4" />,
      on_track: <TrendingUp className="h-4 w-4" />,
      at_risk: <AlertCircle className="h-4 w-4" />,
      off_track: <AlertCircle className="h-4 w-4" />,
      not_started: <Target className="h-4 w-4" />,
      delayed: <AlertCircle className="h-4 w-4" />,
    };
    return icons[status as keyof typeof icons];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-500 text-white',
      on_track: 'bg-blue-500 text-white',
      at_risk: 'bg-yellow-500 text-white',
      off_track: 'bg-red-500 text-white',
      not_started: 'bg-gray-400 text-white',
      delayed: 'bg-orange-500 text-white',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400 text-white';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'border-red-500',
      medium: 'border-yellow-500',
      low: 'border-blue-500',
    };
    return colors[priority as keyof typeof colors] || 'border-gray-400';
  };

  const ownerInitials = '??';

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(objective.priority)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Badge className={getStatusColor(objective.status)}>
            {getStatusIcon(objective.status)}
            <span className="ml-1 capitalize">
              {objective.status.replace('_', ' ')}
            </span>
          </Badge>
          <Badge variant="outline" className="capitalize">
            {objective.priority}
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2">{objective.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {objective.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {objective.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">
              {Math.round(objective.progress_percentage)}%
            </span>
          </div>
          <Progress value={objective.progress_percentage} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {ownerInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Responsável
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {objective.key_results?.length || 0} KRs
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
