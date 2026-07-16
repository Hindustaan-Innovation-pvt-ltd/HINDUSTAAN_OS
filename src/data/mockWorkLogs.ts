export interface WorkLogEntry {
  id: string;
  employeeName: string;
  avatarInitials: string;
  date: string;
  formattedDate: string;
  project: string;
  task: string;
  hours: number;
  status?: string;
}

export const mockWorkLogs: WorkLogEntry[] = [];
