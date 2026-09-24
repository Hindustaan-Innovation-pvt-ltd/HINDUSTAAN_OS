import React, { useMemo } from 'react';
import { 
  Activity, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  RotateCcw, Sparkles, Clock, Users, Download, ChevronDown, 
  FileSpreadsheet, FileText 
} from 'lucide-react';
import { format, isSameDay, isSameMonth, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WorkLogHeatmapProps {
  monthDays: Date[];
  heatmapDate: Date;
  setHeatmapDate: (date: Date) => void;
  heatmapData: { users: string[]; data: Record<string, Record<string, number>> };
  teamMembers: any[];
}

export const WorkLogHeatmap = ({
  monthDays,
  heatmapDate,
  setHeatmapDate,
  heatmapData,
  teamMembers
}: WorkLogHeatmapProps) => {
  const isCurrentMonth = isSameMonth(heatmapDate, new Date());

  // Navigate between months
  const handlePrevMonth = () => {
    setHeatmapDate(new Date(heatmapDate.getFullYear(), heatmapDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setHeatmapDate(new Date(heatmapDate.getFullYear(), heatmapDate.getMonth() + 1, 1));
  };

  const handleResetToCurrentMonth = () => {
    setHeatmapDate(new Date());
  };

  // Heatmap intensity color generator
  const getHeatmapColor = (hours: number) => {
    if (hours === 0) {
      return 'bg-slate-100 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50';
    }
    if (hours <= 2) {
      return 'bg-emerald-200 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200';
    }
    if (hours <= 5) {
      return 'bg-emerald-400 dark:bg-emerald-700 border border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50';
    }
    if (hours <= 8) {
      return 'bg-emerald-500 dark:bg-emerald-500 border border-emerald-600 dark:border-emerald-400 text-white shadow-xs';
    }
    return 'bg-emerald-600 dark:bg-emerald-400 border border-emerald-700 dark:border-emerald-300 text-white dark:text-emerald-950 shadow-sm ring-1 ring-emerald-400/50';
  };

  // Month stats calculation
  const monthStats = useMemo(() => {
    let grandTotalMinutes = 0;
    let activeContributors = 0;

    heatmapData.users.forEach(user => {
      const userTotal = monthDays.reduce((sum, day) => sum + (heatmapData.data[user]?.[format(day, 'yyyy-MM-dd')] || 0), 0);
      if (userTotal > 0) {
        grandTotalMinutes += userTotal * 60;
        activeContributors++;
      }
    });

    const totalHours = (grandTotalMinutes / 60).toFixed(1);
    const avgPerUser = activeContributors > 0 ? (grandTotalMinutes / 60 / activeContributors).toFixed(1) : '0';

    return { totalHours, activeContributors, avgPerUser };
  }, [heatmapData, monthDays]);

  // Export Monthly Timesheet as CSV (Excel)
  const handleExportMonthlyCSV = () => {
    if (heatmapData.users.length === 0) {
      toast.error('No work log data to export for this month.');
      return;
    }

    const dayHeaders = monthDays.map(d => `${d.getDate()} ${format(d, 'MMM')}`);
    const headers = ['Employee Name', ...dayHeaders, 'Total Monthly Hours'];

    const rows = heatmapData.users.map(user => {
      const dailyHours = monthDays.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        return heatmapData.data[user]?.[dateStr] || 0;
      });
      const total = dailyHours.reduce((sum, h) => sum + h, 0);
      return [
        user,
        ...dailyHours.map(h => (h > 0 ? h.toFixed(1) : '0')),
        total.toFixed(1)
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Timesheet_${format(heatmapDate, 'yyyy_MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${format(heatmapDate, 'MMMM yyyy')} Timesheet (CSV)`);
  };

  // Export Monthly Timesheet as PDF Report
  const handleExportMonthlyPDF = () => {
    try {
      if (heatmapData.users.length === 0) {
        toast.error('No work log data to export for this month.');
        return;
      }

      const doc = new jsPDF();
      const monthTitle = format(heatmapDate, 'MMMM yyyy');

      doc.setFontSize(16);
      doc.setTextColor(27, 38, 59);
      doc.text('Hindustaan Innovations - Monthly Timesheet Report', 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Report Period: ${monthTitle}  |  Total Team Hours: ${monthStats.totalHours} hrs  |  Active Staff: ${monthStats.activeContributors}`, 14, 26);

      const tableData = heatmapData.users.map(user => {
        const memberData = teamMembers.find(m => m.name === user);
        let daysActive = 0;
        let totalHrs = 0;

        monthDays.forEach(d => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const hrs = heatmapData.data[user]?.[dateStr] || 0;
          if (hrs > 0) {
            daysActive++;
            totalHrs += hrs;
          }
        });

        const avgHrs = daysActive > 0 ? (totalHrs / daysActive).toFixed(1) : '0';

        return [
          user,
          memberData?.role ? memberData.role.toUpperCase() : 'EMPLOYEE',
          `${daysActive} Days`,
          `${totalHrs.toFixed(1)} hrs`,
          `${avgHrs} hrs / day`
        ];
      });

      autoTable(doc, {
        startY: 32,
        head: [['Employee Name', 'Role', 'Active Days', 'Total Logged Hours', 'Avg Hours / Day']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 4
        }
      });

      doc.save(`Monthly_Timesheet_${format(heatmapDate, 'yyyy_MM')}.pdf`);
      toast.success(`Exported ${monthTitle} Timesheet (PDF)`);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      toast.error('Failed to generate PDF timesheet report.');
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
      {/* Decorative Gradient Background Effects */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 blur-[90px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/15 blur-[90px] rounded-full pointer-events-none" />

      {/* Top Header & Month Navigation Controls */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Monthly Activity Heatmap
                {isCurrentMonth && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-extrabold uppercase py-0">
                    Current Month
                  </Badge>
                )}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Day-by-day logged hours across the entire month. Navigate to review previous months.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month Selector Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="px-3.5 text-xs sm:text-sm font-black text-slate-800 dark:text-white tracking-tight min-w-[130px] text-center">
              {format(heatmapDate, 'MMMM yyyy')}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToCurrentMonth}
              className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5 text-indigo-500" />
              This Month
            </Button>
          )}

          {/* Export Monthly Timesheet Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-orange-500" />
                Export Timesheet
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-48">
              <DropdownMenuItem onClick={handleExportMonthlyCSV} className="text-xs font-semibold cursor-pointer py-2">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
                Export Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportMonthlyPDF} className="text-xs font-semibold cursor-pointer py-2">
                <FileText className="h-4 w-4 mr-2 text-rose-500" />
                Export PDF Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Color Legend */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1.5">0h</span>
            {[0, 2, 5, 8, 10].map((hours, i) => (
              <div 
                key={i} 
                className={cn("w-3.5 h-3.5 rounded-sm transition-all", getHeatmapColor(hours))} 
                title={`${hours === 0 ? '0' : hours}+ hours`} 
              />
            ))}
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-1.5">8h+</span>
          </div>
        </div>
      </div>

      {/* Monthly Metrics Summary Chips */}
      <div className="flex items-center gap-3 sm:gap-6 flex-wrap mb-5 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Total Hours ({format(heatmapDate, 'MMM')}):</span>
          <span className="font-black text-slate-900 dark:text-white text-sm">{monthStats.totalHours} hrs</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Active Contributors:</span>
          <span className="font-black text-slate-900 dark:text-white text-sm">{monthStats.activeContributors}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Average / Contributor:</span>
          <span className="font-black text-slate-900 dark:text-white text-sm">{monthStats.avgPerUser} hrs</span>
        </div>
      </div>

      {/* Monthly Heatmap Matrix Container */}
      <div className="overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[840px]">
          
          {/* Days Header Row */}
          <div className="flex mb-2.5 relative z-10">
            {/* Left Sticky Column Header */}
            <div className="w-44 sm:w-52 shrink-0 sticky left-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1">
              Employee
            </div>

            {/* Day Header Cells */}
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${monthDays.length}, minmax(0, 1fr))` }}>
              {monthDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const weekend = isWeekend(day);
                const dayLetter = format(day, 'E').slice(0, 1);

                return (
                  <div key={day.toISOString()} className="flex flex-col items-center justify-center px-0.5">
                    <span className={cn(
                      "text-[9px] font-black uppercase mb-0.5",
                      isToday ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : weekend ? "text-slate-300 dark:text-slate-600" : "text-slate-400 dark:text-slate-500"
                    )}>
                      {dayLetter}
                    </span>
                    <span className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-all",
                      isToday 
                        ? "bg-indigo-600 text-white shadow-sm font-black ring-2 ring-indigo-400/40" 
                        : weekend
                          ? "text-slate-400/70 dark:text-slate-600"
                          : "text-slate-700 dark:text-slate-300"
                    )}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right Sticky Total Column Header */}
            <div className="w-20 shrink-0 sticky right-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-right font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1 pl-2">
              Total
            </div>
          </div>

          {/* User Rows */}
          <TooltipProvider delayDuration={0}>
            <div className="space-y-2 relative z-10 max-h-96 overflow-y-auto pr-1">
              {heatmapData.users.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-400">
                  No work log activity recorded for {format(heatmapDate, 'MMMM yyyy')}.
                </div>
              ) : (
                heatmapData.users.map((user, rowIdx) => {
                  const userTotalHours = monthDays.reduce((sum, day) => sum + (heatmapData.data[user]?.[format(day, 'yyyy-MM-dd')] || 0), 0);
                  const memberData = teamMembers.find(m => m.name === user);
                  const initials = memberData?.initials || user.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div 
                      key={user} 
                      className="flex items-center group/row hover:bg-slate-50/70 dark:hover:bg-slate-800/30 rounded-xl p-1 transition-colors"
                    >
                      {/* Left Sticky User Info */}
                      <div className="w-44 sm:w-52 shrink-0 pr-3 flex items-center justify-between sticky left-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-1 rounded-l-xl">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className={cn(
                            "w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black shadow-2xs ring-1 ring-border",
                            memberData?.color || "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          )}>
                            {initials}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors truncate">
                            {user}
                          </span>
                        </div>
                      </div>

                      {/* Heatmap Squares across all month days */}
                      <div 
                        className="flex-1 grid gap-1"
                        style={{ gridTemplateColumns: `repeat(${monthDays.length}, minmax(0, 1fr))` }}
                      >
                        {monthDays.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const hours = heatmapData.data[user]?.[dateStr] || 0;
                          const isToday = isSameDay(day, new Date());
                          const weekend = isWeekend(day);

                          return (
                            <Tooltip key={dateStr}>
                              <TooltipTrigger asChild>
                                <div className="relative aspect-square w-full rounded-md cursor-pointer transition-transform hover:scale-125 hover:z-30">
                                  <div className={cn(
                                    "absolute inset-0 rounded-md transition-colors flex items-center justify-center",
                                    getHeatmapColor(hours),
                                    isToday && "ring-1.5 ring-indigo-500",
                                    weekend && hours === 0 && "opacity-40"
                                  )}>
                                    {hours > 0 && (
                                      <span className="text-[8px] font-black opacity-0 group-hover/row:opacity-0 hover:!opacity-100 transition-opacity">
                                        {Math.round(hours)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent 
                                side="top" 
                                className="bg-slate-900 text-white border-slate-800 text-xs px-3 py-2 font-medium z-50 shadow-xl"
                              >
                                <div className="text-slate-400 text-[11px] mb-0.5">
                                  {format(day, 'EEE, MMM d, yyyy')}
                                </div>
                                <div className="font-bold flex items-center gap-1.5">
                                  <span className={cn("w-2 h-2 rounded-full", getHeatmapColor(hours))} />
                                  <span>{user}: {hours.toFixed(1)} hours logged</span>
                                </div>
                                {hours === 0 ? (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {weekend ? 'Weekend' : 'No activity logged'}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                                    {hours >= 8 ? 'Full Day Target Achieved' : 'Partial Working Hours'}
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>

                      {/* Right Sticky Total Column */}
                      <div className="w-20 shrink-0 sticky right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-right py-1 pl-2 pr-1 rounded-r-xl">
                        <span className={cn(
                          "text-xs font-black tracking-tight",
                          userTotalHours >= 140 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {userTotalHours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
