import React, { createContext, useContext, useState, useEffect } from 'react';
import { GLOBAL_PROJECTS } from '@/data/mockData';

type ProjectContextType = {
  projects: any[];
  addProject: (project: any) => void;
  updateProject: (id: string, updatedProject: any) => void;
  deleteProject: (id: string) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('hindustaan_projects');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : GLOBAL_PROJECTS;
    } catch (e) {
      return GLOBAL_PROJECTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('hindustaan_projects', JSON.stringify(projects));
  }, [projects]);

  const addProject = (project: any) => {
    setProjects((prev: any) => [project, ...prev]);
  };

  const updateProject = (id: string, updatedProject: any) => {
    setProjects((prev: any) => prev.map((p: any) => p.id === id ? { ...p, ...updatedProject } : p));
  };

  const deleteProject = (id: string) => {
    setProjects((prev: any) => prev.filter((p: any) => p.id !== id));
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProject, deleteProject }}>
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
