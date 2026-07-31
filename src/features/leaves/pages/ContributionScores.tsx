import React, { useState, useMemo, useEffect } from 'react';
import { useProjects } from '@/context/ProjectContext';
import api from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
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
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Real data will be fetched from the backend API

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-4 rounded-xl border border-slate-700/50 shadow-xl space-y-2 text-xs min-w-[220px]">
        <p className="font-bold text-slate-200 text-sm border-b border-slate-700 pb-1">{data.name}</p>
        <p className="text-orange-400 font-extrabold text-base flex justify-between">
          <span>Weekly Score:</span>
          <span>{data.score}%</span>
        </p>
        <div className="space-y-1.5 pt-1 text-[11px] text-slate-400 font-semibold">
          <div className="flex justify-between items-center">
            <span>📈 Tasks ({data.tasks}% × 35%)</span>
            <span className="text-slate-200 font-bold">{Math.round(data.tasks * 0.35)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>⏱️ Work Logs ({data.logs}% × 25%)</span>
            <span className="text-slate-200 font-bold">{Math.round(data.logs * 0.25)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>💬 Standups ({data.standups}% × 20%)</span>
            <span className="text-slate-200 font-bold">{Math.round(data.standups * 0.20)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>🏁 Milestones ({data.milestones}% × 20%)</span>
            <span className="text-slate-200 font-bold">{Math.round(data.milestones * 0.20)}%</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 leading-tight">
          Score = Tasks(35%) + Logs(25%) + Standups(20%) + Milestones(20%)
        </p>
      </div>
    );
  }
  return null;
};

