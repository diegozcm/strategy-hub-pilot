import React, { useState } from 'react';
import { Plus, MoreVertical, Eye, Edit, Trash2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { useObjectivesData } from '@/hooks/useObjectivesData';
import { EditPlanModal } from '@/components/objectives/EditPlanModal';
import { DeletePlanModal } from '@/components/objectives/DeletePlanModal';
import { PlanDetailModal } from '@/components/objectives/PlanDetailModal';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
  period_start: string;
  period_end: string;
  vision?: string;
  mission?: string;
  company_id: string;
  created_at: string;
}

export const StrategicPlansManagement: React.FC = () => {
  const { user, company } = useAuth();
  const { toast } = useToast();
  const { plans, objectives, setPlans, invalidateAndReload } = useObjectivesData();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Plan management states
  const [selectedPlanForDetail, setSelectedPlanForDetail] = useState<StrategicPlan | null>(null);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<StrategicPlan | null>(null);
  const [selectedPlanForDelete, setSelectedPlanForDelete] = useState<StrategicPlan | null>(null);
  const [selectedPlanForActivate, setSelectedPlanForActivate] = useState<StrategicPlan | null>(null);
  const [isPlanDetailOpen, setIsPlanDetailOpen] = useState(false);
  const [isPlanEditOpen, setIsPlanEditOpen] = useState(false);
  const [isPlanDeleteOpen, setIsPlanDeleteOpen] = useState(false);
  const [isPlanActivateConfirmOpen, setIsPlanActivateConfirmOpen] = useState(false);
  
  // Form state
  const [planForm, setPlanForm] = useState({
    name: '',
    vision: '',
    mission: '',
    period_start: '',
    period_end: ''
  });

  const createPlan = async () => {
    if (!user || !company || !planForm.name || !planForm.period_start || !planForm.period_end) {
      toast({
        title: "Erro",
        description: !company 
          ? "Nenhuma empresa selecionada. Selecione uma empresa no menu superior."
          : "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('strategic_plans')
        .insert([{
          ...planForm,
          company_id: company.id,
          status: 'inactive'
        }])
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => [data, ...prev]);
      setPlanForm({ name: '', vision: '', mission: '', period_start: '', period_end: '' });
      setIsCreateOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Plano estratégico criado como inativo. Ative-o para começar a usar.",
      });

      await invalidateAndReload();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano estratégico. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activatePlan = async () => {
    if (!selectedPlanForActivate || !company || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Desativar todos os planos da empresa
      await supabase
        .from('strategic_plans')
        .update({ status: 'inactive' })
        .eq('company_id', company.id);
      
      // 2. Ativar apenas o plano selecionado
      const { error } = await supabase
        .from('strategic_plans')
        .update({ status: 'active' })
        .eq('id', selectedPlanForActivate.id);
      
      if (error) throw error;
      
      toast({ 
        title: "Sucesso", 
        description: "Plano ativado com sucesso! Agora os OEs e KRs deste plano serão exibidos." 
      });
      
      setIsPlanActivateConfirmOpen(false);
      setSelectedPlanForActivate(null);
      await invalidateAndReload();
    } catch (error) {
      console.error('Error activating plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao ativar plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanDeactivate = async (plan: StrategicPlan) => {
    if (!company || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('strategic_plans')
        .update({ status: 'inactive' })
        .eq('id', plan.id);
      
      if (error) throw error;
      
      toast({ 
        title: "Plano inativado", 
        description: "O plano foi inativado. Nenhum plano está ativo agora." 
      });
      
      await invalidateAndReload();
    } catch (error) {
      console.error('Error deactivating plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao inativar plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePlan = async (planId: string, updates: Partial<StrategicPlan>) => {
    try {
      const { data, error } = await supabase
        .from('strategic_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(plan => plan.id === planId ? data : plan));
      
      toast({
        title: "Sucesso",
        description: "Plano estratégico atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano estratégico. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('strategic_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      setPlans(prev => prev.filter(plan => plan.id !== planId));
      
      toast({
        title: "Sucesso",
        description: "Plano estratégico excluído com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano estratégico. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handlePlanView = (plan: StrategicPlan) => {
    setSelectedPlanForDetail(plan);
    setIsPlanDetailOpen(true);
  };

  const handlePlanEdit = (plan: StrategicPlan) => {
    setSelectedPlanForEdit(plan);
    setIsPlanEditOpen(true);
  };

  const handlePlanDelete = (plan: StrategicPlan) => {
    setSelectedPlanForDelete(plan);
    setIsPlanDeleteOpen(true);
  };

  const handlePlanActivate = (plan: StrategicPlan) => {
    setSelectedPlanForActivate(plan);
    setIsPlanActivateConfirmOpen(true);
  };

  const getObjectivesCountForPlan = (planId: string) => {
    return objectives.filter(obj => obj.plan_id === planId).length;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planos Estratégicos</CardTitle>
              <CardDescription>
                Gerencie os planos estratégicos da empresa
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Plano
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Plano Estratégico</DialogTitle>
                  <DialogDescription>
                    Crie um novo plano estratégico para organizar seus objetivos
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan-name">Nome do Plano</Label>
                    <Input
                      id="plan-name"
                      value={planForm.name}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Plano Estratégico 2024-2026"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="period-start">Data de Início</Label>
                      <Input
                        id="period-start"
                        type="date"
                        value={planForm.period_start}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, period_start: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="period-end">Data de Fim</Label>
                      <Input
                        id="period-end"
                        type="date"
                        value={planForm.period_end}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, period_end: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plan-vision">Visão (Opcional)</Label>
                    <Textarea
                      id="plan-vision"
                      value={planForm.vision}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, vision: e.target.value }))}
                      placeholder="Descreva a visão da empresa para este período"
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plan-mission">Missão (Opcional)</Label>
                    <Textarea
                      id="plan-mission"
                      value={planForm.mission}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, mission: e.target.value }))}
                      placeholder="Descreva a missão da empresa"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createPlan} disabled={isSubmitting}>
                    Criar Plano
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum plano estratégico criado ainda. Clique em "Novo Plano" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Objetivos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => {
                  const objectivesCount = getObjectivesCountForPlan(plan.id);
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        {format(parseISO(plan.period_start), 'MMM yyyy', { locale: ptBR })} - {format(parseISO(plan.period_end), 'MMM yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{objectivesCount}</TableCell>
                      <TableCell>
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePlanView(plan)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePlanEdit(plan)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {plan.status === 'active' ? (
                              <DropdownMenuItem onClick={() => handlePlanDeactivate(plan)}>
                                <Pause className="mr-2 h-4 w-4" />
                                Inativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handlePlanActivate(plan)}>
                                <Play className="mr-2 h-4 w-4" />
                                Ativar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handlePlanDelete(plan)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <PlanDetailModal
        plan={selectedPlanForDetail}
        isOpen={isPlanDetailOpen}
        onClose={() => {
          setIsPlanDetailOpen(false);
          setSelectedPlanForDetail(null);
        }}
        objectivesCount={selectedPlanForDetail ? getObjectivesCountForPlan(selectedPlanForDetail.id) : 0}
      />

      <EditPlanModal
        plan={selectedPlanForEdit}
        isOpen={isPlanEditOpen}
        onClose={() => {
          setIsPlanEditOpen(false);
          setSelectedPlanForEdit(null);
        }}
        onUpdate={updatePlan}
      />

      <DeletePlanModal
        plan={selectedPlanForDelete}
        isOpen={isPlanDeleteOpen}
        onClose={() => {
          setIsPlanDeleteOpen(false);
          setSelectedPlanForDelete(null);
        }}
        onDelete={deletePlan}
        objectivesCount={selectedPlanForDelete ? getObjectivesCountForPlan(selectedPlanForDelete.id) : 0}
      />

      <AlertDialog open={isPlanActivateConfirmOpen} onOpenChange={setIsPlanActivateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar Plano Estratégico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja ativar o plano "{selectedPlanForActivate?.name}"?
              <br /><br />
              <strong>Importante:</strong> Apenas um plano pode estar ativo por vez. 
              Todos os outros planos serão automaticamente inativados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsPlanActivateConfirmOpen(false);
              setSelectedPlanForActivate(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={activatePlan} disabled={isSubmitting}>
              Ativar Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
