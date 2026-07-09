import React, { useState, useEffect } from 'react';
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
import { WhatsAppBroadcastDialog } from "./WhatsAppBroadcastDialog";
import { FigjamDialog } from "./FigjamDialog";
import { EmployeeCalendar } from "./EmployeeCalendar";
import { INITIAL_TASKS, GLOBAL_LOGS, GLOBAL_ACTIVITY_FEED } from '@/data/mockData';
import { useProjects } from '@/context/ProjectContext';


interface InternDashboardProps {
  session?: any;
}

// Monkey-patch localStorage.setItem ONCE globally for this module
// so that different components/hooks can listen to same-tab storage events.
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments as any);
  // Dispatch a custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key, value } }));
};

export default function InternDashboard({ session }: InternDashboardProps) {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isFigjamOpen, setIsFigjamOpen] = useState(false);

  // Resolve current user based on session
  const role = session?.user?.user_metadata?.role || 'intern';
  const email = session?.user?.email || 'user@hindustaan.in';
  
  let currentUserId = 'u-4';
  let currentUserName = 'Tanvy Pandey';
  
  if (email.toLowerCase().includes('amanda')) {
    currentUserId = 'u-1';
    currentUserName = 'Amanda Smith';
  } else if (email.toLowerCase().includes('rahul')) {
    currentUserId = 'u-2';
    currentUserName = 'Rahul Sharma';
  } else if (email.toLowerCase().includes('priya')) {
    currentUserId = 'u-3';
    currentUserName = 'Priya Patel';
  }

  const { projects } = useProjects();
  
  // Extract dynamic tasks from central task list (TaskBoard source)
  const [tasks, setTasks] = useState<any[]>(() => {
    const saved = null; // Bypass local storage to fix UI issues
    const allTasks = saved ? JSON.parse(saved) : INITIAL_TASKS;
    return allTasks.filter((t: any) => 
      t.assignee_name === currentUserName || 
      (currentUserName.toLowerCase().includes('tanvy') && t.assignee_name?.toLowerCase().includes('tanvy'))
    );
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hindustaan_tasks_list' && e.newValue) {
        const allTasks = JSON.parse(e.newValue);
        setTasks(allTasks.filter((t: any) => 
          t.assignee_name === currentUserName || 
          (currentUserName.toLowerCase().includes('tanvy') && t.assignee_name?.toLowerCase().includes('tanvy'))
        ));
      }
    };
    
    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.key === 'hindustaan_tasks_list') {
        const allTasks = typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : INITIAL_TASKS;
        setTasks(allTasks.filter((t: any) => 
          t.assignee_name === currentUserName || 
          (currentUserName.toLowerCase().includes('tanvy') && t.assignee_name?.toLowerCase().includes('tanvy'))
        ));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate as EventListener);
    };
  }, [currentUserName]);

  // Read activity feed
  const [activityFeed, setActivityFeed] = useState<any[]>(() => {
    const saved = null; // Bypass local storage
    return saved ? JSON.parse(saved) : GLOBAL_ACTIVITY_FEED;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hindustaan_activity_feed' && e.newValue) {
        setActivityFeed(JSON.parse(e.newValue));
      }
    };
    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.key === 'hindustaan_activity_feed') {
        setActivityFeed(typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : GLOBAL_ACTIVITY_FEED);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate as EventListener);
    };
  }, []);
  
  const userActivities = React.useMemo(() => {
    return activityFeed.filter((act: any) => act.user === currentUserName || act.user.toLowerCase().includes(currentUserName.split(' ')[0].toLowerCase())).slice(0, 5);
  }, [activityFeed, currentUserName]);

  // Compute log hours this week from localStorage
  const [loggedHours, setLoggedHours] = useState(() => {
    const saved = localStorage.getItem('work_logs_list');
    const logs = saved ? JSON.parse(saved) : GLOBAL_LOGS;
    const userLogs = logs.filter((log: any) => log.name.toLowerCase() === currentUserName.toLowerCase() || (currentUserName.toLowerCase().includes('tanvy') && log.name.toLowerCase().includes('tanvy')));
    return userLogs.reduce((acc: number, log: any) => acc + log.hours, 0);
  });

  useEffect(() => {
    const handleLogsChange = (logsStr: string | null) => {
      const logs = logsStr ? JSON.parse(logsStr) : GLOBAL_LOGS;
      const userLogs = logs.filter((log: any) => log.name.toLowerCase() === currentUserName.toLowerCase() || (currentUserName.toLowerCase().includes('tanvy') && log.name.toLowerCase().includes('tanvy')));
      setLoggedHours(userLogs.reduce((acc: number, log: any) => acc + log.hours, 0));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'work_logs_list') handleLogsChange(e.newValue);
    };
    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.key === 'work_logs_list') handleLogsChange(e.detail.value);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate as EventListener);
    };
  }, [currentUserName]);

  const getProgress = (status: string) => {
    switch (status) {
      case 'Done': return 100;
      case 'In Review': return 85;
      case 'In Progress': return 50;
      default: return 0;
    }
  };

  const activeTasksCount = tasks.filter(t => t.status !== 'Done').length;
  const dueTodayCount = tasks.filter(t => t.due_date.toLowerCase().includes('today') || t.due_date.toLowerCase().includes('12') || t.due_date.toLowerCase().includes(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase())).length;

  const today = new Date();
  const currentHour = today.getHours();
  let greeting = 'Good Morning';
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good Afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good Evening';
  }
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(today);
  const startDate = new Date(2026, 6, 1);
  const endDate = new Date(2026, 9, 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-4 md:space-y-5 animate-in fade-in duration-500 min-h-screen">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 break-words whitespace-normal">
            {greeting}, {currentUserName.split(' ')[0]} <span className="animate-wave inline-block origin-bottom-right">👋</span>
          </h1>
          <p className="text-base sm:text-lg font-medium text-orange-600 dark:text-orange-400 mt-1 break-words whitespace-normal">Frontend Developer Intern</p>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 mt-2 break-words whitespace-normal">
            You have <strong className="text-slate-700 dark:text-slate-200">{activeTasksCount} active tasks</strong>, <strong className="text-rose-600 dark:text-rose-400">{dueTodayCount} due today</strong>, and <strong>{loggedHours.toFixed(1)} hours</strong> logged total.
          </p>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Tasks */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-bold border-rose-100 dark:border-rose-900/30">{dueTodayCount} Due Today</Badge>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{activeTasksCount}</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Active Tasks</p>
            </div>
          </CardContent>
        </Card>

        {/* Hours Logged */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
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
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
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
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * 88) / 100} className="text-orange-500" />
              </svg>
              <span className="absolute text-sm font-black text-slate-900 dark:text-white">88%</span>
            </div>
          </CardContent>
        </Card>

        {/* Standup Status */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-500/10 font-bold">✅ Submitted</Badge>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">Standup</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Logged at 9:10 AM</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        
        {/* Left Column (8) */}
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-5">
          
          {/* My Today's Tasks */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 md:p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold flex items-center text-slate-900 dark:text-white">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mr-2" />
                My Today's Tasks
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-50 dark:hover:bg-orange-500/10 h-8">
                View All Tasks <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.length > 0 ? tasks.map(task => (
                  <div key={task.id} className="p-4 md:p-5 py-2.5 md:py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{task.title}</h4>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase tracking-wider font-bold rounded",
                          task.priority === 'High' ? "border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-500/10" : 
                          task.priority === 'Normal' || task.priority === 'Medium' ? "border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-500/10" : 
                          "border-slate-200 text-slate-600 bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800"
                        )}>{task.priority}</Badge>
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
                  <div className="p-12 flex flex-col items-center justify-center text-center">
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
          {/* Recent Highlights */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col flex-1 h-full overflow-hidden">
            <CardHeader className="p-4 md:p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center text-slate-900 dark:text-white">
                <Activity className="h-4 w-4 text-orange-500 mr-2" />
                Recent Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <ScrollArea className="absolute inset-0 h-full w-full">
                <div className="p-4 md:p-5 space-y-4">
                {userActivities.length > 0 ? userActivities.map((act: any) => (
                  <div key={act.id} className="relative pl-6 py-1 before:absolute before:left-2 before:top-3 before:bottom-[-16px] before:w-px before:bg-slate-100 dark:before:bg-slate-800 last:before:hidden">
                    <div className="absolute left-[3px] top-2 h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-950" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                      {act.action} {act.target && <span className="font-bold text-slate-900 dark:text-white">{act.target}</span>}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{act.time}</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No recent activity.</p>
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
                <span className="text-5xl font-black text-slate-900 dark:text-white">88%</span>
                <span className="text-sm font-bold text-slate-500 mb-1">Overall Score</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>Tasks Completed</span>
                    <span>24 / 30</span>
                  </div>
                  <Progress value={80} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-emerald-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>Hours Logged</span>
                    <span>42 / 50</span>
                  </div>
                  <Progress value={84} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>Milestones</span>
                    <span>2 / 3</span>
                  </div>
                  <Progress value={66} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-5 h-full">
          {/* Upcoming Deadlines */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
            <CardHeader className="p-4 md:p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-0">
              <ScrollArea className="absolute inset-0 h-full w-full">
                <div className="p-4 md:p-5 space-y-4">
                  {tasks.filter(t => t.status !== 'Done').slice(0, 3).map((task, idx) => (
                    <div key={task.id} className="relative pl-6 py-1 before:absolute before:left-2 before:top-2.5 before:bottom-[-16px] before:w-px before:bg-slate-200 dark:before:bg-slate-700 last:before:hidden">
                      <div className={cn(
                        "absolute left-0 top-2.5 h-4 w-4 rounded-full border-4 border-white dark:border-slate-950",
                        idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
                      )} />
                      <span className={cn(
                        "text-xs font-black uppercase tracking-wider mb-0.5 block",
                        idx === 0 ? "text-rose-600 dark:text-rose-400" : idx === 1 ? "text-amber-600 dark:text-amber-500" : "text-slate-500"
                      )}>{task.due_date}</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</p>
                      {task.priority === 'High' && (
                        <Badge variant="outline" className="mt-1.5 text-[10px] border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-900/20 font-bold uppercase tracking-wider">High Priority</Badge>
                      )}
                    </div>
                  ))}
                  {tasks.filter(t => t.status !== 'Done').length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No upcoming deadlines. 🎉</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column Wrapper */}
        <div className="space-y-4 md:space-y-5 h-full">
          {/* Refactored Training Calendar */}
          <EmployeeCalendar />
        </div>
      </div>
      
      <WhatsAppBroadcastDialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />
      <FigjamDialog open={isFigjamOpen} onOpenChange={setIsFigjamOpen} />
    </div>
  );
}
