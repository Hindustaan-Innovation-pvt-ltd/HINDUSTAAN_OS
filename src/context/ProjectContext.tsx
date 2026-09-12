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

export const formatToMMDDYYYY = (dateVal: any): string => {
  if (!dateVal || dateVal === 'TBD') return 'TBD';
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[1]}-${parts[2]}-${parts[0]}`;
      }
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : 'TBD';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
};

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

    const rawDeadline = p.endDate || p.deadline;

    return {
      id: p.id,
      name: p.name,
      status: frontendStatus,
      iconColor: color.iconColor,
      strokeColor: color.strokeColor,
      manager: p.manager?.name || (typeof p.manager === 'string' ? p.manager : 'Unassigned'),
      managerId: p.managerId || '',
      deadline: rawDeadline ? formatToMMDDYYYY(rawDeadline) : 'TBD',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : 
               (p.deadline && p.deadline !== 'TBD' && !isNaN(Date.parse(p.deadline)) ? new Date(p.deadline).toISOString().split('T')[0] : ''),
      progress,
      milestones: (p.milestones || []).map((m: any) => ({
        id: m.id,
        title: m.name,
        status: m.status || 'pending',
        date: m.dueDate ? formatToMMDDYYYY(m.dueDate) : 'TBD'
      })),
      tasks: (p.tasks || []).map((t: any) => {
        const assignees = t.assignees || [];
        const firstAssignee = assignees[0]?.user || assignees[0] || t.assignee || {};
        const assigneeName = firstAssignee.name || t.assignee_name || (typeof t.assignee === 'string' ? t.assignee : 'Unassigned');
        const assigneeId = firstAssignee.id || firstAssignee.userId || t.assigneeId || 'unassigned';
        
        const rawStatus = (t.status || '').toLowerCase().replace(/[\s_-]+/g, '');
        const normalizedStatus = 
          rawStatus === 'done' || rawStatus === 'completed' ? 'Done' :
          rawStatus === 'inprogress' ? 'In Progress' :
          rawStatus === 'inreview' ? 'In Review' : 'To Do';

        return {
          id: t.id,
          title: t.title,
          description: t.desc || t.description || '',
          status: normalizedStatus,
          assignee: assigneeName,
          assignee_name: assigneeName,
          assignee_id: assigneeId,
          assigneeId: assigneeId,
          priority: (t.priority || '').toLowerCase() === 'high' ? 'High' : 
                    (t.priority || '').toLowerCase() === 'low' ? 'Low' : 'Medium',
          due_date: t.dueDate ? formatToMMDDYYYY(t.dueDate) : '',
          start_date: t.startDate ? formatToMMDDYYYY(t.startDate) : '',
          executionDate: t.dueDate ? formatToMMDDYYYY(t.dueDate) : (t.startDate ? formatToMMDDYYYY(t.startDate) : '')
        };
      })
    };
  };

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      if (res.data?.success) {
        const backendProjects = res.data.data || [];
        const mapped = backendProjects.map(mapBackendProject);
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

    const handleUpdate = () => {
      refreshProjects();
    };

    window.addEventListener('task_created', handleUpdate);
    window.addEventListener('task_updated', handleUpdate);
    window.addEventListener('project_updated', handleUpdate);

    return () => {
      window.removeEventListener('task_created', handleUpdate);
      window.removeEventListener('task_updated', handleUpdate);
      window.removeEventListener('project_updated', handleUpdate);
    };
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
        status: 'active'
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
        window.dispatchEvent(new CustomEvent('task_created'));
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
        
        // Optimistic UI update so status changes reflect immediately
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: updateData.status } : p));
      }
      if (updateData.managerId !== undefined) {
        const isValidUuid = updateData.managerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updateData.managerId);
        if (isValidUuid) payload.managerId = updateData.managerId;
      }

      const res = await api.patch(`/projects/${id}`, payload);

      // 1. Handle deleted tasks: tasks in existing project that are missing from updateData.tasks
      if (Array.isArray(updateData.tasks)) {
        const existingProject = projects.find(p => p.id === id);
        const incomingTaskIds = new Set(updateData.tasks.map((t: any) => t.id).filter(Boolean));

        if (existingProject && Array.isArray(existingProject.tasks)) {
          const tasksToDelete = existingProject.tasks.filter((t: any) => t.id && !incomingTaskIds.has(t.id));
          for (const delTask of tasksToDelete) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(delTask.id);
            if (isUuid) {
              try {
                await api.delete(`/tasks/${delTask.id}`);
              } catch (delErr) {
                console.error(`Failed to delete task ${delTask.id}:`, delErr);
              }
            }
          }
        }

        // 2. Save any newly added or updated tasks attached to this project
        for (const task of updateData.tasks) {
          const isExistingUuid = task.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id);
          const rawAssignee = task.assigneeId || task.assignee_id;
          const resolvedAssigneeId = (!rawAssignee || rawAssignee === 'unassigned' || rawAssignee === 'null') ? null : rawAssignee;

          if (isExistingUuid) {
            await api.patch(`/tasks/${task.id}`, {
              title: task.title,
              desc: task.description || '',
              assigneeId: resolvedAssigneeId
            }).catch((err) => {
              console.error(`Failed to update task ${task.id}:`, err);
            });
          } else if (task.title && task.title.trim()) {
            await api.post('/tasks', {
              title: task.title,
              desc: task.description || '',
              projectId: id,
              status: task.status === 'Done' ? 'done' : 
                      task.status === 'In Progress' ? 'in-progress' :
                      task.status === 'In Review' ? 'in-review' : 'todo',
              priority: task.priority ? task.priority.toLowerCase() : 'medium',
              dueDate: updateData.deadline ? new Date(updateData.deadline) : undefined,
              assigneeId: resolvedAssigneeId
            }).catch((err) => {
              console.error('Failed to create new task:', err);
            });
          }
        }
      }

      if (res.status >= 200 && res.status < 300) {
        window.dispatchEvent(new CustomEvent('task_updated'));
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
