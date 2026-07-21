import React, { useState, useEffect, Component } from 'react';
import api from '@/lib/api';

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
          <h2 className="text-xl font-bold mb-4">Dashboard Crash Detected</h2>
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
import { useNotifications } from '@/context/NotificationContext';
import { useSocket } from '@/context/SocketContext';

// --- Mock Data Removed ---
const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  const s = totalSeconds % 60;
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
};

const formatCheckTime = (timeStr?: string | Date | null) => {
  if (!timeStr) return '--:--';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '--:--';
  }
};

const LiveTimer = ({ initialSeconds, sessionStart, isOnline }: { initialSeconds: number; sessionStart?: string | Date | null; isOnline?: boolean }) => {
  const computedInitial = React.useMemo(() => {
    if (isOnline && sessionStart) {
      try {
        const startMs = new Date(sessionStart).getTime();
        const nowMs = Date.now();
        if (startMs <= nowMs && !isNaN(startMs)) {
          const elapsed = Math.floor((nowMs - startMs) / 1000);
          return Math.max(initialSeconds, elapsed);
        }
      } catch (e) {}
    }
    return initialSeconds;
  }, [initialSeconds, sessionStart, isOnline]);

  const [startClock, setStartClock] = React.useState(Date.now() - computedInitial * 1000);
  const [seconds, setSeconds] = React.useState(computedInitial);

  React.useEffect(() => {
    if (Math.abs(computedInitial - seconds) > 15) {
      setStartClock(Date.now() - computedInitial * 1000);
      setSeconds(computedInitial);
    }
  }, [computedInitial, seconds]);

  React.useEffect(() => {
    const int = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startClock) / 1000));
    }, 1000);
    return () => clearInterval(int);
  }, [startClock]);

  return <>{formatTime(seconds)}</>;
};

