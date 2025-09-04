import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { KeyResult } from '@/types/strategic-map';

interface KeyResultsTableProps {
  keyResults: KeyResult[];
  onEdit: (keyResult: KeyResult) => void;
  onDelete: (keyResult: KeyResult) => void;
  onUpdateMonthly: (keyResult: KeyResult) => void;
}

export function KeyResultsTable({ keyResults, onEdit, onDelete, onUpdateMonthly }: KeyResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not_started': { label: 'Não Iniciado', variant: 'secondary' as const },
      'in_progress': { label: 'Em Progresso', variant: 'default' as const },
      'completed': { label: 'Concluído', variant: 'outline' as const, className: 'border-green-500 text-green-700 bg-green-50' },
      'suspended': { label: 'Suspenso', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    const badgeProps = 'className' in config 
      ? { variant: config.variant, className: config.className }
      : { variant: config.variant };
    
    return <Badge {...badgeProps}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string = 'medium') => {
    const priorityConfig = {
      'low': { label: 'Baixa', variant: 'outline' as const },
      'medium': { label: 'Média', variant: 'secondary' as const },
      'high': { label: 'Alta', variant: 'default' as const },
      'critical': { label: 'Crítica', variant: 'destructive' as const }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const calculateProgress = (keyResult: KeyResult) => {
    if (!keyResult.yearly_target || keyResult.yearly_target === 0) return 0;
    return Math.min(100, Math.max(0, (keyResult.yearly_actual || 0) / keyResult.yearly_target * 100));
  };

  const formatValue = (value: number, unit: string = 'number') => {
    if (unit === 'currency') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    } else if (unit === 'percentage') {
      return `${value}%`;
    }
    return value.toString();
  };

  const getMonthlyData = (keyResult: KeyResult) => {
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    return months.map((month, index) => {
      const target = keyResult.monthly_targets?.[month] || 0;
      const actual = keyResult.monthly_actual?.[month] || 0;
      const achievement = target > 0 ? (actual / target) * 100 : 0;
      
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        target,
        actual,
        achievement
      };
    });
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Resultado-Chave</TableHead>
            <TableHead>Meta Anual</TableHead>
            <TableHead>Realizado Anual</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="w-32">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keyResults.map((keyResult) => {
            const progress = calculateProgress(keyResult);
            const isExpanded = expandedRows.has(keyResult.id);
            const monthlyData = getMonthlyData(keyResult);
            
            return (
              <Collapsible key={keyResult.id} open={isExpanded} onOpenChange={() => toggleRow(keyResult.id)}>
                <TableRow className="hover:bg-muted/50">
                  <TableCell>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{keyResult.title}</div>
                      {keyResult.description && (
                        <div className="text-sm text-muted-foreground mt-1">{keyResult.description}</div>
                      )}
                      {keyResult.category && (
                        <Badge variant="outline" className="mt-1">{keyResult.category}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatValue(keyResult.yearly_target || 0, keyResult.unit)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={progress >= 100 ? "font-medium text-green-600" : progress >= 70 ? "font-medium text-yellow-600" : "font-medium text-red-600"}>
                        {formatValue(keyResult.yearly_actual || 0, keyResult.unit)}
                      </span>
                      {progress >= 100 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={progress} className="w-20" />
                      <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(keyResult.status)}</TableCell>
                  <TableCell>{getPriorityBadge(keyResult.priority)}</TableCell>
                  <TableCell>
                    <span className="text-sm">{keyResult.responsible || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateMonthly(keyResult)}
                        title="Atualizar Valores Mensais"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(keyResult)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(keyResult)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <CollapsibleContent asChild>
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <div className="bg-muted/30 p-4 border-t">
                        <h4 className="font-medium mb-3">Detalhes Mensais</h4>
                        <div className="grid grid-cols-6 gap-4">
                          {monthlyData.map((data, index) => (
                            <div key={index} className="bg-background p-3 rounded border">
                              <div className="font-medium text-sm">{data.month}</div>
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Meta:</span>
                                  <span className="font-medium">{formatValue(data.target, keyResult.unit)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span>Real:</span>
                                  <span className="font-medium">{formatValue(data.actual, keyResult.unit)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span>%:</span>
                                  <span className={`font-medium ${data.achievement >= 100 ? 'text-green-600' : data.achievement >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {Math.round(data.achievement)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </TableBody>
      </Table>

      {keyResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum resultado-chave encontrado.</p>
          <p className="text-sm">Clique em "Criar Resultado-Chave" para começar.</p>
        </div>
      )}
    </div>
  );
}