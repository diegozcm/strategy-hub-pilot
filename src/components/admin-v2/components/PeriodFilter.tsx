import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { DateRange } from "react-day-picker";

type PeriodOption = "24h" | "7d" | "30d" | "custom";

interface PeriodFilterProps {
  value: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
}

const periodOptions: { id: PeriodOption; label: string }[] = [
  { id: "24h", label: "Últimas 24h" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "custom", label: "Personalizado" },
];

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [activePeriod, setActivePeriod] = useState<PeriodOption>("7d");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePeriodClick = (period: PeriodOption) => {
    setActivePeriod(period);
    const now = new Date();
    
    switch (period) {
      case "24h":
        onChange({ from: subDays(now, 1), to: now });
        break;
      case "7d":
        onChange({ from: subDays(now, 7), to: now });
        break;
      case "30d":
        onChange({ from: subMonths(now, 1), to: now });
        break;
      case "custom":
        setIsCalendarOpen(true);
        break;
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onChange({ 
        from: startOfDay(range.from), 
        to: endOfDay(range.to) 
      });
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {periodOptions.map((option) => (
        option.id === "custom" ? (
          <Popover key={option.id} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={activePeriod === option.id ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                {activePeriod === "custom" 
                  ? `${format(value.from, "dd/MM", { locale: ptBR })} - ${format(value.to, "dd/MM", { locale: ptBR })}`
                  : option.label
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: value.from, to: value.to }}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            key={option.id}
            variant={activePeriod === option.id ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodClick(option.id)}
          >
            {option.label}
          </Button>
        )
      ))}
    </div>
  );
}
