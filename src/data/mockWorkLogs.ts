export interface WorkLogEntry {
  id: string;
  employeeName: string;
  avatarInitials: string;
  date: string; // ISO string format for sorting/filtering
  formattedDate: string;
  project: string;
  task: string;
  hours: number;
  status?: string;
}

export const mockWorkLogs: WorkLogEntry[] = [
  {
    id: "WL-101",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-10T11:00:00Z",
    formattedDate: "Jul 10, 2026",
    project: "Frontend Core",
    task: "Kanban Board & Work Logs responsiveness fixes",
    hours: 0.2,
    status: "Approved"
  },
  {
    id: "WL-102",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-10T09:30:00Z",
    formattedDate: "Jul 10, 2026",
    project: "Frontend Core",
    task: "Integrating dynamic sub-role selectors on Register view",
    hours: 0.7,
    status: "Approved"
  },
  {
    id: "WL-103",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-10T08:15:00Z",
    formattedDate: "Jul 10, 2026",
    project: "Frontend Core",
    task: "Refactoring logo transparency and gradient headers",
    hours: 0.1,
    status: "Approved"
  },
  {
    id: "WL-104",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-09T16:00:00Z",
    formattedDate: "Jul 9, 2026",
    project: "Frontend Core",
    task: "Debugging mobile layout overflows and grid-cols properties",
    hours: 2.1,
    status: "Approved"
  },
  {
    id: "WL-105",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-09T10:00:00Z",
    formattedDate: "Jul 9, 2026",
    project: "Frontend Core",
    task: "Aligning text spacing and card gaps across Employee layout",
    hours: 1.2,
    status: "Approved"
  },
  {
    id: "WL-106",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-08T14:30:00Z",
    formattedDate: "Jul 8, 2026",
    project: "Frontend Core",
    task: "Fixing Training Calendar grid-alignment and date sync bugs",
    hours: 3.5,
    status: "Approved"
  },
  {
    id: "WL-107",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-07T11:00:00Z",
    formattedDate: "Jul 7, 2026",
    project: "Frontend Core",
    task: "Implementing core logic for Task Details overlay sheet panel",
    hours: 4.0,
    status: "Pending"
  },
  {
    id: "WL-108",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-06T09:00:00Z",
    formattedDate: "Jul 6, 2026",
    project: "Design System",
    task: "Rebuilding settings dashboard into horizontal layout tabs",
    hours: 2.8,
    status: "Pending"
  },
  {
    id: "WL-109",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-03T15:00:00Z",
    formattedDate: "Jul 3, 2026",
    project: "Design System",
    task: "Writing Zod schemas and hook form validation properties",
    hours: 1.5,
    status: "Approved"
  },
  {
    id: "WL-110",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-02T10:00:00Z",
    formattedDate: "Jul 2, 2026",
    project: "Design System",
    task: "Constructing dark-theme tokens and local path class utility setups",
    hours: 3.2,
    status: "Approved"
  },
  {
    id: "WL-111",
    employeeName: "Tanvy Pandey",
    avatarInitials: "TP",
    date: "2026-07-01T09:30:00Z",
    formattedDate: "Jul 1, 2026",
    project: "Internal Tools",
    task: "Initializing ProjectOS frontend structure, router channels, and boilerplate templates",
    hours: 4.5,
    status: "Approved"
  }
];