function ManagerDashboardInner() {
  const { projects } = useProjects();
  const { notifications } = useNotifications();
  const { socket } = useSocket();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isAllDeadlinesOpen, setIsAllDeadlinesOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isActiveInternsModalOpen, setIsActiveInternsModalOpen] = useState(false);
  const [isAllProjectsOpen, setIsAllProjectsOpen] = useState(false);
  const [isAllBlockersOpen, setIsAllBlockersOpen] = useState(false);
  const [messageUser, setMessageUser] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isMessageSent, setIsMessageSent] = useState(false);
  const [activeInternsPage, setActiveInternsPage] = useState(1);
  const internsPerPage = 5;
  const [blockers, setBlockers] = useState<any[]>([]);

  const [alerts, setAlerts] = useState<any[]>([]);

  const [activityFeed, setActivityFeed] = useState<any[]>([]);

  const [tasks, setTasks] = useState<any[]>([]);

  // Live dashboard stats from backend
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [liveTeamMembers, setLiveTeamMembers] = useState<any[]>([]);
  const lastDataRef = React.useRef<string | null>(null);

  const fetchDashboard = React.useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        const data = res.data.data;
        const dataString = JSON.stringify(data);
        if (lastDataRef.current !== dataString) {
          lastDataRef.current = dataString;
          React.startTransition(() => {
            setDashboardStats(data);
            setLiveTeamMembers(data.liveTeamMembers || []);
            setActivityFeed(data.activityFeed || []);
            setAlerts(data.recentAlerts || []);

            if (data.blockersList && data.blockersList.length > 0) {
              const savedMsgs = JSON.parse(localStorage.getItem('hindustaan_manager_messages') || '{}');
              const mappedBlockers = data.blockersList.map((b: any, i: number) => ({
                id: b.id,
                user: b.userName,
                initials: b.initials,
                avatarColor: i % 2 === 0
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                priority: 'Blocker',
                priorityColor: i % 2 === 0
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
                bgColor: i % 2 === 0 ? 'bg-rose-50/50 dark:bg-rose-500/5' : 'bg-amber-50/50 dark:bg-amber-500/5',
                borderColor: i % 2 === 0 ? 'border-rose-100 dark:border-rose-900/50' : 'border-amber-100 dark:border-amber-900/50',
                textColor: i % 2 === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400',
                hoverBgColor: i % 2 === 0 ? 'hover:bg-rose-100 dark:hover:bg-rose-500/20' : 'hover:bg-amber-100 dark:hover:bg-amber-500/20',
                hoverTextColor: i % 2 === 0 ? 'hover:text-rose-700' : 'hover:text-amber-700',
                message: b.blockerText,
                resolved: b.resolved,
                resolvedByName: b.resolvedByName || null,
                managerMessage: savedMsgs[b.id] || undefined
              }));
              setBlockers(mappedBlockers);
            } else {
              setBlockers([]);
            }
          });
        }
      }

      // Fetch live tasks from PostgreSQL DB for Today's Deadlines
      const tasksRes = await api.get('/tasks');
      if (tasksRes.data?.success && Array.isArray(tasksRes.data.data)) {
        const dbTasks = tasksRes.data.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status === 'done' || t.status === 'completed' ? 'Done' :
            t.status === 'in-progress' ? 'In Progress' : 'To Do',
          priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
          due_date: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          assignee_name: t.assignees?.[0]?.user?.name || t.assignee?.name || 'Unassigned'
        }));
        setTasks(dbTasks);
      }
    } catch (err) {
      console.warn('Manager dashboard fetch failed, using local data:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    
    if (socket) {
      socket.on('dashboard_update', () => {
        console.log('Received real-time dashboard update from server');
        fetchDashboard();
      });

      return () => {
        socket.off('dashboard_update');
      };
    }
  }, [fetchDashboard, socket]);


  useEffect(() => {
    // ONE-TIME PURGE of legacy mock data from local storage
    const legacyKeys = [
      'hindustaan_calendar_events',
      'hindustaan_activity_feed',
      'hindustaan_blockers',
      'hindustaan_tasks_list',
      'hindustaan_notifications',
      'hindustaan_standups',
      'hindustaan_standup_history',
      'hindustaan_manager_messages'
    ];
    legacyKeys.forEach(key => localStorage.removeItem(key));
  }, []);

  const dueTodayTasksCount = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return (tasks || []).filter((t: any) => {
      if (!t?.due_date) return false;
      const dStr = t.due_date.includes('T') ? t.due_date.split('T')[0] : t.due_date;
      return dStr <= todayStr && t.status !== 'Done' && t.status !== 'completed' && t.status !== 'done';
    }).length;
  }, [tasks]);

  const [activeSessions, setActiveSessions] = useState<{ [key: string]: { time: number; isOnline: boolean } }>({});

  useEffect(() => {
    const updateSessions = () => {
      const sessions: { [key: string]: { time: number; isOnline: boolean } } = {};
      const todayStr = new Date().toDateString();

      liveTeamMembers.forEach(member => {
        let activeSeconds = member.todayActiveSeconds || 0;
        let isOnline = member.isOnline || false;

        if (member.currentSessionStart) {
          const start = new Date(member.currentSessionStart).getTime();
          activeSeconds += Math.floor((Date.now() - start) / 1000);
          isOnline = true;
        }

        sessions[member.id] = { time: activeSeconds, isOnline };
      });
      setActiveSessions(sessions);
    };

    updateSessions();
  }, [liveTeamMembers]);

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
    const todayStr = new Date().toISOString().split('T')[0];
    const filtered = (tasks || []).filter((t: any) => {
      if (!t || t.status === 'Done' || t.status === 'completed' || t.status === 'done') return false;
      const rawDate = t.due_date || t.dueDate || '';
      const dStr = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
      return dStr <= todayStr || rawDate.toLowerCase().includes('today');
    });

    return filtered
      .sort((a: any, b: any) => {
        if (a.priority === 'High' && b.priority !== 'High') return -1;
        if (b.priority === 'High' && a.priority !== 'High') return 1;
        return 0;
      })
      .map((t: any) => ({
        id: t.id,
        task: t.title || t.task,
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
          manager: currentUser?.name || 'Manager',
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
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white wrap-break-word whitespace-normal">
            {greeting}, {userName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-orange-500 font-medium tracking-wide mt-1 wrap-break-word whitespace-normal">
            {currentUser?.designation || "Product Manager"}
          </p>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium wrap-break-word whitespace-normal">
            Manage projects, monitor team performance, and track progress from one place.
          </p>
        </div>

        {/* Check-in / Check-out Status & Live Duration Card */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-sm shrink-0">
          <div className="flex items-center gap-3 pr-3 border-r border-slate-200 dark:border-slate-800">
            <div className={cn("h-3 w-3 rounded-full shrink-0", (dashboardStats?.isOnline || dashboardStats?.checkinTime) ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {(dashboardStats?.isOnline || dashboardStats?.checkinTime) ? "Checked In" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Check In</p>
              <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCheckTime(dashboardStats?.checkinTime || dashboardStats?.todayFirstLogin || dashboardStats?.currentSessionStart)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Check Out</p>
              <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                {dashboardStats?.checkoutTime ? formatCheckTime(dashboardStats.checkoutTime) : (dashboardStats?.isOnline || dashboardStats?.currentSessionStart) ? <span className="text-amber-500 text-xs uppercase font-extrabold">Working</span> : "--:--"}
              </p>
            </div>
          </div>
          <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Duration</p>
            <p className="text-sm font-mono font-black text-orange-600 dark:text-orange-400">
              {(dashboardStats?.isOnline || dashboardStats?.currentSessionStart) ? (
                <LiveTimer initialSeconds={dashboardStats?.todayActiveSeconds || 0} sessionStart={dashboardStats?.currentSessionStart} isOnline={dashboardStats?.isOnline} />
              ) : (
                formatTime(dashboardStats?.todayActiveSeconds || 0)
              )}
            </p>
          </div>
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
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{dashboardStats?.totalProjectsCount ?? (projects || []).length}</p>
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
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{dashboardStats?.totalTasksCount ?? (projects || []).reduce((acc: number, p: any) => acc + (p.tasks?.length || 0), 0)}</p>
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
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{Math.max(dashboardStats?.dueTodayTasksCount || 0, dueTodayTasksCount)}</p>
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
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10">
                {(() => {
                  const online = dashboardStats?.liveTeamMembers?.filter((m: any) => m.isOnline || !!m.currentSessionStart)?.length || 0;
                  return `${online} Online`;
                })()}
              </Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {dashboardStats?.liveTeamMembers?.length || dashboardStats?.activeInternsCount || 0}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Active Employees</p>
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
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{dashboardStats?.pendingStandupsCount ?? 0}</p>
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
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase font-bold border",
                (dashboardStats?.teamProductivity ?? 0) >= 50
                  ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10"
                  : "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10"
              )}>
                {(dashboardStats?.teamProductivity ?? 0) >= 50 ? '↑' : '↓'} {dashboardStats?.teamProductivity ?? 0}%
              </Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{dashboardStats?.teamProductivity ?? 0}%</p>
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
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-100">
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
                  {mappedProjects.length === 0 ? (
                    <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No active projects.
                    </div>
                  ) : (
                    mappedProjects.map((project: any) => (
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
                          <Progress value={project?.progress || 0} className={cn("h-2 flex-1", project?.status === 'Aborted' ? 'bg-rose-100 dark:bg-rose-900/40 [&>div]:bg-rose-500' : 'bg-slate-100 dark:bg-slate-700 [&>div]:bg-orange-500 dark:[&>div]:bg-orange-400')} />
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
                    )))}
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
                              onClick={async () => {
                                try {
                                  await api.patch(`/standups/${blocker.id}/resolve-blocker`);
                                  // Invalidate cache so the next poll fetches fresh resolved state
                                  lastDataRef.current = null;
                                  await fetchDashboard();
                                  import('sonner').then(m => m.toast.success('Blocker Resolved', { description: `Resolved for ${blocker.user}. Status saved to database.` }));
                                } catch (err: any) {
                                  const msg = err?.response?.data?.message || 'Failed to resolve blocker';
                                  import('sonner').then(m => m.toast.error('Error', { description: msg }));
                                }
                              }}
                              variant="ghost"
                              size="sm"
                              className={cn("h-7 text-xs px-2 font-bold cursor-pointer", blocker.textColor, blocker.hoverTextColor, blocker.hoverBgColor)}
                            >
                              Resolve
                            </Button>
                            <Button
                              onClick={() => setMessageUser(blocker.id)}
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
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-87.5">
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
                  {activityFeed.length === 0 ? (
                    <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl -ml-3">
                      No activity to display.
                    </div>
                  ) : (
                    activityFeed.map((activity) => (
                      <div key={activity.id} className="relative pl-6">
                        <div className="absolute -left-6.25 top-1.5 h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-950" />
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
                    )))}
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
                {dynamicDeadlines.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 italic text-center">No impending deadlines.</div>
                ) : (
                  (isAllDeadlinesOpen ? dynamicDeadlines : dynamicDeadlines.slice(0, 4)).map((deadline) => (
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
                  )))}
              </div>
              {dynamicDeadlines.length > 4 && (
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAllDeadlinesOpen(!isAllDeadlinesOpen)}
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 cursor-pointer w-full"
                  >
                    {isAllDeadlinesOpen ? "View Less" : `View All (${dynamicDeadlines.length})`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Active Sessions */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  Live Active Sessions
                </CardTitle>
                {liveTeamMembers.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsActiveInternsModalOpen(true)}
                    className="text-xs h-7 px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shrink-0"
                  >
                    View All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {liveTeamMembers.length === 0 && (
                  <div className="p-4 text-sm text-slate-500 italic text-center">No team members active.</div>
                )}
                {liveTeamMembers.slice(0, 5).map((member) => {
                  const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
                  const currentUserObj = userStr ? JSON.parse(userStr) : null;
                  const currentUserId = currentUserObj?.id;
                  const currentUserEmail = currentUserObj?.email?.toLowerCase();

                  const isCurrentLoggedInUser = (currentUserId && currentUserId === member.id) ||
                    (currentUserEmail && member.email && currentUserEmail === member.email.toLowerCase()) ||
                    (currentUserObj?.name && member.name && currentUserObj.name.toLowerCase() === member.name.toLowerCase());

                  const isOnline = !!(activeSessions[member.id]?.isOnline || member.isOnline || isCurrentLoggedInUser);
                  const sessionTime = activeSessions[member.id]?.time || 0;
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{member.name}</span>
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black px-1 py-0 rounded uppercase border",
                              member.userRole === 'manager' || member.role?.toLowerCase()?.includes('manager')
                                ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                                : member.userRole === 'admin' || member.role?.toLowerCase()?.includes('admin')
                                ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                                : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
                            )}>
                              {member.userRole === 'manager' || member.role?.toLowerCase()?.includes('manager') ? 'MGR' : member.userRole === 'admin' || member.role?.toLowerCase()?.includes('admin') ? 'ADM' : 'EMP'}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">{member.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {isOnline ? (
                          <Badge variant="outline" className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 hidden sm:flex">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span>Online</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1.5 hidden sm:flex">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                            <span>Offline</span>
                          </Badge>
                        )}
                        {isOnline ? (
                          <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center space-x-1 font-mono text-xs font-bold animate-pulse" title="Check-in Duration Today">
                            <Timer className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span><LiveTimer initialSeconds={sessionTime || member.todayActiveSeconds || 0} sessionStart={member.currentSessionStart} isOnline={isOnline} /></span>
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 rounded-lg flex items-center space-x-1 font-mono text-xs font-bold" title="Check-in Duration Today">
                            <Timer className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{formatTime(sessionTime || member.todayActiveSeconds || 0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex-1 flex flex-col min-h-50">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <BellRing className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full max-h-62.5">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 && alerts.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 italic text-center">No alerts.</div>
                  ) : (
                    (notifications && notifications.length > 0 ? notifications.slice(0, 6) : alerts).map((notif: any) => (
                      <div
                        key={notif.id}
                        onClick={() => { import('sonner').then(m => m.toast.info(`${notif.title || 'System Alert'}: ${notif.message || notif.text}`)) }}
                        className={cn("p-4 flex gap-3 items-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer", notif.unread ? 'bg-orange-50/30 dark:bg-orange-500/5' : '')}
                      >
                        <div className="mt-1 shrink-0">
                          {notif.unread ? (
                            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          {notif.title && (
                            <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{notif.title}</p>
                          )}
                          <p className={cn("text-xs font-medium leading-snug", notif.unread ? "text-slate-800 dark:text-slate-200 font-semibold" : "text-slate-600 dark:text-slate-400")}>
                            {notif.message || notif.text}
                          </p>
                          <span className="text-[10px] text-orange-500 font-bold mt-1 uppercase tracking-wider">{notif.time || 'Tap to view details'}</span>
                        </div>
                      </div>
                    )))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Active Employees Modal */}
      {isActiveInternsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsActiveInternsModalOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800/80 shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Employees</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Names and online status of active employees</p>
              </div>
              <button
                onClick={() => setIsActiveInternsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-75 overflow-y-auto space-y-4">
              {liveTeamMembers.length === 0 ? (
                <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No employees currently online.
                </div>
              ) : (
                liveTeamMembers.slice((activeInternsPage - 1) * internsPerPage, activeInternsPage * internsPerPage).map((member) => {
                  const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
                  const currentUserObj = userStr ? JSON.parse(userStr) : null;
                  const currentUserId = currentUserObj?.id;
                  const isCurrentLoggedInUser = (currentUserId && currentUserId === member.id);

                  const isOnline = !!(activeSessions[member.id]?.isOnline || member.isOnline || isCurrentLoggedInUser);
                  return (
                    <div key={member.id} className={cn("flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-850 transition-all", !isOnline && "opacity-75 grayscale")}>
                      <div className="flex items-center gap-3">
                        <Avatar className={cn("h-9 w-9 border-2 border-white dark:border-slate-900", member.color)}>
                          <AvatarFallback className="font-bold text-xs">{member.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{member.name}</span>
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black px-1.5 py-0 rounded uppercase border",
                              member.userRole === 'manager' || member.role?.toLowerCase()?.includes('manager')
                                ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                                : member.userRole === 'admin' || member.role?.toLowerCase()?.includes('admin')
                                ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                                : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
                            )}>
                              {member.userRole === 'manager' || member.role?.toLowerCase()?.includes('manager') ? 'MANAGER' : member.userRole === 'admin' || member.role?.toLowerCase()?.includes('admin') ? 'ADMIN' : 'EMPLOYEE'}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500 font-medium mt-0.5">{member.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {isOnline ? (
                          <Badge variant="outline" className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span>Online</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                            <span>Offline</span>
                          </Badge>
                        )}
                        <div className="flex items-center gap-1.5 min-w-[95px] justify-end">
                          {isOnline ? (
                            <div className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center space-x-1.5 font-mono text-xs font-bold animate-pulse border border-emerald-200/50 dark:border-emerald-500/20">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                              <span><LiveTimer initialSeconds={activeSessions[member.id]?.time || member.todayActiveSeconds || 0} sessionStart={member.currentSessionStart} isOnline={isOnline} /></span>
                            </div>
                          ) : (
                            <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center space-x-1.5 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
                              <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                              <span>{formatTime(activeSessions[member.id]?.time || member.todayActiveSeconds || 0)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveInternsPage(p => Math.max(1, p - 1))}
                  disabled={activeInternsPage === 1}
                  variant="outline" size="sm" className="h-8">Previous</Button>
                <Button
                  onClick={() => setActiveInternsPage(p => Math.min(Math.ceil(liveTeamMembers.length / internsPerPage), p + 1))}
                  disabled={activeInternsPage >= Math.ceil(liveTeamMembers.length / internsPerPage)}
                  variant="outline" size="sm" className="h-8">Next</Button>
              </div>
              <Button onClick={() => setIsActiveInternsModalOpen(false)} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 font-bold px-6">
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
        <DialogContent className="sm:max-w-106.25 rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl p-0 overflow-hidden">
          {!isMessageSent ? (
            <>
              <div className="bg-orange-50/50 dark:bg-orange-500/10 p-6 pb-4 border-b border-orange-100 dark:border-orange-900/30">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-900 shadow-sm">
                      <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 text-sm font-bold">
                        {(blockers.find((b: any) => b.id === messageUser)?.user || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>Message {blockers.find((b: any) => b.id === messageUser)?.user?.split(' ')[0]}</span>
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
                    placeholder={`Hey ${blockers.find((b: any) => b.id === messageUser)?.user?.split(' ')[0]}, how can I help unblock you with this?`}
                    className="min-h-30 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500 text-slate-900 dark:text-white resize-none text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
                    setBlockers((prev: any[]) => prev.map((b: any) => b.id === messageUser ? { ...b, managerMessage: messageText } : b));
                    const savedMsgs = JSON.parse(localStorage.getItem('hindustaan_manager_messages') || '{}');
                    if (messageUser) {
                      savedMsgs[messageUser] = messageText;
                      localStorage.setItem('hindustaan_manager_messages', JSON.stringify(savedMsgs));
                    }
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
                <p className="text-slate-500 dark:text-slate-400 font-medium">Your message has been delivered to <span className="font-bold text-slate-700 dark:text-slate-200">{blockers.find((b: any) => b.id === messageUser)?.user}</span>.</p>
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
        <DialogContent className="sm:max-w-106.25 md:max-w-150 rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
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
            <ScrollArea className="max-h-100 pr-4">
              <div className="space-y-4">
                {allMappedProjects.length === 0 ? (
                  <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No active projects.
                  </div>
                ) : (
                  allMappedProjects.map((project: any) => (
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
                          <Progress value={project?.progress} className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700" />
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 w-8">{project?.progress}%</span>
                        </div>
                      </div>
                    </div>
                  )))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Blockers Modal */}
      <Dialog open={isAllBlockersOpen} onOpenChange={setIsAllBlockersOpen}>
        <DialogContent className="sm:max-w-106.25 md:max-w-150 rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
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
            <ScrollArea className="max-h-100 pr-4">
              <div className="space-y-4">
                {blockers.length === 0 ? (
                  <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No active blockers.
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
                      </div>
                    )
                  }))}
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
