import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users } from "lucide-react";
import { OKRPillar } from "@/types/okr";
import { useOKRPermissions } from "@/hooks/useOKRPermissions";

interface OKRPillarCardProps {
  pillar: OKRPillar;
  onEdit: (pillar: OKRPillar) => void;
  onDelete: (pillarId: string) => void;
}

export function OKRPillarCard({ pillar, onEdit, onDelete }: OKRPillarCardProps) {
  const permissions = useOKRPermissions();
  const canUpdate = permissions.canUpdatePillar ? permissions.canUpdatePillar(pillar.id) : false;
  const canDelete = permissions.canDeletePillar ? permissions.canDeletePillar(pillar.id) : false;

  const getSponsorName = () => {
    if (!pillar.sponsor) return "Não atribuído";
    return `${pillar.sponsor.first_name} ${pillar.sponsor.last_name}`;
  };

  const objectiveCount = pillar.objectives?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {pillar.icon && <span className="text-2xl">{pillar.icon}</span>}
              <h3 className="font-semibold text-lg">{pillar.name}</h3>
            </div>
            {pillar.description && (
              <p className="text-sm text-muted-foreground mt-1">{pillar.description}</p>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(pillar)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(pillar.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Sponsor Geral:</span>
          <span className="font-medium">{getSponsorName()}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {objectiveCount} {objectiveCount === 1 ? "Objetivo" : "Objetivos"}
          </Badge>
          {pillar.color && (
            <div 
              className="w-4 h-4 rounded-full border" 
              style={{ backgroundColor: pillar.color }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