export default function ContributionScores({ session }: { session?: any }) {
  const { projects } = useProjects();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const role = session?.user?.user_metadata?.role || currentUser?.role || 'employee';
  const email = session?.user?.email || currentUser?.email || '';
  const currentUserName = session?.user?.user_metadata?.name || currentUser?.name || 'Employee';

  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [internData, setInternData] = useState<any[]>([]);
  const [loadingCohort, setLoadingCohort] = useState(true);

  const [metrics, setMetrics] = useState<any>({
    overallScore: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    taskPercent: 0,
    hoursLogged: 0,
    targetHours: 40,
    logPercent: 0,
    submittedStandups: 0,
    totalStandupDays: 5,
    standupPercent: 0,
    milestonesAchieved: 0,
    totalMilestones: 0,
    milestonePercent: 0,
    weeklyTrendData: [
      { name: 'Week 1', score: 0 },
      { name: 'Week 2', score: 0 },
      { name: 'Week 3', score: 0 },
      { name: 'Week 4', score: 0 },
    ],
    scoreBreakdownData: [
      { name: 'Tasks Completed', value: 35, fill: COLORS.excellent },
      { name: 'Work Logs', value: 25, fill: COLORS.good },
      { name: 'Standups', value: 20, fill: COLORS.orange },
      { name: 'Milestones', value: 20, fill: '#8b5cf6' },
    ]
  });

  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const nameToCheck = currentUserName;

      // Try fetching server-computed contributionScore from /api/dashboard first
      try {
        const dashRes = await api.get('/dashboard');
        if (dashRes.data?.success && dashRes.data.data?.contributionScore) {
          const cs = dashRes.data.data.contributionScore;
          if (cs.overallScore > 0 || cs.totalTasks > 0 || cs.hoursLogged > 0) {
            setMetrics({
              overallScore: cs.overallScore || 0,
              tasksCompleted: cs.tasksCompleted || 0,
              totalTasks: cs.totalTasks || 0,
              taskPercent: cs.taskPercent || 0,
              hoursLogged: cs.hoursLogged || 0,
              targetHours: 48,
              logPercent: cs.logPercent || 0,
              submittedStandups: cs.standupsSubmitted || cs.submittedStandups || 0,
              totalStandupDays: 6,
              standupPercent: cs.standupPercent || 0,
              milestonesAchieved: cs.milestonesAchieved || 0,
              totalMilestones: cs.totalMilestones || 0,
              milestonePercent: cs.milestonePercent || 0,
              weeklyTrendData: cs.weeklyTrendData || [
                { name: 'Week 1', score: Math.max(50, (cs.overallScore || 70) - 15) },
                { name: 'Week 2', score: Math.max(60, (cs.overallScore || 75) - 10) },
                { name: 'Week 3', score: Math.max(70, (cs.overallScore || 80) - 5) },
                { name: 'Week 4', score: cs.overallScore || 85 },
              ],
              scoreBreakdownData: [
                { name: 'Tasks Completed', value: 35, fill: COLORS.excellent },
                { name: 'Work Logs', value: 25, fill: COLORS.good },
                { name: 'Standups', value: 20, fill: COLORS.orange },
                { name: 'Milestones', value: 20, fill: '#8b5cf6' },
              ]
            });
            setLoadingMetrics(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Dashboard fallback in ContributionScores:', e);
      }

      // 1. Fetch Tasks (Backend API restricts tasks by user role automatically)
      const tasksRes = await api.get('/tasks?limit=1000');
      let apiTasks: any[] = [];
      if (tasksRes.data?.success && Array.isArray(tasksRes.data.data)) {
        apiTasks = tasksRes.data.data;
      }

      // Also get from localStorage
      const savedTasksStr = localStorage.getItem('hindustaan_tasks');
      let localTasks: any[] = [];
      if (savedTasksStr) {
        try {
          const parsed = JSON.parse(savedTasksStr);
          if (Array.isArray(parsed)) {
            localTasks = parsed;
          }
        } catch (e) {
          console.error('Error parsing local tasks:', e);
        }
      }

      // Merge tasks by id/title to avoid duplication
      const mergedTasksMap = new Map();
      localTasks.forEach(t => {
        const idKey = t.id || t.title;
        mergedTasksMap.set(idKey, {
          id: t.id,
          title: t.title,
          status: t.status?.toLowerCase(),
          dueDate: t.dueDate || t.due_date
        });
      });
      apiTasks.forEach(t => {
        const idKey = t.id || t.title;
        mergedTasksMap.set(idKey, {
          id: t.id,
          title: t.title,
          status: t.status?.toLowerCase(),
          dueDate: t.dueDate || t.due_date
        });
      });
      
      const combinedTasks = Array.from(mergedTasksMap.values());
      const tasksCompleted = combinedTasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length;
      const totalTasks = combinedTasks.length;
      const taskPercent = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

      // 2. Fetch Work Logs (Backend API restricts logs by user role automatically)
      const logsRes = await api.get('/worklogs');
      let apiLogs: any[] = [];
      if (logsRes.data?.success && Array.isArray(logsRes.data.data)) {
        apiLogs = logsRes.data.data;
      }

      const savedLogsStr = localStorage.getItem('work_logs_list');
      let localLogs: any[] = [];
      if (savedLogsStr) {
        try {
          const parsed = JSON.parse(savedLogsStr);
          if (Array.isArray(parsed)) {
            localLogs = parsed.filter((log: any) => 
              log.name?.toLowerCase() === nameToCheck.toLowerCase() ||
              (nameToCheck.toLowerCase().includes(nameToCheck.split(' ')[0].toLowerCase()) && log.name?.toLowerCase().includes(nameToCheck.split(' ')[0].toLowerCase()))
            );
          }
        } catch (e) {
          console.error('Error parsing local logs:', e);
        }
      }

      // Merge and sum logs
      const combinedLogs = [...localLogs];
      apiLogs.forEach((al: any) => {
        const isDuplicate = localLogs.some((ll: any) => 
          ll.hours === parseFloat(al.hours) && 
          (ll.date === al.date || new Date(ll.rawDate || ll.date).toDateString() === new Date(al.rawDate || al.date).toDateString())
        );
        if (!isDuplicate) {
          combinedLogs.push({
            hours: parseFloat(al.hours) || 0,
            date: al.date || al.rawDate,
            rawDate: al.rawDate || al.date
          });
        }
      });
      const hoursLogged = combinedLogs.reduce((sum: number, l: any) => sum + (parseFloat(l.hours) || 0), 0);
      const targetHours = 48; // 6 days * 8 hours/day
      const logPercent = targetHours > 0 ? Math.min(100, Math.round((hoursLogged / targetHours) * 100)) : 0;

      // 3. Fetch Standups (API + localStorage)
      const standupsRes = await api.get(`/standups?userId=${currentUserId}&limit=100`);
      let apiStandups: any[] = [];
      if (standupsRes.data?.success && Array.isArray(standupsRes.data.data)) {
        apiStandups = standupsRes.data.data;
      }
      
      const savedStandupsStr = localStorage.getItem('hindustaan_standup_history');
      let localStandups: any[] = [];
      if (savedStandupsStr) {
        try {
          const parsed = JSON.parse(savedStandupsStr);
          if (Array.isArray(parsed)) {
            localStandups = parsed;
          }
        } catch (e) {
          console.error('Error parsing local standup history:', e);
        }
      }

      const mergedStandupsMap = new Map();
      localStandups.forEach((s: any) => {
        const dateKey = s.dateGroup === 'Today' ? new Date().toDateString() : (s.time + s.yesterday);
        mergedStandupsMap.set(s.id || dateKey, {
          id: s.id,
          done: s.yesterday || s.today || true,
          date: s.dateGroup === 'Today' ? new Date().toISOString() : s.rawDate || new Date().toISOString()
        });
      });
      apiStandups.forEach((s: any) => {
        const dateKey = new Date(s.date || s.submittedAt).toDateString();
        mergedStandupsMap.set(s.id || dateKey, {
          id: s.id,
          done: s.done || s.doing || true,
          date: s.date || s.submittedAt
        });
      });

      const combinedStandups = Array.from(mergedStandupsMap.values());
      const submittedStandups = combinedStandups.length;
      const totalStandupDays = 6; // Monday to Saturday
      const standupPercent = Math.min(100, Math.round((submittedStandups / totalStandupDays) * 100));

      // 4. Calculate Milestones from project context
      const myProjects = projects.filter(p =>
        p.tasks?.some((t: any) => 
          t.assignee_id === currentUserId || 
          (t.assignee_name && t.assignee_name.toLowerCase() === nameToCheck.toLowerCase()) ||
          (t.assignee_name && nameToCheck.toLowerCase().includes(t.assignee_name.split(' ')[0].toLowerCase()))
        )
      );
      const myMilestones = myProjects.flatMap(p => p.milestones || []);
      const milestonesAchieved = myMilestones.filter((m: any) => m.status === 'completed' || m.status === 'done').length;
      const totalMilestones = myMilestones.length;
      const milestonePercent = totalMilestones > 0 ? Math.round((milestonesAchieved / totalMilestones) * 100) : 0;

      // 5. Overall score
      const overallScore = Math.round((taskPercent * 0.35) + (logPercent * 0.25) + (standupPercent * 0.20) + (milestonePercent * 0.20));

      // 6. Compute weekly trend (past 4 weeks) - pre-parsed for computational efficiency
      const parsedLogs = combinedLogs.map(l => ({
        hours: parseFloat(l.hours) || 0,
        timeMs: new Date(l.date || l.rawDate).getTime()
      }));
      const parsedTasks = combinedTasks.map(t => ({
        status: t.status,
        timeMs: t.dueDate ? new Date(t.dueDate).getTime() : null
      }));
      const parsedStandups = combinedStandups.map(s => ({
        timeMs: s.date ? new Date(s.date).getTime() : null
      }));
      const parsedMilestones = myMilestones.map(m => ({
        status: m.status,
        timeMs: (m.dueDate || m.date) ? new Date(m.dueDate || m.date).getTime() : null
      }));

      const weeklyTrendData = [];
      for (let i = 3; i >= 0; i--) {
        const now = new Date();
        const start = new Date(now.getTime() - ((i + 1) * 7 * 24 * 60 * 60 * 1000));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));

        const startMs = start.getTime();
        const endMs = end.getTime();

        // Logs in this week
        const weekHours = parsedLogs
          .filter(l => l.timeMs >= startMs && l.timeMs < endMs)
          .reduce((sum, l) => sum + l.hours, 0);
        const weekLogPercent = Math.min(100, Math.round((weekHours / 48) * 100));

        // Tasks due/completed in this week
        const weekTasks = parsedTasks.filter(t => t.timeMs !== null && t.timeMs >= startMs && t.timeMs < endMs);
        const weekCompleted = weekTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
        const weekTaskPercent = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;

        // Standups in this week
        const weekStandupsCount = parsedStandups.filter(s => s.timeMs !== null && s.timeMs >= startMs && s.timeMs < endMs).length;
        const weekStandupPercent = Math.min(100, Math.round((weekStandupsCount / 6) * 100));

        const weekMilestones = parsedMilestones.filter(m => m.timeMs !== null && m.timeMs >= startMs && m.timeMs < endMs);
        const weekMilestonesCompleted = weekMilestones.filter(m => m.status === 'completed' || m.status === 'done').length;
        const weekMilestonePercent = weekMilestones.length > 0 ? Math.round((weekMilestonesCompleted / weekMilestones.length) * 100) : 0;

        const weekScore = Math.round((weekTaskPercent * 0.35) + (weekLogPercent * 0.25) + (weekStandupPercent * 0.20) + (weekMilestonePercent * 0.20));

        weeklyTrendData.push({
          name: `Week ${4 - i}`,
          score: weekScore,
          tasks: weekTaskPercent,
          logs: weekLogPercent,
          standups: weekStandupPercent,
          milestones: weekMilestonePercent
        });
      }

      setMetrics({
        overallScore,
        tasksCompleted,
        totalTasks,
        taskPercent,
        hoursLogged,
        targetHours,
        logPercent,
        submittedStandups,
        totalStandupDays,
        standupPercent,
        milestonesAchieved,
        totalMilestones,
        milestonePercent,
        weeklyTrendData,
        scoreBreakdownData: [
          { name: 'Tasks Completed', value: 35, fill: COLORS.excellent },
          { name: 'Work Logs', value: 25, fill: COLORS.good },
          { name: 'Standups', value: 20, fill: COLORS.orange },
          { name: 'Milestones', value: 20, fill: '#8b5cf6' },
        ]
      });    } catch (e) {
      console.error('Error fetching contribution metrics:', e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchCohortData = async () => {
    try {
      setLoadingCohort(true);
      const res = await api.get('/scores/cohort?period=today');
      if (res.data?.success) {
        const mapped = res.data.data.map((score: any) => ({
          id: score.userId,
          name: score.name,
          department: "Engineering", // Backend doesn't return department
          project: "Hindustaan OS",
          manager: "Aakash Gupta",
          score: Math.round(score.total),
          taskScore: Math.round(score.tasksScore),
          logScore: Math.round(score.hoursScore),
          standupScore: Math.round(score.milestoneScore), // Mapping to UI fields
          trend: 0, // Placeholder
          status: score.total >= 90 ? 'Excellent' : score.total >= 80 ? 'Good' : score.total >= 70 ? 'Average' : 'Needs Improvement',
          hoursLogged: Math.round(score.hoursScore * 0.48), // Approximate
          tasksCompleted: Math.round(score.tasksScore / 10) // Approximate
        }));
        setInternData(mapped);
      }
    } catch (e) {
      console.error('Error fetching cohort scores:', e);
    } finally {
      setLoadingCohort(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (role !== 'intern' && role !== 'employee') {
      fetchCohortData();
    }
  }, [currentUserId, currentUserName, projects, isRefreshing]);

  const filteredInterns = internData.filter(intern =>
    intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.project.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.score - a.score);

  const top3 = internData.slice(0, 3);
  const needsAttention = internData.filter(i => i.score < 70).slice(0, 3);

  // Distribution for Donut
  const distData = [
    { name: 'Excellent', value: internData.filter(i => i.score >= 90).length, fill: COLORS.excellent },
    { name: 'Good', value: internData.filter(i => i.score >= 80 && i.score < 90).length, fill: COLORS.good },
    { name: 'Average', value: internData.filter(i => i.score >= 70 && i.score < 80).length, fill: COLORS.average },
    { name: 'Needs Imp.', value: internData.filter(i => i.score < 70).length, fill: COLORS.poor },
  ];

  const teamAverageScore = internData.length > 0 
    ? Math.round(internData.reduce((acc, i) => acc + (i.score || 0), 0) / internData.length)
    : 0;

  const avgTaskPerf = internData.length > 0 
    ? Math.round(internData.reduce((acc, i) => acc + (i.taskScore || 0), 0) / internData.length)
    : 0;

  const avgLogPerf = internData.length > 0 
    ? Math.round(internData.reduce((acc, i) => acc + (i.logScore || 0), 0) / internData.length)
    : 0;

  const avgStandupPerf = internData.length > 0 
    ? Math.round(internData.reduce((acc, i) => acc + (i.standupScore || 0), 0) / internData.length)
    : 0;

  const highestScorer = internData.length > 0 ? internData.reduce((max, intern) => (intern.score > max.score ? intern : max), internData[0]) : null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Contribution Analytics Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

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
      headStyles: { fillColor: [249, 115, 22] },
    });

    doc.save(`Team_Contribution_Scores_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (role === 'intern' || role === 'employee') {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
              <Trophy className="mr-3 h-8 w-8 text-orange-500" />
              My Performance
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
              Your detailed contribution score, milestones, and weekly progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm font-bold justify-start text-left", !date && "text-slate-500")}>
                  <Calendar className="mr-2 h-4 w-4 text-slate-400" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate as any}
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleRefresh} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-bold">
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
          {/* Overall Score Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.weeklyTrendData}>
                  <Area type="monotone" dataKey="score" stroke={COLORS.orange} fill={COLORS.orange} strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Score</span>
              </div>
              <div className="flex items-end gap-2 mt-4">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{metrics.overallScore}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Completed Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tasks Completed</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.tasksCompleted} <span className="text-sm font-bold text-slate-500">/ {metrics.totalTasks}</span></p>
                <p className="text-xs font-bold text-slate-400 mt-1">{metrics.taskPercent}% completion rate</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: metrics.taskPercent, fill: COLORS.excellent }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Target className="h-4 w-4 relative z-10" style={{ color: COLORS.excellent }} />
              </div>
            </CardContent>
          </Card>

          {/* Work Logs Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Work Logs</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1 flex-wrap">{metrics.hoursLogged.toFixed(1)} <span className="text-sm font-bold text-slate-500 whitespace-nowrap">/ {metrics.targetHours} hrs</span></p>
                <p className="text-xs font-bold text-slate-400 mt-1">{metrics.logPercent}% of weekly goal</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: metrics.logPercent, fill: COLORS.good }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Clock className="h-4 w-4 relative z-10" style={{ color: COLORS.good }} />
              </div>
            </CardContent>
          </Card>

          {/* Standups Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Standups</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.submittedStandups} <span className="text-sm font-bold text-slate-500">/ {metrics.totalStandupDays} days</span></p>
                <p className="text-xs font-bold text-slate-400 mt-1">{metrics.standupPercent}% participation</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: metrics.standupPercent, fill: COLORS.orange }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Mic className="h-4 w-4 relative z-10" style={{ color: COLORS.orange }} />
              </div>
            </CardContent>
          </Card>

          {/* Milestones Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Milestones Achieved</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.milestonesAchieved} <span className="text-sm font-bold text-slate-500">/ {metrics.totalMilestones}</span></p>
                <p className="text-xs font-bold text-slate-400 mt-1">{Math.round(metrics.milestonePercent)}% completed</p>
              </div>
              <div className="h-12 w-12 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: metrics.milestonePercent, fill: '#8b5cf6' }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-100)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Trophy className="h-4 w-4 relative z-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (lg:col-span-8) - Weekly Performance Trend */}
          <div className="lg:col-span-8">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full bg-white dark:bg-slate-950">
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Weekly Performance Trend</CardTitle>
                <CardDescription className="font-medium mt-1">Track your progress and score development over the past weeks.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex-1">
                <div className="h-[350px] w-full">
                  {loadingMetrics ? (
                    <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold">Calculating Trend...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.weeklyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} className="text-slate-500" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} className="text-slate-500" domain={[0, 100]} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="score" stroke={COLORS.orange} strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (lg:col-span-4) - Pie Chart & Formula */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Contribution Score Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.scoreBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {metrics.scoreBreakdownData.map((entry: any, index: number) => (
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
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {metrics.scoreBreakdownData.map((d: any) => (
                    <div key={d.name} className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                      <div className="h-2.5 w-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="truncate">{d.name} ({d.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-amber-200/50 dark:border-amber-900/30 shadow-sm bg-amber-50/20 dark:bg-amber-950/10">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Score Calculation Formula
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Overall Score = (Tasks Completed % × 35%) + (Work Logs % × 25%) + (Standups % × 20%) + (Milestones % × 20%)
                </p>
                <Separator className="bg-amber-200/30 dark:bg-amber-800/30" />
                <div className="space-y-1.5">
                  <p>📈 <span className="font-bold text-slate-800 dark:text-slate-200">Tasks Completed (35%):</span> Completed tasks relative to total assigned tasks.</p>
                  <p>⏱️ <span className="font-bold text-slate-800 dark:text-slate-200">Work Logs (25%):</span> Hours logged relative to the target goal of 48 hours per week (8 hours/day × 6 days).</p>
                  <p>💬 <span className="font-bold text-slate-800 dark:text-slate-200">Standups (20%):</span> Daily standup submission participation rate (out of 6 working days, Monday to Saturday).</p>
                  <p>🏁 <span className="font-bold text-slate-800 dark:text-slate-200">Milestones (20%):</span> Percentage of project milestones completed on time.</p>
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

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm font-bold justify-start text-left", !date && "text-slate-500")}>
                <Calendar className="mr-2 h-4 w-4 text-slate-400" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate as any}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={handleExportPDF} className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm font-bold">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleRefresh} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-bold">
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
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
              <span className="text-5xl font-black text-slate-900 dark:text-white">{teamAverageScore}%</span>
              <span className="flex items-center text-sm font-bold text-emerald-600 mb-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +4%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Small KPIs */}
        {[
          { title: "Task Performance", val: `${avgTaskPerf}%`, icon: Target, color: COLORS.excellent },
          { title: "Work Logs", val: `${avgLogPerf}%`, icon: Clock, color: COLORS.good },
          { title: "Standups", val: `${avgStandupPerf}%`, icon: Mic, color: COLORS.orange },
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
            <div className="flex-1 flex justify-end">
                {highestScorer ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-emerald-500/20">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {highestScorer.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{highestScorer.name}</p>
                      <p className="text-lg font-black text-emerald-600">{highestScorer.score}%</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-500">No data</p>
                )}
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
            <CardContent className="p-0 overflow-auto max-h-[600px] scrollbar-hide relative">
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
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
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} className="text-slate-500" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} className="text-slate-500" domain={[60, 100]} />
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



    </div>
  );
}
