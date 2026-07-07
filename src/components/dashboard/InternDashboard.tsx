import React, { useState } from 'react';
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

// MOCK DATA
const TASKS = [
  { id: '1', title: 'Implement Kanban Drag & Drop', project: 'Project OS', priority: 'High', due: 'Due Today', status: 'In Progress', progress: 80 },
  { id: '2', title: 'Design Authentication UI', project: 'Project OS', priority: 'Medium', due: 'Tomorrow', status: 'To Do', progress: 0 },
  { id: '3', title: 'Fix Navigation Bugs', project: 'Internal Tools', priority: 'Low', due: 'Jul 10', status: 'Review', progress: 95 },
  { id: '4', title: 'Update Component Library', project: 'Design System', priority: 'Medium', due: 'Jul 12', status: 'To Do', progress: 10 },
];

const RECENT_ACTIVITY = [
  { id: '1', action: 'Logged 2 hrs', target: 'Dashboard UI', time: '2h ago' },
  { id: '2', action: 'Completed', target: 'Login UI', time: '4h ago' },
  { id: '3', action: 'Submitted Standup', target: '', time: '9:10 AM' },
  { id: '4', action: 'Assigned new task', target: 'Kanban Drag & Drop', time: 'Yesterday' },
];

export default function InternDashboard() {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isFigjamOpen, setIsFigjamOpen] = useState(false);

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
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            {greeting}, Tanvy <span className="animate-wave inline-block origin-bottom-right">👋</span>
          </h1>
          <p className="text-lg font-medium text-orange-600 dark:text-orange-400 mt-1">Frontend Developer Intern</p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            You have <strong className="text-slate-700 dark:text-slate-200">4 active tasks</strong>, <strong className="text-rose-600 dark:text-rose-400">1 deadline today</strong>, and <strong>6.5 hours</strong> logged this week.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <Button onClick={() => setIsWhatsAppOpen(true)} variant="outline" className="w-full sm:w-auto rounded-xl font-bold bg-[#25D366]/10 dark:bg-[#25D366]/20 border-[#25D366]/20 dark:border-[#25D366]/30 shadow-sm hover:bg-[#25D366]/20 dark:hover:bg-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] transition-all h-11 px-5 whitespace-nowrap">
            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Broadcast
          </Button>
          <Button onClick={() => setIsFigjamOpen(true)} variant="outline" className="w-full sm:w-auto rounded-xl font-bold bg-[#A259FF]/10 dark:bg-[#A259FF]/20 border-[#A259FF]/20 dark:border-[#A259FF]/30 shadow-sm hover:bg-[#A259FF]/20 dark:hover:bg-[#A259FF]/30 text-[#8a3fe3] dark:text-[#A259FF] transition-all h-11 px-5 whitespace-nowrap">
            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 24c-3.314 0-6-2.686-6-6v-6h6v12zm6-12h-6V6c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6zM6 12C2.686 12 0 9.314 0 6s2.686-6 6-6 6 2.686 6 6v6H6z"/>
            </svg>
            FigJam
          </Button>
          <Button variant="outline" className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-700 h-11 px-5 font-bold shadow-sm text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
            Standup
          </Button>
          <Button className="w-full sm:w-auto rounded-xl bg-orange-600 hover:bg-orange-700 text-white h-11 px-6 font-bold shadow-sm transition-transform active:scale-95">
            <PlayCircle className="mr-2 h-4 w-4" />
            Log Work
          </Button>
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
              <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-bold border-rose-100 dark:border-rose-900/30">1 Due Today</Badge>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">4</p>
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
              <p className="text-3xl font-black text-slate-900 dark:text-white">5.5 <span className="text-lg text-slate-500 font-bold">hrs</span></p>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={68} className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500" />
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* My Today's Tasks */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
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
                {TASKS.length > 0 ? TASKS.map(task => (
                  <div key={task.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{task.title}</h4>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase tracking-wider font-bold rounded",
                          task.priority === 'High' ? "border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-500/10" : 
                          task.priority === 'Medium' ? "border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-500/10" : 
                          "border-slate-200 text-slate-600 bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800"
                        )}>{task.priority}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center"><LayoutDashboard className="h-3 w-3 mr-1" /> {task.project}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" /> {task.due}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className="flex flex-col gap-1.5 w-32 shrink-0">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className={cn(
                            task.status === 'Done' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 uppercase tracking-wider'
                          )}>{task.status}</span>
                          <span className="text-slate-900 dark:text-white">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500" />
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

          {/* Contribution Progress & Upcoming Deadlines Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            
            {/* Contribution Progress */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[320px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <Target className="mr-2 h-4 w-4 text-orange-500" />
                  Contribution Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-5xl font-black text-slate-900 dark:text-white">88%</span>
                  <span className="text-sm font-bold text-slate-500 mb-1">Overall Score</span>
                </div>
                <div className="space-y-6">
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

            {/* Upcoming Deadlines */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[320px] overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative min-h-[260px]">
                <ScrollArea className="absolute inset-0 h-full w-full">
                  <div className="p-6 space-y-7">
                    <div className="relative pl-6 before:absolute before:left-2 before:top-1.5 before:bottom-[-28px] before:w-px before:bg-slate-200 dark:before:bg-slate-700">
                      <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-white dark:border-slate-950 bg-rose-500" />
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1 block">Today</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Dashboard Review</p>
                      <Badge variant="outline" className="mt-2 text-[10px] border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-900/20 font-bold uppercase tracking-wider">High Priority</Badge>
                    </div>
                    
                    <div className="relative pl-6 before:absolute before:left-2 before:top-1.5 before:bottom-[-28px] before:w-px before:bg-slate-200 dark:before:bg-slate-700">
                      <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-white dark:border-slate-950 bg-amber-500" />
                      <span className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1 block">Tomorrow</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Login UI Adjustments</p>
                    </div>
                    
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-white dark:border-slate-950 bg-slate-300 dark:bg-slate-600" />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1 block">Friday</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Sprint Demo Prep</p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Right Column (4) */}
        <div className="lg:col-span-4 flex flex-col gap-8">


          {/* Refactored Training Calendar */}
          <EmployeeCalendar />

          {/* Recent Activity */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col flex-1 min-h-[320px] overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center text-slate-900 dark:text-white">
                <Activity className="h-4 w-4 text-orange-500 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-[250px]">
              <ScrollArea className="absolute inset-0 h-full w-full">
                <div className="p-6 space-y-7">
                  {RECENT_ACTIVITY.map((act, i) => (
                    <div key={act.id} className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-28px] before:w-px before:bg-slate-100 dark:before:bg-slate-800 last:before:hidden">
                      <div className="absolute left-[3px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-950" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                        {act.action} {act.target && <span className="font-bold text-slate-900 dark:text-white">{act.target}</span>}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{act.time}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </div>
      
      <WhatsAppBroadcastDialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />
      <FigjamDialog open={isFigjamOpen} onOpenChange={setIsFigjamOpen} />
    </div>
  );
}
