export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Normal' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface Task {
  id: string;
  title: string;
  description: string;
  project_tag: string;
  projectId?: string;
  assignee_name: string;
  assignee_id: string;
  priority: TaskPriority;
  due_date: string;
  status: TaskStatus;
  project_status?: string;
  startDate?: string;
  milestoneId?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  priority: TaskPriority | string;
  start_date?: string;
  due_date?: string;
  milestoneId?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  projectId?: string;
  assignee_id?: string;
  assigneeId?: string;
  priority?: TaskPriority | string;
  status?: TaskStatus;
  due_date?: string;
  start_date?: string;
}
