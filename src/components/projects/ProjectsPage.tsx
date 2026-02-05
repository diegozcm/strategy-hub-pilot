import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, FolderOpen, Calendar, DollarSign, Users, Clock, BarChart3, CheckCircle, Circle, AlertCircle, Pause, Edit3, Save, Trash2, Target, ImageIcon, ArrowRight, CheckSquare, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { KanbanBoard } from './kanban';
import { ProjectCard } from './ProjectCard';
import { ProjectPillarGroup } from './ProjectPillarGroup';
import { ProjectCoverUpload } from './ProjectCoverUpload';
import { QuickTaskInput } from './QuickTaskInput';
import { TaskEditModal } from './TaskEditModal';
import { TaskCreateModal } from './TaskCreateModal';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { UserSelect } from './UserSelect';
import { ProjectFiltersModal, ProjectFilters } from './ProjectFiltersModal';
import { calculateProjectStatus } from '@/utils/projectStatusUtils';
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
  cover_image_url?: string;
  pillar_color?: string;
  pillar_name?: string;
  all_pillars?: Array<{ name: string; color: string }>;
  responsible_id?: string;
  responsible_user?: {
    first_name: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  project_id: string;
  assignee_id: string | null;
  position: number;
  assignee?: {
    first_name: string;
    last_name?: string;
    avatar_url?: string;
  } | null;
}

