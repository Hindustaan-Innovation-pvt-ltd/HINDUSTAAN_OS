import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, CheckCircle, Clock, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/context/ProjectContext';

export default function ProgressTracker({ session }: { session?: any }) {
  const { theme } = useTheme();
  const { projects } = useProjects();
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'; 

  const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id);
  
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0];
  }, [activeProjectId, projects]);

  const isAborted = activeProject?.status === 'Aborted';
  const chartColor = isAborted ? '#ef4444' : '#3b82f6';


  const dynamicMilestones = useMemo(() => {
    if (!activeProject) return [];
    
    // If milestones explicitly exist, use them
    if (activeProject.milestones && activeProject.milestones.length > 0) {
      return activeProject.milestones;
    }

    // Dynamic generation based on tasks
    const totalTasks = activeProject.tasks?.length || 0;
    if (totalTasks === 0) return []; 

    const doneTasks = activeProject.tasks.filter((t:any) => t.status === 'Done').length;
    const progress = (doneTasks / totalTasks) * 100;

    return [
      { id: 'dyn-m1', title: 'Phase 1: Planning & Setup', status: progress >= 33 ? 'completed' : (progress > 0 ? 'in-progress' : 'pending') },
      { id: 'dyn-m2', title: 'Phase 2: Core Execution', status: progress >= 66 ? 'completed' : (progress > 33 ? 'in-progress' : 'pending') },
      { id: 'dyn-m3', title: 'Phase 3: Finalization', status: progress >= 100 ? 'completed' : (progress > 66 ? 'in-progress' : 'pending') }
    ];
  }, [activeProject]);

  const metrics = useMemo(() => {
    if (!activeProject) return { totalCompletion: '0%', tasksDone: '0 / 0', milestonesDone: '0 / 0', blockedIssues: '0', rawOverallProgress: 0 };
    const totalTasks = activeProject.tasks?.length || 0;
    const completedTasks = activeProject.tasks?.filter((t: any) => t?.status === 'Done').length || 0;
    const taskCompletion = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

    const totalMilestones = activeProject.milestones?.length || 0;
    const completedMilestones = activeProject.milestones?.filter((m: any) => m?.status === 'completed').length || 0;
    const milestoneCompletion = totalMilestones === 0 ? 0 : (completedMilestones / totalMilestones) * 100;

    const overallProgress = Math.round((taskCompletion + milestoneCompletion) / 2);
    const blockedTasks = activeProject.tasks?.filter((t: any) => t?.status === 'Blocked').length || 0;

    return {
      totalCompletion: `${overallProgress}%`,
      tasksDone: `${completedTasks} / ${totalTasks}`,
      milestonesDone: `${completedMilestones} / ${totalMilestones}`,
      blockedIssues: blockedTasks.toString(),
      rawOverallProgress: overallProgress
    };
  }, [activeProject]);

  const teamWorkloadData = useMemo(() => {
    if (!activeProject || !activeProject.tasks) return [];
    
    const assigneeMap = new Map<string, { name: string, Done: number, 'In Progress': number, 'To Do': number }>();
    
    activeProject.tasks.forEach((t: any) => {
      const assignee = t.assignee || t.assignee_name || 'Unassigned';
      // Use just the first name for cleaner chart labels
      const shortName = assignee === 'Unassigned' ? 'Unassigned' : assignee.split(' ')[0];
      
      const tasksCompleted = activeProject.tasks?.filter(
        (t: any) => t?.status === 'Done' && t?.completedAt === dateString
      ).length || 0;
      
      const stats = assigneeMap.get(shortName)!;
      if (t.status === 'Done') stats.Done++;
      else if (t.status === 'In Progress') stats['In Progress']++;
      else stats['To Do']++;
    });
    
    return Array.from(assigneeMap.values());
  }, [activeProject]);



  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Progress Tracker</h2>
            {isAborted && (
              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-transparent dark:bg-red-900/40 dark:text-red-400 font-bold uppercase tracking-wider text-[10px]">
                Aborted
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time metrics calculated from active project data.</p>
        </div>
        <div>
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="w-full sm:w-64 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all font-bold text-sm shadow-sm"
          >
            {projects.map(p => (
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
        <div className={cn("lg:col-span-2 rounded-2xl p-6 shadow-sm border flex flex-col transition-colors duration-500", 
          isAborted ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60"
        )}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Workload Breakdown</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Resource allocation and task status for {activeProject?.name}.</p>
            </div>
          </div>
          
          <div className="flex-1 w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {teamWorkloadData.length > 0 ? (
                <BarChart
                  data={teamWorkloadData}
                margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800 opacity-50" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: axisColor, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: axisColor, fontWeight: 'bold' }} 
                  dx={-10}
                  allowDecimals={false}
                />
                <RechartsTooltip 
                  cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 
                    backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 'bold', marginBottom: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="Done" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="In Progress" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="To Do" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <p className="text-slate-400 font-medium italic">No tasks assigned in this project.</p>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - Milestone Timeline */}
        <div className={cn("rounded-2xl p-6 shadow-sm border flex flex-col transition-colors duration-500",
          isAborted ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60"
        )}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project Milestones</h3>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {dynamicMilestones.length > 0 ? dynamicMilestones.map((m: any, i: number) => {
              let progress = 0;
              let color = 'bg-slate-500';
              if (m.status === 'completed') {
                progress = 100;
                color = isAborted ? 'bg-red-500/80' : 'bg-emerald-500';
              } else if (m.status === 'in-progress') {
                progress = 50;
                color = isAborted ? 'bg-red-400/80' : 'bg-orange-500';
              } else {
                progress = 5; // tiny sliver just to show it's pending
                color = isAborted ? 'bg-red-200 dark:bg-red-900/50' : 'bg-slate-300 dark:bg-slate-700';
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
            }) : (
              <div className="flex items-center justify-center h-full text-center">
                <p className="text-slate-400 font-medium italic text-sm">Add tasks to this project to track milestones.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}