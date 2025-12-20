import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface ProgressSliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  onValueCommit?: (value: number) => void;
}

const getProgressColor = (value: number): string => {
  if (value >= 100) return 'bg-green-500';
  if (value >= 71) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getThumbBorderColor = (value: number): string => {
  if (value >= 100) return 'border-green-500';
  if (value >= 71) return 'border-yellow-500';
  return 'border-red-500';
};

const ProgressSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  ProgressSliderProps
>(({ className, value, defaultValue, onValueCommit, min = 0, max = 100, step = 1, disabled, ...props }, ref) => {
  const [localValue, setLocalValue] = React.useState<number>(
    value ?? defaultValue ?? 0
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: number[]) => {
    setLocalValue(newValue[0]);
  };

  const handleValueCommit = (newValue: number[]) => {
    onValueCommit?.(newValue[0]);
  };

  const progressColor = getProgressColor(localValue);
  const thumbColor = getThumbBorderColor(localValue);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center cursor-pointer",
        className
      )}
      value={[localValue]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={handleValueChange}
      onValueCommit={handleValueCommit}
    >
      <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range 
          className={cn("absolute h-full transition-colors duration-200", progressColor)} 
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-5 w-5 rounded-full border-2 bg-background shadow-md",
          "ring-offset-background transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "hover:scale-110 disabled:pointer-events-none",
          thumbColor
        )} 
      />
    </SliderPrimitive.Root>
  );
});

ProgressSlider.displayName = "ProgressSlider";

export { ProgressSlider };
