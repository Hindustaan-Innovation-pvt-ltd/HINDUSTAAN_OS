import React from 'react';
import { Target, TrendingUp, CheckCircle, Clock, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

const burndownData = [
  { day: 'Day 1', ideal: 100, actual: 100 },
  { day: 'Day 2', ideal: 92, actual: 95 },
  { day: 'Day 3', ideal: 85, actual: 88 },
  { day: 'Day 4', ideal: 77, actual: 82 },
  { day: 'Day 5', ideal: 69, actual: 70 },
  { day: 'Day 6', ideal: 62, actual: 75 }, // unexpected scope added
  { day: 'Day 7', ideal: 54, actual: 65 },
  { day: 'Day 8', ideal: 46, actual: 50 },
  { day: 'Day 9', ideal: 38, actual: null }, 
  { day: 'Day 10', ideal: 31, actual: null },
  { day: 'Day 11', ideal: 23, actual: null },
  { day: 'Day 12', ideal: 15, actual: null },
  { day: 'Day 13', ideal: 8, actual: null },
  { day: 'Day 14', ideal: 0, actual: null },
];

export default function ProgressTracker({ session }: { session?: any }) {
  const { theme } = useTheme();
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // slate-400 in dark mode, slate-500 in light mode

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Progress Tracker</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sprint metrics and burndown statistics.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[
          { label: 'Total Completion', value: '68%', icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Tasks Done', value: '24 / 35', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Hours Logged', value: '142h', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Blocked Issues', value: '3', icon: AlertOctagon, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-4">
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sprint Burndown</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Remaining effort across all projects.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-500" /> Ideal</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500" /> Actual</div>
            </div>
          </div>
          
          <div className="flex-1 w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={burndownData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: axisColor }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: axisColor }} 
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  name="Ideal Tasks Remaining" 
                  dataKey="ideal" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  strokeDasharray="5 5" 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  name="Actual Tasks Remaining" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - Top Contributors */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Velocity by Project</h3>
          </div>

          <div className="flex-1 space-y-6">
            {[
              { name: 'Dashboard UI Revamp', progress: 85, color: 'bg-emerald-500' },
              { name: 'Backend API v2', progress: 42, color: 'bg-orange-500' },
              { name: 'Marketing Campaign', progress: 15, color: 'bg-rose-500' },
              { name: 'Infra Automation', progress: 60, color: 'bg-blue-500' },
            ].map((p, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="font-bold text-slate-500 dark:text-slate-400">{p.progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-1000", p.color)} style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
