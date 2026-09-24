import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { useProjects } from '@/context/ProjectContext';
import { Clock, BarChart3, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { WorkLogSummaryCards } from '../components/worklogs/WorkLogSummaryCards';
import { WorkLogHeatmap } from '../components/worklogs/WorkLogHeatmap';
import { WorkLogFilters } from '../components/worklogs/WorkLogFilters';
import { WorkLogTable } from '../components/worklogs/WorkLogTable';
import { WorkLogDrawer } from '../components/worklogs/WorkLogDrawer';
import { WorkLogAnalytics } from '../components/worklogs/WorkLogAnalytics';
import { TotalHoursModal } from '@/components/dashboard/worklogs/TotalHoursModal';

// ─── Active Session Widget with Real Task Binding ─────────────────────────────
interface ActiveSessionWidgetProps {
  secondsElapsed: number;
  formatTime: (s: number) => string;
  currentUser: { id: string; name: string; role: string };
  activeTask?: any | null;
}

function ActiveSessionWidget({ secondsElapsed, formatTime, currentUser, activeTask }: ActiveSessionWidgetProps) {
  const taskTitle = activeTask?.title || activeTask?.name;
  const projectTag = activeTask?.project?.name || activeTask?.project_tag || 'Active Project';

  return (
    <div className="mb-6 rounded-3xl overflow-hidden shadow-xl shadow-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/20 w-full relative group">
      <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-purple-300/20 rounded-full blur-2xl pointer-events-none transition-transform duration-1000 group-hover:scale-150" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-5 text-center md:text-left">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="p-3 bg-white/20 rounded-2xl border border-white/25 shrink-0 w-fit backdrop-blur-sm">
              <Clock className="h-7 w-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-0.5">
                <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight">Active Work Session</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 border border-white/25 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 bg-emerald-300 rounded-full animate-ping" />
                  Live
                </span>
                {activeTask?.status && (
                  <span className="px-2 py-0.5 bg-emerald-500/30 border border-emerald-300/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {activeTask.status}
                  </span>
                )}
              </div>
              {taskTitle ? (
                <p className="text-sm text-indigo-100 font-semibold mt-1">
                  📌 <span className="text-white font-bold">{taskTitle}</span>
                  <span className="ml-1.5 text-indigo-200/90 font-normal">· {projectTag}</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-indigo-100/80 font-medium mt-1">
                  General active session in progress · Session will be automatically logged on sign out.
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 bg-black/10 md:bg-transparent rounded-xl md:rounded-none p-4 md:p-0 mt-2 md:mt-0 flex items-center justify-between md:block md:text-right w-full md:w-auto backdrop-blur-sm md:backdrop-blur-none">
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
  const { projects: contextProjects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(todayDate);
  const [heatmapDate, setHeatmapDate] = useState<Date>(todayDate);
  
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTotalHoursModalOpen, setIsTotalHoursModalOpen] = useState(false);
  const [showVisualAnalytics, setShowVisualAnalytics] = useState(false);

  // Active task for live session widget
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // Fetch real work logs
  useEffect(() => {
    const fetchWorkLogs = async () => {
      try {
        const res = await api.get('/worklogs');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map((log: any) => {
            const rawDateVal = log.createdAt || log.date;
            const parsedDate = new Date(rawDateVal);
            
            return {
              id: log.id,
              name: log.user?.name || 'Unknown',
              initials: (log.user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
              date: !isNaN(parsedDate.getTime()) ? format(parsedDate, 'MMM dd, yyyy, hh:mm a') : 'Unknown Date',
              rawDate: log.date,
              project: log.task?.project?.name || 'General',
              task: log.task?.title || 'General Work',
              hours: log.hours,
              note: log.note || '',
              role: log.user?.role?.toLowerCase() || 'employee',
              status: (log.status === 'In Progress' || log.status?.toLowerCase() === 'pending') ? 'Pending' : 
                      (log.status?.toLowerCase() === 'approved' ? 'Approved' : 
                      (log.status?.toLowerCase() === 'rejected' ? 'Rejected' : log.status || 'Pending'))
            };
          });
          setLogs(mapped);
        }
      } catch (err) {
        console.warn('WorkLogs fetch failed, using cached data:', err);
      }
    };
    fetchWorkLogs();
  }, []);

  const loggedInUser = getCurrentUser();
  const role = session?.user?.user_metadata?.role || loggedInUser?.role || 'manager';
  const email = session?.user?.email || loggedInUser?.email || 'user@hindustaan.in';

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get('/team/profiles');
        if (res.data?.success) {
          setTeamMembers(res.data.data.filter((u: any) => u.role !== 'admin' && u.name !== 'Admin User'));
        }
      } catch (err) {
        console.warn('Failed to fetch team profiles:', err);
      }
    };
    fetchTeam();
  }, [role]);
  
  const currentUser = {
    id: loggedInUser?.id || 'manager-1',
    role: role as string,
    name: loggedInUser?.name || 'Admin User',
    email: email
  };

  const isAdmin = currentUser.role === 'admin';
  const isEmployee = currentUser.role === 'employee' || currentUser.role === 'intern' || (!isAdmin && currentUser.role !== 'manager');

  const [sessionStart, setSessionStart] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success) {
          setSessionStart(res.data.data.currentSessionStart || null);
        }
      } catch (err) {
        console.warn('Failed to fetch profile', err);
      }
    };
    if (isEmployee) {
      fetchProfile();
      window.addEventListener('auth_status_changed', fetchProfile);
      return () => window.removeEventListener('auth_status_changed', fetchProfile);
    }
  }, [isEmployee]);

  // Fetch real active task for the employee
  useEffect(() => {
    const fetchActiveTask = async () => {
      try {
        const res = await api.get('/tasks?limit=300');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const tasks = res.data.data;
          // Find in-progress task assigned to current user
          const myTask = tasks.find((t: any) => {
            const isAssigned =
              t.assignee_id === currentUser.id ||
              t.assigneeId === currentUser.id ||
              t.assignees?.some((a: any) => a.id === currentUser.id || a.userId === currentUser.id || a.name === currentUser.name) ||
              t.assignee_name?.toLowerCase().includes(currentUser.name.split(' ')[0].toLowerCase());
            return isAssigned && (t.status === 'In Progress' || t.status === 'in_progress');
          }) || tasks.find((t: any) => {
            const isAssigned =
              t.assignee_id === currentUser.id ||
              t.assignees?.some((a: any) => a.id === currentUser.id || a.userId === currentUser.id);
            return isAssigned && t.status !== 'Completed' && t.status !== 'Done';
          });

          setActiveTask(myTask || null);
        }
      } catch (err) {
        console.warn('Could not fetch active task:', err);
      }
    };

    if (isEmployee) {
      fetchActiveTask();
    }
  }, [isEmployee, currentUser.id, currentUser.name]);

  // Active Session Timer Logic
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!isEmployee || !sessionStart) {
      setSecondsElapsed(0);
      return;
    }
    const startTime = new Date(sessionStart).getTime();
    const updateTimer = () => setSecondsElapsed(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isEmployee, sessionStart]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Monthly Heatmap Data Calculation
  const monthDays = useMemo(() => {
    const year = heatmapDate.getFullYear();
    const month = heatmapDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: totalDays }).map((_, i) => new Date(year, month, i + 1));
  }, [heatmapDate]);

  const heatmapData = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    let usersToShow: string[] = [];

    if (isEmployee) {
      usersToShow = [currentUser.name];
    } else {
      const allNames = [...teamMembers.map((m: any) => m.name), ...logs.map((l: any) => l.name)];
      usersToShow = Array.from(new Set(allNames)).filter(name => name !== 'Admin User');
    }
    if (usersToShow.length === 0 && currentUser.name !== 'Admin User') usersToShow = [currentUser.name];
      
    usersToShow.forEach(user => {
      data[user] = {};
      monthDays.forEach(day => { data[user][format(day, 'yyyy-MM-dd')] = 0; });
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
  }, [logs, currentUser, monthDays, teamMembers, isEmployee]);

  // Filtering Logic
  const isDateMatch = (logDateVal: any, targetDateStr: string) => {
    if (!logDateVal || !targetDateStr) return false;
    const d = new Date(logDateVal);
    if (isNaN(d.getTime())) return false;
    return format(d, 'yyyy-MM-dd') === targetDateStr || d.toISOString().slice(0, 10) === targetDateStr || String(logDateVal).slice(0, 10) === targetDateStr;
  };

  const userBaseLogs = useMemo(() => {
    const base = isEmployee ? logs.filter(log => log.name === currentUser.name || log.userId === currentUser.id) : logs;
    return base.filter(log => {
      if (isNaN(new Date(log.rawDate || log.date).getTime())) return true;
      if (dateFilter) return isDateMatch(log.rawDate || log.date, format(dateFilter, 'yyyy-MM-dd'));
      return true;
    });
  }, [logs, dateFilter, isEmployee, currentUser]);

  const uniqueProjects = useMemo(() => {
    const names = [...(contextProjects || []).map((p: any) => p.name || p.title), ...logs.map(l => l.project)].filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [logs, contextProjects]);

  const uniqueEmployees = useMemo(() => {
    const names = [...teamMembers.map(m => m.name), ...logs.map(l => l.name)].filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [logs, teamMembers]);

  const filteredLogs = useMemo(() => {
    return userBaseLogs.filter((log: any) => {
      const matchesSearch = log.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      const matchesProject = projectFilter === 'All' || log.project === projectFilter;
      const matchesRole = roleFilter === 'All' || log.role === roleFilter;
      const matchesEmployee = !isEmployee && employeeFilter !== 'All' 
        ? (employeeFilter === 'My Logs' ? log.name === currentUser.name : log.name === employeeFilter)
        : true;
      
      return matchesSearch && matchesStatus && matchesProject && matchesRole && matchesEmployee;
    }).sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  }, [userBaseLogs, searchQuery, statusFilter, projectFilter, roleFilter, employeeFilter, isEmployee, currentUser.name]);

  // Actions
  const handleStatusChange = async (id: string, newStatus: string) => {
    setLogs(logs.map(log => log.id === id ? { ...log, status: newStatus } : log));
    if (selectedLog?.id === id) {
      setSelectedLog({ ...selectedLog, status: newStatus });
    }
    try {
      await api.put(`/worklogs/${id}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update work log status on backend:', err);
    }
  };

  const handleDelete = async (id: string) => {
    setLogs(logs.filter(log => log.id !== id));
    try {
      await api.delete(`/worklogs/${id}`);
    } catch (err) {
      console.warn('WorkLog delete failed on backend:', err);
    }
  };

  // Summaries
  const totalHours = useMemo(() => filteredLogs.reduce((acc, log) => acc + (log.hours || 0), 0), [filteredLogs]);
  const approvedHours = useMemo(() => filteredLogs.filter(l => l.status === 'Approved').reduce((acc, log) => acc + (log.hours || 0), 0), [filteredLogs]);
  const pendingHours = useMemo(() => filteredLogs.filter(l => l.status === 'Pending').reduce((acc, log) => acc + (log.hours || 0), 0), [filteredLogs]);
  const activeStaff = useMemo(() => {
    return Array.from(new Set(
      logs.filter(l => l.name !== currentUser.name && l.name !== 'Admin User').map(l => l.name)
    )).length;
  }, [logs, currentUser.name]);

  return (
    <div className="w-full max-w-full space-y-6 relative animate-in fade-in duration-300 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Work Logs</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage team timesheets and logged hours efficiently.</p>
        </div>
        <div className="flex items-center gap-3">
          {dateFilter && format(dateFilter, 'yyyy-MM-dd') === todayStr && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <span className="h-2 w-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-indigo-400">Showing Today's Logs</span>
              <button
                onClick={() => setDateFilter(undefined)}
                className="text-indigo-400 hover:text-white transition-colors text-xs font-bold ml-1"
                title="Show all dates"
              >
                ✕ All
              </button>
            </div>
          )}
        </div>
      </div>

      {isEmployee && sessionStart && (
        <ActiveSessionWidget 
          secondsElapsed={secondsElapsed} 
          formatTime={formatTime} 
          currentUser={currentUser} 
          activeTask={activeTask}
        />
      )}

      {/* Modular Summary Cards */}
      <WorkLogSummaryCards 
        logs={filteredLogs}
        totalHours={totalHours}
        approvedHours={approvedHours}
        pendingHours={pendingHours}
        activeMembers={activeStaff || uniqueEmployees.length}
        isEmployee={isEmployee}
        userName={currentUser.name}
        onTotalHoursClick={() => setIsTotalHoursModalOpen(true)}
      />

      {/* Monthly Activity Heatmap with Timesheet Export */}
      <WorkLogHeatmap 
        monthDays={monthDays}
        heatmapDate={heatmapDate}
        setHeatmapDate={setHeatmapDate}
        heatmapData={heatmapData}
        teamMembers={teamMembers}
      />

      {/* Collapsible Visual Analytics Toggle */}
      <div className="bg-muted/30 border border-border p-3.5 rounded-2xl flex items-center justify-between transition-all">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground">Visual Analytics & Distribution</span>
            <span className="text-[11px] text-muted-foreground ml-2 hidden sm:inline">
              Daily trend & project allocation charts
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowVisualAnalytics(v => !v)}
          className="h-8 px-3 rounded-xl border-border text-xs font-bold flex items-center gap-1.5 hover:bg-muted"
        >
          {showVisualAnalytics ? 'Hide Charts' : 'Show Charts'}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showVisualAnalytics && "rotate-180")} />
        </Button>
      </div>

      {showVisualAnalytics && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-300">
          <WorkLogAnalytics logs={filteredLogs} />
        </div>
      )}

      {/* Filters Toolbar */}
      <WorkLogFilters 
        isEmployee={isEmployee}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        employeeFilter={employeeFilter}
        setEmployeeFilter={setEmployeeFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        uniqueProjects={uniqueProjects}
        uniqueEmployees={uniqueEmployees}
      />

      {/* Timesheet Table */}
      <WorkLogTable 
        logs={filteredLogs}
        currentUser={currentUser}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onRowClick={(log) => {
          setSelectedLog(log);
          setIsDrawerOpen(true);
        }}
      />

      {/* Details Slide-over Drawer */}
      <WorkLogDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        log={selectedLog}
        currentUser={currentUser}
        onStatusChange={handleStatusChange}
      />

      {/* Comprehensive Total Hours Modal */}
      {isTotalHoursModalOpen && (
        <TotalHoursModal
          isOpen={isTotalHoursModalOpen}
          onOpenChange={setIsTotalHoursModalOpen}
          logs={filteredLogs}
          role={currentUser.role}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
