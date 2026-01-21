import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Bot } from "lucide-react";

interface CompanyHeaderProps {
  company: {
    id: string;
    name: string;
    logo_url?: string | null;
    status?: string | null;
    company_type?: string | null;
    ai_enabled?: boolean;
  };
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-14 w-14">
        <AvatarImage src={company.logo_url || undefined} alt={company.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-lg">
          {company.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold truncate">{company.name}</h3>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
            {company.status === 'active' ? 'Ativa' : 'Inativa'}
          </Badge>
          <Badge variant="outline">
            <Building2 className="h-3 w-3 mr-1" />
            {company.company_type === 'startup' ? 'Startup' : 'Regular'}
          </Badge>
          {company.ai_enabled && (
            <Badge variant="outline" className="border-violet-500 text-violet-600">
              <Bot className="h-3 w-3 mr-1" />
              AI
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
