import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, CheckCircle, Clock, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

import { GLOBAL_PROJECTS as PROJECTS_DATA } from '@/data/mockData';

export default function ProgressTracker({ session }: { session?: any }) {
  const { theme } = useTheme();
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'; 

  const [activeProjectId, setActiveProjectId] = useState(PROJECTS_DATA[0].id);
  
  const activeProject = useMemo(() => {
    return PROJECTS_DATA.find(p => p.id === activeProjectId) || PROJECTS_DATA[0];
  }, [activeProjectId]);


  const metrics = useMemo(() => {
    const totalTasks = activeProject.tasks.length;
    const completedTasks = activeProject.tasks.filter(t => t.status === 'Done').length;
    const taskCompletion = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

    const totalMilestones = activeProject.milestones.length;
    const completedMilestones = activeProject.milestones.filter(m => m.status === 'completed').length;
    const milestoneCompletion = totalMilestones === 0 ? 0 : (completedMilestones / totalMilestones) * 100;

    const overallProgress = Math.round((taskCompletion + milestoneCompletion) / 2);
    const blockedTasks = activeProject.tasks.filter(t => t.status === 'Blocked').length;

    return {
      totalCompletion: `${overallProgress}%`,
      tasksDone: `${completedTasks} / ${totalTasks}`,
      milestonesDone: `${completedMilestones} / ${totalMilestones}`,
      blockedIssues: blockedTasks.toString(),
      rawOverallProgress: overallProgress
    };
  }, [activeProject]);

  const completionTrendData = useMemo(() => {
    const currentProgress = metrics.rawOverallProgress;
    return Array.from({ length: 7 }).map((_, i) => {
      const daysAgo = 6 - i;
      const progressRatio = Math.pow((i + 1) / 7, 1.2);
      const startProgress = currentProgress * 0.4; // Start at 40% of current progress a week ago
      const progress = startProgress + (currentProgress - startProgress) * progressRatio;
      
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      return {
        day: dayName,
        progress: Math.round(progress)
      }
    });
  }, [metrics.rawOverallProgress]);

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Progress Tracker</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time metrics calculated from active project data.</p>
        </div>
        <div>
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="w-full sm:w-64 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all font-bold text-sm shadow-sm"
          >
            {PROJECTS_DATA.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[
          { label: 'Total Completion', value: metrics.totalCompletion, icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Tasks Done', value: metrics.tasksDone, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Milestones Done', value: metrics.milestonesDone, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Blocked Issues', value: metrics.blockedIssues, icon: AlertOctagon, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0", stat.bg)}>
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

        {/* Left Column - Burndown Chart Mockup */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project Completion Trend</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Tracking cumulative progress over the last 7 days.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /> Completion %</div>
            </div>
          </div>
          
          <div className="flex-1 w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={completionTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800 opacity-50" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: axisColor }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: axisColor }} 
                  tickFormatter={(value) => `${value}%`}
                  dx={-10}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 
                    backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 'bold', color: '#10b981' }}
                  labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 'bold', marginBottom: '8px' }}
                  formatter={(value: number) => [`${value}%`, 'Progress']}
                />
                <Area 
                  type="monotone" 
                  name="Progress" 
                  dataKey="progress" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorProgress)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981', style: { filter: 'drop-shadow(0px 4px 6px rgba(16, 185, 129, 0.5))' } }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - Milestone Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project Milestones</h3>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {activeProject.milestones.map((m, i) => {
              let progress = 0;
              let color = 'bg-slate-500';
              if (m.status === 'completed') {
                progress = 100;
                color = 'bg-emerald-500';
              } else if (m.status === 'in-progress') {
                progress = 50;
                color = 'bg-orange-500';
              } else {
                progress = 5; // tiny sliver just to show it's pending
                color = 'bg-slate-300 dark:bg-slate-700';
              }

              return (
                <div key={m.id} className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{m.title}</span>
                    <span className="font-bold text-slate-500 dark:text-slate-400 capitalize">{m.status.replace('-', ' ')}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}