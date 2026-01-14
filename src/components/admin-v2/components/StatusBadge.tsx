import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType = "active" | "inactive" | "pending" | "success" | "warning" | "error" | "info";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "default";
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  inactive: {
    label: "Inativo",
    className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  },
  pending: {
    label: "Pendente",
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  success: {
    label: "Sucesso",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  warning: {
    label: "Atenção",
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  error: {
    label: "Erro",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  info: {
    label: "Info",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
};

export function StatusBadge({ status, label, size = "default" }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        size === "sm" && "text-xs px-1.5 py-0"
      )}
    >
      {label || config.label}
    </Badge>
  );
}
