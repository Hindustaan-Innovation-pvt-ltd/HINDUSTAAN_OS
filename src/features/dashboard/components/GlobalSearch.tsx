import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Flag, 
  Clock, 
  AlertTriangle,
  Bell,
  ArrowRight,
  FileText
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

// Comprehensive Default Data for Search Fallback & Merging
const DEFAULT_PROJECTS = [
  { id: 'p1', title: 'Crime Prediction System', status: 'Ongoing', type: 'Project' },
  { id: 'p2', title: 'Project OS Dashboard', status: 'In Progress', type: 'Project' },
  { id: 'p3', title: 'Authentication Flow', status: 'Blocked', type: 'Project' },
  { id: 'p4', title: 'Hindustaan OS Platform', status: 'Ongoing', type: 'Project' },
  { id: 'p5', title: 'AI Analytics Engine', status: 'In Progress', type: 'Project' },
  { id: 'p6', title: 'Employee Portal', status: 'Ongoing', type: 'Project' },
  { id: 'p7', title: 'Mobile Client App', status: 'In Progress', type: 'Project' },
  { id: 'p8', title: 'Infrastructure Migration', status: 'Planned', type: 'Project' },
];

const DEFAULT_TASKS = [
  { id: 't1', title: 'Design Login Screen', assignee: 'Tanvy Pandey', status: 'Due Tomorrow', priority: 'High', type: 'Task' },
  { id: 't2', title: 'Build Dashboard UI', assignee: 'Amanda Smith', status: 'In Progress', priority: 'Normal', type: 'Task' },
  { id: 't3', title: 'Setup Kanban Board', assignee: 'Rahul Sharma', status: 'Done', priority: 'Low', type: 'Task' },
  { id: 't4', title: 'Implement Standup Filter', assignee: 'Bhupesh Dewangan', status: 'In Progress', priority: 'High', type: 'Task' },
  { id: 't5', title: 'Optimize Database Queries', assignee: 'Rahul Sharma', status: 'In Progress', priority: 'High', type: 'Task' },
  { id: 't6', title: 'QA Regression Testing', assignee: 'Riya Sharma', status: 'Due in 3 days', priority: 'Normal', type: 'Task' },
  { id: 't7', title: 'CI/CD Pipeline Setup', assignee: 'Karan Patel', status: 'Done', priority: 'Normal', type: 'Task' },
  { id: 't8', title: 'Roadmap Planning Q3', assignee: 'Anchal', status: 'In Progress', priority: 'High', type: 'Task' },
];

const DEFAULT_MEMBERS = [
  { id: 'u1', name: 'Tanvy Pandey', role: 'Frontend Intern', department: 'Engineering', type: 'Team Member' },
  { id: 'u2', name: 'Amanda Smith', role: 'UI/UX Designer', department: 'Design', type: 'Team Member' },
  { id: 'u3', name: 'Rahul Sharma', role: 'Backend Intern', department: 'Engineering', type: 'Team Member' },
  { id: 'u4', name: 'Bhupesh Dewangan', role: 'Full Stack Developer', department: 'Engineering', type: 'Team Member' },
  { id: 'u5', name: 'Anchal', role: 'Product Manager', department: 'Product', type: 'Team Member' },
  { id: 'u6', name: 'Ayush', role: 'Frontend Developer', department: 'Engineering', type: 'Team Member' },
  { id: 'u7', name: 'Riya Sharma', role: 'QA Engineer', department: 'Engineering', type: 'Team Member' },
  { id: 'u8', name: 'Karan Patel', role: 'DevOps Intern', department: 'Infrastructure', type: 'Team Member' },
];

const DEFAULT_STANDUPS = [
  { id: 's1', user: 'Bhupesh Dewangan', date: 'Today', summary: 'Implemented dashboard filter and standup search', type: 'Standup' },
  { id: 's2', user: 'Tanvy Pandey', date: 'Today', summary: 'Worked on login UI and authentication flow', type: 'Standup' },
  { id: 's3', user: 'Amanda Smith', date: 'Today', summary: 'Designed user profile layouts and design system', type: 'Standup' },
  { id: 's4', user: 'Rahul Sharma', date: 'Yesterday', summary: 'Built REST API endpoints for attendance logs', type: 'Standup' },
  { id: 's5', user: 'Anchal', date: 'Yesterday', summary: 'Reviewed milestone progress and quarterly roadmap', type: 'Standup' },
  { id: 's6', user: 'Ayush', date: 'Today', summary: 'Fixed responsive layout bugs on mobile devices', type: 'Standup' },
];

