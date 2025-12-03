import { KRInitiative } from '@/types/strategic-map';
import { Card } from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KRInitiativesTimelineProps {
  initiatives: KRInitiative[];
}

const statusColors: Record<KRInitiative['status'], string> = {
  planned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  on_hold: 'bg-gray-500'
};

// Helper: Formatar quarter para exibição "Q1 (jan-mar) 2026"
const formatQuarterLabel = (startDate: string): string => {
  const date = parseISO(startDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const quarter = Math.ceil(month / 3);
  
  const quarterLabels: Record<number, string> = {
    1: 'Q1 (jan-mar)',
    2: 'Q2 (abr-jun)',
    3: 'Q3 (jul-set)',
    4: 'Q4 (out-dez)'
  };
  
  return `${quarterLabels[quarter]} ${year}`;
};

export const KRInitiativesTimeline = ({ initiatives }: KRInitiativesTimelineProps) => {
  if (initiatives.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          Nenhuma iniciativa encontrada
        </p>
      </Card>
    );
  }

  // Sort initiatives by start date
  const sortedInitiatives = [...initiatives].sort((a, b) => 
    parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
  );

  // Calculate timeline bounds
  const earliestDate = parseISO(sortedInitiatives[0].start_date);
  const latestDate = sortedInitiatives.reduce((latest, init) => {
    const endDate = parseISO(init.end_date);
    return isAfter(endDate, latest) ? endDate : latest;
  }, parseISO(sortedInitiatives[0].end_date));

  const totalDays = differenceInDays(latestDate, earliestDate);
  const today = new Date();

  const getPositionAndWidth = (initiative: KRInitiative) => {
    const startDate = parseISO(initiative.start_date);
    const endDate = parseISO(initiative.end_date);
    
    const startOffset = differenceInDays(startDate, earliestDate);
    const duration = differenceInDays(endDate, startDate);
    
    const left = totalDays > 0 ? (startOffset / totalDays) * 100 : 0;
    const width = totalDays > 0 ? (duration / totalDays) * 100 : 100;
    
    return { left: Math.max(0, left), width: Math.max(2, width) };
  };

  const getTodayPosition = () => {
    if (isBefore(today, earliestDate) || isAfter(today, latestDate)) {
      return null;
    }
    
    const todayOffset = differenceInDays(today, earliestDate);
    return totalDays > 0 ? (todayOffset / totalDays) * 100 : 0;
  };

  const todayPosition = getTodayPosition();

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm">Cronograma de Iniciativas</h4>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(earliestDate, 'MMM/yy', { locale: ptBR })} - {format(latestDate, 'MMM/yy', { locale: ptBR })}
          </div>
        </div>

        <div className="relative">
          {/* Timeline background */}
          <div className="h-2 bg-gray-100 rounded-full relative overflow-hidden">
            {/* Today indicator */}
            {todayPosition !== null && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${todayPosition}%` }}
              />
            )}
          </div>

          {/* Initiatives */}
          <div className="space-y-2 mt-4">
            {sortedInitiatives.map((initiative, index) => {
              const { left, width } = getPositionAndWidth(initiative);
              
              return (
                <div key={initiative.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="font-medium truncate max-w-[150px]" title={initiative.title}>
                        {initiative.title}
                      </span>
                      {initiative.responsible && (
                        <>
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[80px]" title={initiative.responsible}>
                            {initiative.responsible}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {formatQuarterLabel(initiative.start_date)}
                    </div>
                  </div>
                  
                  <div className="relative h-6 bg-gray-100 rounded">
                    {/* Initiative bar */}
                    <div
                      className={`absolute top-0 bottom-0 rounded ${statusColors[initiative.status]} opacity-80`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                    
                    {/* Progress overlay */}
                    <div
                      className={`absolute top-0 bottom-0 rounded ${statusColors[initiative.status]}`}
                      style={{ 
                        left: `${left}%`, 
                        width: `${(width * initiative.progress_percentage) / 100}%` 
                      }}
                    />
                    
                    {/* Progress text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white font-medium drop-shadow-sm">
                        {initiative.progress_percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Planejada</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Em Andamento</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Concluída</span>
            </div>
            {todayPosition !== null && (
              <div className="flex items-center gap-1">
                <div className="w-0.5 h-3 bg-red-500"></div>
                <span>Hoje</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};