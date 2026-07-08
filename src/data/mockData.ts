export const GLOBAL_TEAM_MEMBERS = [
  { id: '1', name: 'Amanda Smith', role: 'Frontend Lead', status: 'online', initials: 'AS', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
  { id: '2', name: 'Rahul Sharma', role: 'Backend Developer', status: 'busy', initials: 'RS', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  { id: '3', name: 'Priya Patel', role: 'Technical Writer', status: 'online', initials: 'PP', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  { id: '4', name: 'Rohan Gupta', role: 'DevOps', status: 'online', initials: 'RG', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
  { id: '5', name: 'Aiden Chen', role: 'Design', status: 'offline', initials: 'AC', color: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400' },
];

export const GLOBAL_PROJECTS = [
  { 
    id: 'p1', 
    name: 'ProjectOS Redesign', 
    status: 'In Progress', 
    iconColor: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400', 
    strokeColor: '#e11d48', 
    manager: 'Amanda Smith', 
    deadline: 'Dec 15', 
    budget: '$15k',
    milestones: [
      { id: 1, title: 'Requirement Gathering', status: 'completed', date: 'Oct 01' },
      { id: 2, title: 'UI/UX Design', status: 'completed', date: 'Oct 15' },
      { id: 3, title: 'Frontend Development', status: 'in-progress', date: 'Nov 10' },
      { id: 4, title: 'Backend Integration', status: 'pending', date: 'Nov 25' },
      { id: 5, title: 'Beta Testing', status: 'pending', date: 'Dec 05' },
    ],
    tasks: [
      { id: 't1', title: 'Design System Setup', status: 'Done', assignee: 'Amanda Smith' },
      { id: 't2', title: 'Authentication Flow', status: 'Done', assignee: 'Rahul Sharma' },
      { id: 't3', title: 'Dashboard Layout', status: 'In Progress', assignee: 'Priya Patel' },
      { id: 't4', title: 'API Integration', status: 'In Progress', assignee: 'Rohan Gupta' },
      { id: 't5', title: 'User Profile Page', status: 'To Do', assignee: 'Unassigned' },
      { id: 't6', title: 'Email Notifications', status: 'To Do', assignee: 'Unassigned' },
      { id: 't7', title: 'Security Audit', status: 'Blocked', assignee: 'Rohan Gupta' },
    ]
  },
  { 
    id: 'p2', 
    name: 'Mobile App', 
    status: 'In Progress', 
    iconColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400', 
    strokeColor: '#2563eb', 
    manager: 'Rahul Sharma', 
    deadline: 'Nov 30', 
    budget: '$20k',
    milestones: [
      { id: 1, title: 'Setup React Native', status: 'completed', date: 'Oct 05' },
      { id: 2, title: 'Auth & Routing', status: 'completed', date: 'Oct 20' },
      { id: 3, title: 'Core Features', status: 'completed', date: 'Nov 10' },
      { id: 4, title: 'App Store Review', status: 'in-progress', date: 'Nov 25' },
    ],
    tasks: [
      { id: 't1', title: 'Expo Init', status: 'Done', assignee: 'Rahul Sharma' },
      { id: 't2', title: 'Navigation Container', status: 'Done', assignee: 'Amanda Smith' },
      { id: 't3', title: 'Login Screen', status: 'Done', assignee: 'Rahul Sharma' },
      { id: 't4', title: 'Push Notifications', status: 'Done', assignee: 'Rohan Gupta' },
      { id: 't5', title: 'Apple Guidelines Check', status: 'Blocked', assignee: 'Priya Patel' },
    ]
  },
  { 
    id: 'p3', 
    name: 'Marketing Website', 
    status: 'On Hold', 
    iconColor: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400', 
    strokeColor: '#d97706', 
    manager: 'Priya Patel', 
    deadline: 'Oct 20', 
    budget: '$5k',
    milestones: [
      { id: 1, title: 'Content Drafting', status: 'completed', date: 'Sep 01' },
      { id: 2, title: 'SEO Optimization', status: 'in-progress', date: 'Oct 10' },
      { id: 3, title: 'Deployment', status: 'pending', date: 'Oct 20' },
    ],
    tasks: [
      { id: 't1', title: 'Landing Page Copy', status: 'Done', assignee: 'Priya Patel' },
      { id: 't2', title: 'Meta Tags', status: 'In Progress', assignee: 'Priya Patel' },
      { id: 't3', title: 'Vercel Setup', status: 'To Do', assignee: 'Rohan Gupta' },
    ]
  },
  { 
    id: 'p4', 
    name: 'Design System', 
    status: 'Completed', 
    iconColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', 
    strokeColor: '#059669', 
    manager: 'Aiden Chen', 
    deadline: 'Sep 10', 
    budget: '$8k',
    milestones: [
      { id: 1, title: 'Color Tokens', status: 'completed', date: 'Aug 15' },
      { id: 2, title: 'Typography', status: 'completed', date: 'Aug 25' },
      { id: 3, title: 'Component Library', status: 'completed', date: 'Sep 10' },
    ],
    tasks: [
      { id: 't1', title: 'Tailwind Config', status: 'Done', assignee: 'Aiden Chen' },
      { id: 't2', title: 'Button Variants', status: 'Done', assignee: 'Aiden Chen' },
      { id: 't3', title: 'Input Fields', status: 'Done', assignee: 'Aiden Chen' },
    ]
  }
];

export const GLOBAL_LOGS = [
  { id: '1', name: 'Amanda Smith', initials: 'AS', date: 'Oct 12, 2026', hours: 4.5, task: 'Dashboard Layout', project: 'ProjectOS Redesign', status: 'Approved' },
  { id: '2', name: 'Rahul Sharma', initials: 'RS', date: 'Oct 12, 2026', hours: 6.0, task: 'Login Screen', project: 'Mobile App', status: 'Approved' },
  { id: '3', name: 'Aiden Chen', initials: 'AC', date: 'Oct 11, 2026', hours: 3.5, task: 'Button Variants', project: 'Design System', status: 'Pending' },
  { id: '4', name: 'Priya Patel', initials: 'PP', date: 'Oct 11, 2026', hours: 8.0, task: 'Landing Page Copy', project: 'Marketing Website', status: 'Approved' },
  { id: '5', name: 'Rohan Gupta', initials: 'RG', date: 'Oct 10, 2026', hours: 5.0, task: 'Push Notifications', project: 'Mobile App', status: 'Rejected' },
];

export const GLOBAL_ACTIVITY_FEED = [
  { id: 'a1', user: 'Rahul Sharma', action: 'completed task', target: 'Login Screen', time: '10m ago', type: 'task' },
  { id: 'a2', user: 'Amanda Smith', action: 'submitted work log', target: '8.5 hours', time: '1h ago', type: 'log' },
  { id: 'a3', user: 'System', action: 'created project', target: 'ProjectOS Redesign', time: '2h ago', type: 'project' },
  { id: 'a4', user: 'Priya Patel', action: 'submitted standup', target: 'Daily Sync', time: '3h ago', type: 'standup' },
  { id: 'a5', user: 'Rohan Gupta', action: 'assigned task to', target: 'Aiden Chen', time: '4h ago', type: 'assign' },
];

export const GLOBAL_NOTIFICATIONS = [
  { id: 'n1', text: 'ProjectOS Redesign is delayed.', unread: true },
  { id: 'n2', text: 'New task assigned by Director.', unread: true },
  { id: 'n3', text: 'Blocker reported by Priya.', unread: false },
  { id: 'n4', text: 'Sarah joined the workspace.', unread: false },
];
