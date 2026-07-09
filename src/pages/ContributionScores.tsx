import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
  CartesianGrid, RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import {
  Trophy, TrendingUp, TrendingDown, Target, Clock, Mic,
  Download, RefreshCw, Filter, Calendar, Search, MoreVertical,
  AlertTriangle, CheckCircle2, ChevronRight, BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { INITIAL_TASKS, GLOBAL_LOGS } from '@/data/mockData';

// -- MOCK DATA GENERATOR --
const generateData = () => {
  const depts = ['Frontend', 'Backend', 'AI/ML', 'UI/UX'];
  const interns = [];

  const scoreDist = [
    ...Array(8).fill([90, 100]), // Excellent
    ...Array(10).fill([80, 89]), // Good
    ...Array(7).fill([70, 79]),  // Average
    ...Array(5).fill([50, 69])   // Needs Improvement
  ];

  for (let i = 0; i < 30; i++) {
    const range = scoreDist[i];
    const targetScore = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];

    // Formula: 40% Task, 35% Logs, 25% Standups
    const taskMax = 40; const logMax = 35; const standupMax = 25;

    let taskScore = Math.round((targetScore / 100) * taskMax);
    let logScore = Math.round((targetScore / 100) * logMax);
    let standupScore = Math.round((targetScore / 100) * standupMax);

    // Adjust slightly to match target score exactly
    const diff = targetScore - (taskScore + logScore + standupScore);
    taskScore += diff; // dump rounding diff into task score

    const actualScore = taskScore + logScore + standupScore;

    interns.push({
      id: `INT-${(i + 1).toString().padStart(3, '0')}`,
      name: i === 0 ? "Tanvy Pandey" : `Intern Member ${i + 1}`,
      department: depts[i % 4],
      project: i % 2 === 0 ? "Dashboard V2" : "Core API",
      manager: "Aakash Gupta",
      score: actualScore,
      taskScore,
      logScore,
      standupScore,
      trend: (Math.random() * 8 - 2).toFixed(1),
      status: actualScore >= 90 ? 'Excellent' : actualScore >= 80 ? 'Good' : actualScore >= 70 ? 'Average' : 'Needs Improvement',
      hoursLogged: Math.floor(Math.random() * (45 - 20) + 20),
      tasksCompleted: Math.floor(Math.random() * (15 - 5) + 5)
    });
  }
  return interns.sort((a, b) => b.score - a.score); // Highest first
};

const MOCK_INTERNS = generateData();

// Chart Data
const weeklyTrendData = [
  { name: 'Week 1', score: 78 },
  { name: 'Week 2', score: 82 },
  { name: 'Week 3', score: 85 },
  { name: 'Week 4', score: 86 },
];

const deptData = [
  { name: 'Frontend', score: 88 },
  { name: 'Backend', score: 82 },
  { name: 'UI/UX', score: 91 },
  { name: 'AI/ML', score: 79 },
];

const COLORS = {
  excellent: '#10b981', // emerald-500
  good: '#3b82f6', // blue-500
  average: '#eab308', // yellow-500
  poor: '#ef4444', // red-500
  orange: '#f97316' // orange-500
};

