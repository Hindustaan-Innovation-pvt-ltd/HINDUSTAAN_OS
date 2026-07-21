import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock, Search, Calendar as CalendarIcon,
  CheckCircle2, Filter, MoreHorizontal, Trash2, X, CheckCircle, XCircle, Timer,
  FolderKanban, Users, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TotalHoursModal } from '@/components/dashboard/worklogs/TotalHoursModal';
import { format, subDays, startOfMonth, parseISO, isSameDay, startOfWeek, addDays } from 'date-fns';
import api from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

// Removed ONLINE_TEAM_MEMBERS in favor of dynamically loaded teamMembers

const getProjectColor = (project: string) => {
  const p = project.toLowerCase();
  if (p.includes('frontend')) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
  if (p.includes('design')) return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
  if (p.includes('internal')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30';
  if (p.includes('backend')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
  if (p.includes('meeting')) return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

const getHoursColor = (hours: number) => {
  if (hours < 2) return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
  if (hours <= 4) return 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
  return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
};

// ─── Active Session Widget ────────────────────────────────────────────────────
interface ActiveSessionWidgetProps {
  secondsElapsed: number;
  formatTime: (s: number) => string;
  currentUser: { id: string; name: string; role: string };
}

function ActiveSessionWidget({ secondsElapsed, formatTime, currentUser }: ActiveSessionWidgetProps) {
  const allTasks: any[] = [];
  const inProgressTask = allTasks.find((t: any) =>
    (t.assignee_id === currentUser.id ||
     t.assignee_name?.toLowerCase().includes(currentUser.name.split(' ')[0].toLowerCase())) &&
    t.status === 'In Progress'
  );

  return (
    <div className="mb-8 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/20 w-full">
      <div className="bg-linear-to-br from-indigo-500 via-indigo-600 to-purple-600 p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-purple-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-5 text-center md:text-left p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="p-3 bg-white/20 rounded-2xl border border-white/25 shrink-0 w-fit">
              <Clock className="h-7 w-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-0.5">
                <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight">Active Work Session</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 border border-white/25 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 bg-emerald-300 rounded-full animate-ping" />
                  Live
                </span>
              </div>
              {inProgressTask ? (
                <p className="text-sm text-indigo-100 font-semibold mt-1">
                  📌 {inProgressTask.title}
                  <span className="ml-1.5 text-indigo-200/70 font-normal">· {inProgressTask.project_tag}</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-indigo-100/80 font-medium mt-1">Session will be auto-logged on sign out.</p>
              )}
            </div>
          </div>
          <div className="shrink-0 bg-black/10 md:bg-transparent rounded-xl md:rounded-none p-4 md:p-0 mt-2 md:mt-0 flex items-center justify-between md:block md:text-right w-full md:w-auto">
            <p className="text-[10px] sm:text-xs font-bold text-indigo-100 uppercase tracking-widest block md:hidden">Session Time</p>
            <div className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-wider tabular-nums drop-shadow text-right">
              {formatTime(secondsElapsed)}
            </div>
            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-0.5 hidden md:block">Session Time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkLogs({ session }: { session?: any }) {
  const todayDate = new Date();
  const todayStr = format(todayDate, 'yyyy-MM-dd');
  
  const [logs, setLogs] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [heatmapDate, setHeatmapDate] = useState<Date>(todayDate);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSpecificDate, setSelectedSpecificDate] = useState<string>(todayStr);

  const [isActiveMembersModalOpen, setIsActiveMembersModalOpen] = useState(false);
  const [isTotalHoursModalOpen, setIsTotalHoursModalOpen] = useState(false);

  const isMounted = React.useRef(false);

  // Fetch real work logs from backend on mount
  useEffect(() => {
    const fetchWorkLogs = async () => {
      try {
        const res = await api.get('/worklogs');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((log: any) => ({
            id: log.id,
            name: log.user?.name || 'Unknown',
            initials: (log.user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            date: format(new Date(log.date), 'MMM dd, yyyy'),
            rawDate: log.date,
            project: log.task?.project?.name || 'General',
            task: log.task?.title || 'General Work',
            hours: log.hours,
            note: log.note || '',
            status: 'Approved' // default since backend doesn't have approval status
          }));
          setLogs(mapped);
        }
      } catch (err) {
        console.warn('WorkLogs fetch failed, using cached data:', err);
      }
    };
    fetchWorkLogs();
  }, []);

  const role = session?.user?.user_metadata?.role || 'manager';
  const email = session?.user?.email || 'user@hindustaan.in';

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get('/team/profiles');
        if (res.data?.success) {
          // Include managers and employees/interns, exclude only Admin User
          setTeamMembers(res.data.data.filter((u: any) => u.role !== 'admin' && u.name !== 'Admin User'));
        }
      } catch (err) {
        console.warn('Failed to fetch team profiles:', err);
      }
    };
    fetchTeam();
  }, [role]);
  
  const loggedInUser = getCurrentUser();
  const currentUserId = loggedInUser?.id || 'manager-1';
  const currentUserName = loggedInUser?.name || 'Admin User';

  const currentUser = {
    id: currentUserId,
    role: role as 'manager' | 'employee',
    name: currentUserName,
    email: email
  };

  const loginKey = `login_time_${currentUser.id}`;
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (currentUser.role !== 'employee') return;
    let loginTime = localStorage.getItem(loginKey);
    if (!loginTime) {
      loginTime = Date.now().toString();
      localStorage.setItem(loginKey, loginTime);
    }
    const startTime = parseInt(loginTime, 10);
    const updateTimer = () => setSecondsElapsed(Math.floor((Date.now() - startTime) / 1000));
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentUser.id, loginKey, currentUser.role]);

  const [activeSessions, setActiveSessions] = useState<{ [key: string]: { time: number; isOnline: boolean } }>({});

  useEffect(() => {
    const updateSessions = () => {
      const sessions: { [key: string]: { time: number; isOnline: boolean } } = {};
      teamMembers.forEach(member => {
        const isCurrentUserEmployee = member.id === currentUser.id && currentUser.role === 'employee';
        const loginTimeStr = localStorage.getItem(`login_time_${member.id}`);
        
        let seconds = member.todayActiveSeconds || 0;
        let isOnline = false;
        
        if (member.currentSessionStart || member.id === currentUser.id) {
          isOnline = true;
          if (member.currentSessionStart) {
            const start = new Date(member.currentSessionStart).getTime();
            seconds += Math.floor((Date.now() - start) / 1000);
          }
        }
        
        if (isCurrentUserEmployee && loginTimeStr) {
           isOnline = true;
           const startTime = parseInt(loginTimeStr, 10);
           seconds = Math.floor((Date.now() - startTime) / 1000);
        }
        
        sessions[member.id] = { time: seconds, isOnline };
      });
      setActiveSessions(sessions);
    };
    updateSessions();
    const interval = setInterval(updateSessions, 1000);
    return () => clearInterval(interval);
  }, [currentUser.id, secondsElapsed, currentUser.role, teamMembers]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const weekStart = startOfWeek(heatmapDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const heatmapData = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    let usersToShow: string[] = [];

    if (currentUser.role === 'manager') {
      if (teamMembers.length > 0) {
        usersToShow = Array.from(new Set(teamMembers.map(m => m.name)));
      } else {
        usersToShow = Array.from(new Set(logs.map(l => l.name)));
      }
      // Strictly filter out admin and current manager
      usersToShow = usersToShow.filter(name => name !== 'Admin User' && name !== currentUser.name);
    } else {
      usersToShow = [currentUser.name];
    }
      
    usersToShow.forEach(user => {
      data[user] = {};
      weekDays.forEach(day => {
        data[user][format(day, 'yyyy-MM-dd')] = 0;
      });
    });

    logs.forEach(log => {
      if (!usersToShow.includes(log.name)) return;
      const logDate = log.rawDate ? new Date(log.rawDate) : new Date(log.date);
      if (isNaN(logDate.getTime())) return;
      
      const dateStr = format(logDate, 'yyyy-MM-dd');
      if (data[log.name] && data[log.name][dateStr] !== undefined) {
        data[log.name][dateStr] += Number(log.hours);
      }
    });
    
    return { users: usersToShow, data };
  }, [logs, currentUser, weekDays, teamMembers]);

  const getHeatmapColor = (hours: number) => {
    if (hours === 0) return 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 shadow-inner';
    if (hours <= 2) return 'bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/80 dark:to-emerald-800/80 border border-emerald-300/50 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]';
    if (hours <= 5) return 'bg-gradient-to-br from-emerald-400 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600 border border-emerald-400/50 dark:border-emerald-500/50 text-emerald-950 dark:text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] shadow-emerald-500/20';
    if (hours <= 8) return 'bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-500 border border-emerald-500/50 dark:border-emerald-400/50 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shadow-emerald-500/30';
    return 'bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-400 border border-emerald-600/50 dark:border-emerald-300/50 text-white dark:text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shadow-emerald-500/40 ring-1 ring-emerald-400/50 dark:ring-emerald-300/50'; 
  };

  const userBaseLogs = useMemo(() => {
    // Backend API already filters work logs for employee role on server
    const base = logs;

    return base.filter((log: any) => {
      const logDate = new Date(log.rawDate || log.date);
      if (isNaN(logDate.getTime())) return true;

      if (activeTab !== 'all' && dateFilter) {
        return isSameDay(logDate, dateFilter);
      }
      return true;
    });
  }, [logs, dateFilter, activeTab]);

  const uniqueProjects = useMemo(() => Array.from(new Set(logs.map(l => l.project))), [logs]);
  const uniqueEmployees = useMemo(() => Array.from(new Set(logs.map(l => l.name))), [logs]);

  const filteredLogs = useMemo(() => {
    return userBaseLogs.filter((log: any) => {
      const logDate = new Date(log.rawDate);
      
      // Tab filter
      if (activeTab === 'today' && !isSameDay(logDate, todayDate)) return false;
      if (activeTab === 'specific' && !isSameDay(logDate, parseISO(selectedSpecificDate))) return false;

      const matchesSearch = log.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      const matchesProject = projectFilter === 'All' || log.project === projectFilter;
      const matchesEmployee = currentUser.role === 'manager' && employeeFilter !== 'All' ? log.name === employeeFilter : true;
      
      return matchesSearch && matchesStatus && matchesProject && matchesEmployee;
    }).sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  }, [userBaseLogs, searchQuery, statusFilter, projectFilter, employeeFilter, activeTab, selectedSpecificDate, currentUser.role]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setLogs(logs.map((log: any) => log.id === id ? { ...log, status: newStatus } : log));
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    setLogs(logs.filter((log: any) => log.id !== id));
    try {
      await api.delete(`/worklogs/${id}`);
    } catch (err: any) {
      console.warn('WorkLog delete failed on backend:', err.response?.data?.message || err.message);
      // Rollback is not needed since it's a delete — just warn
    }
  };

  const totalHours = useMemo(() => (filteredLogs || []).reduce((acc: number, log: any) => acc + (log?.hours || 0), 0), [filteredLogs]);
  const approvedHours = useMemo(() => (filteredLogs || []).filter((l: any) => l?.status === 'Approved').reduce((acc: number, log: any) => acc + (log?.hours || 0), 0), [filteredLogs]);
  const pendingHours = useMemo(() => (filteredLogs || []).filter((l: any) => l?.status === 'Pending').reduce((acc: number, log: any) => acc + (log?.hours || 0), 0), [filteredLogs]);
  const activeStaff = useMemo(() => new Set((filteredLogs || []).map(l => l.name)).size, [filteredLogs]);

  const isEmployee = currentUser.role === 'employee';

  const filtersCard = (
    <div className={cn(
      "bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-sm transition-all",
      isEmployee 
        ? "rounded-xl p-3 space-y-3" 
        : "rounded-2xl p-4 sm:p-5 space-y-4"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-bold text-[#0F172A] dark:text-white flex items-center gap-2 text-sm sm:text-base">
          <Filter className="h-4 w-4 text-[#6366F1]" /> Filters
        </h3>
        <div className={cn(
          "flex items-center bg-[#F1F5F9] dark:bg-slate-800 px-3 rounded-xl border border-transparent focus-within:border-[#6366F1] transition-colors w-full sm:w-64",
          isEmployee ? "py-1.5" : "py-2"
        )}>
          <Search className="h-4 w-4 text-[#64748B] mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium text-[#0F172A] dark:text-white placeholder:text-[#64748B] w-full"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "rounded-xl border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#0F172A] dark:text-white justify-start hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors shadow-sm",
              isEmployee ? "w-35 h-8" : "w-40 h-9"
            )}>
              <CalendarIcon className="mr-2 h-4 w-4 text-[#6366F1]" />
              {dateFilter ? format(dateFilter, "do MMMM") : <span>All Dates</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl" align="start">
            <CalendarComponent
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              className="bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-2xl p-3"
            />
          </PopoverContent>
        </Popover>

        {currentUser.role === 'manager' && (
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-40 h-9 rounded-xl border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-[#6366F1]/20 focus:border-[#6366F1]">
              <SelectValue placeholder="Employee" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="All">All Employees</SelectItem>
              {uniqueEmployees.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className={cn(
            "rounded-xl border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-[#6366F1]/20 focus:border-[#6366F1]",
            isEmployee ? "w-35 h-8" : "w-40 h-9"
          )}>
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="All">All Projects</SelectItem>
            {uniqueProjects.map(p => <SelectItem key={p as string} value={p as string}>{p as string}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={cn(
            "rounded-xl border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-[#6366F1]/20 focus:border-[#6366F1]",
            isEmployee ? "w-30 h-8" : "w-35 h-9"
          )}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {(dateFilter || searchQuery || projectFilter !== 'All' || statusFilter !== 'All' || employeeFilter !== 'All') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setDateFilter(undefined);
              setSearchQuery('');
              setProjectFilter('All');
              setStatusFilter('All');
              setEmployeeFilter('All');
            }}
            className="h-8 text-xs text-[#64748B] hover:text-[#6366F1] font-bold px-2 rounded-xl transition-colors"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 relative animate-in fade-in duration-500 bg-[#F8FAFC] dark:bg-slate-950 min-h-screen text-[#0F172A] dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">Work Logs</h2>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">Manage team timesheets and logged hours efficiently.</p>
        </div>
      </div>

      {/* Active Session Timer Card for employees */}
      {currentUser.role === 'employee' && (
        <ActiveSessionWidget secondsElapsed={secondsElapsed} formatTime={formatTime} currentUser={currentUser} />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div 
          onClick={() => setIsTotalHoursModalOpen(true)}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#64748B] dark:text-slate-400 group-hover:text-[#6366F1] transition-colors">{currentUser.role === 'manager' ? "Employee's Total Hours" : 'My Total Hours'}</h3>
            <div className="p-2 bg-[#F1F5F9] dark:bg-slate-800 rounded-lg"><Clock className="h-5 w-5 text-[#6366F1]" /></div>
          </div>
          <p className="text-4xl font-black text-[#0F172A] dark:text-white">{totalHours.toFixed(1)}h</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#64748B] dark:text-slate-400">Approved Hours</h3>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><CheckCircle2 className="h-5 w-5 text-[#10B981]" /></div>
          </div>
          <p className="text-4xl font-black text-[#0F172A] dark:text-white">{approvedHours.toFixed(1)}h</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#64748B] dark:text-slate-400">Pending Approvals</h3>
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg"><Timer className="h-5 w-5 text-[#F59E0B]" /></div>
          </div>
          <p className="text-4xl font-black text-[#0F172A] dark:text-white">{pendingHours.toFixed(1)}h</p>
        </div>

        <div 
          onClick={() => setIsActiveMembersModalOpen(true)}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#64748B] dark:text-slate-400 group-hover:text-emerald-500 transition-colors font-sans">
              {currentUser.role === 'manager' ? "Active Employees" : "Active Members"}
            </h3>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"><Users className="h-5 w-5 text-emerald-500" /></div>
          </div>
          <p className="text-4xl font-black text-[#0F172A] dark:text-white">
            {Object.values(activeSessions).filter((s: any) => s.isOnline).length}
          </p>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="relative bg-white dark:bg-slate-900 rounded-4xl p-8 border border-slate-200/60 dark:border-slate-700/40 shadow-sm overflow-hidden mb-6 group">
        {/* Glassy Orbs in Background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
              <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-3 shadow-inner">
                <Activity className="h-4 w-4" />
              </div>
              Weekly Activity Heatmap
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none cursor-pointer">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                  {format(weekStart, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl" align="start">
                <CalendarComponent
                  mode="single"
                  selected={heatmapDate}
                  onSelect={(date) => {
                    if (date) setHeatmapDate(date);
                  }}
                  className="bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-2xl p-3"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Elegant Legend */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2 ml-1">Less</span>
            {[0, 2, 5, 8, 10].map((hours, i) => (
              <div key={i} className={cn("w-4 h-4 rounded-md transition-all duration-300", getHeatmapColor(hours))} title={`${hours === 0 ? 0 : hours}+ hours`} />
            ))}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          <div className="min-w-175">
            {/* Days Header */}
            <div className="flex mb-4 relative z-10">
              <div className="w-56 shrink-0"></div>
              <div className="flex-1 grid grid-cols-7 gap-3">
                {weekDays.map(day => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={day.toString()} className="flex flex-col items-center justify-center group/day">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider mb-1 transition-colors",
                        isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {format(day, 'EEE')}
                      </span>
                      <span className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
                        isToday 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                          : "text-slate-700 dark:text-slate-300 group-hover/day:bg-slate-100 dark:group-hover/day:bg-slate-800"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Users Rows */}
            <div className="space-y-3 relative z-10 max-h-55 overflow-y-auto pr-2 hide-scrollbar">
              {heatmapData.users.map((user, rowIdx) => {
                const totalWeekHours = weekDays.reduce((sum, day) => sum + (heatmapData.data[user][format(day, 'yyyy-MM-dd')] || 0), 0);
                const memberData = teamMembers.find(m => m.name === user);
                
                return (
                  <div 
                    key={user} 
                    className="flex items-center group/row animate-in slide-in-from-left-4 fade-in duration-500 fill-mode-both"
                    style={{ animationDelay: `${rowIdx * 100}ms` }}
                  >
                    {/* User Info */}
                    <div className="w-56 shrink-0 pr-6 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-white dark:ring-slate-900 group-hover/row:scale-110 transition-transform",
                          memberData?.color || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          {memberData?.initials || user.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors truncate">
                          {user}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-400 group-hover/row:text-indigo-500 transition-colors">
                          {totalWeekHours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                    
                    {/* Heatmap Cells */}
                    <div className="flex-1 grid grid-cols-7 gap-3">
                      {weekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const hours = heatmapData.data[user][dateStr] || 0;
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                          <div 
                            key={dateStr}
                            title={`${hours.toFixed(1)} hours on ${format(day, 'MMM d')}`}
                            className="relative group/cell aspect-square sm:aspect-auto sm:h-12 w-full rounded-xl"
                          >
                            <div className={cn(
                              "absolute inset-0 rounded-xl transition-all duration-300 cursor-crosshair flex items-center justify-center",
                              getHeatmapColor(hours),
                              isToday && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900",
                              "group-hover/cell:scale-[1.15] group-hover/cell:shadow-xl group-hover/cell:z-20"
                            )}>
                              {hours > 0 && (
                                <span className="text-[10px] font-black opacity-0 group-hover/cell:opacity-100 transition-opacity drop-shadow-md">
                                  {hours.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {filtersCard}

      {/* Data Cards Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#F1F5F9] dark:bg-slate-800 p-1 rounded-xl mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="rounded-lg text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#6366F1]">All Logs</TabsTrigger>
          <TabsTrigger value="today" className="rounded-lg text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#6366F1]">Today's Logs</TabsTrigger>
          {currentUser.role === 'manager' && (
            <TabsTrigger value="specific" className="rounded-lg text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#6366F1]">Date Specific Logs</TabsTrigger>
          )}
        </TabsList>

        {currentUser.role === 'manager' && activeTab === 'specific' && (
          <div className="mb-6 flex items-center gap-3">
            <label className="text-sm font-bold text-[#64748B] dark:text-slate-400">Select Date:</label>
            <input 
              type="date" 
              value={selectedSpecificDate}
              onChange={(e) => setSelectedSpecificDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-[#0F172A] dark:text-white outline-none focus:border-[#6366F1]"
            />
          </div>
        )}

        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-[#E2E8F0] dark:border-slate-800 shadow-sm text-center">
              <FolderKanban className="h-12 w-12 text-[#64748B] opacity-50 mx-auto mb-4" />
              <p className="text-[#64748B] dark:text-slate-400 font-bold text-lg">No logs found matching your criteria.</p>
            </div>
          ) : (
            filteredLogs.map((log: any) => (
              <div key={log.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#6366F1]/30 dark:hover:border-[#6366F1]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                
                {/* Left side: Avatar + Info */}
                <div className="flex items-start md:items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-900 shadow-sm shrink-0">
                    <AvatarFallback className="bg-linear-to-br from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm">
                      {log.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#0F172A] dark:text-white text-base">{log.name}</span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#64748B] bg-[#F1F5F9] dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <CalendarIcon className="h-3 w-3" /> {log.date}
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", getProjectColor(log.project))}>
                        {log.project}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-[#64748B] dark:text-slate-300 wrap-break-word line-clamp-2 sm:line-clamp-none">
                      {log.task}
                    </p>
                  </div>
                </div>

                {/* Right side: Badges and Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-16 md:pl-0 border-t border-[#E2E8F0] dark:border-slate-800 md:border-0 pt-3 md:pt-0">
                  <Badge variant="outline" className={cn("text-xs font-black tracking-wider px-2.5 py-1", getHoursColor(log.hours))}>
                    <Clock className="h-3 w-3 mr-1.5" /> {log.hours.toFixed(1)}h
                  </Badge>
                  
                  <Badge variant="outline" className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2.5 py-1",
                    log.status === 'Approved' ? "bg-emerald-50 text-[#10B981] dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" :
                    log.status === 'Pending' ? "bg-amber-50 text-[#F59E0B] dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" :
                    "bg-rose-50 text-rose-600 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                  )}>
                    {log.status}
                  </Badge>

                  {currentUser.role === 'manager' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800 rounded-xl">
                        {log.status !== 'Approved' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(log.id, 'Approved')} className="cursor-pointer text-[#10B981] font-bold">
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve Log
                          </DropdownMenuItem>
                        )}
                        {log.status !== 'Rejected' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(log.id, 'Rejected')} className="cursor-pointer text-rose-600 font-bold">
                            <XCircle className="h-4 w-4 mr-2" /> Reject Log
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-[#E2E8F0] dark:bg-slate-800" />
                        <DropdownMenuItem onClick={() => handleDelete(log.id)} className="cursor-pointer text-red-600 font-bold">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Tabs>

      {/* Active Members Modal */}
      {isActiveMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsActiveMembersModalOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Team Members</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Currently contributing in the workspace</p>
              </div>
              <button 
                onClick={() => setIsActiveMembersModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-75 overflow-y-auto space-y-4">
              {teamMembers.map((member) => {
                const isOnline = activeSessions[member.id]?.isOnline;
                const initials = (member.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                <div key={member.id} className={cn("flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all", !isOnline && "opacity-75 grayscale")}>
                  <div className="flex items-center gap-3">
                    <Avatar className={cn("h-9 w-9 border-2 border-white dark:border-slate-900 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
                      <AvatarFallback className="font-bold text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{member.name}</span>
                      <span className="text-xs text-slate-500 font-medium capitalize">{member.designation || member.role}</span>
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
              )})}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button onClick={() => setIsActiveMembersModalOpen(false)} className="rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white font-bold px-4 py-2 cursor-pointer">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <TotalHoursModal 
        isOpen={isTotalHoursModalOpen} 
        onOpenChange={setIsTotalHoursModalOpen} 
        logs={filteredLogs} 
        role={currentUser.role} 
        currentUser={{ name: currentUser.name, email: currentUser.email || '' }}
      />
    </div>
  );
}
