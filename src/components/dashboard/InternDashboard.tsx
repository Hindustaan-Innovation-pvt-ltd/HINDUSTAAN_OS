import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, Clock, Calendar as CalendarIcon, Flag, Activity,
  ArrowRight, MoreVertical, PlayCircle, Trophy, Target, AlertCircle, Sparkles, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { WhatsAppBroadcastDialog } from "./WhatsAppBroadcastDialog";
import { FigjamDialog } from "./FigjamDialog";
import { EmployeeCalendar } from "./EmployeeCalendar";
import { TotalHoursModal } from "./worklogs/TotalHoursModal";

import { format, isSameDay, isAfter, startOfDay } from 'date-fns';
import { getCurrentUser } from '@/lib/auth';
import { useProjects } from '@/context/ProjectContext';
import { useUser } from '@/context/UserContext';
import api from '@/lib/api';


interface InternDashboardProps { }

// Monkey-patch localStorage.setItem ONCE globally for this module
// so that different components/hooks can listen to same-tab storage events.
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
  originalSetItem.apply(this, arguments as any);
  // Dispatch a custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key, value } }));
};

export default function InternDashboard({ }: InternDashboardProps) {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isFigjamOpen, setIsFigjamOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isStandupModalOpen, setIsStandupModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [extensionDays, setExtensionDays] = useState(1);
  const [extensionReason, setExtensionReason] = useState('');

  const { user: contextUser } = useUser();
  const role = contextUser?.role || 'intern';
  const email = contextUser?.email || 'user@hindustaan.in';
  const user = getCurrentUser();
  let currentUserId = user?.id || '';
  let currentUserName = contextUser?.name || user?.name || 'User';

  const { projects } = useProjects();

  const formatDateSafely = (dateVal: any) => {
    if (!dateVal || String(dateVal).toLowerCase() === 'tbd') {
      return new Date().toISOString().split('T')[0];
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return d.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  // Dynamic tasks state fetched strictly from DB API
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchInternTasks = async () => {
    try {
      const res = await api.get('/tasks?limit=1000');
      console.log('[DEBUG API] /api/tasks response:', { url: '/api/tasks?limit=1000', data: res.data });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.desc || '',
          project_tag: t.project?.name || 'General',
          projectId: t.projectId,
          project_status: t.project?.status || 'active',
          assignee_name: t.assignee_name || (t.assignees && t.assignees[0]?.name) || 'Unassigned',
          assignee_id: t.assignee_id || (t.assignees && t.assignees[0]?.id) || 'unassigned',
          assignees: t.assignees || [],
          priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
          due_date: formatDateSafely(t.due_date || t.dueDate),
          status: t.status === 'done' || t.status === 'completed' ? 'Done' :
            t.status === 'in-progress' ? 'In Progress' :
              t.status === 'in-review' ? 'In Review' : 'To Do'
        }));

        console.log('[DEBUG API] Mapped DB Tasks:', mapped);
        setTasks(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch tasks on InternDashboard:', err);
    }
  };

  const [leaves, setLeaves] = useState<any[]>([]);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves');
      console.log('[DEBUG API] /api/leaves response:', res.data);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch leaves on InternDashboard:', err);
    }
  };

  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loggedHours, setLoggedHours] = useState(0);

  const fetchWorkLogs = async () => {
    try {
      const res = await api.get('/worklogs');
      console.log('[DEBUG API] /api/worklogs response:', res.data);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const logs = res.data.data;
        setAllLogs(logs);
        const total = logs.reduce((acc: number, log: any) => acc + (log.hours || 0), 0);
        setLoggedHours(total);
        console.log('[DEBUG API] Mapped WorkLogs:', { count: logs.length, totalHours: total });
      }
    } catch (err) {
      console.warn('Failed to fetch worklogs on InternDashboard:', err);
    }
  };

  useEffect(() => {
    fetchInternTasks();
    fetchLeaves();
    fetchWorkLogs();
  }, [currentUserId, currentUserName]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'work_logs_list' || e.key === 'hindustaan_tasks_list') {
        fetchWorkLogs();
        fetchInternTasks();
      }
    };
    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.key === 'work_logs_list' || e.detail.key === 'hindustaan_tasks_list') {
        fetchWorkLogs();
        fetchInternTasks();
      }
    };

    const handleTasksUpdatedEvent = () => {
      fetchWorkLogs();
      fetchInternTasks();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate as EventListener);
    window.addEventListener('tasks-updated', handleTasksUpdatedEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate as EventListener);
      window.removeEventListener('tasks-updated', handleTasksUpdatedEvent);
    };
  }, [currentUserName]);

  // Read todays standup
  const [todaysStandup, setTodaysStandup] = useState<any>(null);

  const getProgress = (status: string) => {
    switch (status) {
      case 'Done': return 100;
      case 'In Review': return 85;
      case 'In Progress': return 50;
      default: return 0;
    }
  };

  // Live backend dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const lastDataRef = React.useRef<string | null>(null);

  const overallScore = dashboardData?.contribution?.overallScore ?? 0;
  const tasksCompleted = dashboardData?.performance?.completedTasks ?? 0;
  const tasksTotal = dashboardData?.performance?.totalTasks ?? 0;
  const hoursLoggedValue = dashboardData?.performance?.totalHours ?? 0;
  const milestonesCompleted = dashboardData?.performance?.completedMilestones ?? 0;
  const milestonesTotal = dashboardData?.totalMilestones ?? 0;

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      console.log('[DEBUG API] /api/dashboard response:', res.data);
      if (res.data?.success) {
        const dataString = JSON.stringify(res.data.data);
        if (lastDataRef.current === dataString) return;
        lastDataRef.current = dataString;

        React.startTransition(() => {
          setDashboardData(res.data.data);
          // Hydrate todaysStandup from live data
          if (res.data.data.standupStatus?.submittedToday) {
            setTodaysStandup({
              status: 'Submitted',
              time: res.data.data.standupStatus.submissionTime || '',
              yesterday: res.data.data.standupStatus.yesterday || '',
              today: res.data.data.standupStatus.today || '',
              blockers: res.data.data.standupStatus.blockers || 'None'
            });
          } else {
            setTodaysStandup(null);
          }
          // Hydrate logged hours
          if (typeof res.data.data.loggedHours === 'number') {
            setLoggedHours(res.data.data.loggedHours);
          }
          // Hydrate activity feed
          if (res.data.data.activityFeed && res.data.data.activityFeed.length > 0) {
            setActivityFeed(res.data.data.activityFeed);
          }
        });
      }
    } catch (err) {
      console.warn('Intern dashboard fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchLeaves();
    fetchWorkLogs();
    fetchInternTasks();

    // Poll every 5 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchDashboard();
      fetchLeaves();
      fetchWorkLogs();
      fetchInternTasks();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const employeeUpcomingEvents = useMemo(() => {
    const today = new Date();
    const cutoffDate = startOfDay(today);

    // 1. Task Deadlines
    const taskEvents = tasks
      .filter((t: any) => t && t.status !== 'Done' && t.status !== 'completed' && t.due_date)
      .map((t: any) => {
        let dueDate: Date;
        try {
          dueDate = new Date(t.due_date);
        } catch {
          dueDate = new Date();
        }
        return {
          id: `task-event-${t.id}`,
          date: dueDate,
          title: t.title,
          type: 'deadline',
          time: '11:59 PM'
        };
      });

    // 2. Approved Leaves
    const leaveEvents = leaves
      .filter((l: any) => l.status === 'Approved' && l.startDate)
      .map((l: any) => {
        let lDate: Date;
        try {
          lDate = new Date(l.startDate);
        } catch {
          lDate = new Date();
        }
        return {
          id: `leave-event-${l.id}`,
          date: lDate,
          title: `${l.user?.name || currentUserName} on Leave`,
          type: 'leave',
          time: 'All Day'
        };
      });

    // 3. Project Milestones
    const milestoneEvents = projects.flatMap((proj: any) => {
      return (proj.milestones || [])
        .filter((m: any) => m.status !== 'completed' && m.status !== 'Done' && m.date && m.date !== 'TBD')
        .map((m: any) => {
          let dateVal = new Date();
          const parsed = Date.parse(`${m.date}, ${new Date().getFullYear()}`);
          if (!isNaN(parsed)) {
            dateVal = new Date(parsed);
          }
          return {
            id: `milestone-event-${m.id}`,
            date: dateVal,
            title: `${m.title} (${proj.name})`,
            type: 'milestone',
            time: 'All Day'
          };
        });
    });

    const allEvents = [...calendarEvents, ...taskEvents, ...leaveEvents, ...milestoneEvents];

    return allEvents
      .filter((e: any) => isAfter(e.date, cutoffDate) || isSameDay(e.date, cutoffDate))
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [calendarEvents, tasks, leaves, projects, currentUserName]);

  const activeTasksCount = typeof dashboardData?.activeTasksCount === 'number'
    ? dashboardData.activeTasksCount
    : tasks.filter((t: any) => t && t.status !== 'Done' && t.status.toLowerCase() !== 'completed').length;

  const completedTasksCount = typeof dashboardData?.performance?.completedTasks === 'number'
    ? dashboardData.performance.completedTasks
    : tasks.filter((t: any) => t && (t.status === 'Done' || t.status.toLowerCase() === 'completed')).length;

  // Compute upcoming deadlines (handling relative dates like 'Today' and 'Tomorrow')
  const upcomingDeadlines = useMemo(() => {
    if (dashboardData?.upcomingTasks && dashboardData.upcomingTasks.length > 0) {
      return dashboardData.upcomingTasks.map((t: any) => {
        let dueDate: Date;
        try {
          dueDate = new Date(t.dueDate);
        } catch {
          dueDate = new Date();
        }
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < todayDate;
        const isToday = dueDate.getTime() === todayDate.getTime();
        return {
          id: t.id,
          title: t.title,
          priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
          project_tag: t.project?.name || 'General',
          due_date: formatDateSafely(t.dueDate),
          status: t.status === 'done' || t.status === 'completed' ? 'Done' :
            t.status === 'in-progress' ? 'In Progress' :
              t.status === 'in-review' ? 'In Review' : 'To Do',
          isOverdue,
          isToday
        };
      });
    }

    return tasks
      .filter((t: any) => t && t.status !== 'Done' && t.due_date)
      .map((t: any) => {
        let dueDate: Date | null = null;
        const rawDate = t.due_date.toLowerCase().trim();

        if (rawDate === 'today') {
          dueDate = new Date();
        } else if (rawDate === 'tomorrow') {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1);
        } else {
          dueDate = new Date(t.due_date);
        }

        return { ...t, parsedDate: dueDate };
      })
      .filter((t: any) => t.parsedDate && !isNaN(t.parsedDate.getTime()))
      .map((t: any) => {
        const dueDate = t.parsedDate;
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < todayDate;
        const isToday = dueDate.getTime() === todayDate.getTime();
        return { ...t, isOverdue, isToday };
      })
      .sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .slice(0, 5);
  }, [tasks, dashboardData]);

  // Load approved deadline extensions
  const savedApprovedExtensions = localStorage.getItem('hindustaan_approved_extensions');
  const approvedExtensions: any[] = (savedApprovedExtensions && savedApprovedExtensions !== 'null')
    ? (() => { try { return JSON.parse(savedApprovedExtensions); } catch { return []; } })()
    : [];
  const dueTodayCount = typeof dashboardData?.dueTodayCount === 'number'
    ? dashboardData.dueTodayCount
    : tasks.filter((t: any) => {
      if (!t.due_date) return false;
      const dStr = t.due_date.includes('T') ? t.due_date.split('T')[0] : t.due_date;
      const todayStr = new Date().toISOString().split('T')[0];
      return dStr <= todayStr && t.status !== 'Done' && t.status !== 'completed' && t.status !== 'done';
    }).length;

  const displayedTodayTasks = useMemo(() => {
    if (dashboardData?.todayTasks && dashboardData.todayTasks.length > 0) {
      return dashboardData.todayTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
        project_tag: t.project?.name || 'General',
        due_date: formatDateSafely(t.dueDate),
        status: t.status === 'done' || t.status === 'completed' ? 'Done' :
          t.status === 'in-progress' ? 'In Progress' :
            t.status === 'in-review' ? 'In Review' : 'To Do',
        progress: t.status === 'done' || t.status === 'completed' ? 100 :
          t.status === 'in-progress' ? 50 :
            t.status === 'in-review' ? 85 : 0
      }));
    }
    return tasks;
  }, [tasks, dashboardData]);

  const handleExtensionSubmit = () => {
    if (!selectedTaskId) {
      toast.error('Please select a task.');
      return;
    }
    if (!extensionReason.trim()) {
      toast.error('Please provide a reason for the extension.');
      return;
    }
    const selectedTask = upcomingDeadlines.find((t: any) => String(t.id) === String(selectedTaskId));
    if (!selectedTask) {
      toast.error('Selected task not found.');
      return;
    }

    const savedNotifications = localStorage.getItem('hindustaan_notifications');
    let currentNotifications = [];
    if (savedNotifications && savedNotifications !== 'null') {
      try {
        currentNotifications = JSON.parse(savedNotifications);
      } catch (e) {
        console.error(e);
      }
    }

    const newReqNotification = {
      id: Date.now(),
      type: 'request',
      category: 'Tasks',
      icon: '⏳',
      title: 'Deadline Extension Request',
      message: `${currentUserName} requested a ${extensionDays}-day extension for "${selectedTask.title}". Reason: ${extensionReason}`,
      time: 'Just now',
      unread: true,
      group: 'Today',
      metadata: {
        type: 'deadline_extension',
        taskId: selectedTaskId,
        days: Number(extensionDays),
        employeeName: currentUserName,
        taskTitle: selectedTask.title,
        reason: extensionReason
      },
      actions: [
        { label: 'Approve', primary: true, actionType: 'approve_extension' },
        { label: 'Reject', primary: false, actionType: 'reject_extension' }
      ]
    };

    const updatedNotifications = [newReqNotification, ...currentNotifications];
    localStorage.setItem('hindustaan_notifications', JSON.stringify(updatedNotifications));
    window.dispatchEvent(new Event('notifications-updated'));

    const savedEmpNotifications = localStorage.getItem('hindustaan_employee_notifications');
    let empNotifications: any[] = [];
    if (savedEmpNotifications && savedEmpNotifications !== 'null') {
      try { empNotifications = JSON.parse(savedEmpNotifications); } catch (e) { console.error(e); }
    }
    const empPendingNotification = {
      id: Date.now() + 1,
      category: 'Tasks',
      icon: '⏳',
      title: 'Extension Request Sent',
      message: `Your ${extensionDays}-day extension request for "${selectedTask.title}" has been submitted and is pending manager approval.`,
      time: 'Just now',
      unread: true,
      group: 'Today',
      priority: 'Important'
    };
    localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([empPendingNotification, ...empNotifications]));
    window.dispatchEvent(new Event('employee-notifications-updated'));

    toast.success('Extension Request Submitted!', {
      description: `Requested ${extensionDays} days for "${selectedTask.title}".`
    });

    setIsExtensionModalOpen(false);
    setSelectedTaskId('');
    setExtensionDays(1);
    setExtensionReason('');
  };

  const today = new Date();
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 18) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  const [selectedMonth, setSelectedMonth] = useState<Date>(today);
  const startDate = new Date(2026, 6, 1);
  const endDate = new Date(2026, 9, 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-4 md:space-y-5 animate-in fade-in duration-500 min-h-screen">

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-page-title font-bold tracking-tight text-slate-900 dark:text-white wrap-break-word whitespace-normal">
            {greeting}, {currentUserName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-base sm:text-lg font-medium text-orange-600 dark:text-orange-400 mt-1 wrap-break-word whitespace-normal">
            {user?.designation || (user?.role === 'manager' ? 'Product Manager' : 'Frontend Developer Intern')}
          </p>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 mt-2 wrap-break-word whitespace-normal">
            You have <strong className="text-slate-700 dark:text-slate-200">{activeTasksCount} active tasks</strong>, <strong className="text-rose-600 dark:text-rose-400">{dueTodayCount} due today</strong>, and <strong>{loggedHours.toFixed(1)} hours</strong> logged total.
          </p>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Tasks */}
        <Card onClick={() => setIsTasksModalOpen(true)} className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-bold border-rose-100 dark:border-rose-900/30">{dueTodayCount} Due Today</Badge>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{activeTasksCount}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Active Tasks</p>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">{completedTasksCount} Done</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hours Logged */}
        <Card onClick={() => setIsHoursModalOpen(true)} className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-slate-500">Goal: 8 hrs</span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{loggedHours.toFixed(1)} <span className="text-lg text-slate-500 font-bold">hrs</span></p>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={Math.min(100, (loggedHours / 8) * 100)} className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contribution Score */}
        <Card onClick={() => setIsContributionModalOpen(true)} className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-5 flex items-center justify-between h-full gap-4">
            <div className="flex flex-col h-full justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Contribution</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                  ↑ +6 this week
                </p>
              </div>
            </div>
            <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * overallScore) / 100} className="text-orange-500" />
              </svg>
              <span className="absolute text-sm font-black text-slate-900 dark:text-white">{overallScore}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Standup Status */}
        <Card onClick={() => setIsStandupModalOpen(true)} className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", todaysStandup ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400")}>
                {todaysStandup ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              {todaysStandup ? (
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-500/10 font-bold">✅ Submitted</Badge>
              ) : (
                <Badge variant="outline" className="border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-500/10 font-bold">❌ Not Submitted</Badge>
              )}
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">Standup</p>
              {todaysStandup ? (
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {todaysStandup.time?.startsWith('Logged at') ? todaysStandup.time : `Logged at ${todaysStandup.time}`}
                </p>
              ) : (
                <p className="text-sm font-bold text-rose-500 dark:text-rose-400 mt-1">Action Required</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">

        {/* Left Column (8) */}
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-5">

          {/* My Today's Tasks */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 md:p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold flex items-center text-slate-900 dark:text-white">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mr-2" />
                My Today's Tasks
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-50 dark:hover:bg-orange-500/10 h-8">
                View All Tasks <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 flex flex-col justify-center">
                {displayedTodayTasks.length > 0 ? displayedTodayTasks.map((task: any) => (
                  <div key={task.id} className={cn(
                    "p-4 md:p-5 py-2.5 md:py-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                    task.project_status === 'aborted' ? "opacity-75 grayscale bg-slate-50 dark:bg-slate-900/40 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className={cn("text-base font-bold transition-colors truncate",
                          task.project_status === 'aborted' ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400"
                        )}>{task.title}</h4>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase tracking-wider font-bold rounded",
                          task.priority === 'High' ? "border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-500/10" :
                            task.priority === 'Normal' || task.priority === 'Medium' ? "border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-500/10" :
                              "border-slate-200 text-slate-600 bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800"
                        )}>{task.priority}</Badge>
                        {task.project_status === 'aborted' && (
                          <Badge variant="destructive" className="text-[10px] uppercase tracking-wider font-bold rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200/50">Aborted</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center"><LayoutDashboard className="h-3 w-3 mr-1" /> {task.project_tag}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" /> {task.due_date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className="flex flex-col gap-1.5 w-32 shrink-0">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className={cn(
                            task.status === 'Done' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 uppercase tracking-wider'
                          )}>{task.status}</span>
                          <span className="text-slate-900 dark:text-white">{task.progress ?? getProgress(task.status)}%</span>
                        </div>
                        <Progress value={task.progress ?? getProgress(task.status)} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 flex flex-col items-center justify-center text-center flex-1">
                    <span className="text-4xl mb-4">🎉</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">You're all caught up.</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Great job! Enjoy your free time or ask for more work.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4) */}
        <div className="lg:col-span-4 flex flex-col gap-4 md:gap-5">
          {/* Upcoming Events (read-only) */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col flex-1 h-full overflow-hidden">
            <CardHeader className="p-4 md:p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center text-slate-900 dark:text-white">
                <Clock className="h-4 w-4 text-orange-500 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <ScrollArea className="absolute inset-0 h-full w-full">
                <div className="p-4 md:p-5 space-y-3">
                  {employeeUpcomingEvents.length > 0 ? employeeUpcomingEvents.map((evt: any) => (
                    <div key={evt.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all">
                      <div className="flex flex-col items-center justify-center h-11 w-11 rounded-lg bg-orange-50 dark:bg-orange-500/10 shrink-0">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase leading-none">{format(evt.date, 'MMM')}</span>
                        <span className="text-sm font-black text-orange-700 dark:text-orange-300 leading-none mt-1">{format(evt.date, 'dd')}</span>
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate" title={evt.title}>{evt.title}</span>
                          {evt.time && <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded leading-none mt-0.5">{evt.time}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={cn("h-1.5 w-1.5 rounded-full",
                            evt.type === 'deadline' ? 'bg-rose-500' :
                              evt.type === 'milestone' ? 'bg-purple-500' :
                                evt.type === 'completed' ? 'bg-emerald-500' :
                                  evt.type === 'leave' ? 'bg-amber-500' :
                                    evt.type === 'meeting' ? 'bg-blue-500' :
                                      'bg-slate-500'
                          )} />
                          <span className="text-[10px] font-semibold text-slate-500 capitalize">{evt.type}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-xs text-slate-500 italic p-4 text-center bg-white dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">No upcoming events.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3-Column Grid for Metrics and Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 items-start mt-4 md:mt-5">

        <div className="space-y-4 md:space-y-5 h-full">
          {/* Contribution Progress */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <CardHeader className="p-4 md:p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <Target className="mr-2 h-4 w-4 text-orange-500" />
                Contribution Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 md:p-5 pt-0">
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-black text-slate-900 dark:text-white">{overallScore}%</span>
                <span className="text-sm font-bold text-slate-500 mb-1">Overall Score</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>Tasks Completed</span>
                    <span>{tasksCompleted} / {tasksTotal}</span>
                  </div>
                  <Progress value={tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-emerald-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>Hours Logged</span>
                    <span>{hoursLoggedValue.toFixed(1)} / 50</span>
                  </div>
                  <Progress value={Math.min(100, (hoursLoggedValue / 50) * 100)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>Milestones</span>
                    <span>{milestonesCompleted} / {milestonesTotal}</span>
                  </div>
                  <Progress value={milestonesTotal > 0 ? (milestonesCompleted / milestonesTotal) * 100 : 0} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-5 h-full">
          {/* Upcoming Deadlines (rich card from DailyStandups) */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base flex items-center whitespace-nowrap">
                <CalendarIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2 shrink-0" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              {role !== 'manager' && (
                <div className="flex justify-end mb-3">
                  <Button
                    onClick={() => setIsExtensionModalOpen(true)}
                    size="sm"
                    className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm border border-indigo-600 hover:border-indigo-700 text-xs transition-all duration-200"
                  >
                    Request Extension
                  </Button>
                </div>
              )}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((task: any) => {
                    let colorClass = "text-slate-600 dark:text-slate-400";
                    if (task.isOverdue) {
                      colorClass = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded";
                    } else if (task.isToday) {
                      colorClass = "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded";
                    }

                    const approvedExt = approvedExtensions.find((ex: any) => String(ex.taskId) === String(task.id));

                    return (
                      <div key={task.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{task.project_tag}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {approvedExt ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-semibold">Original:</span>
                                <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 line-through">
                                  {approvedExt.originalDueDate}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Extended:</span>
                                <span className={cn("text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400")}>
                                  {approvedExt.extendedDueDate}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className={cn("text-xs font-bold font-mono", colorClass)}>
                              {task.due_date}
                            </span>
                          )}
                          <Badge className={cn(
                            "text-[10px] font-black border-0 uppercase tracking-wider",
                            task.priority === 'High' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" :
                              task.priority === 'Normal' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                                "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          )}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400 font-medium text-sm">No upcoming deadlines. All caught up!</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refactored Training Calendar */}
        <div className="space-y-4 md:space-y-5 h-full">
          <EmployeeCalendar tasks={tasks} role={role} leaves={leaves} />
        </div>
      </div>

      {/* KPI Modals */}
      <Dialog open={isTasksModalOpen} onOpenChange={setIsTasksModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Active Tasks Summary</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-500 mb-4">You currently have <strong>{activeTasksCount}</strong> active tasks.</p>
            <ScrollArea className="h-75 pr-4">
              <div className="space-y-3">
                {tasks.filter(t => t.status !== 'Done').map(task => (
                  <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex justify-between items-center border border-slate-100 dark:border-slate-800">
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{task.project_tag}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{task.priority}</Badge>
                  </div>
                ))}
                {activeTasksCount === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">No active tasks! You're all caught up.</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <TotalHoursModal
        isOpen={isHoursModalOpen}
        onOpenChange={setIsHoursModalOpen}
        logs={allLogs}
        role={role}
        currentUser={{ name: currentUserName, email }}
      />

      <Dialog open={isContributionModalOpen} onOpenChange={setIsContributionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contribution Details</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-purple-500" />
            </div>
            <h3 className="text-4xl font-black mb-2 text-slate-900 dark:text-white">{overallScore}%</h3>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-4">↑ +6 points this week</p>
            <p className="text-sm text-slate-500 px-4">Your contribution score is a unified metric calculated automatically based on your <strong>completed tasks</strong>, <strong>logged hours</strong>, and <strong>milestones achieved</strong>.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStandupModalOpen} onOpenChange={setIsStandupModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Daily Standup</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center text-center">
            <div className={cn("h-20 w-20 rounded-full flex items-center justify-center mb-4", todaysStandup ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10")}>
              {todaysStandup ? <CheckCircle2 className="h-10 w-10 text-emerald-500" /> : <AlertCircle className="h-10 w-10 text-rose-500" />}
            </div>

            {todaysStandup ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Standup Submitted</h3>
                <p className="text-sm text-slate-500 mt-2">Logged today at {todaysStandup.time}</p>

                <div className="mt-6 w-full text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Yesterday</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{todaysStandup.yesterday || "No update"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Today</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{todaysStandup.today || "No update"}</p>
                  </div>
                  {todaysStandup.blockers && todaysStandup.blockers.toLowerCase() !== "none" && todaysStandup.blockers.toLowerCase() !== "none." && (
                    <div>
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Blockers</p>
                      <p className="text-sm text-rose-600 dark:text-rose-400">{todaysStandup.blockers}</p>
                    </div>
                  )}
                </div>

                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-6 bg-emerald-50 dark:bg-emerald-900/30 py-2 px-4 rounded-full inline-block">Great job keeping the team updated!</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Standup Not Submitted</h3>
                <p className="text-sm text-slate-500 mt-2 px-4">You haven't submitted your daily standup yet.</p>
                <p className="text-xs font-semibold text-rose-500 mt-6 bg-rose-50 dark:bg-rose-900/30 py-2 px-4 rounded-full inline-block">Please go to the Daily Standup tab to submit!</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <WhatsAppBroadcastDialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />
      <FigjamDialog open={isFigjamOpen} onOpenChange={setIsFigjamOpen} />

      {/* Deadline Extension Dialog */}
      <Dialog open={isExtensionModalOpen} onOpenChange={setIsExtensionModalOpen}>
        <DialogContent className="sm:max-w-112.5 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Request Deadline Extension</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Task / Milestone</label>
              {upcomingDeadlines.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full h-11 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-medium text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="text-slate-400 dark:bg-slate-900">Select task...</option>
                    {upcomingDeadlines.map((t: any) => (
                      <option key={t.id} value={t.id} className="dark:bg-slate-900">
                        {t.title} (Due: {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  No pending deadlines found to extend.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Days Extension Required</label>
              <input
                type="number"
                min="1"
                max="30"
                value={extensionDays}
                onChange={(e) => setExtensionDays(Math.max(1, Number(e.target.value)))}
                className="w-full h-11 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-medium text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Reason for Extension</label>
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Please state why you need this extension..."
                className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none font-medium text-sm"
              />
            </div>

            <div className="pt-2 flex justify-between gap-3">
              <Button
                onClick={() => {
                  setIsExtensionModalOpen(false);
                  setSelectedTaskId('');
                  setExtensionDays(1);
                  setExtensionReason('');
                }}
                variant="outline"
                className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtensionSubmit}
                disabled={upcomingDeadlines.length === 0}
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-sm"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