export default function ContributionScores({ session }: { session?: any }) {
  const [selectedIntern, setSelectedIntern] = useState<typeof MOCK_INTERNS[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Load and count user's tasks
  const savedTasksStr = localStorage.getItem('hindustaan_tasks_list');
  const allTasks = savedTasksStr ? JSON.parse(savedTasksStr) : INITIAL_TASKS;
  const userTasks = allTasks.filter((t: any) => 
    t.assignee_id === currentUserId || 
    t.assignee_name.toLowerCase().includes(currentUserName.split(' ')[0].toLowerCase())
  );
  const completedTasks = userTasks.filter((t: any) => t.status === 'Done');
  const tasksCompletedCount = completedTasks.length;
  const totalTasks = userTasks.length || 1;
  const taskRate = (tasksCompletedCount / totalTasks) * 100;

  // Load and sum user's logs
  const savedLogsStr = localStorage.getItem('work_logs_list');
  const allLogs = savedLogsStr ? JSON.parse(savedLogsStr) : GLOBAL_LOGS;
  const userLogs = allLogs.filter((log: any) => 
    log.name.toLowerCase().includes(currentUserName.split(' ')[0].toLowerCase())
  );
  const totalHoursLogged = userLogs.reduce((acc: number, log: any) => acc + log.hours, 0);

  // Daily Standups count derived from log events
  const standupsCount = Math.max(0, Math.round(totalHoursLogged / 3));

  // Milestones matching from projects
  const savedProjects = localStorage.getItem('hindustaan_projects_list');
  const PROJECTS_FALLBACK = [
    { id: 'p1', name: 'Hindustaan OS', milestones: [
      { id: 'm1', title: 'Task Manager Interface', status: 'completed', date: 'Oct 05, 2026' },
      { id: 'm2', title: 'Work Log Timer Integration', status: 'completed', date: 'Oct 08, 2026' },
      { id: 'm3', title: 'Standup Automation Bot', status: 'in-progress', date: 'Oct 15, 2026' },
      { id: 'm4', title: 'Performance Analytics Dashboard', status: 'pending', date: 'Oct 20, 2026' }
    ]}
  ];
  const allProjects = savedProjects ? JSON.parse(savedProjects) : PROJECTS_FALLBACK;
  const allMilestones = allProjects.flatMap((p: any) => p.milestones || []);
  const completedMilestones = allMilestones.filter((m: any) => m.status === 'completed');
  const milestonesCount = completedMilestones.length || Math.max(1, Math.min(5, Math.round(completedTasks.length * 0.4)));
  const totalMilestonesCount = allMilestones.length || 4;
  const milestoneRate = (milestonesCount / totalMilestonesCount) * 100;

  // Overall Performance is calculated dynamically based on tasks completed and milestones achieved
  const overallScore = Math.min(100, Math.round((taskRate + milestoneRate) / 2)) || 85;

  if (role === 'intern') {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
              <Trophy className="mr-3 h-8 w-8 text-orange-500" />
              My Performance Analytics
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
              Review your tasks, logged hours, standups, and milestone details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm font-bold">
              <Calendar className="mr-2 h-4 w-4 text-slate-400" />
              This Month
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm font-bold">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
          {/* Overall Performance Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm col-span-1 sm:col-span-2 lg:col-span-2 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendData}>
                  <Area type="monotone" dataKey="score" stroke={COLORS.orange} fill={COLORS.orange} strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Overall Performance</span>
              </div>
              <div className="flex items-end gap-3 mt-4">
                <span className="text-5xl font-black text-slate-900 dark:text-white">{overallScore}%</span>
                <span className="flex items-center text-sm font-bold text-emerald-600 mb-1">
                  <TrendingUp className="h-4 w-4 mr-1" /> +2%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Completed Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tasks Completed</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{tasksCompletedCount} / {totalTasks}</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: Math.min(100, Math.round((tasksCompletedCount / totalTasks) * 100)), fill: COLORS.excellent }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <CheckCircle2 className="h-4 w-4 relative z-10" style={{ color: COLORS.excellent }} />
              </div>
            </CardContent>
          </Card>

          {/* Worklogs Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Worklogs</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalHoursLogged.toFixed(1)} hrs</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: Math.min(100, Math.round((totalHoursLogged / 40) * 100)), fill: COLORS.good }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Clock className="h-4 w-4 relative z-10" style={{ color: COLORS.good }} />
              </div>
            </CardContent>
          </Card>

          {/* Daily Standups Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Daily Standups</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{standupsCount}</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: Math.min(100, Math.round((standupsCount / 20) * 100)), fill: COLORS.orange }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Mic className="h-4 w-4 relative z-10" style={{ color: COLORS.orange }} />
              </div>
            </CardContent>
          </Card>

          {/* Milestones Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Milestones</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{milestonesCount} achieved</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: Math.min(100, Math.round((milestonesCount / totalMilestonesCount) * 100)), fill: COLORS.excellent }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Target className="h-4 w-4 relative z-10" style={{ color: COLORS.excellent }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intern Personal Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8) - My Tasks Status Table */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">My Tasks & Statuses</CardTitle>
                  <CardDescription className="font-medium mt-1">Review status and priority of all tasks assigned to you.</CardDescription>
                </div>
                <Badge variant="outline" className="font-bold border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:bg-orange-500/10">
                  {userTasks.length} total tasks
                </Badge>
              </CardHeader>
              <CardContent className="p-0 overflow-auto max-h-[500px]">
                {userTasks.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 font-bold sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Task Name</th>
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Priority</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {userTasks.map((task: any) => (
                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{task.title}</td>
                          <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">{task.project_tag}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={cn(
                              "font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider",
                              task.priority === 'High' ? "border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-500/10" :
                              task.priority === 'Normal' ? "border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-500/10" :
                              "border-slate-200 text-slate-650 bg-slate-50 dark:border-slate-700 dark:text-slate-350 dark:bg-slate-800"
                            )}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">{task.due_date}</td>
                          <td className="px-6 py-4 text-right">
                            <Badge className={cn(
                              "font-black text-xs px-2.5 py-1 rounded-lg",
                              task.status === 'Done' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                              task.status === 'In Review' ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" :
                              task.status === 'In Progress' ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                              {task.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <span className="text-4xl mb-3">🎉</span>
                    <h4 className="font-bold text-slate-900 dark:text-white">No tasks assigned to you yet.</h4>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (4) - Milestones Achieved List */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
              <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                  <Target className="mr-2 h-4 w-4 text-orange-500" />
                  Project Milestones
                </CardTitle>
                <CardDescription className="font-medium">Track your sprint milestone completions.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 overflow-auto max-h-[500px]">
                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-850 space-y-6">
                  {allMilestones.map((m: any, i: number) => {
                    const isCompleted = m.status === 'completed';
                    const isInProgress = m.status === 'in-progress';

                    return (
                      <div key={m.id || i} className="relative">
                        {/* Milestone dot indicator */}
                        <div className={cn(
                          "absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center shadow-sm",
                          isCompleted ? "bg-emerald-500 animate-pulse" :
                          isInProgress ? "bg-orange-500 animate-pulse" : "bg-slate-200 dark:bg-slate-800"
                        )}>
                          {isCompleted && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{m.title || m.name}</h4>
                            <Badge variant="outline" className={cn(
                              "text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded",
                              isCompleted ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-450 dark:bg-emerald-500/10" :
                              isInProgress ? "border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-900/40 dark:text-orange-400 dark:bg-orange-500/10" :
                              "border-slate-200 text-slate-500 bg-slate-50 dark:border-slate-800 dark:text-slate-450"
                            )}>
                              {m.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">{m.date || 'Target Milestone'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const filteredInterns = MOCK_INTERNS.filter(intern =>
    intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const top3 = MOCK_INTERNS.slice(0, 3);
  const needsAttention = MOCK_INTERNS.filter(i => i.score < 70).slice(0, 3);

  // Distribution for Donut
  const distData = [
    { name: 'Excellent', value: MOCK_INTERNS.filter(i => i.score >= 90).length, fill: COLORS.excellent },
    { name: 'Good', value: MOCK_INTERNS.filter(i => i.score >= 80 && i.score < 90).length, fill: COLORS.good },
    { name: 'Average', value: MOCK_INTERNS.filter(i => i.score >= 70 && i.score < 80).length, fill: COLORS.average },
    { name: 'Needs Imp.', value: MOCK_INTERNS.filter(i => i.score < 70).length, fill: COLORS.poor },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
            <Trophy className="mr-3 h-8 w-8 text-orange-500" />
            Contribution Analytics
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
            Monitor intern performance, identify top contributors, and track productivity trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm font-bold">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            This Month
          </Button>
          <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm font-bold">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-bold">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm col-span-1 sm:col-span-2 lg:col-span-2 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData}>
                <Area type="monotone" dataKey="score" stroke={COLORS.orange} fill={COLORS.orange} strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600">
                <BarChart2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Team Average</span>
            </div>
            <div className="flex items-end gap-3 mt-4">
              <span className="text-5xl font-black text-slate-900 dark:text-white">86%</span>
              <span className="flex items-center text-sm font-bold text-emerald-600 mb-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +4%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Small KPIs */}
        {[
          { title: "Task Performance", val: "91%", icon: Target, color: COLORS.excellent },
          { title: "Work Logs", val: "94%", icon: Clock, color: COLORS.good },
          { title: "Standups", val: "89%", icon: Mic, color: COLORS.orange },
        ].map((kpi, i) => (
          <Card key={i} className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{kpi.title}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{kpi.val}</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: parseInt(kpi.val), fill: kpi.color }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <kpi.icon className="h-4 w-4 relative z-10" style={{ color: kpi.color }} />
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Highest Score</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-900 shadow-sm">
                <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">TP</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Tanvy P.</p>
                <p className="text-lg font-black text-emerald-600">98%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column - Main Table */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Team Performance Overview</CardTitle>
                <CardDescription className="font-medium mt-1">Ranking of all 30 active interns based on their weighted contribution scores.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search interns..."
                  className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[600px] relative">
              <table className="w-full text-sm text-left relative">
                <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 font-bold sticky top-0 z-20">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Rank</th>
                    <th className="px-6 py-4">Intern</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Trend</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 rounded-tr-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInterns.map((intern, idx) => (
                    <tr
                      key={intern.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedIntern(intern)}
                    >
                      <td className="px-6 py-4 font-black text-slate-400 dark:text-slate-600">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                              {intern.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">{intern.name}</p>
                            <p className="text-xs font-medium text-slate-500">{intern.project}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                        {intern.department}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white">{intern.score}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{ width: `${intern.score}%`, backgroundColor: intern.score >= 90 ? COLORS.excellent : intern.score >= 80 ? COLORS.good : intern.score >= 70 ? COLORS.average : COLORS.poor }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "flex items-center text-xs font-bold",
                          parseFloat(intern.trend) > 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {parseFloat(intern.trend) > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(parseFloat(intern.trend))}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn(
                          "border-0 font-bold",
                          intern.status === 'Excellent' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                            intern.status === 'Good' ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                              intern.status === 'Average' ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                                "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        )}>
                          {intern.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={e => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem><BarChart2 className="mr-2 h-4 w-4" /> View Analytics</DropdownMenuItem>
                            <DropdownMenuItem><CheckCircle2 className="mr-2 h-4 w-4" /> Assign Task</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600"><AlertTriangle className="mr-2 h-4 w-4" /> Flag Performance</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Charts & Top Performers */}
        <div className="lg:col-span-4 space-y-6">

          {/* Score Distribution Donut */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {distData.map(d => (
                  <div key={d.name} className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: d.fill }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Comparison */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Avg Score by Dept</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500" domain={[60, 100]} />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                    <Bar dataKey="score" fill={COLORS.orange} radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Needs Attention */}
          <Card className="rounded-2xl border-rose-200 dark:border-rose-900/50 shadow-sm bg-rose-50/50 dark:bg-rose-950/20">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3">
              {needsAttention.map(intern => (
                <div key={intern.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-rose-100 text-rose-700 text-xs font-bold">{intern.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{intern.name}</p>
                      <p className="text-xs font-medium text-slate-500">Score: <span className="font-bold text-rose-600">{intern.score}%</span></p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30">Review</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intern Detail Drawer */}
      <Sheet open={!!selectedIntern} onOpenChange={(open) => !open && setSelectedIntern(null)}>
        <SheetContent className="w-full sm:max-w-md lg:max-w-lg overflow-y-auto bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-0 rounded-l-3xl">
          {selectedIntern && (
            <div className="flex flex-col min-h-full">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-900 shadow-md">
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-xl">
                        {selectedIntern.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white">{selectedIntern.name}</SheetTitle>
                      <p className="text-sm font-bold text-slate-500">{selectedIntern.department} Intern</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8 flex-1">
                {/* Final Score Radial */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Final Contribution Score</p>
                  <div className="h-48 w-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="80%" outerRadius="100%" data={[{ value: selectedIntern.score, fill: COLORS.orange }]} startAngle={90} endAngle={-270}>
                        <RadialBar background={{ fill: 'var(--color-slate-200)' }} dataKey="value" cornerRadius={20} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-900 dark:text-white">{selectedIntern.score}</span>
                      <span className="text-sm font-bold text-slate-500">/ 100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Formula Breakdown</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-orange-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Task Performance</p>
                          <p className="text-xs font-semibold text-slate-500">40% Weightage</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{selectedIntern.taskScore}</span>
                        <span className="text-sm font-bold text-slate-500"> / 40</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-orange-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Work Log Consistency</p>
                          <p className="text-xs font-semibold text-slate-500">35% Weightage</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{selectedIntern.logScore}</span>
                        <span className="text-sm font-bold text-slate-500"> / 35</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-orange-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600">
                          <Mic className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Standup Completion</p>
                          <p className="text-xs font-semibold text-slate-500">25% Weightage</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{selectedIntern.standupScore}</span>
                        <span className="text-sm font-bold text-slate-500"> / 25</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Formula Hint */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">How is this calculated?</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Scores automatically recalculate daily at midnight based on Jira tasks resolved, Harvest timesheets submitted, and Slack standups approved.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