const DEFAULT_LOGS = [
  { id: 'l1', user: 'Bhupesh Dewangan', task: 'Standup Module Enhancement', date: 'Today', type: 'Work Log' },
  { id: 'l2', user: 'Amanda Smith', task: 'Dashboard UI Layout', date: 'Yesterday', type: 'Work Log' },
  { id: 'l3', user: 'Tanvy Pandey', task: 'Authentication Flow Validation', date: 'Yesterday', type: 'Work Log' },
  { id: 'l4', user: 'Rahul Sharma', task: 'API Endpoint Refactoring', date: '2 days ago', type: 'Work Log' },
];

const DEFAULT_MILESTONES = [
  { id: 'm1', title: 'Phase 1 Complete', date: 'Jul 15, 2026', project: 'Project OS', type: 'Milestone' },
  { id: 'm2', title: 'MVP Release', date: 'Aug 1, 2026', project: 'Crime Prediction', type: 'Milestone' },
];

const DEFAULT_DEADLINES = [
  { id: 'd1', title: 'Landing Page', date: 'Due in 2 days', type: 'Deadline' },
];

const DEFAULT_NOTIFICATIONS = [
  { id: 'n1', text: 'Task Assigned: Kanban Board', time: '1h ago', type: 'Notification' },
];

const RECENT_SEARCHES = [
  'Crime Prediction System',
  'Tanvy',
  'Dashboard UI',
  'Login Page',
  'MVP Complete'
];

const FILTERS = ['All', 'Projects', 'Tasks', 'Team', 'Milestones', 'Work Logs', 'Standups'];

