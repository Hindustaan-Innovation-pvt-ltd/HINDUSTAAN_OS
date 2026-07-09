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
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const role = session?.user?.user_metadata?.role || 'intern';
  const email = session?.user?.email || 'user@hindustaan.in';

  let currentUserName = 'Tanvy Pandey';
  if (email.toLowerCase().includes('amanda')) currentUserName = 'Amanda Smith';
  else if (email.toLowerCase().includes('rahul')) currentUserName = 'Rahul Sharma';
  else if (email.toLowerCase().includes('priya')) currentUserName = 'Priya Patel';

  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredInterns = MOCK_INTERNS.filter(intern =>
    intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.project.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.score - a.score);

  const top3 = MOCK_INTERNS.slice(0, 3);
  const needsAttention = MOCK_INTERNS.filter(i => i.score < 70).slice(0, 3);

  // Distribution for Donut
  const distData = [
    { name: 'Excellent', value: MOCK_INTERNS.filter(i => i.score >= 90).length, fill: COLORS.excellent },
    { name: 'Good', value: MOCK_INTERNS.filter(i => i.score >= 80 && i.score < 90).length, fill: COLORS.good },
    { name: 'Average', value: MOCK_INTERNS.filter(i => i.score >= 70 && i.score < 80).length, fill: COLORS.average },
    { name: 'Needs Imp.', value: MOCK_INTERNS.filter(i => i.score < 70).length, fill: COLORS.poor },
  ];

  const highestScorer = MOCK_INTERNS.reduce((max, intern) => (intern.score > max.score ? intern : max), MOCK_INTERNS[0]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
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

  if (role === 'intern') {
    const myData = MOCK_INTERNS.find(i => i.name === currentUserName) || MOCK_INTERNS[0];
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
            <Trophy className="mr-3 h-8 w-8 text-orange-500" />
            My Performance
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
            Your detailed contribution score and performance breakdown.
          </p>
        </div>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
          <div className="p-6 md:p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex gap-5 items-center">
                <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 shadow-md">
                  <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-2xl">
                    {myData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">{myData.name}</h3>
                  <p className="text-base font-bold text-slate-500">{myData.department} Intern</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-10">
            {/* Final Score Radial */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Final Contribution Score</p>
              <div className="h-64 w-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="80%" outerRadius="100%" data={[{ value: myData.score, fill: COLORS.orange }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'var(--color-slate-200)' }} dataKey="value" cornerRadius={20} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-7xl font-black text-slate-900 dark:text-white">{myData.score}</span>
                  <span className="text-base font-bold text-slate-500 mt-1">/ 100</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Formula Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 transition-colors text-center">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 mb-4">
                    <Target className="h-8 w-8" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">Task Performance</p>
                  <p className="text-xs font-semibold text-slate-500 mb-4">40% Weightage</p>
                  <div className="mt-auto">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{myData.taskScore}</span>
                    <span className="text-sm font-bold text-slate-500"> / 40</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-colors text-center">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 mb-4">
                    <Clock className="h-8 w-8" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">Work Log Consistency</p>
                  <p className="text-xs font-semibold text-slate-500 mb-4">35% Weightage</p>
                  <div className="mt-auto">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{myData.logScore}</span>
                    <span className="text-sm font-bold text-slate-500"> / 35</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-purple-500/50 transition-colors text-center">
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 mb-4">
                    <Mic className="h-8 w-8" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">Standup Completion</p>
                  <p className="text-xs font-semibold text-slate-500 mb-4">25% Weightage</p>
                  <div className="mt-auto">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{myData.standupScore}</span>
                    <span className="text-sm font-bold text-slate-500"> / 25</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Formula Hint */}
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">How is this calculated?</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                  Scores automatically recalculate daily at midnight based on tasks resolved on the board, timesheets submitted in Work Logs, and Standups approved by the manager.
                </p>
              </div>
            </div>

          </div>
        </Card>
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
                <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                  {highestScorer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{highestScorer.name}</p>
                <p className="text-lg font-black text-emerald-600">{highestScorer.score}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column - Main Table */}
        <div className="lg:col-span-8 flex flex-col min-w-0">
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
            <CardContent className="p-0 overflow-auto flex-1 min-h-0 relative">
              <table className="w-full min-w-[800px] text-sm text-left relative">
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



    </div>
  );
}
