import React, { useState } from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  CheckCircle2,
  CalendarClock,
  ChevronDown,
  Megaphone,
  BellRing,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProjectCalendarWidget } from './ProjectCalendarWidget';
import { Separator } from '@/components/ui/separator';
import { AssignTaskDialog } from './AssignTaskDialog';
import { WhatsAppBroadcastDialog } from './WhatsAppBroadcastDialog';
import { FigjamDialog } from './FigjamDialog';

// --- Mock Data ---
const TEAM_MEMBERS = [
  { id: '1', name: 'Amanda Smith', role: 'Frontend', status: 'online', initials: 'AS' },
  { id: '2', name: 'Rahul Sharma', role: 'Backend', status: 'busy', initials: 'RS' },
  { id: '3', name: 'Priya Patel', role: 'Data Sci', status: 'leave', initials: 'PP' },
  { id: '4', name: 'Rohan Gupta', role: 'DevOps', status: 'online', initials: 'RG' },
  { id: '5', name: 'Aiden Chen', role: 'Design', status: 'offline', initials: 'AC' },
];

const PROJECTS = [
  { id: 'p1', name: 'Authentication Flow Pipeline', progress: 85, dueDate: 'Today', status: 'On Track' },
  { id: 'p2', name: 'Dashboard UI Revamp', progress: 40, dueDate: 'Tomorrow', status: 'At Risk' },
  { id: 'p3', name: 'Supabase Data Migration', progress: 95, dueDate: 'Aug 12', status: 'Completed' },
  { id: 'p4', name: 'Role-Based Access Control', progress: 20, dueDate: 'Aug 15', status: 'On Track' },
  { id: 'p5', name: 'Email Notifications System', progress: 60, dueDate: 'Aug 18', status: 'On Track' },
];

