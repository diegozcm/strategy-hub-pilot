import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KRFCA, KRMonthlyAction } from '@/types/strategic-map';

interface KRFCACardProps {
  fca: KRFCA;
  onView: (fca: KRFCA) => void;
  onEdit: (fca: KRFCA) => void;
  onDelete: (fcaId: string) => void;
}

export const KRFCACard: React.FC<KRFCACardProps> = ({
  fca,
  onView,
  onEdit,
  onDelete,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'border-green-200 bg-green-50';
      case 'cancelled':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      default:
        return '🟢';
    }
  };

  // Calcular estatísticas das ações do FCA
  const actions = fca.actions || [];
  const totalActions = actions.length;
  const completedActions = actions.filter(a => a.status === 'completed').length;
  const completionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
  const averageProgress = totalActions > 0 
    ? actions.reduce((sum, action) => sum + action.completion_percentage, 0) / totalActions 
    : 0;

  // Preview das primeiras 3 ações
  const previewActions = actions.slice(0, 3);

  return (
    <Card className={`transition-all hover:shadow-md ${getStatusColor(fca.status)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(fca.status)}
              <CardTitle className="text-base leading-tight">
                {fca.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-0 h-5 ${getPriorityColor(fca.priority)}`}
              >
                {getPriorityIcon(fca.priority)} {fca.priority === 'high' ? 'Alta' :
                 fca.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                {totalActions} {totalActions === 1 ? 'ação' : 'ações'}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(fca)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(fca)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(fca.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Resumo do Fato e Causa */}
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Fato:</span>
            <p className="line-clamp-2 text-foreground">{fca.fact}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Causa:</span>
            <p className="line-clamp-2 text-foreground">{fca.cause}</p>
          </div>
        </div>

        {/* Progresso das Ações */}
        {totalActions > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso das Ações</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{completedActions}/{totalActions}</span>
                <span className="text-muted-foreground">({completionRate.toFixed(0)}%)</span>
              </div>
            </div>
            <Progress value={averageProgress} className="h-2" />
          </div>
        )}

        {/* Preview das Ações */}
        {previewActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Ações:</h4>
            <div className="space-y-1">
              {previewActions.map((action) => (
                <div key={action.id} className="flex items-center gap-2 text-xs">
                  <div className="flex-shrink-0">
                    {action.status === 'completed' ? '✅' : 
                     action.status === 'in_progress' ? '🔄' : 
                     action.status === 'cancelled' ? '❌' : '🎯'}
                  </div>
                  <span className="flex-1 line-clamp-1">{action.action_title}</span>
                  <span className="text-muted-foreground">{action.completion_percentage}%</span>
                </div>
              ))}
              {totalActions > 3 && (
                <div className="text-xs text-muted-foreground text-center pt-1">
                  +{totalActions - 3} mais {totalActions - 3 === 1 ? 'ação' : 'ações'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalActions === 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">Nenhuma ação vinculada</p>
          </div>
        )}

        {/* Ação Principal */}
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onView(fca)}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};