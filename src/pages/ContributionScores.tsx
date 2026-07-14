import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  CartesianGrid, RadialBarChart, RadialBar, AreaChart, Area, Legend
} from 'recharts';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';
import {
  Trophy, TrendingUp, TrendingDown, Target, Clock, Mic,
  Download, RefreshCw, Filter, Calendar, Search, MoreVertical,
  AlertTriangle, CheckCircle2, ChevronRight, BarChart2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { AssignTaskDialog } from '../components/dashboard/AssignTaskDialog';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const standup = payload.find((p: any) => p.dataKey === 'standupScore')?.value || 0;
    const log = payload.find((p: any) => p.dataKey === 'logScore')?.value || 0;
    const task = payload.find((p: any) => p.dataKey === 'taskScore')?.value || 0;
    const total = standup + log + task;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl space-y-2 text-left">
        <p className="font-black text-slate-800 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-1">{label}</p>
        <div className="space-y-1 text-xs font-bold">
          <div className="flex items-center justify-between gap-4 text-orange-600">
            <span>Task Performance:</span>
            <span>{task} / 40</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-blue-600 dark:text-blue-400">
            <span>Log Consistency:</span>
            <span>{log} / 35</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-600">
            <span>Standup Completion:</span>
            <span>{standup} / 25</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
            <span>Total Score:</span>
            <span>{total}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function ContributionScores({ session }: { session?: any }) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const tickColor = isDarkMode ? '#94a3b8' : '#64748b'; // slate-400 for dark mode, slate-500 for light mode
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0'; // slate-700 for dark mode, slate-200 for light mode

  const role = session?.user?.user_metadata?.role || 'employee';
  const email = session?.user?.email || 'user@hindustaan.in';

  const user = getCurrentUser();
  const userName = user?.name || 'Tanvy Pandey';
  let currentUserName = userName;
  if (email.toLowerCase().includes('amanda')) currentUserName = 'Amanda Smith';
  else if (email.toLowerCase().includes('rahul')) currentUserName = 'Rahul Sharma';
  else if (email.toLowerCase().includes('priya')) currentUserName = 'Priya Patel';

  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [analyticsIntern, setAnalyticsIntern] = useState<any>(null);
  // Backend data
  const [backendInterns, setBackendInterns] = useState<any[]>([]);
  const [myScore, setMyScore] = useState<any>(null);
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const [managerAnalytics, setManagerAnalytics] = useState<any>(null);

  // Fetch scores from backend
  useEffect(() => {
    const fetchScores = async () => {
      setIsLoadingScores(true);
      try {
        const currentUser = getCurrentUser();
        if (!currentUser?.id) { setIsLoadingScores(false); return; }

        if (currentUser.role === 'manager' || currentUser.role === 'admin') {
          // Manager: fetch full cohort leaderboard
          const [cohortRes, analyticsRes] = await Promise.all([
            api.get('/scores/cohort'),
            api.get('/scores/manager/analytics')
          ]);
          if (cohortRes.data?.success && Array.isArray(cohortRes.data.data)) {
            const mapped = cohortRes.data.data.map((s: any, i: number) => ({
              id: s.userId,
              name: s.user?.name || `Member ${i + 1}`,
              department: s.user?.department || 'General',
              project: s.user?.project || 'Core',
              manager: 'Manager',
              score: s.total || 0,
              taskScore: s.tasksScore || 0,
              logScore: s.hoursScore || 0,
              standupScore: s.milestoneScore || 0,
              trend: s.trend || '0.0',
              status: (s.total || 0) >= 90 ? 'Excellent' : (s.total || 0) >= 80 ? 'Good' : (s.total || 0) >= 70 ? 'Average' : 'Needs Improvement',
              hoursLogged: s.hoursLogged || 0,
              tasksCompleted: s.tasksCompleted || 0
            }));
            setBackendInterns(mapped);
          }
          if (analyticsRes.data?.success) {
            setManagerAnalytics(analyticsRes.data.data);
          }
        } else {
          // Intern: fetch own score
          const res = await api.get(`/scores/${currentUser.id}`);
          if (res.data?.success) {
            setMyScore(res.data.data);
          }
        }
      } catch (err: any) {
        console.warn('Scores fetch failed, using mock data:', err.response?.data?.message || err.message);
      } finally {
        setIsLoadingScores(false);
      }
    };
    fetchScores();
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Use backend data if available, otherwise fallback to mock
  const activeInterns = backendInterns.length > 0 ? backendInterns : MOCK_INTERNS;

  const filteredInterns = activeInterns.filter(intern =>
    intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.project.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a: any, b: any) => b.score - a.score);

  const top3 = activeInterns.slice(0, 3);
  const needsAttention = activeInterns.filter((i: any) => i.score < 70).slice(0, 3);

  // Distribution for Donut
  const distData = [
    { name: 'Excellent', value: activeInterns.filter((i: any) => i.score >= 90).length, fill: COLORS.excellent },
    { name: 'Good', value: activeInterns.filter((i: any) => i.score >= 80 && i.score < 90).length, fill: COLORS.good },
    { name: 'Average', value: activeInterns.filter((i: any) => i.score >= 70 && i.score < 80).length, fill: COLORS.average },
    { name: 'Needs Imp.', value: activeInterns.filter((i: any) => i.score < 70).length, fill: COLORS.poor },
  ];

  const highestScorer = activeInterns.reduce((max: any, intern: any) => (intern.score > max.score ? intern : max), activeInterns[0] || MOCK_INTERNS[0]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const currentUser = getCurrentUser();
      if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
        const res = await api.get('/scores/cohort');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map((s: any, i: number) => ({
            id: s.userId,
            name: s.user?.name || `Member ${i + 1}`,
            department: s.user?.department || 'General',
            project: s.user?.project || 'Core',
            manager: 'Manager',
            score: s.total || 0,
            taskScore: s.tasksScore || 0,
            logScore: s.hoursScore || 0,
            standupScore: s.milestoneScore || 0,
            trend: s.trend || '0.0',
            status: (s.total || 0) >= 90 ? 'Excellent' : (s.total || 0) >= 80 ? 'Good' : (s.total || 0) >= 70 ? 'Average' : 'Needs Improvement',
            hoursLogged: s.hoursLogged || 0,
            tasksCompleted: s.tasksCompleted || 0
          }));
          setBackendInterns(mapped);
          toast.success('Scores refreshed from server.');
        }
      }
    } catch (err) {
      toast.error('Could not refresh scores.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('Contribution Analytics Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

    // Create table data
    const tableData = filteredInterns.map((intern, idx) => [
      `#${idx + 1}`,
      intern.name,
      intern.department,
      `${intern.score}%`,
      intern.trend + '%',
      intern.status
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Rank', 'Intern', 'Department', 'Score', 'Trend', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }, // orange-500
    });

    doc.save(`Team_Contribution_Scores_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportPersonalPDF = (intern: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Performance Report: ${intern.name}`, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Department: ${intern.department}`, 14, 30);
    doc.text(`Project: ${intern.project}`, 14, 38);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 46);

    const tableData = [
      ['Total Score', `${intern.score}%`],
      ['Task Performance', `${intern.taskScore} / 40`],
      ['Work Log Consistency', `${intern.logScore} / 35`],
      ['Standup Completion', `${intern.standupScore} / 25`],
      ['Trend', `${intern.trend}%`],
      ['Status', intern.status]
    ];

    autoTable(doc, {
      startY: 56,
      head: [['Metric', 'Score']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] },
    });

    doc.save(`${intern.name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  if (role === 'employee') {
    const myData = MOCK_INTERNS.find(i => i.name === currentUserName) || MOCK_INTERNS[0];

    // Pull real counts from localStorage
    const savedTasks = localStorage.getItem('hindustaan_tasks_list');
    const allTasks = savedTasks ? JSON.parse(savedTasks) : [];
    const firstName = currentUserName.split(' ')[0].toLowerCase();
    const tasksCompleted = allTasks.filter((t: any) =>
      t.status === 'Done' &&
      t.assignee_name?.toLowerCase().includes(firstName)
    ).length || myData.tasksCompleted;

    const savedLogs = localStorage.getItem('work_logs_list');
    const allLogs = savedLogs ? JSON.parse(savedLogs) : [];
    const myLogEntries = allLogs.filter((l: any) =>
      l.name?.toLowerCase().includes(firstName)
    );
    const myLogsCount = myLogEntries.length || myData.hoursLogged;

    const savedStandups = localStorage.getItem('hindustaan_standups');
    const allStandups = savedStandups ? JSON.parse(savedStandups) : [];
    const myStandups = allStandups.filter((s: any) =>
      s.author?.toLowerCase().includes(firstName)
    ).length || Math.round((myData.standupScore / 25) * 12);

    const savedProjects = localStorage.getItem('hindustaan_projects');
    const allProjects = savedProjects ? JSON.parse(savedProjects) : [];
    const milestonesAchieved = allProjects.reduce((acc: number, p: any) =>
      acc + (p.milestones?.filter((m: any) => m.status === 'completed').length || 0), 0
    ) || Math.round((myData.taskScore / 40) * 5);

    const trendNum = parseFloat(myData.trend);

    // Employee weekly trend (derived from score)
    const myWeeklyTrend = [
      { name: 'Week 1', score: Math.max(50, myData.score - 8) },
      { name: 'Week 2', score: Math.max(50, myData.score - 5) },
      { name: 'Week 3', score: Math.max(50, myData.score - 2) },
      { name: 'Week 4', score: myData.score },
    ].map(w => {
      const taskScore = Math.round((w.score / 100) * 40);
      const logScore = Math.round((w.score / 100) * 35);
      const standupScore = w.score - taskScore - logScore;
      return {
        ...w,
        taskScore,
        logScore,
        standupScore
      };
    });

    // Recent log entries (last 5)
    const recentLogs = myLogEntries.slice(0, 5);

    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
              <Trophy className="mr-3 h-8 w-8 text-orange-500" />
              My Performance
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
              Your personal contribution score and activity breakdown, {currentUserName.split(' ')[0]}.
            </p>
          </div>
        </div>

        {/* KPI Cards — same grid layout as manager view */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">

          {/* Wide card — Overall Performance */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm col-span-1 sm:col-span-2 lg:col-span-2 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={myWeeklyTrend}>
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
                <span className="text-5xl font-black text-slate-900 dark:text-white">{myData.score}%</span>
                <span className={cn("flex items-center text-sm font-bold mb-1", trendNum >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {trendNum >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {trendNum >= 0 ? '+' : ''}{myData.trend}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 4 small KPI cards */}
          {[
            { title: 'Tasks Completed', val: String(tasksCompleted), icon: Target, color: COLORS.excellent },
            { title: 'Work Logs',       val: String(myLogsCount),    icon: Clock,  color: COLORS.good },
            { title: 'Standups',        val: String(myStandups),     icon: Mic,    color: COLORS.orange },
            { title: 'Milestones',      val: String(milestonesAchieved), icon: Trophy, color: COLORS.average },
          ].map((kpi, i) => (
            <Card key={i} className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{kpi.title}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{kpi.val}</p>
                </div>
                <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                    <RadialBarChart
                      innerRadius="70%" outerRadius="100%"
                      data={[{ value: Math.min(100, parseInt(kpi.val) * 10 || 70), fill: kpi.color }]}
                      startAngle={90} endAngle={-270}
                    >
                      <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <kpi.icon className="h-4 w-4 relative z-10" style={{ color: kpi.color }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid — same 12-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left — Weekly Score Trend + Recent Work Logs */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">

            {/* Weekly trend chart */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Weekly Score Trend</CardTitle>
                <CardDescription className="font-medium mt-1">Your contribution score trajectory over the past 4 weeks.</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={myWeeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="logGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.good} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.good} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="standupGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.excellent} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.excellent} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="standupScore" name="Standup Completion (Max 25)" stackId="1" stroke={COLORS.excellent} strokeWidth={2} fill="url(#standupGrad)" dot={{ fill: COLORS.excellent, r: 4 }} activeDot={{ r: 6 }} />
                      <Area type="monotone" dataKey="logScore" name="Work Log Consistency (Max 35)" stackId="1" stroke={COLORS.good} strokeWidth={2} fill="url(#logGrad)" dot={{ fill: COLORS.good, r: 4 }} activeDot={{ r: 6 }} />
                      <Area type="monotone" dataKey="taskScore" name="Task Performance (Max 40)" stackId="1" stroke={COLORS.orange} strokeWidth={2} fill="url(#taskGrad)" dot={{ fill: COLORS.orange, r: 4 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Work Logs */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Recent Work Logs</CardTitle>
                <CardDescription className="font-medium mt-1">Your latest submitted work log entries.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Task</th>
                      <th className="px-5 py-3">Project</th>
                      <th className="px-5 py-3 text-right">Hours</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentLogs.length > 0 ? recentLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{log.date}</td>
                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{log.task}</td>
                        <td className="px-5 py-3">
                          <span className="inline-block text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">{log.project}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-black text-orange-600">{log.hours?.toFixed(1)}h</td>
                        <td className="px-5 py-3 text-right">
                          <Badge variant="outline" className={cn(
                            "border-0 font-bold text-xs",
                            log.status === 'Approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                            log.status === 'Pending'  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                                                        "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                          )}>{log.status}</Badge>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-medium">No work logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Right — Score Breakdown + Formula hint */}
          <div className="lg:col-span-4 space-y-6">

            {/* Radial score */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Contribution Score</CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col items-center">
                <div className="h-[160px] w-[160px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="80%" outerRadius="100%" data={[{ value: myData.score, fill: COLORS.orange }]} startAngle={90} endAngle={-270}>
                      <RadialBar background={{ fill: 'var(--color-slate-200)' }} dataKey="value" cornerRadius={20} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">{myData.score}</span>
                    <span className="text-xs font-bold text-slate-500">/ 100</span>
                  </div>
                </div>
                <Badge className={cn(
                  "mt-3 font-bold text-sm px-4 py-1 border-0",
                  myData.status === 'Excellent'         ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                  myData.status === 'Good'              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                  myData.status === 'Average'           ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                                                         "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                )}>{myData.status}</Badge>
              </CardContent>
            </Card>

            {/* Score Breakdown bars */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {[
                  { label: 'Task Performance', score: myData.taskScore, max: 40, color: 'bg-blue-500' },
                  { label: 'Work Log Consistency', score: myData.logScore, max: 35, color: 'bg-emerald-500' },
                  { label: 'Standup Completion', score: myData.standupScore, max: 25, color: 'bg-purple-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{item.score} / {item.max}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", item.color)}
                        style={{ width: `${(item.score / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Formula hint */}
            <Card className="rounded-2xl border-amber-200/50 dark:border-amber-800/50 shadow-sm bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">How is this calculated?</h4>
                </div>
                <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400 pl-8 leading-relaxed">
                  <p>
                    Your overall score (max 100%) is the sum of three weighted categories:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong className="text-slate-900 dark:text-slate-200">Task Performance (Max 40%):</strong> Based on your completed tasks on the Kanban board and resolved milestones.
                    </li>
                    <li>
                      <strong className="text-slate-900 dark:text-slate-200">Work Log Consistency (Max 35%):</strong> Evaluated based on your active timesheets and logged work hours.
                    </li>
                    <li>
                      <strong className="text-slate-900 dark:text-slate-200">Standup Completion (Max 25%):</strong> Measures the percentage of daily standups submitted and approved by managers.
                    </li>
                  </ul>
                  <p className="pt-1 border-t border-amber-200/30 dark:border-amber-800/30 text-[11px] font-semibold italic text-amber-700 dark:text-amber-400">
                    Formula: Overall Score = Task Score (40) + Work Log Score (35) + Standup Score (25)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }




  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

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
        <div className="flex items-center gap-3">
          <Button onClick={handleExportPDF} variant="outline" className="font-bold border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-2 relative overflow-hidden group">
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
            <CardContent className="p-4 lg:p-5 flex flex-col items-center justify-center text-center gap-2 lg:gap-3">
              <div className="w-full flex flex-col items-center">
                <p className="text-[9px] lg:text-[10px] 2xl:text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1 whitespace-nowrap overflow-visible">{kpi.title}</p>
                <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white leading-none">{kpi.val}</p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: parseInt(kpi.val), fill: kpi.color }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <kpi.icon className="h-3 w-3 lg:h-4 lg:w-4 relative z-10" style={{ color: kpi.color }} />
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <CardContent className="p-4 lg:p-5 flex flex-col items-center justify-center text-center gap-2">
            <p className="text-[9px] lg:text-[10px] 2xl:text-[11px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">Highest Score</p>
            <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-900 shadow-sm shrink-0">
              <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-xs lg:text-sm">
                {highestScorer.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="w-full flex flex-col items-center">
              <p className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1">{highestScorer.name}</p>
              <p className="text-base lg:text-lg font-black text-emerald-600 leading-none mt-1">{highestScorer.score}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left Column - Main Table */}
        <div className="xl:col-span-8 flex flex-col min-w-0">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
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
            <CardContent 
              className={cn("p-0 overflow-auto flex-1 relative hide-scrollbar", isDragging ? "cursor-grabbing select-none" : "cursor-grab")}
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              <table className="w-full whitespace-nowrap text-sm text-left relative">
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => setAnalyticsIntern(intern)}
                    >
                      <td className="px-6 py-4 font-black text-slate-400 dark:text-slate-600">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                              {intern.name.split(' ').map((n: string) => n[0]).join('')}
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
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setAnalyticsIntern(intern)}><BarChart2 className="mr-2 h-4 w-4" /> View Analytics</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsAssignTaskOpen(true)}><CheckCircle2 className="mr-2 h-4 w-4" /> Assign Task</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600 cursor-pointer" onClick={() => toast.success(`Performance flagged for ${intern.name}`)}><AlertTriangle className="mr-2 h-4 w-4" /> Flag Performance</DropdownMenuItem>
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
        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-24 h-fit">

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
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" domain={[60, 100]} />
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
                      <AvatarFallback className="bg-rose-100 text-rose-700 text-xs font-bold">{intern.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
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

      <AssignTaskDialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen} />
      
      {/* Analytics Sheet */}
      <Sheet open={!!analyticsIntern} onOpenChange={(open) => !open && setAnalyticsIntern(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md lg:max-w-lg overflow-y-auto bg-slate-50 dark:bg-slate-950 p-0 border-l border-slate-200 dark:border-slate-800">
          {analyticsIntern && (
            <div className="flex flex-col min-h-full">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm flex items-center justify-between">
                <SheetTitle className="text-xl sm:text-2xl font-black flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-800 shadow-sm">
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-lg">
                      {analyticsIntern.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {analyticsIntern.name}
                    <p className="text-sm font-medium text-slate-500 mt-1">{analyticsIntern.department} Intern</p>
                  </div>
                </SheetTitle>
                <Button onClick={() => handleExportPersonalPDF(analyticsIntern)} variant="outline" size="icon" className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800 shrink-0" title="Export PDF">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-6 space-y-6 flex-1">
                <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Final Contribution Score</p>
                  <div className="h-48 w-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="80%" outerRadius="100%" data={[{ value: analyticsIntern.score, fill: COLORS.orange }]} startAngle={90} endAngle={-270}>
                        <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={20} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-900 dark:text-white">{analyticsIntern.score}</span>
                      <span className="text-sm font-bold text-slate-500 mt-1">/ 100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Formula Breakdown</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Target className="h-6 w-6" /></div>
                        <div>
                          <p className="text-base font-bold text-slate-900 dark:text-white">Task Performance</p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">40% Weightage</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{analyticsIntern.taskScore}</span>
                        <span className="text-sm font-bold text-slate-500"> / 40</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><Clock className="h-6 w-6" /></div>
                        <div>
                          <p className="text-base font-bold text-slate-900 dark:text-white">Work Log Consistency</p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">35% Weightage</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{analyticsIntern.logScore}</span>
                        <span className="text-sm font-bold text-slate-500"> / 35</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"><Mic className="h-6 w-6" /></div>
                        <div>
                          <p className="text-base font-bold text-slate-900 dark:text-white">Standup Completion</p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">25% Weightage</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{analyticsIntern.standupScore}</span>
                        <span className="text-sm font-bold text-slate-500"> / 25</span>
                      </div>
                    </div>
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