export function GlobalSearch({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const [projectsList, setProjectsList] = useState<any[]>(DEFAULT_PROJECTS);
  const [tasksList, setTasksList] = useState<any[]>(DEFAULT_TASKS);
  const [membersList, setMembersList] = useState<any[]>(DEFAULT_MEMBERS);
  const [standupsList, setStandupsList] = useState<any[]>(DEFAULT_STANDUPS);
  const [logsList, setLogsList] = useState<any[]>(DEFAULT_LOGS);

  // Load live data from localStorage and API when modal opens
  useEffect(() => {
    if (!open) return;

    // 1. LocalStorage cached data
    try {
      const savedProjects = localStorage.getItem('hindustaan_projects');
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((p: any, idx: number) => ({
            id: p.id || `lp-${idx}`,
            title: p.title || p.name || 'Untitled Project',
            status: p.status || 'Ongoing',
            type: 'Project'
          }));
          const existingTitles = new Set(mapped.map(m => m.title.toLowerCase()));
          DEFAULT_PROJECTS.forEach(dp => {
            if (!existingTitles.has(dp.title.toLowerCase())) mapped.push(dp);
          });
          setProjectsList(mapped);
        }
      }

      const savedTasks = localStorage.getItem('hindustaan_tasks_list');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((t: any, idx: number) => ({
            id: t.id || `lt-${idx}`,
            title: t.title || t.name || 'Untitled Task',
            assignee: t.assignee || t.assigneeName || t.user || 'Unassigned',
            status: t.status || 'In Progress',
            priority: t.priority || 'Normal',
            type: 'Task'
          }));
          const existingTitles = new Set(mapped.map(m => m.title.toLowerCase()));
          DEFAULT_TASKS.forEach(dt => {
            if (!existingTitles.has(dt.title.toLowerCase())) mapped.push(dt);
          });
          setTasksList(mapped);
        }
      }

      const savedUsers = localStorage.getItem('hindustaan_users') || localStorage.getItem('hindustaan_team');
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((m: any, idx: number) => ({
            id: m.id || `lu-${idx}`,
            name: m.name || m.user || 'Team Member',
            role: m.role || m.designation || 'Intern',
            department: m.department || 'Engineering',
            type: 'Team Member'
          }));
          const existingNames = new Set(mapped.map(m => m.name.toLowerCase()));
          DEFAULT_MEMBERS.forEach(dm => {
            if (!existingNames.has(dm.name.toLowerCase())) mapped.push(dm);
          });
          setMembersList(mapped);
        }
      }

      const savedStandups = localStorage.getItem('hindustaan_standup_history') || localStorage.getItem('hindustaan_standups');
      if (savedStandups) {
        const parsed = JSON.parse(savedStandups);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((s: any, idx: number) => ({
            id: s.id || `ls-${idx}`,
            user: s.user || s.name || 'Intern',
            date: s.dateGroup || s.date || 'Today',
            summary: s.today || s.yesterday || s.summary || s.doing || 'Submitted standup update',
            type: 'Standup'
          }));
          const existingUsers = new Set(mapped.map(m => m.user.toLowerCase()));
          DEFAULT_STANDUPS.forEach(ds => {
            if (!existingUsers.has(ds.user.toLowerCase())) mapped.push(ds);
          });
          setStandupsList(mapped);
        }
      }

      const savedLogs = localStorage.getItem('hindustaan_worklogs');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((l: any, idx: number) => ({
            id: l.id || `ll-${idx}`,
            user: l.user || l.name || 'Intern',
            task: l.task || l.title || l.project || 'Work activity',
            date: l.date || l.rawDate || 'Recent',
            type: 'Work Log'
          }));
          setLogsList(mapped);
        }
      }
    } catch (e) {}

    // 2. Fetch live data from APIs
    api.get('/projects').then(r => {
      if (Array.isArray(r.data) && r.data.length > 0) {
        const mapped = r.data.map((p: any, idx: number) => ({
          id: p.id || `ap-${idx}`,
          title: p.name || p.title || 'Untitled Project',
          status: p.status || 'Ongoing',
          type: 'Project'
        }));
        const titles = new Set(mapped.map(m => m.title.toLowerCase()));
        DEFAULT_PROJECTS.forEach(dp => {
          if (!titles.has(dp.title.toLowerCase())) mapped.push(dp);
        });
        setProjectsList(mapped);
      }
    }).catch(() => {});

    api.get('/tasks?limit=1000').then(r => {
      if (Array.isArray(r.data) && r.data.length > 0) {
        const mapped = r.data.map((t: any, idx: number) => ({
          id: t.id || `at-${idx}`,
          title: t.title || t.name || 'Untitled Task',
          assignee: t.assignee?.name || t.assigneeName || t.assignee || 'Unassigned',
          status: t.status || 'In Progress',
          priority: t.priority || 'Normal',
          type: 'Task'
        }));
        const titles = new Set(mapped.map(m => m.title.toLowerCase()));
        DEFAULT_TASKS.forEach(dt => {
          if (!titles.has(dt.title.toLowerCase())) mapped.push(dt);
        });
        setTasksList(mapped);
      }
    }).catch(() => {});

    api.get('/team').then(r => {
      if (Array.isArray(r.data) && r.data.length > 0) {
        const mapped = r.data.map((m: any, idx: number) => ({
          id: m.id || `am-${idx}`,
          name: m.name || m.user || 'Team Member',
          role: m.role || m.designation || 'Intern',
          department: m.department || 'Engineering',
          type: 'Team Member'
        }));
        const names = new Set(mapped.map(m => m.name.toLowerCase()));
        DEFAULT_MEMBERS.forEach(dm => {
          if (!names.has(dm.name.toLowerCase())) mapped.push(dm);
        });
        setMembersList(mapped);
      }
    }).catch(() => {});

    api.get('/standups/manager/sync').then(r => {
      const historyArr = r.data && Array.isArray(r.data.history) ? r.data.history : (Array.isArray(r.data) ? r.data : null);
      if (historyArr && historyArr.length > 0) {
        const mapped = historyArr.map((s: any, idx: number) => ({
          id: s.id || `as-${idx}`,
          user: s.user || s.name || 'Intern',
          date: s.dateGroup || s.date || 'Today',
          summary: s.today || s.yesterday || s.summary || s.doing || 'Submitted standup update',
          type: 'Standup'
        }));
        const users = new Set(mapped.map((m: any) => m.user.toLowerCase()));
        DEFAULT_STANDUPS.forEach(ds => {
          if (!users.has(ds.user.toLowerCase())) mapped.push(ds);
        });
        setStandupsList(mapped);
      }
    }).catch(() => {});
  }, [open]);

  // Debounce logic
  useEffect(() => {
    if (query.length >= 1) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
        setIsSearching(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setDebouncedQuery('');
      setIsSearching(false);
    }
  }, [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Filter Data
  const filterResults = (data: any[], type: string) => {
    if (activeFilter !== 'All' && activeFilter !== type) return [];
    if (!debouncedQuery) return data; // Return all items when query is empty
    const q = debouncedQuery.toLowerCase();
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(q)
      )
    );
  };

  const results = {
    projects: filterResults(projectsList, 'Projects'),
    tasks: filterResults(tasksList, 'Tasks'),
    members: filterResults(membersList, 'Team'),
    milestones: filterResults(DEFAULT_MILESTONES, 'Milestones'),
    deadlines: filterResults(DEFAULT_DEADLINES, 'All'),
    standups: filterResults(standupsList, 'Standups'),
    logs: filterResults(logsList, 'Work Logs'),
    notifications: filterResults(DEFAULT_NOTIFICATIONS, 'All'),
  };

  const hasResults = Object.values(results).some(arr => arr.length > 0);
  const showRecent = query.length === 0 && activeFilter === 'All';

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl bg-white dark:bg-slate-950 overflow-hidden"
    >
      <CommandInput 
        placeholder="Search projects, tasks, interns, milestones..." 
        value={query}
        onValueChange={setQuery}
        className="h-14 text-base px-4 border-b-0 focus:ring-0 placeholder:text-slate-400 dark:text-white"
      />
      
      {/* Quick Filters */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-1 overflow-x-auto hide-scrollbar border-b border-slate-100 dark:border-slate-800">
        {FILTERS.map(filter => (
          <Badge 
            key={filter}
            variant="outline"
            className={cn(
              "cursor-pointer transition-colors px-3 py-1 text-xs font-semibold rounded-full",
              activeFilter === filter 
                ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600" 
                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Badge>
        ))}
      </div>

      <CommandList className="max-h-[60vh] p-2">
        {isSearching && (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isSearching && !hasResults && !showRecent && (
          <CommandEmpty className="py-12 px-6 text-center flex flex-col items-center">
            <Search className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-lg font-bold text-slate-900 dark:text-white">No matching results found.</p>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">Try searching by project name, intern name, or task title.</p>
          </CommandEmpty>
        )}

        {showRecent && (
          <CommandGroup heading="Recent Searches" className="text-slate-500 font-semibold px-2">
            {RECENT_SEARCHES.map((search, i) => (
              <CommandItem key={i} onSelect={() => setQuery(search)} className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{search}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isSearching && (debouncedQuery || activeFilter !== 'All') && hasResults && (
          <>
            {results.projects.length > 0 && (
              <CommandGroup heading="📁 Projects" className="px-2 font-semibold">
                {results.projects.map(p => (
                  <CommandItem key={p.id} className="flex items-center justify-between p-3 cursor-pointer rounded-xl data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-slate-900 data-[selected=true]:text-slate-900 dark:data-[selected=true]:text-white transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{p.status}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-700 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.tasks.length > 0 && (
              <CommandGroup heading="📋 Tasks" className="px-2 font-semibold mt-2">
                {results.tasks.map(t => (
                  <CommandItem key={t.id} className="flex items-center justify-between p-3 cursor-pointer rounded-xl data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-slate-900 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500">
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</span>
                        <span className="text-xs font-medium text-slate-500">{t.assignee} • {t.status}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-800">{t.priority}</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.members.length > 0 && (
              <CommandGroup heading="👥 Team Members" className="px-2 font-semibold mt-2">
                {results.members.map(m => (
                  <CommandItem key={m.id} className="flex items-center justify-between p-3 cursor-pointer rounded-xl data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-slate-900 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-800">
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">{m.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</span>
                        <span className="text-xs font-medium text-slate-500">{m.role} • {m.department}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.milestones.length > 0 && (
              <CommandGroup heading="🎯 Milestones" className="px-2 font-semibold mt-2">
                {results.milestones.map(m => (
                  <CommandItem key={m.id} className="flex items-center gap-3 p-3 cursor-pointer rounded-xl data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-slate-900 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Flag className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</span>
                      <span className="text-xs font-medium text-slate-500">{m.project} • {m.date}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {results.deadlines.length > 0 && (
              <CommandGroup heading="📅 Deadlines" className="px-2 font-semibold mt-2">
                {results.deadlines.map(d => (
                  <CommandItem key={d.id} className="flex items-center gap-3 p-3 cursor-pointer rounded-xl data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-slate-900 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{d.title}</span>
                      <span className="text-xs font-medium text-slate-500">{d.date}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.standups.length > 0 && (
              <CommandGroup heading="📝 Standups" className="px-2 font-semibold mt-2">
                {results.standups.map(s => (
                  <CommandItem key={s.id} className="flex items-center gap-3 p-3 cursor-pointer rounded-xl data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-slate-900 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{s.user} • {s.date}</span>
                      <span className="text-xs font-medium text-slate-500">{s.summary}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {results.logs.length > 0 && (
              <CommandGroup heading="⏱ Work Logs" className="px-2 font-semibold mt-2">
                {results.logs.map(l => (
                  <CommandItem key={l.id} className="flex items-center gap-3 p-3 cursor-pointer rounded-xl data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-slate-900 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{l.user} logged time for {l.task}</span>
                      <span className="text-xs font-medium text-slate-500">{l.date}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.notifications.length > 0 && (
              <CommandGroup heading="📢 Notifications" className="px-2 font-semibold mt-2">
                {results.notifications.map(n => (
                  <CommandItem key={n.id} className="flex items-center gap-3 p-3 cursor-pointer rounded-xl data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-slate-900 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{n.text}</span>
                      <span className="text-xs font-medium text-slate-500">{n.time}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
      
      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shadow-sm text-[10px]">↑</kbd> <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shadow-sm text-[10px]">↓</kbd> to navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Enter</kbd> to select</span>
        </div>
        <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Esc</kbd> to close</span>
      </div>
    </CommandDialog>
  );
}