const ACTIVITY_FEED = [
  { id: 'a1', user: 'Rahul Sharma', action: 'completed task', target: 'API Route Setup', time: '10m ago', type: 'task' },
  { id: 'a2', user: 'Amanda Smith', action: 'submitted work log', target: '8.5 hours', time: '1h ago', type: 'log' },
  { id: 'a3', user: 'System', action: 'created project', target: 'Dashboard UI Revamp', time: '2h ago', type: 'project' },
  { id: 'a4', user: 'Priya Patel', action: 'submitted standup', target: 'Daily Sync', time: '3h ago', type: 'standup' },
  { id: 'a5', user: 'Rohan Gupta', action: 'assigned task to', target: 'Aiden Chen', time: '4h ago', type: 'assign' },
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

export default function ManagerDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isFigjamOpen, setIsFigjamOpen] = useState(false);

  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 18) greeting = 'Good Afternoon';

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'On Track': return 'secondary';
      case 'At Risk': return 'destructive';
      case 'Completed': return 'default';
      default: return 'outline';
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch(status) {
      case 'On Track': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20';
      case 'At Risk': return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20';
      case 'Completed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700';
      default: return '';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {greeting}, Aakash <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Manage projects, monitor team performance, and track progress from one place.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <Button onClick={() => setIsWhatsAppOpen(true)} variant="outline" className="w-full md:w-auto h-10 px-4 rounded-xl font-bold bg-[#25D366]/10 dark:bg-[#25D366]/20 border-[#25D366]/20 dark:border-[#25D366]/30 shadow-sm hover:bg-[#25D366]/20 dark:hover:bg-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] transition-all whitespace-nowrap">
            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Broadcast
          </Button>
          <Button onClick={() => setIsFigjamOpen(true)} variant="outline" className="w-full md:w-auto h-10 px-4 rounded-xl font-bold bg-[#A259FF]/10 dark:bg-[#A259FF]/20 border-[#A259FF]/20 dark:border-[#A259FF]/30 shadow-sm hover:bg-[#A259FF]/20 dark:hover:bg-[#A259FF]/30 text-[#8a3fe3] dark:text-[#A259FF] transition-all whitespace-nowrap">
            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 24c-3.314 0-6-2.686-6-6v-6h6v12zm6-12h-6V6c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6zM6 12C2.686 12 0 9.314 0 6s2.686-6 6-6 6 2.686 6 6v6H6z"/>
            </svg>
            FigJam
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <FolderKanban className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10">+2 this wk</Badge>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">12</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Active Projects</p>
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
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">248</p>
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
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">8</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Tasks Due Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
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
                <CardDescription className="text-xs font-semibold mt-1">Top 5 active projects across all cohorts.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-300 h-8">
                  View All <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pt-2">
                  {PROJECTS.map((project) => (
                    <div key={project.id} className="group flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {project.name}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", getStatusBadgeStyles(project.status))}>
                            {project.status}
                          </Badge>
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Due: {project.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={project.progress} className={cn("h-2 flex-1", project.status === 'At Risk' ? 'bg-rose-100 dark:bg-rose-900/40 [&>div]:bg-rose-500' : 'bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500 dark:[&>div]:bg-orange-400')} />
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 w-8 text-right">{project.progress}%</span>
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
                <CardDescription className="text-xs font-semibold mt-1">Impediments requiring your immediate attention.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                         <AvatarFallback className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-bold">AS</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Amanda Smith</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20">High Priority</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium ml-8">
                    Figma API token expired and waiting for renewal. Cannot proceed with design implementation.
                  </p>
                  <div className="flex items-center gap-3 ml-8 mt-1">
                     <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 font-bold">Resolve</Button>
                     <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-2 font-semibold">Message</Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                         <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold">PP</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Priya Patel</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">Blocked Task</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium ml-8">
                    Waiting for data engineering team to provide the cleaned dataset for ML model training.
                  </p>
                  <div className="flex items-center gap-3 ml-8 mt-1">
                     <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-2 font-bold">Resolve</Button>
                     <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-2 font-semibold">Message</Button>
                  </div>
                </div>

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
                <CardDescription className="text-xs font-semibold mt-1">Real-time pulse of workspace execution.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pt-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                  {ACTIVITY_FEED.map((activity) => (
                    <div key={activity.id} className="relative pl-6">
                      <div className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-950" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 text-xs font-bold rounded-lg">
                              {activity.user.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
                              <span className="font-bold text-slate-900 dark:text-white">{activity.user}</span> {activity.action} <span className="font-bold text-slate-900 dark:text-white">{activity.target}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap pt-1">{activity.time}</span>
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
                  <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 shrink-0">3 Due</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {DEADLINES.map((deadline) => (
                  <div key={deadline.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{deadline.task}</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 rounded-full">
                          <AvatarFallback className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[8px] font-bold">
                            {deadline.assignee.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{deadline.assignee}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="font-semibold text-xs cursor-pointer">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="font-semibold text-xs cursor-pointer text-orange-600 dark:text-orange-400 focus:text-orange-600">Reassign</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Availability */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Team Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">24</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-extrabold text-amber-500">4</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Busy</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-extrabold text-slate-600 dark:text-slate-400">2</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 overflow-hidden">
                {TEAM_MEMBERS.map((member) => (
                  <div key={member.id} className="relative">
                    <Avatar className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-950">
                      <AvatarFallback className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950",
                      member.status === 'online' ? 'bg-emerald-500' :
                      member.status === 'busy' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                    )} />
                  </div>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-white dark:border-slate-950 text-[10px] font-bold text-slate-500">
                  +25
                </div>
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
                  {NOTIFICATIONS.map((notif) => (
                    <div key={notif.id} className={cn("p-4 flex gap-3 items-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40", notif.unread ? 'bg-slate-50/50 dark:bg-slate-900/20' : '')}>
                      <div className="mt-1 shrink-0">
                        {notif.unread ? (
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                        )}
                      </div>
                      <p className={cn("text-sm font-medium leading-snug", notif.unread ? "text-slate-900 dark:text-white font-bold" : "text-slate-600 dark:text-slate-400")}>
                        {notif.text}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </div>
      
      <AssignTaskDialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen} />
      <WhatsAppBroadcastDialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />
      <FigjamDialog open={isFigjamOpen} onOpenChange={setIsFigjamOpen} />
    </div>
  );
}
