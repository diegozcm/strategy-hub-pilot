import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  BarChart3, 
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { KeyResult, KRMonthlyAction } from '@/types/strategic-map';
import { useKRActions } from '@/hooks/useKRActions';
import { ActionCard } from './ActionCard';
import { ActionFormModal } from './ActionFormModal';

interface KRActionsModalProps {
  open: boolean;
  onClose: () => void;
  keyResult: KeyResult;
}

export const KRActionsModal: React.FC<KRActionsModalProps> = ({
  open,
  onClose,
  keyResult,
}) => {
  const {
    actions,
    loading,
    createAction,
    updateAction,
    deleteAction,
    getActionsByMonth,
    getActionStats,
  } = useKRActions(keyResult.id);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingAction, setEditingAction] = useState<KRMonthlyAction | undefined>();

  // Estatísticas
  const stats = useMemo(() => getActionStats(), [actions]);

  // Filtrar ações
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const matchesYear = action.month_year.startsWith(selectedYear);
      const matchesMonth = selectedMonth === 'all' || action.month_year.endsWith(selectedMonth);
      const matchesSearch = action.action_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           action.action_description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter;
      
      return matchesYear && matchesMonth && matchesSearch && matchesStatus && matchesPriority;
    });
  }, [actions, selectedYear, selectedMonth, searchTerm, statusFilter, priorityFilter]);

  // Agrupar ações por mês
  const actionsByMonth = useMemo(() => {
    const groups: { [key: string]: KRMonthlyAction[] } = {};
    filteredActions.forEach(action => {
      if (!groups[action.month_year]) {
        groups[action.month_year] = [];
      }
      groups[action.month_year].push(action);
    });
    
    // Ordenar por mês/ano (mais recente primeiro)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .reduce((acc, [month, actions]) => {
        acc[month] = actions.sort((a, b) => {
          // Ordenar por prioridade (alta primeiro) e depois por data de criação
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        return acc;
      }, {} as { [key: string]: KRMonthlyAction[] });
  }, [filteredActions]);

  // Gerar opções de anos (últimos 3 anos + próximos 2 anos)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -3; i <= 2; i++) {
      years.push((currentYear + i).toString());
    }
    return years;
  }, []);

  // Gerar opções de meses
  const monthOptions = [
    { value: 'all', label: 'Todos os meses' },
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const handleCreateAction = () => {
    setEditingAction(undefined);
    setShowActionForm(true);
  };

  const handleEditAction = (action: KRMonthlyAction) => {
    setEditingAction(action);
    setShowActionForm(true);
  };

  const handleDeleteAction = async (actionId: string) => {
    if (confirm('Tem certeza que deseja deletar esta ação?')) {
      await deleteAction(actionId);
    }
  };

  const handleSaveAction = async (actionData: Omit<KRMonthlyAction, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (editingAction) {
      await updateAction(editingAction.id, actionData as any);
    } else {
      await createAction(actionData);
    }
    setShowActionForm(false);
    setEditingAction(undefined);
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ações do KR: {keyResult.title}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="actions" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="actions">📋 Ações</TabsTrigger>
              <TabsTrigger value="analytics">📊 Análises</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="flex-1 flex flex-col">
              {/* Filtros e Controles */}
              <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar ações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="planned">🎯 Planejada</SelectItem>
                    <SelectItem value="in_progress">🔄 Em Progresso</SelectItem>
                    <SelectItem value="completed">✅ Concluída</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelada</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="low">🟢 Baixa</SelectItem>
                    <SelectItem value="medium">🟡 Média</SelectItem>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleCreateAction} className="ml-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ação
                </Button>
              </div>

              {/* Lista de Ações */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Carregando ações...</div>
                  </div>
                ) : Object.keys(actionsByMonth).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma ação encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {filteredActions.length === 0 && actions.length > 0 
                        ? 'Tente ajustar os filtros para ver mais ações'
                        : 'Comece criando sua primeira ação para este KR'
                      }
                    </p>
                    <Button onClick={handleCreateAction}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Ação
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(actionsByMonth).map(([monthYear, monthActions]) => (
                      <div key={monthYear}>
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-medium text-lg">
                            📅 {formatMonthYear(monthYear)}
                          </h3>
                          <Badge variant="outline">
                            {monthActions.length} {monthActions.length === 1 ? 'ação' : 'ações'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {monthActions.map(action => (
                            <ActionCard
                              key={action.id}
                              action={action}
                              onEdit={handleEditAction}
                              onDelete={handleDeleteAction}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Total de Ações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Taxa de Conclusão
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.completionRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Progresso Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.avgCompletion.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Em Andamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.inProgress}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🎯 Planejadas</span>
                        <span className="font-medium">{stats.planned}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🔄 Em Progresso</span>
                        <span className="font-medium">{stats.inProgress}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">✅ Concluídas</span>
                        <span className="font-medium">{stats.completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">❌ Canceladas</span>
                        <span className="font-medium">{stats.cancelled}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Resumo do KR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Meta:</span>
                        <span className="font-medium">{keyResult.target_value} {keyResult.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Atual:</span>
                        <span className="font-medium">{keyResult.current_value} {keyResult.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Progresso:</span>
                        <span className="font-medium">
                          {((keyResult.current_value / keyResult.target_value) * 100).toFixed(1)}%
                        </span>
                      </div>
                      {keyResult.due_date && (
                        <div className="flex justify-between">
                          <span>Prazo:</span>
                          <span className="font-medium">
                            {new Date(keyResult.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ActionFormModal
        open={showActionForm}
        onClose={() => {
          setShowActionForm(false);
          setEditingAction(undefined);
        }}
        onSave={handleSaveAction}
        action={editingAction}
        keyResultId={keyResult.id}
        defaultMonth={selectedMonth !== 'all' ? `${selectedYear}-${selectedMonth}` : undefined}
      />
    </>
  );
};