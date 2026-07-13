import React, { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Leave {
  id?: number | string;
  employee: string;
  start: string;
  end: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: string;
}

interface LeaveCalendarProps {
  leaves: Leave[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
}

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function LeaveCalendar({ leaves, selectedDate, onSelectDate }: LeaveCalendarProps) {
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState<Date>(today);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = [2025, 2026, 2027];

  const handleMonthChange = (monthIdx: string) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), parseInt(monthIdx), 1));
  };

  const handleYearChange = (yearStr: string) => {
    setCalendarMonth(new Date(parseInt(yearStr), calendarMonth.getMonth(), 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCalendarMonth(now);
    onSelectDate(now);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Employee's Leave Calendar</h3>
          <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg mt-1">
            {format(calendarMonth, 'MMMM yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-10 rounded-xl font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm"
          >
            Today
          </Button>

          <Select value={calendarMonth.getMonth().toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-10 rounded-xl font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-[140px] shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {months.map((m, idx) => (
                <SelectItem key={idx} value={idx.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={calendarMonth.getFullYear().toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="h-10 rounded-xl font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-[110px] shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-4 md:p-6 shadow-inner overflow-x-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && onSelectDate(d)}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          className="w-full flex justify-center border-0 p-0"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
            month: "space-y-4 w-full",
            nav: "hidden", // Hide navigation buttons, we use custom dropdowns
            month_caption: "hidden", // Hide v9 month caption
            dropdowns: "hidden", // Hide v9 dropdowns
            weekdays: "grid grid-cols-7 gap-y-3 text-center items-center justify-items-center mt-4 border-b border-slate-100 dark:border-slate-800 pb-2",
            weekday: "text-slate-500 dark:text-slate-400 font-medium text-sm text-center select-none w-9 h-9 flex items-center justify-center",
            week: "grid grid-cols-7 gap-y-3 text-center items-center justify-items-center mt-2",
            day: "h-9 w-9 p-0 flex items-center justify-center relative",
            disabled: "text-slate-400 opacity-50",
            hidden: "invisible",
          }}
          components={{
            DayButton: ({ day, modifiers, ...props }) => {
              const date = day.date;
              const isTodayDate = isSameDay(date, today);

              // Get leaves on this date
              const leavesOnDate = leaves.filter(l => {
                if (l.status === 'Rejected') return false;
                const start = parseLocalDate(l.start);
                const end = parseLocalDate(l.end);
                end.setHours(23, 59, 59, 999);
                return date >= start && date <= end;
              });

              const hasApproved = leavesOnDate.some(l => l.status === 'Approved');
              const hasPending = leavesOnDate.some(l => l.status === 'Pending');

              let statusClass = "";
              if (hasApproved) {
                statusClass = "bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg";
              } else if (hasPending) {
                statusClass = "bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg";
              }

              const isSelected = selectedDate && isSameDay(date, selectedDate);

              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      {...props}
                      className={cn(
                        "h-9 w-9 flex items-center justify-center text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 transition-colors hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/40 dark:hover:text-purple-300 outline-none",
                        statusClass,
                        isTodayDate && !hasApproved && !hasPending && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold ring-1 ring-slate-200 dark:ring-slate-700",
                        isSelected && "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-950",
                        modifiers.outside && "opacity-30 pointer-events-none text-slate-400 dark:text-slate-600"
                      )}
                    >
                      <span className="leading-none">{date.getDate()}</span>
                    </button>
                  </TooltipTrigger>
                  {leavesOnDate.length > 0 && (
                    <TooltipContent side="top" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-[100] max-w-[240px]">
                      <p className="font-bold mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">
                        {format(date, 'MMMM d, yyyy')}
                      </p>
                      <div className="space-y-1.5">
                        {leavesOnDate.map((leave, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-4 text-xs">
                            <span className="font-semibold truncate max-w-[120px]">{leave.employee}</span>
                            <span className={cn(
                              "text-[9px] uppercase px-1 py-0.5 rounded font-black shrink-0",
                              leave.status === 'Approved'
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-purple-500/20 text-purple-400"
                            )}>
                              {leave.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}
