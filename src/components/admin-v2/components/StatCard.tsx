import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  isLoading?: boolean;
}

const variantStyles = {
  default: "bg-cofound-blue-dark/10 text-cofound-blue-dark",
  success: "bg-cofound-green/20 text-cofound-green",
  warning: "bg-yellow-500/10 text-yellow-600",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-cofound-blue-light/10 text-cofound-blue-light",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  isLoading = false,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}% vs. período anterior
              </p>
            )}
          </div>
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            variantStyles[variant]
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
