import { Target } from "lucide-react";

interface BrandBadgeProps {
  collapsed?: boolean;
}

export function BrandBadge({ collapsed = false }: BrandBadgeProps) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Target className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
        <Target className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">Strategy HUB</span>
        <span className="text-xs text-muted-foreground">Administração</span>
      </div>
    </div>
  );
}
