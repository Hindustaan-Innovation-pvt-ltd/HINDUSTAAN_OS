export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Aborted';

export interface Milestone {
  id: string;
  title: string;
  status: 'pending' | 'completed' | string;
  date?: string;
  dueDate?: string;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done';
  assignee: string;
  assignee_name?: string;
  assignee_id?: string;
  assigneeId?: string;
  priority?: 'High' | 'Medium' | 'Low' | 'Critical' | 'Normal';
  due_date?: string;
  start_date?: string;
  executionDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  iconColor?: string;
  strokeColor?: string;
  manager: string;
  managerId: string;
  deadline: string;
  endDate?: string;
  startDate?: string;
  priority?: string;
  progress: number;
  milestones: Milestone[];
  tasks: ProjectTaskItem[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  manager?: string;
  managerId?: string;
  deadline?: string;
  priority?: string;
  tasks?: Array<{
    id?: string;
    title: string;
    description?: string;
    assignee?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
  }>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  manager?: string;
  managerId?: string;
  deadline?: string;
  priority?: string;
  status?: ProjectStatus;
  tasks?: Array<{
    id?: string;
    title: string;
    description?: string;
    assignee?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
  }>;
}
