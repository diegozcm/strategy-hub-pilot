import React from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format,
  addMonths, subMonths, parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { GovernanceMeeting } from '@/hooks/useGovernanceMeetings';

const typeColors: Record<string, string> = {
  RM: 'bg-blue-500',
  RE: 'bg-emerald-500',
  Extraordinaria: 'bg-amber-500',
};

const typeLabelsShort: Record<string, string> = {
  RM: 'RM',
  RE: 'RE',
  Extraordinaria: 'EX',
};

interface Props {
  month: Date;
  onMonthChange: (d: Date) => void;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  meetings: GovernanceMeeting[];
}

export const GovernanceCalendarGrid: React.FC<Props> = ({
  month, onMonthChange, selectedDate, onSelectDate, meetings,
}) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { locale: ptBR });
  const calEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getMeetingsForDay = (day: Date) =>
    meetings.filter(m => isSameDay(parseISO(m.scheduled_date), day));

  return (
    <div className="w-full">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="cofound-ghost" size="icon" className="h-8 w-8" onClick={() => onMonthChange(subMonths(month, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <h3 className="text-base font-display font-semibold capitalize">
            {format(month, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          {!isSameMonth(month, new Date()) && (
            <Button variant="cofound-ghost" size="sm" className="h-7 text-xs" onClick={() => { onMonthChange(new Date()); onSelectDate(new Date()); }}>
              Hoje
            </Button>
          )}
        </div>
        <Button variant="cofound-ghost" size="icon" className="h-8 w-8" onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-7 border-t border-l border-border">
          {days.map(day => {
            const inMonth = isSameMonth(day, month);
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);
            const dayMeetings = getMeetingsForDay(day);

            const cell = (
              <div
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  'relative h-20 border-r border-b border-border p-1.5 cursor-pointer transition-colors',
                  !inMonth && 'bg-muted/30',
                  inMonth && 'hover:bg-cofound-blue-light/5',
                  selected && 'bg-cofound-blue-light/10 ring-2 ring-cofound-blue-light/40 ring-inset',
                )}
              >
                <span className={cn(
                  'text-sm font-medium leading-none',
                  !inMonth && 'text-muted-foreground/40',
                  today && 'inline-flex items-center justify-center h-6 w-6 rounded-full bg-cofound-blue-light text-cofound-blue-dark text-xs font-bold',
                )}>
                  {format(day, 'd')}
                </span>

                {dayMeetings.length > 0 && (
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1 flex-wrap">
                    {dayMeetings.slice(0, 3).map(m => (
                      <span key={m.id} className={cn('h-2 w-2 rounded-full shrink-0', typeColors[m.meeting_type] || 'bg-muted-foreground')} />
                    ))}
                    {dayMeetings.length > 3 && (
                      <span className="text-[9px] font-semibold text-muted-foreground leading-none">+{dayMeetings.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );

            if (dayMeetings.length === 0) return cell;

            return (
              <Tooltip key={day.toISOString()}>
                <TooltipTrigger asChild>{cell}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  <p className="font-display font-medium text-xs mb-1">{format(day, "dd 'de' MMMM", { locale: ptBR })}</p>
                  {dayMeetings.map(m => (
                    <p key={m.id} className="text-xs text-muted-foreground">
                      • {m.title}{m.scheduled_time ? ` às ${m.scheduled_time.slice(0, 5)}` : ''}
                    </p>
                  ))}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};
