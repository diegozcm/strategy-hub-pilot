import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FolderOpen, Calendar, DollarSign, Users, Clock, BarChart3, CheckCircle, Circle, AlertCircle, Pause, Edit3, Save } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<StrategicProject[]>([]);
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load strategic plans
      const { data: plansData, error: plansError } = await supabase
        .from('strategic_plans')
        .select('id, name, status')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('strategic_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

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

  const createProject = async () => {
    if (!user || !projectForm.name || !projectForm.plan_id) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('strategic_projects')
        .insert([{
          ...projectForm,
          budget: projectForm.budget ? parseFloat(projectForm.budget) : null,
          owner_id: user.id,
          status: 'planning'
        }])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      setProjectForm({ name: '', description: '', plan_id: '', start_date: '', end_date: '', budget: '', priority: 'medium' });
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
            <h1 className="text-3xl font-bold text-gray-900">Projetos Estratégicos</h1>
            <p className="text-gray-600 mt-2">Gerencie seus projetos e tarefas estratégicas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projetos Estratégicos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus projetos e tarefas estratégicas</p>
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

          <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Projeto Estratégico</DialogTitle>
                <DialogDescription>
                  Defina um novo projeto para executar sua estratégia.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-plan">Plano Estratégico</Label>
                  <Select 
                    value={projectForm.plan_id} 
                    onValueChange={(value) => setProjectForm(prev => ({ ...prev, plan_id: value }))}
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
                <div>
                  <Label htmlFor="project-name">Nome do Projeto</Label>
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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>
                      {editingProject ? 'Editando Projeto' : 'Detalhes do Projeto'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProject ? 'Modifique as informações do projeto' : 'Visualize e edite as informações do projeto'}
                    </DialogDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProject(!editingProject)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {editingProject ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
              </DialogHeader>

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
                        <p className="mt-1 text-sm text-gray-900">{selectedProjectForDetail.name}</p>
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
                        <p className="mt-1 text-sm text-gray-900">{selectedProjectForDetail.description || 'Sem descrição'}</p>
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
                          <p className="mt-1 text-sm text-gray-900">
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
                          <p className="mt-1 text-sm text-gray-900">
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
                          <p className="mt-1 text-sm text-gray-900">
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
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedProjectForDetail.end_date 
                              ? new Date(selectedProjectForDetail.end_date).toLocaleDateString('pt-BR')
                              : 'Não definida'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Tasks Summary */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tarefas do Projeto</h3>
                    <div className="space-y-4">
                      {getProjectTasks(selectedProjectForDetail.id).length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma tarefa encontrada para este projeto.</p>
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
                                  <p className="text-xs text-gray-600 mt-1 ml-6">{task.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum plano estratégico encontrado</h3>
                <p className="text-gray-600 mb-4">Crie um plano estratégico primeiro para poder criar projetos.</p>
                <Button variant="outline">
                  Ir para Objetivos
                </Button>
              </CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
                <p className="text-gray-600 mb-4">Comece criando seu primeiro projeto estratégico.</p>
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
                            <span className="text-gray-600">Progresso das Tarefas</span>
                            <span className="font-medium">{Math.round(taskProgress)}%</span>
                          </div>
                          <Progress value={taskProgress} className="h-2" />
                        </div>

                        {/* Tasks Summary */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-1" />
                            Tarefas
                          </div>
                          <span className="font-medium">
                            {completedTasks}/{projectTasks.length} concluídas
                          </span>
                        </div>

                        {/* Budget and Timeline */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
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
                <h3 className="font-semibold text-gray-900">A Fazer</h3>
                <Badge variant="secondary">{tasksByStatus.todo.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasksByStatus.todo.map((task) => (
                  <Card key={task.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white border-0 text-xs`}>
                          {getPriorityText(task.priority)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
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
                <h3 className="font-semibold text-gray-900">Em Progresso</h3>
                <Badge variant="secondary">{tasksByStatus.in_progress.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasksByStatus.in_progress.map((task) => (
                  <Card key={task.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-blue-500"
                        onClick={() => updateTaskStatus(task.id, 'review')}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white border-0 text-xs`}>
                          {getPriorityText(task.priority)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
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
                <h3 className="font-semibold text-gray-900">Em Revisão</h3>
                <Badge variant="secondary">{tasksByStatus.review.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasksByStatus.review.map((task) => (
                  <Card key={task.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-yellow-500"
                        onClick={() => updateTaskStatus(task.id, 'done')}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white border-0 text-xs`}>
                          {getPriorityText(task.priority)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
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
                <h3 className="font-semibold text-gray-900">Concluído</h3>
                <Badge variant="secondary">{tasksByStatus.done.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasksByStatus.done.map((task) => (
                  <Card key={task.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-green-500 opacity-75">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-through">{task.title}</h4>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
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