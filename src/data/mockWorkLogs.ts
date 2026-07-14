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
  // TANVY PANDEY
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
  },

  // AMANDA SMITH
  {
    id: "WL-201",
    employeeName: "Amanda Smith",
    avatarInitials: "AS",
    date: "2026-07-10T14:00:00Z",
    formattedDate: "Jul 10, 2026",
    project: "Frontend Core",
    task: "Code reviewing Tanvy's Kanban board responsiveness",
    hours: 1.5,
    status: "Approved"
  },
  {
    id: "WL-202",
    employeeName: "Amanda Smith",
    avatarInitials: "AS",
    date: "2026-07-10T10:00:00Z",
    formattedDate: "Jul 10, 2026",
    project: "Meeting",
    task: "Weekly Sprint Planning with stakeholders",
    hours: 1.0,
    status: "Approved"
  },
  {
    id: "WL-203",
    employeeName: "Amanda Smith",
    avatarInitials: "AS",
    date: "2026-07-09T13:30:00Z",
    formattedDate: "Jul 9, 2026",
    project: "Design System",
    task: "Approving UI tokens and migrating legacy component libraries",
    hours: 3.5,
    status: "Approved"
  },
  {
    id: "WL-204",
    employeeName: "Amanda Smith",
    avatarInitials: "AS",
    date: "2026-07-08T09:15:00Z",
    formattedDate: "Jul 8, 2026",
    project: "Internal Tools",
    task: "Setting up CI/CD workflows for the new Vite frontend",
    hours: 4.0,
    status: "Approved"
  },
  {
    id: "WL-205",
    employeeName: "Amanda Smith",
    avatarInitials: "AS",
    date: "2026-07-07T14:45:00Z",
    formattedDate: "Jul 7, 2026",
    project: "Frontend Core",
    task: "Architecting global state management using Zustand",
    hours: 5.5,
    status: "Approved"
  },

  // RAHUL SHARMA
  {
    id: "WL-301",
    employeeName: "Rahul Sharma",
    avatarInitials: "RS",
    date: "2026-07-10T12:00:00Z",
    formattedDate: "Jul 10, 2026",
    project: "Backend Core",
    task: "Optimizing PostgreSQL queries for the analytics dashboard",
    hours: 2.5,
    status: "Approved"
  },
  {
    id: "WL-302",
    employeeName: "Rahul Sharma",
    avatarInitials: "RS",
    date: "2026-07-10T09:00:00Z",
    formattedDate: "Jul 10, 2026",
    project: "Meeting",
    task: "Daily Standup sync and blocker resolution",
    hours: 0.5,
    status: "Approved"
  },
  {
    id: "WL-303",
    employeeName: "Rahul Sharma",
    avatarInitials: "RS",
    date: "2026-07-09T15:00:00Z",
    formattedDate: "Jul 9, 2026",
    project: "Backend Core",
    task: "Implementing JWT refresh token rotation mechanism",
    hours: 4.2,
    status: "Pending"
  },
  {
    id: "WL-304",
    employeeName: "Rahul Sharma",
    avatarInitials: "RS",
    date: "2026-07-08T11:00:00Z",
    formattedDate: "Jul 8, 2026",
    project: "Internal Tools",
    task: "Dockerizing backend services and updating compose file",
    hours: 3.0,
    status: "Approved"
  },
  {
    id: "WL-305",
    employeeName: "Rahul Sharma",
    avatarInitials: "RS",
    date: "2026-07-06T10:30:00Z",
    formattedDate: "Jul 6, 2026",
    project: "Backend Core",
    task: "Designing REST API schemas for Task assignments",
    hours: 6.0,
    status: "Approved"
  },

  // PRIYA PATEL
  {
    id: "WL-401",
    employeeName: "Priya Patel",
    avatarInitials: "PP",
    date: "2026-07-10T13:15:00Z",
    formattedDate: "Jul 10, 2026",
    project: "Internal Tools",
    task: "Drafting employee onboarding documentation module",
    hours: 3.0,
    status: "Pending"
  },
  {
    id: "WL-402",
    employeeName: "Priya Patel",
    avatarInitials: "PP",
    date: "2026-07-09T11:00:00Z",
    formattedDate: "Jul 9, 2026",
    project: "Internal Tools",
    task: "Reviewing pull request descriptions for release notes",
    hours: 2.0,
    status: "Approved"
  },
  {
    id: "WL-403",
    employeeName: "Priya Patel",
    avatarInitials: "PP",
    date: "2026-07-07T09:30:00Z",
    formattedDate: "Jul 7, 2026",
    project: "Meeting",
    task: "Sync with product on feature definitions",
    hours: 1.5,
    status: "Approved"
  },
  {
    id: "WL-404",
    employeeName: "Priya Patel",
    avatarInitials: "PP",
    date: "2026-07-05T14:00:00Z",
    formattedDate: "Jul 5, 2026",
    project: "Frontend Core",
    task: "Updating tooltip copy and standardizing error messages",
    hours: 2.5,
    status: "Approved"
  }
];
