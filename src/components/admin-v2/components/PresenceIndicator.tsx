import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  isOnline?: boolean;
  size?: "sm" | "default" | "lg";
  showPulse?: boolean;
}

const sizeStyles = {
  sm: "h-2 w-2",
  default: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

export function PresenceIndicator({ 
  isOnline = true, 
  size = "default",
  showPulse = true 
}: PresenceIndicatorProps) {
  return (
    <span className="relative flex">
      <span
        className={cn(
          "rounded-full",
          sizeStyles[size],
          isOnline ? "bg-green-500" : "bg-gray-400"
        )}
      />
      {isOnline && showPulse && (
        <span
          className={cn(
            "absolute inline-flex rounded-full bg-green-400 opacity-75 animate-ping",
            sizeStyles[size]
          )}
        />
      )}
    </span>
  );
}
