import React from 'react';
import { Clock, CheckCircle2, Timer, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { subDays, isBefore, startOfDay } from 'date-fns';

interface SummaryCardProps {
  title: string;
  description: string;
  value: string | number;
  trend: number; // positive or negative percentage
  icon: React.ReactNode;
  data: any[];
  color: 'indigo' | 'emerald' | 'amber' | 'blue';
  onClick?: () => void;
}

const calculateMetrics = (logs: any[], statusFilter?: string) => {
  const today = startOfDay(new Date());
  const currentWeekStart = subDays(today, 6);
  const previousWeekStart = subDays(today, 13);

  let currentWeekVal = 0;
  let previousWeekVal = 0;
  const sparklineData = Array.from({ length: 7 }).map(() => ({ value: 0 }));

  logs.forEach(log => {
    if (statusFilter && log.status !== statusFilter) return;
    const logDate = startOfDay(new Date(log.rawDate || log.date));
    
    if (!isBefore(logDate, currentWeekStart)) {
      const dayIndex = Math.floor((logDate.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        sparklineData[dayIndex].value += Number(log.hours) || 0;
        currentWeekVal += Number(log.hours) || 0;
      }
    } else if (!isBefore(logDate, previousWeekStart) && isBefore(logDate, currentWeekStart)) {
      previousWeekVal += Number(log.hours) || 0;
    }
  });

  const trend = previousWeekVal === 0 ? (currentWeekVal > 0 ? 100 : 0) : ((currentWeekVal - previousWeekVal) / previousWeekVal) * 100;
  return { sparklineData, trend: Number(trend.toFixed(1)), currentWeekVal };
};

const calculateActiveMembersMetrics = (logs: any[]) => {
  const today = startOfDay(new Date());
  const currentWeekStart = subDays(today, 6);
  const previousWeekStart = subDays(today, 13);

  const currentMembers = new Set();
  const previousMembers = new Set();
  const sparklineData = Array.from({ length: 7 }).map(() => ({ value: 0, members: new Set() }));

  logs.forEach(log => {
    const logDate = startOfDay(new Date(log.rawDate || log.date));
    if (!isBefore(logDate, currentWeekStart)) {
      const dayIndex = Math.floor((logDate.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        sparklineData[dayIndex].members.add(log.name);
        currentMembers.add(log.name);
      }
    } else if (!isBefore(logDate, previousWeekStart) && isBefore(logDate, currentWeekStart)) {
      previousMembers.add(log.name);
    }
  });

  const currentVal = currentMembers.size;
  const previousVal = previousMembers.size;
  const trend = previousVal === 0 ? (currentVal > 0 ? 100 : 0) : ((currentVal - previousVal) / previousVal) * 100;
  
  return {
    sparklineData: sparklineData.map(d => ({ value: d.members.size })),
    trend: Number(trend.toFixed(1)),
    currentVal
  };
};

const SummaryCard = ({ title, description, value, trend, icon, data, color, onClick }: SummaryCardProps) => {
  const colorMap = {
    indigo: {
      bg: 'from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/5',
      iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200/50 dark:border-indigo-500/20',
      trendPos: 'text-emerald-600 dark:text-emerald-400',
      trendNeg: 'text-rose-600 dark:text-rose-400',
      chart: '#6366f1'
    },
    emerald: {
      bg: 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/5',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200/50 dark:border-emerald-500/20',
      trendPos: 'text-emerald-600 dark:text-emerald-400',
      trendNeg: 'text-rose-600 dark:text-rose-400',
      chart: '#10b981'
    },
    amber: {
      bg: 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/5',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/50 dark:border-amber-500/20',
      trendPos: 'text-rose-600 dark:text-rose-400', // Pending up is usually bad
      trendNeg: 'text-emerald-600 dark:text-emerald-400',
      chart: '#f59e0b'
    },
    blue: {
      bg: 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/5',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/50 dark:border-blue-500/20',
      trendPos: 'text-emerald-600 dark:text-emerald-400',
      trendNeg: 'text-rose-600 dark:text-rose-400',
      chart: '#3b82f6'
    }
  };

  const theme = colorMap[color];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300",
        `bg-gradient-to-br ${theme.bg} ${theme.border}`,
        "bg-white/50 dark:bg-slate-900/50"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight pr-4">{description}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl shrink-0", theme.iconBg, theme.iconColor)}>
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {value}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {trend > 0 ? (
              <TrendingUp className={cn("h-3.5 w-3.5", theme.trendPos)} />
            ) : (
              <TrendingDown className={cn("h-3.5 w-3.5", theme.trendNeg)} />
            )}
            <span className={trend > 0 ? theme.trendPos : theme.trendNeg}>
              {Math.abs(trend)}%
            </span>
            <span className="text-slate-400 font-medium">vs last week</span>
          </div>
        </div>

        <div className="w-20 h-10 opacity-70">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={theme.chart} 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

interface WorkLogSummaryCardsProps {
  logs: any[];
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  activeMembers: number;
  isEmployee: boolean;
  userName?: string;
  onTotalHoursClick?: () => void;
  onActiveMembersClick?: () => void;
}

export const WorkLogSummaryCards = ({
  logs,
  totalHours,
  approvedHours,
  pendingHours,
  activeMembers,
  isEmployee,
  userName,
  onTotalHoursClick,
  onActiveMembersClick
}: WorkLogSummaryCardsProps) => {
  const totalMetrics = calculateMetrics(logs);
  const approvedMetrics = calculateMetrics(logs, 'Approved');
  const pendingMetrics = calculateMetrics(logs, 'Pending');
  const activeMetrics = calculateActiveMembersMetrics(logs);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      <SummaryCard
        title={isEmployee ? (totalHours < 8 ? "My Logged Hours" : "My Logged Days") : (totalHours < 8 ? "Total Logged Hours" : "Total Logged Days")}
        description={isEmployee ? (totalHours < 8 ? "Your total hours for the period" : "Your total days for the period") : (totalHours < 8 ? "Total hours logged by the team" : "Total days logged by the team")}
        value={totalHours < 8 ? `${totalHours.toFixed(1)}h` : `${(totalHours / 8).toFixed(1)}d`}
        trend={totalMetrics.trend}
        icon={<Clock className="h-5 w-5" />}
        data={totalMetrics.sparklineData}
        color="indigo"
        onClick={onTotalHoursClick}
      />
      
      <SummaryCard
        title="Approved Hours"
        description="Hours verified and approved"
        value={`${approvedHours.toFixed(1)}h`}
        trend={approvedMetrics.trend}
        icon={<CheckCircle2 className="h-5 w-5" />}
        data={approvedMetrics.sparklineData}
        color="emerald"
      />
      
      <SummaryCard
        title="Pending Hours"
        description="Hours awaiting manager approval"
        value={`${pendingHours.toFixed(1)}h`}
        trend={pendingMetrics.trend}
        icon={<Timer className="h-5 w-5" />}
        data={pendingMetrics.sparklineData}
        color="amber"
      />
      
      <SummaryCard
        title={isEmployee ? "Active Projects" : "Active Team Members"}
        description={isEmployee ? "Projects you worked on" : "Team members who logged work"}
        value={isEmployee ? new Set(logs.map(l => l.project)).size : activeMembers}
        trend={activeMetrics.trend}
        icon={<Users className="h-5 w-5" />}
        data={activeMetrics.sparklineData}
        color="blue"
        onClick={onActiveMembersClick}
      />
    </div>
  );
};
