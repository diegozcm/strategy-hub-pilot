import { useMemo } from 'react';
import { useStrategicMap } from './useStrategicMap';
import { KeyResult, StrategicObjective, StrategicProject } from '@/types/strategic-map';

interface ReportsKPIs {
  totalKeyResults: number;
  onTargetKeyResults: number;
  keyResultsSuccessRate: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectsCompletionRate: number;
  totalObjectives: number;
  completedObjectives: number;
  objectivesCompletionRate: number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export const useReportsData = () => {
  const { 
    loading, 
    company, 
    keyResults, 
    objectives, 
    projects,
    pillars 
  } = useStrategicMap();

  // Calculate KPIs from strategic map data
  const kpis = useMemo((): ReportsKPIs => {
    const totalKeyResults = keyResults.length;
    const onTargetKeyResults = keyResults.filter(kr => {
      const progress = kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0;
      return progress >= 90;
    }).length;
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter(o => o.status === 'completed').length;

    return {
      totalKeyResults,
      onTargetKeyResults,
      keyResultsSuccessRate: totalKeyResults > 0 ? (onTargetKeyResults / totalKeyResults) * 100 : 0,
      totalProjects,
      activeProjects,
      completedProjects,
      projectsCompletionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      totalObjectives,
      completedObjectives,
      objectivesCompletionRate: totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0,
    };
  }, [keyResults, projects, objectives]);

  // Key Results by Category chart data
  const keyResultsByCategory = useMemo((): ChartData[] => {
    // Since KeyResult doesn't have category, group by metric_type instead
    const categories = keyResults.reduce((acc, keyResult) => {
      const category = keyResult.metric_type || 'others';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryNames = {
      percentage: 'Percentual',
      number: 'Numérico', 
      currency: 'Financeiro',
      time: 'Tempo',
      others: 'Outros'
    };

    const categoryColors = {
      percentage: 'hsl(142, 76%, 36%)',
      number: 'hsl(221, 83%, 53%)', 
      currency: 'hsl(32, 95%, 44%)',
      time: 'hsl(262, 83%, 58%)',
      others: 'hsl(215, 16%, 47%)'
    };

    return Object.entries(categories).map(([key, value]) => ({
      name: categoryNames[key as keyof typeof categoryNames] || key,
      value: value as number,
      color: categoryColors[key as keyof typeof categoryColors] || 'hsl(215, 16%, 47%)'
    }));
  }, [keyResults]);

  // Projects by Status chart data
  const projectsByStatus = useMemo((): ChartData[] => {
    const statuses = projects.reduce((acc, project) => {
      const status = project.status || 'planning';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusNames = {
      planning: 'Planejamento',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      suspended: 'Suspenso'
    };

    const statusColors = {
      planning: 'hsl(32, 95%, 44%)',
      in_progress: 'hsl(221, 83%, 53%)',
      completed: 'hsl(142, 76%, 36%)',
      suspended: 'hsl(215, 16%, 47%)'
    };

    return Object.entries(statuses).map(([key, value]) => ({
      name: statusNames[key as keyof typeof statusNames] || key,
      value: value as number,
      color: statusColors[key as keyof typeof statusColors] || 'hsl(215, 16%, 47%)'
    }));
  }, [projects]);

  // Objectives by Pillar chart data
  const objectivesByPillar = useMemo((): ChartData[] => {
    const pillarObjectives = pillars.map(pillar => {
      const pillarObjs = objectives.filter(obj => obj.pillar_id === pillar.id);
      return {
        name: pillar.name,
        value: pillarObjs.length,
        color: pillar.color
      };
    }).filter(item => item.value > 0);

    return pillarObjectives;
  }, [objectives, pillars]);

  // Progress by Pillar
  const progressByPillar = useMemo(() => {
    return pillars.map(pillar => {
      const pillarObjectives = objectives.filter(obj => obj.pillar_id === pillar.id);
      
      if (pillarObjectives.length === 0) {
        return {
          pillar: pillar.name,
          progress: 0,
          color: pillar.color
        };
      }

      const totalProgress = pillarObjectives.reduce((sum, obj) => {
        const objKeyResults = keyResults.filter(kr => kr.objective_id === obj.id);
        if (objKeyResults.length === 0) return sum;
        
        const objProgress = objKeyResults.reduce((krSum, kr) => {
          const progress = kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0;
          return krSum + Math.min(progress, 100);
        }, 0) / objKeyResults.length;
        
        return sum + objProgress;
      }, 0);

      return {
        pillar: pillar.name,
        progress: Math.round(totalProgress / pillarObjectives.length),
        color: pillar.color
      };
    });
  }, [pillars, objectives, keyResults]);

  const hasData = company && (keyResults.length > 0 || projects.length > 0 || objectives.length > 0);

  return {
    loading,
    company,
    hasData,
    keyResults,
    objectives, 
    projects,
    pillars,
    kpis,
    chartData: {
      keyResultsByCategory,
      projectsByStatus,
      objectivesByPillar,
      progressByPillar
    }
  };
};