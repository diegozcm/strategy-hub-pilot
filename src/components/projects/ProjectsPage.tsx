import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FolderOpen, Calendar, DollarSign, Users, Clock, BarChart3, CheckCircle, Circle, AlertCircle, Pause, Edit3, Save, ChevronLeft, ChevronRight, Trash2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
}

interface StrategicObjective {
  id: string;
  title: string;
  pillar_id: string;
  strategic_pillars?: {
    name: string;
    color: string;
  };
}

interface StrategicProject {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  priority: string;
  start_date: string;
  end_date: string;
  budget: number;
  plan_id: string;
  owner_id: string;
  created_at: string;
  objective_ids?: string[];
}

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  project_id: string;
  assignee_id: string;
}

export const ProjectsPage: React.FC = () => {
  const { user, company: authCompany } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<StrategicProject[]>([]);
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<StrategicProject | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingObjectives, setLoadingObjectives] = useState(false);
  const [isObjectivesModalOpen, setIsObjectivesModalOpen] = useState(false);
  const [currentProjectForObjectives, setCurrentProjectForObjectives] = useState<string | null>(null);
  const [tempSelectedObjectives, setTempSelectedObjectives] = useState<string[]>([]);

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    plan_id: '',
    start_date: '',
    end_date: '',
    budget: '',
    priority: 'medium'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    project_id: '',
    due_date: '',
    priority: 'medium',
    estimated_hours: ''
  });

  const [editProjectForm, setEditProjectForm] = useState({
    name: '',
    description: '',
    plan_id: '',
    start_date: '',
    end_date: '',
    budget: '',
    priority: 'medium',
    status: 'planning'
  });

  useEffect(() => {
    loadData();
  }, []);

  // React to company changes
  useEffect(() => {
    if (user && authCompany) {
      loadData();
    }
  }, [authCompany?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!user || !authCompany) {
        setPlans([]);
        setProjects([]);
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // Load strategic plans
      const { data: plansData, error: plansError } = await supabase
        .from('strategic_plans')
        .select('id, name, status')
        .eq('company_id', authCompany.id)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Load projects - filter by company_id
      const { data: projectsData, error: projectsError } = await supabase
        .from('strategic_projects')
        .select('*')
        .eq('company_id', authCompany.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      
      // Load objective IDs for each project
      if (projectsData && projectsData.length > 0) {
        const projectsWithObjectives = await Promise.all(
          projectsData.map(async (project) => {
            const { data: relations } = await supabase
              .from('project_objective_relations')
              .select('objective_id')
              .eq('project_id', project.id);
            
            return {
              ...project,
              objective_ids: relations?.map(r => r.objective_id) || []
            };
          })
        );
        setProjects(projectsWithObjectives);
      } else {
        setProjects([]);
      }

      // Load tasks - filter by projects from this company
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(project => project.id);
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_tasks')
          .select('*')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
      } else {
        setTasks([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadObjectives = async (planId: string) => {
    if (!planId) {
      setObjectives([]);
      return;
    }

    try {
      setLoadingObjectives(true);
      const { data, error } = await supabase
        .from('strategic_objectives')
        .select(`
          id,
          title,
          pillar_id,
          strategic_pillars (
            name,
            color
          )
        `)
        .eq('plan_id', planId)
        .order('title');

      if (error) throw error;
      setObjectives(data || []);
    } catch (error) {
      console.error('Error loading objectives:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar objetivos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingObjectives(false);
    }
  };

  const createProject = async () => {
    if (!user || !authCompany || !projectForm.name || !projectForm.plan_id) {
      toast({
        title: "Erro",
        description: !authCompany 
          ? "Nenhuma empresa selecionada. Selecione uma empresa no menu superior."
          : "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Criar projeto
      const { data: project, error: projectError } = await supabase
        .from('strategic_projects')
        .insert([{
          ...projectForm,
          start_date: projectForm.start_date || null,
          end_date: projectForm.end_date || null,
          budget: projectForm.budget ? parseFloat(projectForm.budget) : null,
          company_id: authCompany.id,
          owner_id: user.id,
          status: 'planning'
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Criar relações com objetivos
      if (selectedObjectives.length > 0) {
        const relations = selectedObjectives.map(objId => ({
          project_id: project.id,
          objective_id: objId
        }));

        const { error: relError } = await supabase
          .from('project_objective_relations')
          .insert(relations);

        if (relError) throw relError;
      }

      // 3. Atualizar estado e resetar formulário
      setProjects(prev => [{ ...project, objective_ids: selectedObjectives }, ...prev]);
      setProjectForm({ name: '', description: '', plan_id: '', start_date: '', end_date: '', budget: '', priority: 'medium' });
      setSelectedObjectives([]);
      setObjectives([]);
      setIsCreateProjectOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Projeto estratégico criado com sucesso!",
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar projeto estratégico. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const groupObjectivesByPillar = (objectives: StrategicObjective[]) => {
    return objectives.reduce((acc, obj) => {
      const pillarName = obj.strategic_pillars?.name || 'Sem Pilar';
      if (!acc[pillarName]) acc[pillarName] = [];
      acc[pillarName].push(obj);
      return acc;
    }, {} as Record<string, StrategicObjective[]>);
  };

  const toggleObjectiveSelection = (objectiveId: string) => {
    setTempSelectedObjectives(prev => 
      prev.includes(objectiveId)
        ? prev.filter(id => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const openObjectivesModal = (projectId?: string) => {
    if (projectId) {
      // Editing existing project
      const project = projects.find(p => p.id === projectId);
      setTempSelectedObjectives(project?.objective_ids || []);
      setCurrentProjectForObjectives(projectId);
    } else {
      // Creating new project
      setTempSelectedObjectives(selectedObjectives);
      setCurrentProjectForObjectives(null);
    }
    setIsObjectivesModalOpen(true);
  };

  const saveObjectivesSelection = async () => {
    if (currentProjectForObjectives) {
      // Update existing project objectives
      try {
        // Remove old relations
        await supabase
          .from('project_objective_relations')
          .delete()
          .eq('project_id', currentProjectForObjectives);

        // Add new relations
        if (tempSelectedObjectives.length > 0) {
          const relations = tempSelectedObjectives.map(objId => ({
            project_id: currentProjectForObjectives,
            objective_id: objId
          }));

          const { error } = await supabase
            .from('project_objective_relations')
            .insert(relations);

          if (error) throw error;
        }

        // Update local state
        setProjects(prev => prev.map(p => 
          p.id === currentProjectForObjectives 
            ? { ...p, objective_ids: tempSelectedObjectives }
            : p
        ));

        toast({
          title: "Sucesso",
          description: "Objetivos atualizados com sucesso!",
        });
      } catch (error) {
        console.error('Error updating objectives:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar objetivos. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      // Creating new project - just update selection
      setSelectedObjectives(tempSelectedObjectives);
    }
    
    setIsObjectivesModalOpen(false);
    setCurrentProjectForObjectives(null);
  };

  const resetProjectForm = () => {
    setProjectForm({ name: '', description: '', plan_id: '', start_date: '', end_date: '', budget: '', priority: 'medium' });
    setSelectedObjectives([]);
    setObjectives([]);
  };

  const createTask = async () => {
    if (!user || !taskForm.title || !taskForm.project_id) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert([{
          ...taskForm,
          estimated_hours: taskForm.estimated_hours ? parseInt(taskForm.estimated_hours) : null,
          assignee_id: user.id,
          status: 'todo'
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data, ...prev]);
      setTaskForm({ title: '', description: '', project_id: '', due_date: '', priority: 'medium', estimated_hours: '' });
      setIsCreateTaskOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso!",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      toast({
        title: "Sucesso",
        description: "Status da tarefa atualizado!",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa.",
        variant: "destructive",
      });
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = ['todo', 'in_progress', 'review', 'done'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  const getPreviousStatus = (currentStatus: string) => {
    const statusFlow = ['todo', 'in_progress', 'review', 'done'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
  };

  const handleStatusChange = (taskId: string, newStatus: string, event: React.MouseEvent) => {
    event.stopPropagation();
    updateTaskStatus(taskId, newStatus);
  };

  const openProjectDetail = (project: StrategicProject) => {
    setSelectedProjectForDetail(project);
    setEditProjectForm({
      name: project.name,
      description: project.description || '',
      plan_id: project.plan_id || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget?.toString() || '',
      priority: project.priority || 'medium',
      status: project.status
    });
    setEditingProject(false);
    setIsProjectDetailOpen(true);
  };

  const updateProject = async () => {
    if (!selectedProjectForDetail) return;

    try {
      const { error } = await supabase
        .from('strategic_projects')
        .update({
          name: editProjectForm.name,
          description: editProjectForm.description,
          plan_id: editProjectForm.plan_id,
          start_date: editProjectForm.start_date || null,
          end_date: editProjectForm.end_date || null,
          budget: editProjectForm.budget ? parseFloat(editProjectForm.budget) : null,
          priority: editProjectForm.priority,
          status: editProjectForm.status
        })
        .eq('id', selectedProjectForDetail.id);

      if (error) throw error;

      // Update local state
      setProjects(prev => prev.map(project => 
        project.id === selectedProjectForDetail.id 
          ? { 
              ...project, 
              ...editProjectForm,
              budget: editProjectForm.budget ? parseFloat(editProjectForm.budget) : project.budget
            }
          : project
      ));

      setEditingProject(false);
      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar projeto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    // Confirmar com o usuário
    const confirmed = window.confirm(`Tem certeza que deseja deletar o projeto "${projectName}"? Esta ação não pode ser desfeita.`);
    
    if (!confirmed) return;

    try {
      // Primeiro, deletar todas as tarefas relacionadas ao projeto
      const { error: tasksError } = await supabase
        .from('project_tasks')
        .delete()
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      // Depois, deletar o projeto
      const { error: projectError } = await supabase
        .from('strategic_projects')
        .delete()
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Atualizar o estado local
      setProjects(prev => prev.filter(project => project.id !== projectId));
      setTasks(prev => prev.filter(task => task.project_id !== projectId));

      toast({
        title: "Sucesso",
        description: "Projeto deletado com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar projeto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'active': return 'Ativo';
      case 'on_hold': return 'Em Pausa';
      case 'cancelled': return 'Cancelado';
      default: return 'Planejamento';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Crítica';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      default: return 'Baixa';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Circle className="w-4 h-4 text-blue-500" />;
      case 'review': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPlan = selectedPlan === 'all' || project.plan_id === selectedPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.project_id === projectId);
  };

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo' && (selectedProject === 'all' ? true : t.project_id === selectedProject)),
    in_progress: tasks.filter(t => t.status === 'in_progress' && (selectedProject === 'all' ? true : t.project_id === selectedProject)),
    review: tasks.filter(t => t.status === 'review' && (selectedProject === 'all' ? true : t.project_id === selectedProject)),
    done: tasks.filter(t => t.status === 'done' && (selectedProject === 'all' ? true : t.project_id === selectedProject))
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projetos Estratégicos</h1>
            <p className="text-muted-foreground mt-2">Gerencie seus projetos e tarefas estratégicas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Block access if no company is associated
  if (!authCompany) {
    return <NoCompanyMessage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projetos Estratégicos</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus projetos e tarefas estratégicas</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Tarefa</DialogTitle>
                <DialogDescription>
                  Adicione uma nova tarefa a um projeto estratégico.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task-project">Projeto</Label>
                  <Select 
                    value={taskForm.project_id} 
                    onValueChange={(value) => setTaskForm(prev => ({ ...prev, project_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="task-title">Título da Tarefa</Label>
                  <Input
                    id="task-title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Implementar nova funcionalidade"
                  />
                </div>
                <div>
                  <Label htmlFor="task-description">Descrição</Label>
                  <Textarea
                    id="task-description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva a tarefa em detalhes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task-priority">Prioridade</Label>
                    <Select 
                      value={taskForm.priority} 
                      onValueChange={(value) => setTaskForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="task-hours">Horas Estimadas</Label>
                    <Input
                      id="task-hours"
                      type="number"
                      value={taskForm.estimated_hours}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                      placeholder="8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="task-due-date">Data de Vencimento</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createTask}>
                    Criar Tarefa
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateProjectOpen} onOpenChange={(open) => {
            setIsCreateProjectOpen(open);
            if (!open) resetProjectForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Projeto Estratégico</DialogTitle>
                <DialogDescription>
                  Defina um novo projeto para executar sua estratégia.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-plan">
                    Plano Estratégico <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={projectForm.plan_id} 
                    onValueChange={(value) => {
                      setProjectForm(prev => ({ ...prev, plan_id: value }));
                      loadObjectives(value);
                      setSelectedObjectives([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Objectives Selection Button */}
                {projectForm.plan_id && (
                  <div>
                    <Label>Objetivos Associados (opcional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Adicione objetivos estratégicos relacionados a este projeto
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          loadObjectives(projectForm.plan_id);
                          openObjectivesModal();
                        }}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {selectedObjectives.length > 0 ? 'Editar Objetivos' : 'Adicionar Objetivos'}
                      </Button>
                      {selectedObjectives.length > 0 && (
                        <Badge variant="secondary">
                          {selectedObjectives.length} objetivo(s) selecionado(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="project-name">
                    Nome do Projeto <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="project-name"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Transformação Digital"
                  />
                </div>
                <div>
                  <Label htmlFor="project-description">Descrição</Label>
                  <Textarea
                    id="project-description"
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o projeto em detalhes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project-start-date">Data de Início</Label>
                    <Input
                      id="project-start-date"
                      type="date"
                      value={projectForm.start_date}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-end-date">Data de Término</Label>
                    <Input
                      id="project-end-date"
                      type="date"
                      value={projectForm.end_date}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project-budget">Orçamento (R$)</Label>
                    <Input
                      id="project-budget"
                      type="number"
                      step="0.01"
                      value={projectForm.budget}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="100000.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-priority">Prioridade</Label>
                    <Select 
                      value={projectForm.priority} 
                      onValueChange={(value) => setProjectForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createProject}>
                    Criar Projeto
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Project Detail/Edit Modal */}
          <Dialog open={isProjectDetailOpen} onOpenChange={setIsProjectDetailOpen}>
        <DialogContent className="sm:max-w-2xl p-0">
              <div className="max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header colorido com pilar */}
                {selectedProjectForDetail && (() => {
                  // Buscar o primeiro objetivo com pilar
                  const firstObjective = selectedProjectForDetail.objective_ids
                    ?.map(objId => objectives.find(o => o.id === objId))
                    .find(obj => obj?.strategic_pillars);
                  
                  const pillarColor = firstObjective?.strategic_pillars?.color || '#6366f1';
                  const pillarName = firstObjective?.strategic_pillars?.name;

                  return (
                    <div 
                      style={{ backgroundColor: pillarColor }}
                      className="p-3 rounded-t-lg flex-shrink-0"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h2 className="text-white font-semibold text-xl leading-tight">
                            {selectedProjectForDetail.name}
                          </h2>
                          {pillarName && (
                            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                              {pillarName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 pr-8">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProject(!editingProject)}
                            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              deleteProject(selectedProjectForDetail.id, selectedProjectForDetail.name);
                              setIsProjectDetailOpen(false);
                            }}
                            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Conteúdo com scroll */}
                <div className="overflow-y-auto flex-1 p-6">
              {selectedProjectForDetail && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-project-name">Nome do Projeto</Label>
                      {editingProject ? (
                        <Input
                          id="edit-project-name"
                          value={editProjectForm.name}
                          onChange={(e) => setEditProjectForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-foreground">{selectedProjectForDetail.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="edit-project-description">Descrição</Label>
                      {editingProject ? (
                        <Textarea
                          id="edit-project-description"
                          value={editProjectForm.description}
                          onChange={(e) => setEditProjectForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-foreground">{selectedProjectForDetail.description || 'Sem descrição'}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-project-plan">Plano Estratégico</Label>
                        {editingProject ? (
                          <Select 
                            value={editProjectForm.plan_id} 
                            onValueChange={(value) => setEditProjectForm(prev => ({ ...prev, plan_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="mt-1 text-sm text-foreground">
                            {plans.find(p => p.id === selectedProjectForDetail.plan_id)?.name || 'Sem plano'}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="edit-project-status">Status</Label>
                        {editingProject ? (
                          <Select 
                            value={editProjectForm.status} 
                            onValueChange={(value) => setEditProjectForm(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planning">Planejamento</SelectItem>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="on_hold">Em Pausa</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1">
                            <Badge className={`${getStatusColor(selectedProjectForDetail.status)} text-white`}>
                              {getStatusText(selectedProjectForDetail.status)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-project-priority">Prioridade</Label>
                        {editingProject ? (
                          <Select 
                            value={editProjectForm.priority} 
                            onValueChange={(value) => setEditProjectForm(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="critical">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1">
                            <Badge className={`${getPriorityColor(selectedProjectForDetail.priority || 'medium')} text-white`}>
                              {getPriorityText(selectedProjectForDetail.priority || 'medium')}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="edit-project-budget">Orçamento (R$)</Label>
                        {editingProject ? (
                          <Input
                            id="edit-project-budget"
                            type="number"
                            step="0.01"
                            value={editProjectForm.budget}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                          />
                        ) : (
                          <p className="mt-1 text-sm text-foreground">
                            {selectedProjectForDetail.budget 
                              ? `R$ ${selectedProjectForDetail.budget.toLocaleString('pt-BR')}`
                              : 'Não definido'
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-project-start-date">Data de Início</Label>
                        {editingProject ? (
                          <Input
                            id="edit-project-start-date"
                            type="date"
                            value={editProjectForm.start_date}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                          />
                        ) : (
                          <p className="mt-1 text-sm text-foreground">
                            {selectedProjectForDetail.start_date 
                              ? new Date(selectedProjectForDetail.start_date).toLocaleDateString('pt-BR')
                              : 'Não definida'
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="edit-project-end-date">Data de Término</Label>
                        {editingProject ? (
                          <Input
                            id="edit-project-end-date"
                            type="date"
                            value={editProjectForm.end_date}
                            onChange={(e) => setEditProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                          />
                        ) : (
                          <p className="mt-1 text-sm text-foreground">
                            {selectedProjectForDetail.end_date 
                              ? new Date(selectedProjectForDetail.end_date).toLocaleDateString('pt-BR')
                              : 'Não definida'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Objectives Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-foreground">Objetivos Estratégicos</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedProjectForDetail?.plan_id) {
                            loadObjectives(selectedProjectForDetail.plan_id);
                            openObjectivesModal(selectedProjectForDetail.id);
                          }
                        }}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Gerenciar Objetivos
                      </Button>
                    </div>
                    {selectedProjectForDetail?.objective_ids && selectedProjectForDetail.objective_ids.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProjectForDetail.objective_ids.map((objId) => {
                          const objective = objectives.find(o => o.id === objId);
                          if (!objective) return null;
                          return (
                            <div key={objId} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{objective.title}</span>
                              {objective.strategic_pillars && (
                                <Badge variant="outline" className="text-xs">
                                  {objective.strategic_pillars.name}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum objetivo associado a este projeto.</p>
                    )}
                  </div>

                  {/* Project Tasks Summary */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-foreground mb-4">Tarefas do Projeto</h3>
                    <div className="space-y-4">
                      {getProjectTasks(selectedProjectForDetail.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada para este projeto.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {getProjectTasks(selectedProjectForDetail.id).map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {getTaskStatusIcon(task.status)}
                                  <span className="text-sm font-medium">{task.title}</span>
                                  <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white border-0 text-xs`}>
                                    {getPriorityText(task.priority)}
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-1 ml-6">{task.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                {task.estimated_hours && (
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {task.estimated_hours}h
                                  </div>
                                )}
                                {task.due_date && (
                                  <div className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {editingProject && (
                    <div className="flex justify-end space-x-2 border-t pt-6">
                      <Button variant="outline" onClick={() => setEditingProject(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={updateProject}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </Button>
                    </div>
                  )}
                </div>
              )}
              </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Objectives Selection Modal */}
          <Dialog open={isObjectivesModalOpen} onOpenChange={setIsObjectivesModalOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Selecionar Objetivos Estratégicos</DialogTitle>
                <DialogDescription>
                  Escolha os objetivos estratégicos relacionados a este projeto
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {loadingObjectives ? (
                  <div className="text-sm text-muted-foreground">Carregando objetivos...</div>
                ) : objectives.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum objetivo encontrado para este plano.</div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupObjectivesByPillar(objectives)).map(([pillarName, pillarObjectives]) => (
                      <div key={pillarName} className="space-y-3">
                        <div className="text-sm font-semibold text-foreground border-b pb-2">{pillarName}</div>
                        <div className="space-y-2">
                          {pillarObjectives.map((objective) => (
                            <div key={objective.id} className="flex items-start space-x-3 p-2 hover:bg-muted rounded-md transition-colors">
                              <Checkbox
                                id={`modal-obj-${objective.id}`}
                                checked={tempSelectedObjectives.includes(objective.id)}
                                onCheckedChange={() => toggleObjectiveSelection(objective.id)}
                              />
                              <label
                                htmlFor={`modal-obj-${objective.id}`}
                                className="text-sm leading-relaxed cursor-pointer flex-1"
                              >
                                {objective.title}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {tempSelectedObjectives.length > 0 && (
                  <div className="text-sm text-muted-foreground pt-3 border-t">
                    {tempSelectedObjectives.length} objetivo(s) selecionado(s)
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsObjectivesModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={saveObjectivesSelection}>
                    Salvar Objetivos
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os planos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="planning">Planejamento</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="on_hold">Em Pausa</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="kanban">Kanban de Tarefas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="space-y-6">
          {/* Empty State */}
          {plans.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum plano estratégico encontrado</h3>
                <p className="text-muted-foreground mb-4">Crie um plano estratégico primeiro para poder criar projetos.</p>
                <Button variant="outline">
                  Ir para Objetivos
                </Button>
              </CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground mb-4">Comece criando seu primeiro projeto estratégico.</p>
                <Button onClick={() => setIsCreateProjectOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const projectTasks = getProjectTasks(project.id);
                const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                const taskProgress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

                return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openProjectDetail(project)}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {project.description}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant="secondary" className={`${getStatusColor(project.status)} text-white`}>
                            {getStatusText(project.status)}
                          </Badge>
                          <Badge variant="outline" className={`${getPriorityColor(project.priority)} text-white border-0`}>
                            {getPriorityText(project.priority)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progresso das Tarefas</span>
                            <span className="font-medium">{Math.round(taskProgress)}%</span>
                          </div>
                          <Progress value={taskProgress} className="h-2" />
                        </div>

                        {/* Tasks Summary */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            Tarefas
                          </div>
                          <span className="font-medium">
                            {completedTasks}/{projectTasks.length} concluídas
                          </span>
                        </div>

                        {/* Objectives Count */}
                        {project.objective_ids && project.objective_ids.length > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Target className="w-4 h-4 mr-1" />
                              Objetivos
                            </div>
                            <span className="font-medium">
                              {project.objective_ids.length} associado{project.objective_ids.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        {/* Budget and Timeline */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          {project.budget && (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              R$ {project.budget.toLocaleString('pt-BR')}
                            </div>
                          )}
                          {project.end_date && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(project.end_date).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          {/* Project Filter for Kanban */}
          <div className="flex justify-between items-center">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* To Do */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">A Fazer</h3>
                <Badge variant="secondary">{tasksByStatus.todo.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasksByStatus.todo.map((task) => (
                  <Card key={task.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex items-center gap-1">
                          {getPreviousStatus(task.status) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={(e) => handleStatusChange(task.id, getPreviousStatus(task.status)!, e)}
                            >
                               <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                          {getNextStatus(task.status) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={(e) => handleStatusChange(task.id, getNextStatus(task.status)!, e)}
                            >
                               <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                          <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white border-0 text-xs`}>
                            {getPriorityText(task.priority)}
                          </Badge>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {task.estimated_hours && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.estimated_hours}h
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Em Progresso</h3>
                <Badge variant="secondary">{tasksByStatus.in_progress.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasksByStatus.in_progress.map((task) => (
                  <Card key={task.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-blue-500">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex items-center gap-1">
                          {getPreviousStatus(task.status) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={(e) => handleStatusChange(task.id, getPreviousStatus(task.status)!, e)}
                            >
                               <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                          {getNextStatus(task.status) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={(e) => handleStatusChange(task.id, getNextStatus(task.status)!, e)}
                            >
                               <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                          <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white border-0 text-xs`}>
                            {getPriorityText(task.priority)}
                          </Badge>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {task.estimated_hours && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.estimated_hours}h
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Review */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Em Revisão</h3>
                <Badge variant="secondary">{tasksByStatus.review.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasksByStatus.review.map((task) => (
                  <Card key={task.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-yellow-500">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex items-center gap-1">
                          {getPreviousStatus(task.status) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={(e) => handleStatusChange(task.id, getPreviousStatus(task.status)!, e)}
                            >
                               <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                          {getNextStatus(task.status) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={(e) => handleStatusChange(task.id, getNextStatus(task.status)!, e)}
                            >
                               <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                          <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white border-0 text-xs`}>
                            {getPriorityText(task.priority)}
                          </Badge>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {task.estimated_hours && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.estimated_hours}h
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Done */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Concluído</h3>
                <Badge variant="secondary">{tasksByStatus.done.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasksByStatus.done.map((task) => (
                   <Card key={task.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-green-500 opacity-75">
                     <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm line-through">{task.title}</h4>
                          <div className="flex items-center gap-1">
                            {getPreviousStatus(task.status) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 hover:bg-gray-100"
                                onClick={(e) => handleStatusChange(task.id, getPreviousStatus(task.status)!, e)}
                              >
                                <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            )}
                            {getNextStatus(task.status) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 hover:bg-gray-100"
                                onClick={(e) => handleStatusChange(task.id, getNextStatus(task.status)!, e)}
                              >
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            )}
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                       {task.description && (
                         <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                       )}
                       <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {task.estimated_hours && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.estimated_hours}h
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};