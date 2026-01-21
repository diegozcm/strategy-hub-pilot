import React from 'react';
import { FolderOpen } from 'lucide-react';
import { ProjectCard } from './ProjectCard';

interface ProjectTask {
  id: string;
  project_id: string;
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
  objective_ids?: string[];
  cover_image_url?: string;
  pillar_color?: string;
  pillar_name?: string;
  responsible_id?: string;
  responsible_user?: {
    first_name: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface ProjectPillarGroupProps {
  pillarName: string;
  pillarColor: string;
  projects: StrategicProject[];
  tasks: ProjectTask[];
  onProjectClick: (project: StrategicProject) => void;
}

export const ProjectPillarGroup: React.FC<ProjectPillarGroupProps> = ({
  pillarName,
  pillarColor,
  projects,
  tasks,
  onProjectClick,
}) => {
  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.project_id === projectId);
  };

  return (
    <div className="space-y-4">
      {/* Pillar Header */}
      <div className="flex items-center gap-3">
        <div 
          className="w-1.5 h-6 rounded-full"
          style={{ backgroundColor: pillarColor }}
        />
        <h3 className="font-semibold text-lg text-foreground">{pillarName}</h3>
        <span className="text-sm text-muted-foreground">
          ({projects.length} {projects.length === 1 ? 'projeto' : 'projetos'})
        </span>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-8 border border-dashed border-border rounded-lg bg-muted/20">
          <div className="text-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum projeto neste pilar</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {projects.map((project) => {
            const projectTasks = getProjectTasks(project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'done').length;

            return (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={projectTasks.length}
                completedTasks={completedTasks}
                onClick={() => onProjectClick(project)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
