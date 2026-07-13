import React, { useState, useEffect, Component } from 'react';

class ManagerErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 m-10 bg-rose-50 border border-rose-200 rounded-xl overflow-auto text-rose-900">
          <h2 className="text-page-title mb-4">Dashboard Crash Detected</h2>
          <pre className="text-xs font-mono whitespace-pre-wrap">{this.state.error?.stack || this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import { FileText, MoreVertical, Flag, Clock, Users, CalendarIcon, Briefcase, Plus, PlayCircle, Loader2, ArrowRight, LayoutGrid, Zap, TrendingUp, CheckCircle2, Megaphone, Timer, AlertTriangle, ShieldAlert, BellRing, Target, Fingerprint, Activity, UserPlus, FileEdit, HelpCircle, UserX, X, FolderKanban, CheckSquare, CalendarClock, ChevronRight, ChevronDown } from 'lucide-react';
import { cn, getRelativeTime } from '@/lib/utils';
import ProjectDetails from '../projects/ProjectDetails';
import { getCurrentUser } from '@/lib/auth';
import { useUser } from '@/context/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProjectCalendarWidget } from './ProjectCalendarWidget';
import { Separator } from '@/components/ui/separator';
import { AssignTaskDialog } from './AssignTaskDialog';
import { useProjects } from '@/context/ProjectContext';
import { INITIAL_TASKS } from '@/data/mockData';

// --- Mock Data ---
const TEAM_MEMBERS = [
  { id: '1', name: 'Amanda Smith', role: 'Frontend', status: 'online', initials: 'AS' },
  { id: '2', name: 'Rahul Sharma', role: 'Backend', status: 'busy', initials: 'RS' },
  { id: '3', name: 'Priya Patel', role: 'Data Sci', status: 'leave', initials: 'PP' },
  { id: '4', name: 'Rohan Gupta', role: 'DevOps', status: 'online', initials: 'RG' },
  { id: '5', name: 'Aiden Chen', role: 'Design', status: 'offline', initials: 'AC' },
];

const ONLINE_TEAM_MEMBERS_MANAGER = [
  { id: 'u-1', name: 'Amanda Smith', initials: 'AS', role: 'Frontend Lead', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
  { id: 'u-2', name: 'Rahul Sharma', initials: 'RS', role: 'Backend Developer', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  { id: 'u-3', name: 'Priya Patel', initials: 'PP', role: 'Technical Writer', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  { id: 'u-4', name: 'Tanvy Pandey', initials: 'TP', role: 'Intern Developer', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
];

const ACTIVITY_FEED_MOCK = [
  { id: 'a1', user: 'Rahul Sharma', action: 'completed task', target: 'API Route Setup', time: '10m ago', timestamp: Date.now() - 10 * 60 * 1000, type: 'task' },
  { id: 'a2', user: 'Amanda Smith', action: 'submitted work log', target: '8.5 hours', time: '1h ago', timestamp: Date.now() - 60 * 60 * 1000, type: 'log' },
  { id: 'a3', user: 'System', action: 'created project', target: 'Dashboard UI Revamp', time: '2h ago', timestamp: Date.now() - 2 * 60 * 60 * 1000, type: 'project' },
  { id: 'a4', user: 'Priya Patel', action: 'submitted standup', target: 'Daily Sync', time: '3h ago', timestamp: Date.now() - 3 * 60 * 60 * 1000, type: 'standup' },
  { id: 'a5', user: 'Rohan Gupta', action: 'assigned task to', target: 'Aiden Chen', time: '4h ago', timestamp: Date.now() - 4 * 60 * 60 * 1000, type: 'assign' },
];

const NOTIFICATIONS = [
  { id: 'n1', text: 'Dashboard UI Revamp is delayed.', unread: true },
  { id: 'n2', text: 'New task assigned by Director.', unread: true },
  { id: 'n3', text: 'Blocker reported by Priya.', unread: false },
  { id: 'n4', text: 'Sarah joined the workspace.', unread: false },
];

const DEADLINES = [
  { id: 'd1', task: 'Finalize Auth DB Schema', priority: 'High', assignee: 'Rahul Sharma' },
  { id: 'd2', task: 'Design System Tokens', priority: 'Medium', assignee: 'Aiden Chen' },
  { id: 'd3', task: 'Client Presentation', priority: 'High', assignee: 'Amanda Smith' },
];

const INITIAL_BLOCKERS = [
  {
    id: 'b1',
    user: 'Amanda Smith',
    initials: 'AS',
    avatarColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    priority: 'High Priority',
    priorityColor: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    bgColor: 'bg-rose-50/50 dark:bg-rose-500/5',
    borderColor: 'border-rose-100 dark:border-rose-900/50',
    textColor: 'text-rose-600 dark:text-rose-400',
    hoverBgColor: 'hover:bg-rose-100 dark:hover:bg-rose-500/20',
    hoverTextColor: 'hover:text-rose-700',
    message: 'Figma API token expired and waiting for renewal. Cannot proceed with design implementation.',
  },
  {
    id: 'b2',
    user: 'Priya Patel',
    initials: 'PP',
    avatarColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    priority: 'Blocked Task',
    priorityColor: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    bgColor: 'bg-amber-50/50 dark:bg-amber-500/5',
    borderColor: 'border-amber-100 dark:border-amber-900/50',
    textColor: 'text-amber-600 dark:text-amber-400',
    hoverBgColor: 'hover:bg-amber-100 dark:hover:bg-amber-500/20',
    hoverTextColor: 'hover:text-amber-700',
    message: 'Waiting for data engineering team to provide the cleaned dataset for ML model training.',
  }
];

function ManagerDashboardInner() {
  const { projects } = useProjects();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isActiveInternsModalOpen, setIsActiveInternsModalOpen] = useState(false);
  const [isAllProjectsOpen, setIsAllProjectsOpen] = useState(false);
  const [isAllBlockersOpen, setIsAllBlockersOpen] = useState(false);
  const [messageUser, setMessageUser] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isMessageSent, setIsMessageSent] = useState(false);
  const [blockers, setBlockers] = useState(() => {
    const saved = localStorage.getItem('hindustaan_blockers');
    return saved ? JSON.parse(saved) : INITIAL_BLOCKERS;
  });

  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('hindustaan_notifications');
    if (saved && saved !== 'null') {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return NOTIFICATIONS;
  });

  const [activityFeed, setActivityFeed] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_activity_feed');
    return saved ? JSON.parse(saved) : ACTIVITY_FEED_MOCK;
  });

  const [tasks, setTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_tasks_list');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_TASKS;
    } catch (e) {
      return INITIAL_TASKS;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hindustaan_tasks_list' && e.newValue) {
        setTasks(JSON.parse(e.newValue));
      } else if (e.key === 'hindustaan_activity_feed' && e.newValue) {
        setActivityFeed(JSON.parse(e.newValue));
      } else if (e.key === 'hindustaan_blockers' && e.newValue) {
        setBlockers(JSON.parse(e.newValue));
      } else if (e.key === 'hindustaan_notifications' && e.newValue) {
        setAlerts(JSON.parse(e.newValue));
      }
    };

    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.key === 'hindustaan_tasks_list') {
        setTasks(typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : INITIAL_TASKS);
      } else if (e.detail.key === 'hindustaan_activity_feed') {
        setActivityFeed(typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : ACTIVITY_FEED_MOCK);
      } else if (e.detail.key === 'hindustaan_blockers') {
        setBlockers(typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : INITIAL_BLOCKERS);
      } else if (e.detail.key === 'hindustaan_notifications') {
        setAlerts(typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : NOTIFICATIONS);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate as EventListener);
    };
  }, []);

  const dueTodayTasksCount = (tasks || []).filter(t => t?.due_date?.toLowerCase().includes('today') || t?.due_date?.toLowerCase().includes('12') || t?.due_date?.toLowerCase().includes(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase())).length;

  const [activeSessions, setActiveSessions] = useState<{ [key: string]: { time: number; isOnline: boolean } }>({});

  useEffect(() => {
    const teamMembers = [
      { id: 'u-1', defaultOffset: 2 * 3600 + 15 * 60 + 30 },
      { id: 'u-2', defaultOffset: 3600 + 45 * 60 + 12 },
      { id: 'u-3', defaultOffset: 45 * 60 + 5 },
      { id: 'u-4', defaultOffset: 3 * 3600 + 10 * 60 + 40 }
    ];

    const updateSessions = () => {
      const sessions: { [key: string]: { time: number; isOnline: boolean } } = {};
      teamMembers.forEach(member => {
        const loginTimeStr = localStorage.getItem(`login_time_${member.id}`);
        if (loginTimeStr) {
          const startTime = parseInt(loginTimeStr, 10);
          sessions[member.id] = { time: Math.floor((Date.now() - startTime) / 1000), isOnline: true };
        } else {
          // Changed to actually reflect offline status if real data doesn't exist
          sessions[member.id] = { time: 0, isOnline: false };
        }
      });
      setActiveSessions(sessions);
    };

    updateSessions();
    const interval = setInterval(updateSessions, 1000);
    return () => clearInterval(interval);
  }, []);

  const allMappedProjects: any[] = (projects || []).map(p => {
    if (!p) return null;
    const completedTasks = (p.tasks || []).filter((t: any) => t?.status === 'Done').length || 0;
    const totalTasks = (p.tasks || []).length || 0;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    return {
      id: p.id,
      name: p.name,
      progress,
      dueDate: p.deadline || 'TBD',
      status: p.status
    };
  }).filter(Boolean);

  const mappedProjects: any[] = allMappedProjects.slice(0, 5);

  const dynamicDeadlines = React.useMemo(() => {
    return (tasks || [])
      .filter(t => t && t.status !== 'Done')
      .filter(t => t.due_date?.toLowerCase().includes('today') || t.due_date?.toLowerCase().includes('12') || t.due_date?.toLowerCase().includes(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()))
      .sort((a, b) => {
        if (a.priority === 'High' && b.priority !== 'High') return -1;
        if (b.priority === 'High' && a.priority !== 'High') return 1;
        return 0;
      })
      .slice(0, 4)
      .map(t => ({
        id: t.id,
        task: t.title,
        priority: t.priority || 'High',
        assignee: t.assignee_name || t.assignee || 'Unassigned'
      }));
  }, [tasks]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  const { user: contextUser } = useUser();
  const currentUser = getCurrentUser();
  const userName = contextUser?.name || currentUser?.name || 'Manager';

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'On Track': return 'secondary';
      case 'At Risk': return 'destructive';
      case 'Completed': return 'default';
      default: return 'outline';
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'On Track': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20';
      case 'At Risk': return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20';
      case 'Completed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700';
      case 'Aborted': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30';
      case 'In Progress': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  if (selectedProject) {
    return (
      <ProjectDetails
        project={{
          ...selectedProject,
          deadline: selectedProject.dueDate,
          manager: 'Aakash Gupta',
          strokeColor: '#f97316',
          iconColor: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
        }}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-page-title tracking-tight text-slate-900 dark:text-white break-words whitespace-normal">
            {greeting}, {userName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-orange-500 font-medium tracking-wide mt-1 break-words whitespace-normal">
            {currentUser?.designation || "Product Manager"}
          </p>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium break-words whitespace-normal">
            Manage projects, monitor team performance, and track progress from one place.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <FolderKanban className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10">Active</Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{(projects || []).length}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Total Projects</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CheckSquare className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">All time</Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{(projects || []).reduce((acc: number, p: any) => acc + (p.tasks?.length || 0), 0)}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Total Tasks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10">High Pri</Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{dueTodayTasksCount}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Tasks Due Today</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setIsActiveInternsModalOpen(true)}
          className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-blue-500/30 active:scale-98"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10">100% On</Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">30</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Active Interns</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <CalendarClock className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">Sync at 11</Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">6</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Pending Standups</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10">+4.2%</Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">92%</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Team Productivity</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Modern Project Calendar Widget */}
          <ProjectCalendarWidget />

          {/* Project Progress Overview */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2" />
                  Project Progress Overview
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Top 5 active projects across all cohorts.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsAllProjectsOpen(true)} variant="ghost" size="sm" className="text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-300 h-8 cursor-pointer">
                  View All <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pt-2">
                  {mappedProjects.map((project: any) => (
                    <div key={project?.id || Math.random()} className="group flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {project?.name}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", getStatusBadgeStyles(project?.status || 'Active'))}>
                            {project?.status}
                          </Badge>
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Due: {project?.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={project?.progress || 0} className={cn("h-2 flex-1", project?.status === 'Aborted' ? 'bg-rose-100 dark:bg-rose-900/40 [&>div]:bg-rose-500' : 'bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500 dark:[&>div]:bg-orange-400')} />
                        <div className="flex items-center gap-1 justify-end w-16 shrink-0">
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{project?.progress || 0}%</span>
                          <button
                            onClick={() => setSelectedProject(project)}
                            className="flex items-center justify-center h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-orange-600 transition-colors shrink-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Active Blockers & Risks */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 mr-2" />
                  Active Blockers & Risks
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Impediments requiring your immediate attention.</CardDescription>
              </div>
              <Button onClick={() => setIsAllBlockersOpen(true)} variant="ghost" size="sm" className="text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blockers.length === 0 ? (
                  <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No active blockers at the moment.
                  </div>
                ) : (
                  blockers.map((blocker: any) => {
                    const isResolved = (blocker as any).resolved;
                    return (
                      <div key={blocker.id} className={cn("flex flex-col gap-2 p-3.5 rounded-xl border relative transition-all duration-300", isResolved ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/50" : cn(blocker.borderColor, blocker.bgColor))}>
                        {isResolved && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.02]">
                            <CheckCircle2 className="w-24 h-24 text-emerald-600" />
                          </div>
                        )}
                        <div className={cn("flex items-center justify-between", isResolved && "opacity-75")}>
                          <div className="flex items-center gap-2">
                            <Avatar className={cn("h-6 w-6", isResolved && "opacity-60 grayscale")}>
                              <AvatarFallback className={cn("text-[10px] font-bold", isResolved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : blocker.avatarColor)}>{blocker.initials}</AvatarFallback>
                            </Avatar>
                            <span className={cn("font-bold text-sm", isResolved ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600" : "text-slate-900 dark:text-white")}>{blocker.user}</span>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px]", isResolved ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" : blocker.priorityColor)}>
                            {isResolved ? "Resolved" : blocker.priority}
                          </Badge>
                        </div>
                        <p className={cn("text-sm font-medium ml-8", isResolved ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-400")}>
                          {blocker.message}
                        </p>

                        {!isResolved && (
                          <div className="flex items-center gap-3 ml-8 mt-1 relative z-10">
                            <Button
                              onClick={() => {
                                setBlockers((prev: any[]) => prev.map((b: any) => b.id === blocker.id ? { ...b, resolved: true } : b));
                                import('sonner').then(m => m.toast.success('Blocker Resolved', { description: `Resolved for ${blocker.user}. The employee has been notified directly.` }));
                              }}
                              variant="ghost"
                              size="sm"
                              className={cn("h-7 text-xs px-2 font-bold cursor-pointer", blocker.textColor, blocker.hoverTextColor, blocker.hoverBgColor)}
                            >
                              Resolve
                            </Button>
                            <Button
                              onClick={() => setMessageUser(blocker.user)}
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-2 font-semibold cursor-pointer"
                            >
                              Message
                            </Button>
                          </div>
                        )}
                        {(blocker as any).managerMessage && (
                          <div className={cn("ml-8 mt-2 p-3 rounded-xl border shadow-sm relative overflow-hidden", isResolved ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-800/30 opacity-75" : "bg-white/60 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/50")}>
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1", isResolved ? "bg-emerald-500/30" : "bg-orange-500/50")}></div>
                            <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isResolved ? "text-emerald-600/70 dark:text-emerald-400/70" : "text-slate-500 dark:text-slate-400")}>Your Reply</p>
                            <p className={cn("text-sm italic font-medium", isResolved ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200")}>"{(blocker as any).managerMessage}"</p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">

          {/* Team Activity Feed */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <Megaphone className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2" />
                  Team Activity Feed
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Real-time pulse of workspace execution.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pt-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                  {activityFeed.map((activity) => (
                    <div key={activity.id} className="relative pl-6">
                      <div className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-950" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 text-xs font-bold rounded-lg">
                              {(activity.user || 'Unknown').split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
                              <span className="font-bold text-slate-900 dark:text-white">{activity.user || 'Unknown User'}</span> {activity.action} <span className="font-bold text-slate-900 dark:text-white">{activity.target}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap pt-1">
                          {getRelativeTime(activity.timestamp || activity.time, true)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Today's Deadlines */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Today's Deadlines</span>
                  <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 shrink-0">{dueTodayTasksCount} Due</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {dynamicDeadlines.map((deadline) => (
                  <div key={deadline.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{deadline.task}</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 rounded-full">
                          <AvatarFallback className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[8px] font-bold">
                            {(deadline.assignee || 'Unassigned').split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{deadline.assignee || 'Unassigned'}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => { import('sonner').then(m => m.toast.info(`Viewing details for: ${deadline.task}`)) }} className="font-semibold text-xs cursor-pointer">View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsAssignTaskOpen(true)} className="font-semibold text-xs cursor-pointer text-orange-600 dark:text-orange-400 focus:text-orange-600">Reassign</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Active Sessions */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <Clock className="h-4 w-4 text-emerald-500 mr-2 animate-pulse" />
                Live Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {ONLINE_TEAM_MEMBERS_MANAGER.map((member) => {
                  const sessionInfo = activeSessions[member.id];
                  const isOnline = sessionInfo?.isOnline;
                  const sessionTime = sessionInfo?.time || 0;
                  return (
                    <div key={member.id} className={cn("p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors", !isOnline && "opacity-75")}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className={cn("h-8 w-8 rounded-full border-2 border-white dark:border-slate-950", !isOnline && "grayscale opacity-80")}>
                            <AvatarFallback className={cn("text-xs font-bold", member.color)}>
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline ? (
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse" />
                          ) : (
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-950" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{member.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{member.role}</span>
                        </div>
                      </div>
                      {isOnline ? (
                        <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center space-x-1 font-mono text-xs font-bold animate-pulse">
                          <Timer className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{formatTime(sessionTime)}</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 rounded-lg flex items-center space-x-1 font-mono text-xs font-bold">
                          <Timer className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                          <span className="uppercase tracking-wider text-[10px]">Offline</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex-1 flex flex-col min-h-[200px]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <BellRing className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full max-h-[250px]">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {alerts.map((notif: any) => (
                    <div
                      key={notif.id}
                      onClick={() => { import('sonner').then(m => m.toast.success(`Opening system: ${notif.text}`)) }}
                      className={cn("p-4 flex gap-3 items-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer", notif.unread ? 'bg-slate-50/50 dark:bg-slate-900/20' : '')}
                    >
                      <div className="mt-1 shrink-0">
                        {notif.unread ? (
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className={cn("text-sm font-medium leading-snug", notif.unread ? "text-slate-900 dark:text-white font-bold" : "text-slate-600 dark:text-slate-400")}>
                          {notif.message || notif.text}
                        </p>
                        <span className="text-[10px] text-orange-500 font-bold mt-1 uppercase tracking-wider">Tap to open system</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Active Interns Modal */}
      {isActiveInternsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsActiveInternsModalOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Interns</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Names and online status of active interns</p>
              </div>
              <button
                onClick={() => setIsActiveInternsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[300px] overflow-y-auto space-y-4">
              {ONLINE_TEAM_MEMBERS_MANAGER.map((member) => {
                const isOnline = activeSessions[member.id]?.isOnline;
                return (
                  <div key={member.id} className={cn("flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-850 transition-all", !isOnline && "opacity-75 grayscale")}>
                    <div className="flex items-center gap-3">
                      <Avatar className={cn("h-9 w-9 border-2 border-white dark:border-slate-900", member.color)}>
                        <AvatarFallback className="font-bold text-xs">{member.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{member.name}</span>
                        <span className="text-xs text-slate-500 font-medium">{member.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isOnline ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Online</span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span className="text-xs font-bold text-slate-500">Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button onClick={() => setIsActiveInternsModalOpen(false)} className="rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white font-bold px-4 py-2 cursor-pointer">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}


      <AssignTaskDialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen} />

      <Dialog
        open={!!messageUser}
        onOpenChange={(open) => {
          if (!open) {
            setMessageUser(null);
            setTimeout(() => {
              setMessageText("");
              setIsMessageSent(false);
            }, 300); // delay reset so it doesn't flash during closing animation
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl p-0 overflow-hidden">
          {!isMessageSent ? (
            <>
              <div className="bg-orange-50/50 dark:bg-orange-500/10 p-6 pb-4 border-b border-orange-100 dark:border-orange-900/30">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-900 shadow-sm">
                      <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 text-sm font-bold">
                        {(messageUser || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>Message {messageUser?.split(' ')[0]}</span>
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium pt-2">
                    Send a direct, high-priority message regarding this blocker to help them get unblocked faster.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-6 pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Your Message</Label>
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Hey ${messageUser?.split(' ')[0]}, how can I help unblock you with this?`}
                    className="min-h-[120px] rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500 text-slate-900 dark:text-white resize-none text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
              <DialogFooter className="p-6 pt-0 sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setMessageUser(null)} className="rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!messageText.trim()}
                  onClick={() => {
                    setBlockers((prev: any[]) => prev.map((b: any) => b.user === messageUser ? { ...b, managerMessage: messageText } : b));
                    setIsMessageSent(true);
                  }}
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <Megaphone className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-300">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Your message has been delivered to <span className="font-bold text-slate-700 dark:text-slate-200">{messageUser}</span>.</p>
              </div>
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 text-left relative">
                <span className="absolute -top-2.5 left-4 bg-white dark:bg-slate-900 px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">What you said</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap">{messageText}</p>
              </div>
              <Button
                onClick={() => setMessageUser(null)}
                className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold mt-4 cursor-pointer hover:scale-[1.02] transition-transform"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* All Projects Modal */}
      <Dialog open={isAllProjectsOpen} onOpenChange={setIsAllProjectsOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center">
              <Activity className="mr-2 h-5 w-5 text-orange-600 dark:text-orange-400" />
              All Active Projects
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              A comprehensive list of all projects across cohorts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-4">
                {allMappedProjects.map((project: any) => (
                  <div key={project?.id || Math.random()} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all">
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {project?.name}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", getStatusBadgeStyles(project?.status || 'Active'))}>
                          {project?.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={project?.progress} className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 w-8">{project?.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                {allMappedProjects.length === 0 && (
                  <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No active projects found.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Blockers Modal */}
      <Dialog open={isAllBlockersOpen} onOpenChange={setIsAllBlockersOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-rose-600 dark:text-orange-400" />
              All Blockers & Escalations
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              View all active blockers that require your attention.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-4">
                {blockers.map((blocker: any) => {
                  const isResolved = (blocker as any).resolved;
                  return (
                    <div key={blocker.id} className={cn("flex flex-col gap-2 p-3.5 rounded-xl border relative transition-all duration-300", isResolved ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/50" : cn(blocker.borderColor, blocker.bgColor))}>
                      {isResolved && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.02]">
                          <CheckCircle2 className="w-24 h-24 text-emerald-600" />
                        </div>
                      )}
                      <div className={cn("flex items-center justify-between", isResolved && "opacity-75")}>
                        <div className="flex items-center gap-2">
                          <Avatar className={cn("h-6 w-6", isResolved && "opacity-60 grayscale")}>
                            <AvatarFallback className={cn("text-[10px] font-bold", isResolved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : blocker.avatarColor)}>{blocker.initials}</AvatarFallback>
                          </Avatar>
                          <span className={cn("font-bold text-sm", isResolved ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600" : "text-slate-900 dark:text-white")}>{blocker.user}</span>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px]", isResolved ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" : blocker.priorityColor)}>
                          {isResolved ? "Resolved" : blocker.priority}
                        </Badge>
                      </div>
                      <p className={cn("text-sm font-medium ml-8", isResolved ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-400")}>
                        {blocker.message}
                      </p>
                    </div>
                  )
                })}
                {blockers.length === 0 && (
                  <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No active blockers.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ManagerDashboard() {
  return (
    <ManagerErrorBoundary>
      <ManagerDashboardInner />
    </ManagerErrorBoundary>
  );
}
