import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OKRQuarter } from '@/types/okr';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OKRQuarterTabsProps {
  quarters: OKRQuarter[];
  currentQuarter: OKRQuarter | null;
  onQuarterChange: (quarter: OKRQuarter) => void;
}

export const OKRQuarterTabs: React.FC<OKRQuarterTabsProps> = ({
  quarters,
  currentQuarter,
  onQuarterChange,
}) => {
  const getQuarterName = (quarter: number) => {
    return `Q${quarter}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500',
      inactive: 'bg-gray-400',
      completed: 'bg-blue-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  return (
    <Tabs value={currentQuarter?.id || ''} onValueChange={(value) => {
      const quarter = quarters.find(q => q.id === value);
      if (quarter) onQuarterChange(quarter);
    }}>
      <TabsList className="grid w-full grid-cols-4">
        {quarters.map((quarter) => {
          const progress = quarter.progress_percentage || 0;
          return (
            <TabsTrigger
              key={quarter.id}
              value={quarter.id}
              className="flex flex-col items-start p-4 data-[state=active]:bg-primary/10"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{getQuarterName(quarter.quarter)}</span>
                <Badge variant="outline" className={`${getStatusColor(quarter.status)} text-white`}>
                  {quarter.status}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(quarter.start_date), 'MMM', { locale: ptBR })} - {format(new Date(quarter.end_date), 'MMM', { locale: ptBR })}
              </span>
              {quarter.theme && (
                <span className="text-xs text-muted-foreground mt-1 italic">
                  {quarter.theme}
                </span>
              )}
              <Progress value={progress} className="h-1 mt-2" />
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};
