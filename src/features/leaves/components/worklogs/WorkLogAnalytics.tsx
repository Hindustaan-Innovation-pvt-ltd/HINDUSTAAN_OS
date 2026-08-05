import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkLogAnalyticsProps {
  logs: any[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const WorkLogAnalytics = ({ logs }: WorkLogAnalyticsProps) => {
  // Process data for Daily Trend (Last 7 Days)
  const dailyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLabel = format(date, 'MMM dd');
      
      const dayHours = logs
        .filter(l => {
          const lDate = new Date(l.rawDate || l.date);
          return !isNaN(lDate.getTime()) && format(lDate, 'yyyy-MM-dd') === dateStr;
        })
        .reduce((sum, log) => sum + (Number(log.hours) || 0), 0);
        
      data.push({ name: dayLabel, hours: dayHours });
    }
    return data;
  }, [logs]);

  // Process data for Project Distribution
  const projectData = useMemo(() => {
    const dist: Record<string, number> = {};
    logs.forEach(log => {
      const p = log.project || 'General';
      dist[p] = (dist[p] || 0) + (Number(log.hours) || 0);
    });
    
    return Object.entries(dist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 projects
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl border border-slate-800">
          <p className="font-bold text-sm mb-1">{label || payload[0].name}</p>
          <p className="text-indigo-400 font-bold text-xs">
            {payload[0].value.toFixed(1)} Hours
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Daily Hours Trend Chart */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-sm rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <BarChart3 className="h-4 w-4" />
            </div>
            Daily Trend (Last 7 Days)
          </h3>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
            <TrendingUp className="h-3 w-3" />
            Active
          </div>
        </div>

        <div className="h-[250px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
              <Bar 
                dataKey="hours" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Distribution Pie Chart */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-sm rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
        
        <div className="flex items-center justify-between mb-2 relative z-10">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <PieChartIcon className="h-4 w-4" />
            </div>
            Project Distribution
          </h3>
        </div>

        {projectData.length > 0 ? (
          <div className="h-[280px] w-full relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="middle" 
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center relative z-10">
            <p className="text-slate-500 font-medium">No project data available</p>
          </div>
        )}
      </div>
    </div>
  );
};
