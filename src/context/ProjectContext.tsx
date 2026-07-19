import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type ProjectContextType = {
  projects: any[];
  loading: boolean;
  addProject: (projectData: any) => Promise<boolean>;
  updateProject: (id: string, updateData: any) => Promise<boolean>;
  deleteProject: (id: string, reason?: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>;
  addMilestone: (projectId: string, name: string, dueDate?: string) => Promise<boolean>;
  updateMilestoneStatus: (milestoneId: string, status: string) => Promise<boolean>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mapBackendProject = (p: any) => {
    const totalTasks = p.tasks?.length || 0;
    const completedTasks = p.tasks?.filter((t: any) => t.status === 'completed' || t.status === 'done').length || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const colors = [
      { iconColor: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400', strokeColor: '#e11d48' },
      { iconColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400', strokeColor: '#2563eb' },
      { iconColor: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400', strokeColor: '#a855f7' },
      { iconColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', strokeColor: '#10b981' }
    ];
    let sum = 0;
    if (p.id) {
      for (let i = 0; i < p.id.length; i++) sum += p.id.charCodeAt(i);
    }
    const color = colors[sum % colors.length];

    let frontendStatus = 'In Progress';
    if (p.status === 'completed' || p.status === 'Done') frontendStatus = 'Completed';
    else if (p.status === 'aborted') frontendStatus = 'Aborted';
    else if (p.status === 'on_hold') frontendStatus = 'On Hold';
    else if (p.status === 'not_started') frontendStatus = 'Not Started';

    return {
      id: p.id,
      name: p.name,
      status: frontendStatus,
      iconColor: color.iconColor,
      strokeColor: color.strokeColor,
      manager: p.manager?.name || (typeof p.manager === 'string' ? p.manager : 'Unassigned'),
      managerId: p.managerId || '',
      deadline: p.deadline && p.deadline !== 'TBD' ? new Date(p.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : 
               (p.deadline && p.deadline !== 'TBD' && !isNaN(Date.parse(p.deadline)) ? new Date(p.deadline).toISOString().split('T')[0] : ''),
      budget: p.budget && p.budget !== 'TBD' ? (p.budget.startsWith('₹') ? p.budget : `₹${p.budget.replace('$', '')}`) : 'TBD',
      progress,
      milestones: (p.milestones || []).map((m: any) => ({
        id: m.id,
        title: m.name,
        status: m.status || 'pending',
        date: m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'
      })),
      tasks: (p.tasks || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.desc || '',
        status: t.status === 'done' || t.status === 'completed' ? 'Done' :
                t.status === 'in-progress' ? 'In Progress' :
                t.status === 'in-review' ? 'In Review' : 'To Do',
        assignee_name: t.assignee?.name || 'Unassigned',
        assignee_id: t.assigneeId || 'unassigned',
        priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
        due_date: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
        start_date: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : ''
      }))
    };
  };

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      console.log('[DEBUG API] /api/projects response:', res.data);
      if (res.data?.success) {
        const backendProjects = res.data.data || [];
        const mapped = backendProjects.map(mapBackendProject);
        console.log('[DEBUG API] Mapped Projects:', mapped);
        setProjects(mapped);
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      refreshProjects();
    } else {
      setLoading(false);
    }
  }, []);

  const addProject = async (projectData: any): Promise<boolean> => {
    try {
      const currentUser = getCurrentUser();
      const managerId = projectData.managerId || currentUser?.id;
      const isUuid = managerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(managerId);

      // 1. Create project on backend
      const projRes = await api.post('/projects', {
        name: projectData.name,
        description: projectData.description || projectData.name,
        ...(isUuid ? { managerId } : {}),
        startDate: new Date(),
        endDate: projectData.deadline && projectData.deadline !== 'TBD' ? new Date(projectData.deadline) : undefined,
        status: 'active',
        budget: projectData.budget
      });

      if (projRes.data?.success) {
        const newProjId = projRes.data.data.id;

        // 2. Create milestones or tasks if any are attached
        if (Array.isArray(projectData.tasks) && projectData.tasks.length > 0) {
          for (const task of projectData.tasks) {
            await api.post('/tasks', {
              title: task.title,
              desc: task.description || '',
              projectId: newProjId,
              status: task.status === 'Done' ? 'done' : 
                      task.status === 'In Progress' ? 'in-progress' :
                      task.status === 'In Review' ? 'in-review' : 'todo',
              priority: task.priority ? task.priority.toLowerCase() : 'medium',
              dueDate: projectData.deadline ? new Date(projectData.deadline) : undefined,
              assigneeId: task.assigneeId || undefined
            });
          }
        }
        await refreshProjects();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to create project:', e);
      throw e;
    }
  };

  const updateProject = async (id: string, updateData: any): Promise<boolean> => {
    try {
      const payload: any = {};
      if (updateData.name) payload.name = updateData.name;
      if (updateData.description) payload.description = updateData.description;
      if (updateData.deadline) payload.endDate = new Date(updateData.deadline);
      if (updateData.status) {
        payload.status = updateData.status === 'Completed' ? 'completed' :
                         updateData.status === 'Aborted' ? 'aborted' :
                         updateData.status === 'On Hold' ? 'on_hold' : 'active';
      }
      if (updateData.budget !== undefined) payload.budget = updateData.budget;
      if (updateData.managerId !== undefined) payload.managerId = updateData.managerId;

      const res = await api.patch(`/projects/${id}`, payload);
      if (res.data?.success) {
        await refreshProjects();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to update project:', e);
      throw e;
    }
  };

  const deleteProject = async (id: string, reason?: string): Promise<boolean> => {
    try {
      const res = await api.delete(`/projects/${id}`, { data: { reason } });
      if (res.data?.success) {
        await refreshProjects();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to delete project:', e);
      throw e;
    }
  };

  const addMilestone = async (projectId: string, name: string, dueDate?: string): Promise<boolean> => {
    try {
      const res = await api.post('/milestones', {
        name,
        projectId,
        dueDate: dueDate || null,
        status: 'pending'
      });
      if (res.data?.success) {
        await refreshProjects();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to create milestone:', e);
      throw e;
    }
  };

  const updateMilestoneStatus = async (milestoneId: string, status: string): Promise<boolean> => {
    try {
      const res = await api.patch(`/milestones/${milestoneId}/status`, { status });
      if (res.data?.success) {
        await refreshProjects();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to update milestone status:', e);
      throw e;
    }
  };

  return (
    <ProjectContext.Provider value={{ projects, loading, addProject, updateProject, deleteProject, refreshProjects, addMilestone, updateMilestoneStatus }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
