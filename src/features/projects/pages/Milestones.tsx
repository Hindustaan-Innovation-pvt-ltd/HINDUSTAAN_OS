import React, { useState } from 'react';
import { Trophy, Target, Flag, Clock, CheckCircle2, Rocket, Award, HelpCircle, Zap, ShieldCheck, Star, Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '@/context/ThemeContext';

import { useProjects } from '@/context/ProjectContext';

// --- Mock Data ---
const contributionData = {
  'Today': { score: 87, tasks: 32, hours: 28, miles: 18 },
  'This Week': { score: 72, tasks: 24, hours: 20, miles: 12 },
  'This Month': { score: 94, tasks: 38, hours: 32, miles: 22 },
};

const TEAM: string[] = [];

function MetricCard({ name, data, period, onPeriodChange }: { name: string, data: any, period: string, onPeriodChange: (p: string) => void }) {
  const { score, tasks, hours, miles } = data[period as keyof typeof data];
  
  return (
    <Card className="w-full relative overflow-hidden shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        {/* Title row: icon + title on one line, subtitle aligned under title */}
        <div className="flex items-start gap-2">
          <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
          <div>
            <CardTitle className="text-lg leading-tight whitespace-nowrap">Performance Metric</CardTitle>
            <CardDescription className="mt-0.5 font-semibold">{name}</CardDescription>
          </div>
        </div>
        {/* Filter tabs: full-width, fits inside card */}
        <Tabs value={period} onValueChange={onPeriodChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <TabsTrigger 
              value="Today"
              className="rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-bold transition-all"
            >
              Today
            </TabsTrigger>
            <TabsTrigger 
              value="This Week"
              className="rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-bold transition-all"
            >
              This Week
            </TabsTrigger>
            <TabsTrigger 
              value="This Month"
              className="rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-bold transition-all"
            >
              This Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative flex items-center justify-center w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f97316" strokeWidth="12" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * score) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{score}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Score</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                <span className="text-emerald-600 dark:text-emerald-400">Tasks Completed (40%)</span>
                <span className="text-emerald-700 dark:text-emerald-300">{tasks}/40</span>
              </div>
              <Progress value={(tasks / 40) * 100} className="h-2 [&>div]:bg-emerald-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                <span className="text-orange-600 dark:text-orange-400">Hours Logged (35%)</span>
                <span className="text-orange-700 dark:text-orange-300">{hours}/35</span>
              </div>
              <Progress value={(hours / 35) * 100} className="h-2 [&>div]:bg-orange-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                <span className="text-amber-600 dark:text-amber-400">Milestones Hit (25%)</span>
                <span className="text-amber-700 dark:text-amber-300">{miles}/25</span>
              </div>
              <Progress value={(miles / 25) * 100} className="h-2 [&>div]:bg-amber-500" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Milestones({ session }: { session?: any }) {
  const { projects } = useProjects();
  const [globalPeriod, setGlobalPeriod] = useState('Today');
  const role = session?.user?.user_metadata?.role || 'employee';

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const tickColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

  const derivedProjects = projects.map((p: any) => {
    const totalTasks = p.tasks?.length || 0;
    const completedTasks = p.tasks?.filter((t: any) => t.status === 'Done').length || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    let status = 'On Track';
    let color = 'bg-emerald-500';
    if (progress === 100) { status = 'Completed'; color = 'bg-blue-500'; }
    else if (progress < 30 && totalTasks > 0) { status = 'At Risk'; color = 'bg-rose-500'; }
    else if (progress >= 80) { status = 'Almost Done'; color = 'bg-emerald-500'; }
    else if (totalTasks === 0) { status = 'Pending'; color = 'bg-slate-400'; }
    return { id: p.id, name: p.name, progress, status, color };
  });

  const derivedMilestones = projects.flatMap((p: any) => {
    if (!p.milestones || p.milestones.length === 0) {
      // Generate generic milestones if none exist
      return [
        { id: `m1-${p.id}`, title: `${p.name} - Alpha`, status: p.status === 'Done' ? 'completed' : 'in-progress' }
      ];
    }
    return p.milestones;
  }).map((m: any, i: number) => {
    const isCompleted = m.status === 'completed';
    const progress = isCompleted ? 100 : (m.status === 'in-progress' ? 50 : 0);
    const colors = ['bg-slate-800 dark:bg-slate-400', 'bg-orange-500', 'bg-slate-300 dark:bg-slate-700', 'bg-indigo-500'];
    return { id: m.id || `m-${i}`, name: m.title, progress, color: colors[i % colors.length] };
  }).slice(0, 5); // Show top 5 milestones
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Milestones & Contribution</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review your performance scores and team contribution metrics.</p>
      </div>

      {/* Content Rendering based on Role */}
      {role === 'manager' ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Project Progress */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Rocket className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                Project Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {derivedProjects.length > 0 ? derivedProjects.map(project => (
                  <div key={project.id}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-200">{project.name}</span>
                      <span className={cn("text-slate-500 dark:text-slate-400")}>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className={cn("h-3", `[&>div]:${project.color}`)} />
                    <div className="mt-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 text-right">
                      {project.status}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 italic">No projects found.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Milestone Progress */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                Milestone Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {derivedMilestones.length > 0 ? derivedMilestones.map(milestone => (
                  <div key={milestone.id}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-200 flex items-center">
                        <Flag className="h-3.5 w-3.5 mr-1.5 text-slate-400 dark:text-slate-500" />
                        {milestone.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{milestone.progress}%</span>
                    </div>
                    <Progress value={milestone.progress} className={cn("h-3", `[&>div]:${milestone.color}`)} />
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 italic">No milestones found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Manager View: All Employee Contributions */}
        <div className="mt-12">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Team Contributions</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {TEAM.map(member => (
              <MetricCard 
                key={member}
                name={member}
                data={contributionData}
                period={globalPeriod}
                onPeriodChange={setGlobalPeriod}
              />
            ))}
          </div>
        </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Contributions & Rules */}
          <div className="lg:col-span-6 space-y-8 flex flex-col h-full">
            <MetricCard 
              name="My Contributions"
              data={contributionData}
              period={globalPeriod}
              onPeriodChange={setGlobalPeriod}
            />

            {/* Milestones Stepper & Calculator */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl flex-1 flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-base flex items-center">
                  <Award className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                  Milestone Level & Rules
                </CardTitle>
                <CardDescription className="mt-1">
                  Find out how milestones are calculated and track your journey to the next level.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {/* Highlight explanation box */}
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">How much task completion gets one Milestone?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Every <strong className="text-orange-600 dark:text-orange-400">5 resolved tasks</strong> on your Kanban board triggers <strong className="text-orange-600 dark:text-orange-400">1 Milestone</strong> level-up. Complete tasks to unlock badges and increase your final contribution score!
                    </p>
                  </div>
                </div>

                {/* Level Stepper */}
                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 flex flex-col gap-4 mt-4">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-slate-950">
                      <ShieldCheck className="h-3 w-3" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Level 1: Milestone Starter</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Completed 5 tasks. (Unlocked)</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-slate-950">
                      <ShieldCheck className="h-3 w-3" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Level 2: Sprint Runner</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Completed 10 tasks. (Unlocked)</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white ring-4 ring-white dark:ring-slate-950 animate-pulse">
                      <Zap className="h-2.5 w-2.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-950 dark:text-white">Level 3: Feature Builder (Active)</h4>
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30">In Progress</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Requires 15 completed tasks. You are currently at <strong className="text-slate-700 dark:text-slate-300">12 completions</strong> (3 tasks remaining).</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-white ring-4 ring-white dark:ring-slate-950" />
                    <div className="opacity-60">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Level 4: Launch Master</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Requires 20 completed tasks. (Locked)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Project Tracking */}
          <div className="lg:col-span-6 space-y-8">
            {/* Project execution */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Rocket className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                  My Projects Execution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {derivedProjects.slice(0, 2).map(project => (
                    <div key={project.id}>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-slate-700 dark:text-slate-200">{project.name}</span>
                        <span className="text-slate-500 dark:text-slate-400">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className={cn("h-3", `[&>div]:${project.color}`)} />
                      <div className="mt-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 text-right">
                        {project.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card 1: Recent Achievements */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {[
                    { title: "Completed 50 Tasks", desc: "2 days ago", icon: Trophy, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20" },
                    { title: "7-Day Work Streak", desc: "This week", icon: Flame, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                    { title: "Milestone Level Up", desc: "3 days ago", icon: Star, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" },
                    { title: "First Project Delivered", desc: "Last week", icon: Target, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" }
                  ].map((ach, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", ach.color)}>
                          <ach.icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-500 transition-colors">{ach.title}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{ach.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Contribution Trend */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                  Contribution Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { day: 'Mon', value: 65 },
                      { day: 'Tue', value: 80 },
                      { day: 'Wed', value: 72 },
                      { day: 'Thu', value: 90 },
                      { day: 'Fri', value: 85 },
                      { day: 'Sat', value: 60 },
                      { day: 'Sun', value: 75 }
                    ]} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} domain={[0, 100]} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs space-y-1 mt-2">
                  <div className="flex justify-between items-center font-semibold text-slate-600 dark:text-slate-400">
                    <span>Average Contribution:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">75%</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+12% compared to last week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
