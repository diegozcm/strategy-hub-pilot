import { Target } from "lucide-react";

interface BrandBadgeProps {
  collapsed?: boolean;
}

export function BrandBadge({ collapsed = false }: BrandBadgeProps) {
  if (collapsed) {
    return (
      <div className="flex h-16 items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Target className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center gap-3 px-4">
      <div className="flex flex-col">
        <span className="text-base font-bold tracking-tight text-primary">Strategy HUB</span>
        <span className="text-xs text-muted-foreground">Administração</span>
      </div>
    </div>
  );
}
