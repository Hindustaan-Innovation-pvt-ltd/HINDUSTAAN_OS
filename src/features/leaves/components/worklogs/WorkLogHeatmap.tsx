import React from 'react';
import { Activity, Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkLogHeatmapProps {
  weekDays: Date[];
  heatmapDate: Date;
  setHeatmapDate: (date: Date) => void;
  heatmapData: { users: string[]; data: Record<string, Record<string, number>> };
  teamMembers: any[];
}

export const WorkLogHeatmap = ({ weekDays, heatmapDate, setHeatmapDate, heatmapData, teamMembers }: WorkLogHeatmapProps) => {
  const getHeatmapColor = (hours: number) => {
    if (hours === 0) return 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 shadow-inner';
    if (hours <= 2) return 'bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/80 dark:to-emerald-800/80 border border-emerald-300/50 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]';
    if (hours <= 5) return 'bg-gradient-to-br from-emerald-400 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600 border border-emerald-400/50 dark:border-emerald-500/50 text-emerald-950 dark:text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] shadow-emerald-500/20';
    if (hours <= 8) return 'bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-500 border border-emerald-500/50 dark:border-emerald-400/50 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shadow-emerald-500/30';
    return 'bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-400 border border-emerald-600/50 dark:border-emerald-300/50 text-white dark:text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shadow-emerald-500/40 ring-1 ring-emerald-400/50 dark:ring-emerald-300/50'; 
  };

  return (
    <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/40 shadow-sm overflow-hidden group mb-6">
      {/* Glassy Orbs in Background */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
            <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-3 shadow-inner">
              <Activity className="h-4 w-4" />
            </div>
            Weekly Activity Heatmap
          </h3>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none cursor-pointer">
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl" align="start">
              <CalendarComponent
                mode="single"
                selected={heatmapDate}
                onSelect={(date) => {
                  if (date) setHeatmapDate(date);
                }}
                className="bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-2xl p-3"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Elegant Legend */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2 ml-1">Less</span>
          {[0, 2, 5, 8, 10].map((hours, i) => (
            <div key={i} className={cn("w-4 h-4 rounded-md transition-all duration-300", getHeatmapColor(hours))} title={`${hours === 0 ? 0 : hours}+ hours`} />
          ))}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        <div className="min-w-[600px]">
          {/* Days Header */}
          <div className="flex mb-4 relative z-10">
            <div className="w-48 sm:w-56 shrink-0 sticky left-0 z-20 bg-transparent"></div>
            <div className="flex-1 grid grid-cols-7 gap-2 sm:gap-3">
              {weekDays.map(day => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={day.toString()} className="flex flex-col items-center justify-center group/day">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider mb-1 transition-colors",
                      isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                    )}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
                      isToday 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                        : "text-slate-700 dark:text-slate-300 group-hover/day:bg-slate-100 dark:group-hover/day:bg-slate-800"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Users Rows */}
          <TooltipProvider delayDuration={0}>
            <div className="space-y-3 relative z-10 max-h-72 overflow-y-auto pr-2 hide-scrollbar">
              {heatmapData.users.map((user, rowIdx) => {
                const totalWeekHours = weekDays.reduce((sum, day) => sum + (heatmapData.data[user][format(day, 'yyyy-MM-dd')] || 0), 0);
                const memberData = teamMembers.find(m => m.name === user);
                
                return (
                  <div 
                    key={user} 
                    className="flex items-center group/row animate-in slide-in-from-left-4 fade-in duration-500 fill-mode-both"
                    style={{ animationDelay: `${rowIdx * 50}ms` }}
                  >
                    {/* User Info (Sticky) */}
                    <div className="w-48 sm:w-56 shrink-0 pr-4 sm:pr-6 flex items-center justify-between sticky left-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-1 rounded-r-xl">
                      <div className="flex items-center space-x-3 truncate">
                        <div className={cn(
                          "w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-white dark:ring-slate-900 group-hover/row:scale-110 transition-transform",
                          memberData?.color || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          {memberData?.initials || user.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors truncate">
                          {user}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-400 group-hover/row:text-indigo-500 transition-colors">
                          {totalWeekHours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                    
                    {/* Heatmap Cells */}
                    <div className="flex-1 grid grid-cols-7 gap-2 sm:gap-3 pl-2">
                      {weekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const hours = heatmapData.data[user][dateStr] || 0;
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                          <Tooltip key={dateStr}>
                            <TooltipTrigger asChild>
                              <div className="relative group/cell aspect-square sm:aspect-auto sm:h-12 w-full rounded-xl cursor-crosshair">
                                <div className={cn(
                                  "absolute inset-0 rounded-xl transition-all duration-300 flex items-center justify-center",
                                  getHeatmapColor(hours),
                                  isToday && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900",
                                  "hover:scale-[1.15] hover:shadow-xl hover:z-20"
                                )}>
                                  {hours > 0 && (
                                    <span className="text-[10px] sm:text-xs font-black opacity-0 group-hover/cell:opacity-100 transition-opacity drop-shadow-md">
                                      {hours.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="top" 
                              className="bg-slate-900 text-white border-slate-800 text-xs px-3 py-2 font-medium"
                            >
                              <div className="text-slate-400 mb-1">{format(day, 'MMM d, yyyy')}</div>
                              <div className="font-bold flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", getHeatmapColor(hours))} />
                                {user}: {hours.toFixed(1)} hours
                              </div>
                              <div className="text-[10px] mt-1 text-slate-500">
                                Status: {hours > 0 ? (hours >= 8 ? 'Approved' : 'Pending') : 'No Logs'}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
