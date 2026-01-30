import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface ActionConfirmationProps {
  title: string;
  description?: string;
  variant: 'destructive' | 'success' | 'warning' | 'info';
  bulletPoints?: string[];
}

export function ActionConfirmation({ 
  title, 
  description, 
  variant, 
  bulletPoints 
}: ActionConfirmationProps) {
  const variants = {
    destructive: {
      icon: AlertTriangle,
      containerClass: 'bg-destructive/10 border-destructive/30',
      iconClass: 'text-destructive',
      textClass: 'text-destructive'
    },
    warning: {
      icon: AlertTriangle,
      containerClass: 'bg-amber-50 border-amber-200',
      iconClass: 'text-amber-600',
      textClass: 'text-amber-800'
    },
    success: {
      icon: CheckCircle2,
      containerClass: 'bg-cofound-green/10 border-cofound-green/30',
      iconClass: 'text-cofound-green',
      textClass: 'text-cofound-green'
    },
    info: {
      icon: Info,
      containerClass: 'bg-cofound-blue-light/10 border-cofound-blue-light/30',
      iconClass: 'text-cofound-blue-light',
      textClass: 'text-cofound-blue-dark'
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Alert className={`${config.containerClass}`}>
      <Icon className={`h-4 w-4 ${config.iconClass}`} />
      <AlertDescription className={`${config.textClass}`}>
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm mt-1">{description}</p>}
        {bulletPoints && bulletPoints.length > 0 && (
          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
            {bulletPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}