export const ProjectsPage: React.FC = () => {
  const { user, company: authCompany } = useAuth();
  const { toast } = useToast();
  const { users: companyUsers, loading: loadingUsers } = useCompanyUsers(authCompany?.id);
  
  const [projects, setProjects] = useState<StrategicProject[]>([]);
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProjectFilters>({
    pillar: 'all',
    objective: 'all',
    responsible: 'all',
    status: 'all'
  });
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
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
  const [activeTab, setActiveTab] = useState<'projects' | 'kanban'>('projects');
  
  // Task editing state
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [isTaskEditModalOpen, setIsTaskEditModalOpen] = useState(false);

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    plan_id: '',
    start_date: '',
    end_date: '',
    budget: '',
    priority: 'medium',
    cover_image_url: '',
    responsible_id: ''
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
    status: 'planning',
    cover_image_url: '',
    responsible_id: ''
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

  // Auto-update project status based on task statuses
  const updateProjectStatusIfNeeded = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Get all tasks for this project from local state
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    
    // Calculate new status
    const newStatus = calculateProjectStatus(projectTasks, project.status);
    
    // If no update needed, return
    if (!newStatus || newStatus === project.status) return;
    
    try {
      // Update in database
      await supabase
        .from('strategic_projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      
      // Update local state
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  }, [projects, tasks]);

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
      
      // Load only ACTIVE strategic plans
      const { data: plansData, error: plansError } = await supabase
        .from('strategic_plans')
        .select('id, name, status')
        .eq('company_id', authCompany.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Get active plan IDs
      const activePlanIds = plansData?.map(p => p.id) || [];

      if (activePlanIds.length === 0) {
        setProjects([]);
        setTasks([]);
        setObjectives([]);
        setLoading(false);
        return;
      }

      // Load objectives for filter dropdown
      const { data: objectivesData } = await supabase
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
        .in('plan_id', activePlanIds)
        .order('title');
      
      setObjectives(objectivesData || []);

      // Load projects - filter by active plans only with responsible user data
      const { data: projectsData, error: projectsError } = await supabase
        .from('strategic_projects')
        .select(`
          *,
          responsible_user:profiles!strategic_projects_responsible_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('company_id', authCompany.id)
        .in('plan_id', activePlanIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      
      // Load objective IDs and pillar info for each project
      if (projectsData && projectsData.length > 0) {
        const projectsWithPillarInfo = await Promise.all(
          projectsData.map(async (project) => {
            const { data: relations } = await supabase
              .from('project_objective_relations')
              .select(`
                objective_id,
                strategic_objectives (
                  pillar_id,
                  strategic_pillars (
                    name,
                    color
                  )
                )
              `)
              .eq('project_id', project.id);
            
            // Collect all unique pillars from relations
            const pillarsInfo = relations
              ?.map(r => r.strategic_objectives?.strategic_pillars)
              .filter(Boolean)
              .filter((pillar, index, self) => 
                index === self.findIndex(p => p?.name === pillar?.name)
              ) as Array<{ name: string; color: string }> || [];
            
            const primaryPillar = pillarsInfo[0];
            
            return {
              ...project,
              objective_ids: relations?.map(r => r.objective_id) || [],
              pillar_color: primaryPillar?.color || undefined,
              pillar_name: primaryPillar?.name || undefined,
              all_pillars: pillarsInfo
            };
          })
        );
        setProjects(projectsWithPillarInfo);
      } else {
        setProjects([]);
      }

      // Load tasks - filter by projects from active plans only
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(project => project.id);
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_tasks')
          .select('*')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        if (tasksError) throw tasksError;
        
        // Fetch assignee info for each task that has an assignee_id
        const tasksWithAssignees = await Promise.all(
          (tasksData || []).map(async (task) => {
            if (!task.assignee_id) return task;
            
            const { data: assigneeData } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('user_id', task.assignee_id)
              .single();
            
            return {
              ...task,
              assignee: assigneeData || null
            };
          })
        );
        
        setTasks(tasksWithAssignees);
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
          name: projectForm.name,
          description: projectForm.description,
          plan_id: projectForm.plan_id,
          priority: projectForm.priority,
          start_date: projectForm.start_date || null,
          end_date: projectForm.end_date || null,
          budget: projectForm.budget ? parseFloat(projectForm.budget) : null,
          cover_image_url: projectForm.cover_image_url || null,
          responsible_id: projectForm.responsible_id || null,
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

      // 3. Buscar dados do responsável se existir
      let responsibleUser = null;
      if (projectForm.responsible_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('user_id', projectForm.responsible_id)
          .single();
        responsibleUser = userData;
      }

      // 4. Calcular dados do pilar a partir dos objetivos selecionados
      const selectedObjs = objectives.filter(o => selectedObjectives.includes(o.id));
      const pillarsInfo = selectedObjs
        .map(o => o.strategic_pillars)
        .filter(Boolean)
        .filter((pillar, index, self) => 
          index === self.findIndex(p => p?.name === pillar?.name)
        ) as Array<{ name: string; color: string }>;

      // 5. Atualizar estado com dados completos
      const projectWithDetails: StrategicProject = {
        ...project,
        objective_ids: selectedObjectives,
        responsible_user: responsibleUser,
        pillar_color: pillarsInfo[0]?.color,
        pillar_name: pillarsInfo[0]?.name,
        all_pillars: pillarsInfo
      };
      
      setProjects(prev => [projectWithDetails, ...prev]);
      setProjectForm({ name: '', description: '', plan_id: '', start_date: '', end_date: '', budget: '', priority: 'medium', cover_image_url: '', responsible_id: '' });
      setSelectedObjectives([]);
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

        // Calcular dados do pilar a partir dos novos objetivos
        const selectedObjs = objectives.filter(o => tempSelectedObjectives.includes(o.id));
        const pillarsInfo = selectedObjs
          .map(o => o.strategic_pillars)
          .filter(Boolean)
          .filter((pillar, index, self) => 
            index === self.findIndex(p => p?.name === pillar?.name)
          ) as Array<{ name: string; color: string }>;

        // Update local state with complete pillar info
        setProjects(prev => prev.map(p => 
          p.id === currentProjectForObjectives 
            ? { 
                ...p, 
                objective_ids: tempSelectedObjectives,
                pillar_color: pillarsInfo[0]?.color,
                pillar_name: pillarsInfo[0]?.name,
                all_pillars: pillarsInfo
              }
            : p
        ));

        // Also update selectedProjectForDetail if it's the same project
        if (selectedProjectForDetail?.id === currentProjectForObjectives) {
          setSelectedProjectForDetail(prev => prev ? {
            ...prev,
            objective_ids: tempSelectedObjectives,
            pillar_color: pillarsInfo[0]?.color,
            pillar_name: pillarsInfo[0]?.name,
            all_pillars: pillarsInfo
          } : null);
        }

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
    setProjectForm({ name: '', description: '', plan_id: '', start_date: '', end_date: '', budget: '', priority: 'medium', cover_image_url: '', responsible_id: '' });
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
      
      // Atualizar status do projeto
      await updateProjectStatusIfNeeded(taskForm.project_id);
      
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

  // Quick task creation (Asana-style)
  const createQuickTask = async (title: string, projectId: string) => {
    if (!user || !title.trim() || !projectId) return;

    try {
      const projectTasks = tasks.filter(t => t.project_id === projectId);
      const maxPosition = Math.max(0, ...projectTasks.map(t => t.position || 0));

      const { data, error } = await supabase
        .from('project_tasks')
        .insert([{
          title: title.trim(),
          project_id: projectId,
          status: 'todo',
          position: maxPosition + 1
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data, ...prev]);
      
      // Atualizar status do projeto
      await updateProjectStatusIfNeeded(projectId);
      
      toast({
        title: "Sucesso",
        description: "Tarefa criada!",
      });
    } catch (error) {
      console.error('Error creating quick task:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa.",
        variant: "destructive",
      });
    }
  };

  // Update task (from modal)
  const updateTask = async (taskId: string, updates: Partial<ProjectTask>) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      // Buscar dados do assignee se mudou
      let assigneeData = null;
      const currentTask = tasks.find(t => t.id === taskId);
      if (updates.assignee_id && updates.assignee_id !== currentTask?.assignee_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('user_id', updates.assignee_id)
          .single();
        assigneeData = userData;
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              ...updates, 
              assignee: updates.assignee_id ? assigneeData : (updates.assignee_id === null ? null : task.assignee)
            } 
          : task
      ));

      // Atualizar status do projeto se o status da task mudou
      if (updates.status !== undefined) {
        const projectId = updates.project_id || currentTask?.project_id;
        if (projectId) {
          await updateProjectStatusIfNeeded(projectId);
        }
      }

      toast({
        title: "Sucesso",
        description: "Tarefa atualizada!",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    // Guardar o project_id antes de deletar
    const taskToDelete = tasks.find(t => t.id === taskId);
    const projectId = taskToDelete?.project_id;
    
    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));

      // Atualizar status do projeto após exclusão
      if (projectId) {
        await updateProjectStatusIfNeeded(projectId);
      }

      toast({
        title: "Sucesso",
        description: "Tarefa excluída!",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tarefa.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setIsTaskEditModalOpen(true);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));

      // Atualizar status do projeto
      if (task?.project_id) {
        await updateProjectStatusIfNeeded(task.project_id);
      }

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

  const openProjectDetail = async (project: StrategicProject) => {
    setSelectedProjectForDetail(project);
    setEditProjectForm({
      name: project.name,
      description: project.description || '',
      plan_id: project.plan_id || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget?.toString() || '',
      priority: project.priority || 'medium',
      status: project.status,
      cover_image_url: project.cover_image_url || '',
      responsible_id: project.responsible_id || ''
    });
    setEditingProject(false);
    setIsProjectDetailOpen(true);
    
    // Carregar objetivos automaticamente para exibir o nome completo
    if (project.plan_id) {
      await loadObjectives(project.plan_id);
    }
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
          status: editProjectForm.status,
          cover_image_url: editProjectForm.cover_image_url || null,
          responsible_id: editProjectForm.responsible_id || null
        })
        .eq('id', selectedProjectForDetail.id);

      if (error) throw error;

      // Buscar dados do responsável se mudou
      let responsibleUser = selectedProjectForDetail.responsible_user;
      if (editProjectForm.responsible_id && editProjectForm.responsible_id !== selectedProjectForDetail.responsible_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('user_id', editProjectForm.responsible_id)
          .single();
        responsibleUser = userData;
      } else if (!editProjectForm.responsible_id) {
        responsibleUser = undefined;
      }

      // Update local state with complete data
      const updatedProject = { 
        ...selectedProjectForDetail, 
        ...editProjectForm,
        budget: editProjectForm.budget ? parseFloat(editProjectForm.budget) : selectedProjectForDetail.budget,
        responsible_user: responsibleUser
      };

      setProjects(prev => prev.map(project => 
        project.id === selectedProjectForDetail.id ? updatedProject : project
      ));

      // Also update selectedProjectForDetail
      setSelectedProjectForDetail(updatedProject);

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
      case 'done': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'in_progress': return <Circle className="w-4 h-4 text-primary" />;
      case 'review': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Extract unique pillars from projects for filter
  const uniquePillars = useMemo(() => {
    const pillarsMap = new Map<string, string>();
    projects.forEach(p => {
      if (p.pillar_name && p.pillar_color) {
        pillarsMap.set(p.pillar_name, p.pillar_color);
      }
    });
    return Array.from(pillarsMap.entries()).map(([name, color]) => ({ name, color }));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || project.status === filters.status;
      const matchesPillar = filters.pillar === 'all' || project.pillar_name === filters.pillar;
      const matchesObjective = filters.objective === 'all' || 
        (project.objective_ids && project.objective_ids.includes(filters.objective));
      const matchesResponsible = filters.responsible === 'all' || 
        project.responsible_id === filters.responsible;
      
      return matchesSearch && matchesStatus && matchesPillar && matchesObjective && matchesResponsible;
    });
  }, [projects, searchTerm, filters]);

  // Filtered tasks based on global filters (for Kanban)
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const project = projects.find(p => p.id === task.project_id);
      if (!project) return false;
      
      // Filtro por busca (no título da tarefa ou nome do projeto)
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por pilar
      const matchesPillar = filters.pillar === 'all' || project.pillar_name === filters.pillar;
      
      // Filtro por objetivo
      const matchesObjective = filters.objective === 'all' || 
        (project.objective_ids && project.objective_ids.includes(filters.objective));
      
      // Filtro por responsável (do projeto OU da tarefa)
      const matchesResponsible = filters.responsible === 'all' || 
        project.responsible_id === filters.responsible ||
        task.assignee_id === filters.responsible;
      
      // Filtro por status do projeto
      const matchesStatus = filters.status === 'all' || project.status === filters.status;
      
      return matchesSearch && matchesPillar && matchesObjective && matchesResponsible && matchesStatus;
    });
  }, [tasks, projects, searchTerm, filters]);

  // Group projects by pillar for visual organization
  const projectsByPillar = useMemo(() => {
    const grouped: Record<string, { projects: StrategicProject[]; color: string }> = {};
    
    filteredProjects.forEach(project => {
      const pillarKey = project.pillar_name || 'Sem Pilar';
      const pillarColor = project.pillar_color || '#94a3b8';
      
      if (!grouped[pillarKey]) {
        grouped[pillarKey] = { projects: [], color: pillarColor };
      }
      grouped[pillarKey].projects.push(project);
    });
    
    return grouped;
  }, [filteredProjects]);

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.project_id === projectId);
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
        <TaskCreateModal
            open={isCreateTaskOpen}
            onOpenChange={setIsCreateTaskOpen}
            projects={projects}
            users={companyUsers}
            onSave={async (data) => {
              if (!user) return;
              try {
                const projectTasks = tasks.filter(t => t.project_id === data.project_id);
                const maxPosition = Math.max(0, ...projectTasks.map(t => t.position || 0));
                
                const { data: newTask, error } = await supabase
                  .from('project_tasks')
                  .insert([{
                    title: data.title,
                    description: data.description || null,
                    project_id: data.project_id,
                    priority: data.priority,
                    estimated_hours: data.estimated_hours ? parseInt(data.estimated_hours) : null,
                    due_date: data.due_date || null,
                    assignee_id: data.assignee_id,
                    status: 'todo',
                    position: maxPosition + 1
                  }])
                  .select()
                  .single();

                if (error) throw error;

                // Buscar dados do assignee se existir
                let assigneeData = null;
                if (data.assignee_id) {
                  const { data: userData } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, avatar_url')
                    .eq('user_id', data.assignee_id)
                    .single();
                  assigneeData = userData;
                }

                setTasks(prev => [{ ...newTask, assignee: assigneeData }, ...prev]);
                
                // Atualizar status do projeto
                await updateProjectStatusIfNeeded(data.project_id);
                
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
                throw error;
              }
            }}
          />

          <Button variant="outline" onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>

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
                
                {/* Responsible */}
                <div>
                  <Label>Responsável</Label>
                  <UserSelect
                    users={companyUsers}
                    value={projectForm.responsible_id}
                    onValueChange={(value) => setProjectForm(prev => ({ ...prev, responsible_id: value || '' }))}
                  />
                </div>
                {/* Cover Image Upload */}
                <div>
                  <Label>Imagem de Capa</Label>
                  <div className="mt-2">
                    <ProjectCoverUpload
                      currentImageUrl={projectForm.cover_image_url || undefined}
                      onImageUploaded={(url) => setProjectForm(prev => ({ ...prev, cover_image_url: url }))}
                      onImageRemoved={() => setProjectForm(prev => ({ ...prev, cover_image_url: '' }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Faça upload de uma imagem 16:9 para representar o projeto.
                  </p>
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
            <DialogContent className="sm:max-w-3xl p-0 gap-0 max-h-[90vh] overflow-hidden">
              {selectedProjectForDetail && (() => {
                const projectTasks = getProjectTasks(selectedProjectForDetail.id);
                const firstObjective = selectedProjectForDetail.objective_ids
                  ?.map(objId => objectives.find(o => o.id === objId))
                  .find(obj => obj?.strategic_pillars);
                
                const pillarColor = selectedProjectForDetail.pillar_color || firstObjective?.strategic_pillars?.color || '#64748b';
                const pillarName = selectedProjectForDetail.pillar_name || firstObjective?.strategic_pillars?.name;
                const planName = plans.find(p => p.id === selectedProjectForDetail.plan_id)?.name;

                const handleOpenKanban = () => {
                  setIsProjectDetailOpen(false);
                  setSelectedProject(selectedProjectForDetail.id);
                  setActiveTab('kanban');
                };

                const handleCoverImageUploaded = (url: string) => {
                  setEditProjectForm(prev => ({ ...prev, cover_image_url: url }));
                };

                const handleCoverImageRemoved = () => {
                  setEditProjectForm(prev => ({ ...prev, cover_image_url: '' }));
                };

                return (
                  <div className="flex flex-col max-h-[90vh]">
                    {/* Header Section - Always h-44 (176px) */}
                    <div className="relative flex-shrink-0 h-44">
                      {/* Thumbnail with image or pillar color fallback */}
                      {(editingProject ? editProjectForm.cover_image_url : selectedProjectForDetail.cover_image_url) ? (
                        <>
                          <img 
                            src={editingProject ? editProjectForm.cover_image_url : selectedProjectForDetail.cover_image_url}
                            alt={selectedProjectForDetail.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        </>
                      ) : (
                        /* Pillar color fallback */
                        <div 
                          className="w-full h-full"
                          style={{ backgroundColor: pillarColor }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/30" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FolderOpen className="w-16 h-16 text-white/30" />
                          </div>
                        </div>
                      )}
                      
                      {/* Single close button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsProjectDetailOpen(false)}
                        className="absolute top-3 right-3 h-8 w-8 z-20 text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      {/* Content over header */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-end justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg truncate">
                              {editingProject ? 'Editar Projeto' : selectedProjectForDetail.name}
                            </h2>
                            {/* Badges inline: Pilar + Status + Prioridade */}
                            {!editingProject && (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {pillarName && (
                                  <Badge 
                                    className="text-white text-xs border-0"
                                    style={{ backgroundColor: `${pillarColor}CC` }}
                                  >
                                    {pillarName}
                                  </Badge>
                                )}
                                <Badge className={`${getStatusColor(selectedProjectForDetail.status)} text-white text-xs border-0`}>
                                  {getStatusText(selectedProjectForDetail.status)}
                                </Badge>
                                <Badge className={`${getPriorityColor(selectedProjectForDetail.priority || 'medium')} text-white text-xs border-0`}>
                                  {getPriorityText(selectedProjectForDetail.priority || 'medium')}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {!editingProject && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingProject(true)}
                                className="h-8 w-8 text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full"
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
                                className="h-8 w-8 text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto flex-1 p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-8">
                        {/* Left Column: Project Details */}
                        <div className="space-y-4">
                          {/* Cover Image Upload - Only in Edit Mode */}
                          {editingProject && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Imagem de Capa</Label>
                              <div className="mt-1">
                                <ProjectCoverUpload
                                  currentImageUrl={editProjectForm.cover_image_url || undefined}
                                  onImageUploaded={handleCoverImageUploaded}
                                  onImageRemoved={handleCoverImageRemoved}
                                  projectId={selectedProjectForDetail.id}
                                />
                              </div>
                            </div>
                          )}

                          {/* Project Name - Only in Edit Mode */}
                          {editingProject && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Nome do Projeto</Label>
                              <Input
                                value={editProjectForm.name}
                                onChange={(e) => setEditProjectForm(prev => ({ ...prev, name: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                          )}

                          {/* Description */}
                          {editingProject ? (
                            <div>
                              <Label className="text-xs text-muted-foreground">Descrição</Label>
                              <Textarea
                                value={editProjectForm.description}
                                onChange={(e) => setEditProjectForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={2}
                                className="mt-1"
                              />
                            </div>
                          ) : selectedProjectForDetail.description && (
                            <p className="text-sm text-muted-foreground">{selectedProjectForDetail.description}</p>
                          )}

                          {/* Info Grid - Added gap-x-6 for spacing */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                            <div className="space-y-0.5">
                              <span className="text-xs text-muted-foreground">Plano</span>
                              {editingProject ? (
                                <Select 
                                  value={editProjectForm.plan_id} 
                                  onValueChange={(value) => setEditProjectForm(prev => ({ ...prev, plan_id: value }))}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {plans.map((plan) => (
                                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <p className="font-medium truncate">{planName || 'Sem plano'}</p>
                              )}
                            </div>
                            
                            {/* Status - Only in Edit Mode */}
                            {editingProject && (
                              <div className="space-y-0.5">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <Select 
                                  value={editProjectForm.status} 
                                  onValueChange={(value) => setEditProjectForm(prev => ({ ...prev, status: value }))}
                                >
                                  <SelectTrigger className="h-8 text-xs">
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
                              </div>
                            )}
                            
                            {/* Prioridade - Only in Edit Mode */}
                            {editingProject && (
                              <div className="space-y-0.5">
                                <span className="text-xs text-muted-foreground">Prioridade</span>
                                <Select 
                                  value={editProjectForm.priority} 
                                  onValueChange={(value) => setEditProjectForm(prev => ({ ...prev, priority: value }))}
                                >
                                  <SelectTrigger className="h-8 text-xs">
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
                            )}
                            
                            <div className="space-y-0.5">
                              <span className="text-xs text-muted-foreground">Orçamento</span>
                              {editingProject ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editProjectForm.budget}
                                  onChange={(e) => setEditProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                              ) : (
                                <p className="font-medium">
                                  {selectedProjectForDetail.budget 
                                    ? `R$ ${selectedProjectForDetail.budget.toLocaleString('pt-BR')}`
                                    : '—'
                                  }
                                </p>
                              )}
                            </div>
                            
                            <div className="space-y-0.5">
                              <span className="text-xs text-muted-foreground">Início</span>
                              {editingProject ? (
                                <Input
                                  type="date"
                                  value={editProjectForm.start_date}
                                  onChange={(e) => setEditProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                              ) : (
                                <p className="font-medium">
                                  {selectedProjectForDetail.start_date 
                                    ? new Date(selectedProjectForDetail.start_date).toLocaleDateString('pt-BR')
                                    : '—'
                                  }
                                </p>
                              )}
                            </div>
                            
                            <div className="space-y-0.5">
                              <span className="text-xs text-muted-foreground">Término</span>
                              {editingProject ? (
                                <Input
                                  type="date"
                                  value={editProjectForm.end_date}
                                  onChange={(e) => setEditProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                              ) : (
                                <p className="font-medium">
                                  {selectedProjectForDetail.end_date 
                                    ? new Date(selectedProjectForDetail.end_date).toLocaleDateString('pt-BR')
                                    : '—'
                                  }
                                </p>
                              )}
                            </div>
                            
                            {/* Responsible */}
                            <div className="space-y-0.5 col-span-2">
                              <span className="text-xs text-muted-foreground">Responsável</span>
                              {editingProject ? (
                                <UserSelect
                                  users={companyUsers}
                                  value={editProjectForm.responsible_id}
                                  onValueChange={(value) => setEditProjectForm(prev => ({ ...prev, responsible_id: value || '' }))}
                                  className="h-8 text-xs"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  {selectedProjectForDetail.responsible_user ? (
                                    <>
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={selectedProjectForDetail.responsible_user.avatar_url} />
                                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                          {selectedProjectForDetail.responsible_user.first_name?.[0]}{selectedProjectForDetail.responsible_user.last_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium text-sm">
                                        {selectedProjectForDetail.responsible_user.first_name} {selectedProjectForDetail.responsible_user.last_name}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Objectives - Compact Chips */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground font-medium">Objetivos Estratégicos</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  if (selectedProjectForDetail?.plan_id) {
                                    loadObjectives(selectedProjectForDetail.plan_id);
                                    openObjectivesModal(selectedProjectForDetail.id);
                                  }
                                }}
                              >
                                <Target className="w-3 h-3 mr-1" />
                                Gerenciar
                              </Button>
                            </div>
                            {selectedProjectForDetail?.objective_ids && selectedProjectForDetail.objective_ids.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {selectedProjectForDetail.objective_ids.map((objId) => {
                                  const objective = objectives.find(o => o.id === objId);
                                  if (!objective) return null;
                                  return (
                                    <div 
                                      key={objId} 
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-lg text-xs"
                                    >
                                      <Target className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                      <span className="break-words">{objective.title}</span>
                                      {objective.strategic_pillars && (
                                        <span 
                                          className="w-2 h-2 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: objective.strategic_pillars.color }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Nenhum objetivo associado</p>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Tasks Preview */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-4 h-fit overflow-hidden">
                          {/* Header */}
                          <div className="flex items-center justify-between pb-2 border-b">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <CheckSquare className="w-4 h-4 text-primary" />
                              Tarefas ({projectTasks.length})
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleOpenKanban}
                              className="h-7 px-2 text-xs text-primary hover:text-primary"
                            >
                              Ver no Kanban
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                          
                          {/* Task List */}
                          <div className="space-y-2 max-h-52 overflow-y-auto overflow-x-hidden">
                            {projectTasks.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-6 text-center">
                                Nenhuma tarefa encontrada
                              </p>
                            ) : (
                              projectTasks.slice(0, 8).map(task => (
                                <div 
                                  key={task.id} 
                                  className="flex items-center gap-2 p-2 bg-background rounded-md text-xs hover:bg-muted/50 cursor-pointer transition-colors min-w-0 overflow-hidden"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setIsTaskEditModalOpen(true);
                                  }}
                                >
                                  {getTaskStatusIcon(task.status)}
                                  <span className="flex-1 truncate min-w-0">{task.title}</span>
                                  {task.priority && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[10px] px-1.5 py-0 ${getPriorityColor(task.priority)} text-white border-0`}
                                    >
                                      {getPriorityText(task.priority)}
                                    </Badge>
                                  )}
                                </div>
                              ))
                            )}
                            {projectTasks.length > 8 && (
                              <p className="text-xs text-muted-foreground text-center pt-1">
                                +{projectTasks.length - 8} outras tarefas
                              </p>
                            )}
                          </div>
                          
                          {/* Quick Task Input */}
                          <div className="pt-2 border-t">
                            <QuickTaskInput 
                              onCreateTask={(title) => createQuickTask(title, selectedProjectForDetail.id)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {editingProject && (
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          <Button variant="outline" size="sm" onClick={() => setEditingProject(false)}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={updateProject}>
                            <Save className="w-3 h-3 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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

      {/* View Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'projects' | 'kanban')} className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList className="inline-flex w-auto bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="projects" className="px-6 py-2.5 rounded-md data-[state=active]:shadow-sm">
              <FolderOpen className="w-4 h-4 mr-2" />
              Projetos
            </TabsTrigger>
            <TabsTrigger value="kanban" className="px-6 py-2.5 rounded-md data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Kanban de Tarefas
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filters - Below Tabs */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Button */}
          <Button
            variant="outline"
            onClick={() => setIsFiltersModalOpen(true)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtrar
            {(() => {
              const count = [
                filters.pillar !== 'all',
                filters.objective !== 'all',
                filters.responsible !== 'all',
                filters.status !== 'all'
              ].filter(Boolean).length;
              return count > 0 ? (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {count}
                </Badge>
              ) : null;
            })()}
          </Button>
        </div>

        {/* Filters Modal */}
        <ProjectFiltersModal
          open={isFiltersModalOpen}
          onOpenChange={setIsFiltersModalOpen}
          filters={filters}
          onFiltersChange={setFilters}
          pillars={uniquePillars}
          objectives={objectives}
          users={companyUsers}
        />
        
        <TabsContent value="projects" className="space-y-6">
          {/* Empty State */}
          {plans.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground mb-4">Comece criando seu primeiro projeto estratégico.</p>
                <Button onClick={() => setIsCreateProjectOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Projects grouped by Pillar */
            <div className="space-y-8">
              {Object.entries(projectsByPillar).map(([pillarName, { projects: pillarProjects, color }]) => (
                <ProjectPillarGroup
                  key={pillarName}
                  pillarName={pillarName}
                  pillarColor={color}
                  projects={pillarProjects}
                  tasks={tasks}
                  onProjectClick={openProjectDetail}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <KanbanBoard
            tasks={filteredTasks}
            projects={filteredProjects}
            selectedProject={selectedProject}
            onProjectFilterChange={setSelectedProject}
            onTasksUpdate={setTasks}
            companyUsers={companyUsers}
            onEditTask={handleEditTask}
            onProjectStatusUpdate={updateProjectStatusIfNeeded}
          />
        </TabsContent>
      </Tabs>

      {/* Task Edit Modal */}
      {(() => {
        const taskProject = editingTask ? projects.find(p => p.id === editingTask.project_id) : null;
        const taskObjectives = taskProject?.objective_ids 
          ? objectives.filter(obj => taskProject.objective_ids?.includes(obj.id))
          : [];
        
        return (
          <TaskEditModal
            open={isTaskEditModalOpen}
            onOpenChange={setIsTaskEditModalOpen}
            task={editingTask}
            users={companyUsers}
            projects={projects}
            pillarColor={taskProject?.pillar_color}
            pillarName={taskProject?.pillar_name}
            onSave={updateTask}
            onDelete={deleteTask}
          />
        );
      })()}

      {/* Task Create Modal */}
      <TaskCreateModal
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        projects={projects}
        users={companyUsers}
        onSave={async (data) => {
          if (!user) return;
          const projectTasks = tasks.filter(t => t.project_id === data.project_id);
          const maxPosition = Math.max(0, ...projectTasks.map(t => t.position || 0));
          
          const { data: newTask, error } = await supabase
            .from('project_tasks')
            .insert([{
              title: data.title,
              description: data.description || null,
              project_id: data.project_id,
              priority: data.priority,
              estimated_hours: data.estimated_hours ? parseInt(data.estimated_hours) : null,
              due_date: data.due_date || null,
              assignee_id: data.assignee_id,
              status: 'todo',
              position: maxPosition + 1
            }])
            .select()
            .single();

          if (error) throw error;

          // Buscar dados do assignee se existir
          let assigneeData = null;
          if (data.assignee_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('user_id', data.assignee_id)
              .single();
            assigneeData = userData;
          }

          setTasks(prev => [{ ...newTask, assignee: assigneeData }, ...prev]);
          toast({
            title: "Sucesso",
            description: "Tarefa criada com sucesso!",
          });
        }}
      />
    </div>
  );
};