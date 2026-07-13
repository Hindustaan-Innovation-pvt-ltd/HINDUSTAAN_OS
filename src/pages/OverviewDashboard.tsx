import React from 'react';
import { 
  FolderKanban, 
  Loader2, 
  AlertOctagon, 
  CalendarDays, 
  Clock 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { cn } from '@/lib/utils';

// --- Mock Data ---

const VELOCITY_DATA = [
  { name: 'Mon', completed: 12, inProgress: 24, overdue: 8 },
  { name: 'Tue', completed: 18, inProgress: 22, overdue: 7 },
  { name: 'Wed', completed: 25, inProgress: 28, overdue: 5 },
  { name: 'Thu', completed: 32, inProgress: 26, overdue: 4 },
  { name: 'Fri', completed: 45, inProgress: 18, overdue: 5 },
  { name: 'Sat', completed: 48, inProgress: 15, overdue: 2 },
  { name: 'Sun', completed: 50, inProgress: 12, overdue: 1 },
];

const UPCOMING_DEADLINES = [
  {
    id: '1',
    project: 'UI Design System',
    task: 'Finalize Authentication Components',
    dueDate: 'Oct 14, 2026',
    daysLeft: 2,
    color: 'bg-orange-50 dark:bg-orange-500/100',
    bgColor: 'bg-orange-50 dark:bg-orange-500/10',
    textColor: 'text-orange-700 dark:text-orange-300',
  },
  {
    id: '2',
    project: 'Backend Infrastructure',
    task: 'Supabase RLS Implementation',
    dueDate: 'Oct 16, 2026',
    daysLeft: 4,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    id: '3',
    project: 'User Research Report',
    task: 'Q3 Cohort Analysis Synthesis',
    dueDate: 'Oct 17, 2026',
    daysLeft: 5,
    color: 'bg-emerald-50 dark:bg-emerald-500/100',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    textColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    id: '4',
    project: 'Marketing Assets',
    task: 'Sprint Demo Deck Presentation',
    dueDate: 'Oct 19, 2026',
    daysLeft: 7,
    color: 'bg-rose-50 dark:bg-rose-500/100',
    bgColor: 'bg-rose-50 dark:bg-rose-500/10',
    textColor: 'text-rose-700 dark:text-rose-300',
  },
];

// --- Custom Recharts Tooltip ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-lg flex flex-col gap-2">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-xs font-medium">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500 capitalize">{entry.name}:</span>
            <span className="text-slate-900 dark:text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Page Component ---

export default function OverviewDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Project Overview</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Real-time metrics and sprint velocity tracking.</p>
      </div>

      {/* GRID AREA 1: TOP PERFORMANCE STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card A: Active Projects */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <FolderKanban className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-md">
              Target: 15
            </span>
          </div>
          <div className="mb-1">
            <h3 className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm font-semibold">Active Projects</h3>
          </div>
          <div className="flex items-baseline space-x-2 mb-4">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">12</h2>
          </div>
          {/* Progress Bar (12/15 = 80%) */}
          <div className="mt-auto">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
              <span>Capacity</span>
              <span>80%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-orange-50 dark:bg-orange-500/100 h-1.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>

        {/* Card B: Tasks In Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:text-amber-400">
              <Loader2 className="h-6 w-6 animate-[spin_3s_linear_infinite]" />
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 px-2 py-1 rounded-md">
              Sprint Load
            </span>
          </div>
          <div className="mb-1">
            <h3 className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm font-semibold">Tasks In Progress</h3>
          </div>
          <div className="flex items-baseline space-x-2 mb-4">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">28</h2>
          </div>
          {/* Progress Bar (28/50 hypothetical = 56%) */}
          <div className="mt-auto">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
              <span>Completion Rate</span>
              <span>56%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '56%' }}></div>
            </div>
          </div>
        </div>

        {/* Card C: Tasks Overdue */}
        <div className="bg-rose-50/30 rounded-2xl p-6 border border-rose-100 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 dark:bg-rose-500/100/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 px-2 py-1 rounded-md flex items-center">
              <span className="w-1.5 h-1.5 bg-rose-50 dark:bg-rose-500/100 rounded-full mr-1.5 animate-pulse"></span>
              Action Required
            </span>
          </div>
          <div className="mb-1 relative z-10">
            <h3 className="text-rose-900/60 text-sm font-semibold">Tasks Overdue</h3>
          </div>
          <div className="flex items-baseline space-x-2 mb-4 relative z-10">
            <h2 className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">5</h2>
          </div>
          {/* Progress Bar (5/100 hypothetical risk tolerance = 5%) */}
          <div className="mt-auto relative z-10">
            <div className="flex justify-between text-[10px] font-bold text-rose-900/50 mb-1.5 uppercase tracking-wider">
              <span>Risk Threshold</span>
              <span>12%</span>
            </div>
            <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-rose-50 dark:bg-rose-500/100 h-1.5 rounded-full" style={{ width: '12%' }}></div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* GRID AREA 2: CENTRAL SPRINT VELOCITY TREND CHART */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sprint Velocity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">7-day trailing task resolution volume.</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-50 dark:bg-emerald-500/100 mr-2"></div>Completed</div>
              <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-sm bg-amber-400 mr-2"></div>In Progress</div>
              <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-sm bg-rose-50 dark:bg-rose-500/100 mr-2"></div>Overdue</div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={VELOCITY_DATA} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  name="Completed"
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="inProgress" 
                  name="In Progress"
                  stroke="#fbbf24" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="overdue" 
                  name="Overdue"
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRID AREA 3: UPCOMING DEADLINES TRACKER WIDGET */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
            <button className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:text-orange-300 transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {UPCOMING_DEADLINES.map((item) => (
              <div key={item.id} className="group flex flex-col p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:bg-slate-900/40 transition-all cursor-pointer">
                
                {/* Top Row: Category Tag & Due Date */}
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("flex items-center px-2 py-1 rounded-md", item.bgColor)}>
                    <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", item.color)}></div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", item.textColor)}>
                      {item.project}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs font-semibold group-hover:text-slate-600 dark:text-slate-300 transition-colors">
                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                    {item.dueDate}
                  </div>
                </div>

                {/* Middle Row: Task Name */}
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-3">
                  {item.task}
                </h4>

                {/* Bottom Row: Countdown Badge */}
                <div className="flex items-center justify-end mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className={cn(
                    "flex items-center px-2.5 py-1 rounded-lg text-xs font-bold",
                    item.daysLeft <= 2 
                      ? "bg-rose-100 text-rose-700 dark:text-rose-300" 
                      : item.daysLeft <= 4 
                        ? "bg-amber-100 text-amber-700 dark:text-amber-300"
                        : "bg-slate-200 text-slate-700 dark:text-slate-200"
                  )}>
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    {item.daysLeft} {item.daysLeft === 1 ? 'day' : 'days'} left
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
