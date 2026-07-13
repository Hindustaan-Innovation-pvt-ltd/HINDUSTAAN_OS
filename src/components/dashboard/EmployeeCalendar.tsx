import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type TaskState = 'completed' | 'in-progress' | 'overdue';

interface CalendarTask {
  id: string;
  date: Date;
  title: string;
  state: TaskState;
}

const MOCK_CALENDAR_TASKS: CalendarTask[] = [
  { id: '1', date: new Date(2026, 6, 1), title: 'Onboarding complete', state: 'completed' },
  { id: '2', date: new Date(2026, 6, 2), title: 'Setup local env', state: 'completed' },
  { id: '3', date: new Date(2026, 6, 3), title: 'Read documentation', state: 'completed' },
  { id: '4', date: new Date(2026, 6, 4), title: 'First PR submitted', state: 'completed' },
  { id: '5', date: new Date(2026, 6, 6), title: 'Code review fixes', state: 'completed' },
  { id: '6', date: new Date(2026, 6, 7), title: 'Dashboard UI', state: 'in-progress' },
  { id: '7', date: new Date(2026, 6, 7), title: 'Fix Auth bug', state: 'in-progress' },
  { id: '8', date: new Date(2026, 6, 5), title: 'API integration', state: 'overdue' },
];

export function EmployeeCalendar() {
  // Use dynamic current date
  const today = new Date(); 
  const [selectedMonth, setSelectedMonth] = useState<Date>(today);
  const startDate = new Date(2026, 6, 1);
  const endDate = new Date(2026, 9, 1);

  const getTasksForDay = (date: Date) => {
    return MOCK_CALENDAR_TASKS.filter(task => isSameDay(task.date, date));
  };

  const getDotColor = (state: TaskState) => {
    switch (state) {
      case 'completed': return 'bg-emerald-500';
      case 'in-progress': return 'bg-orange-500';
      case 'overdue': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <CardTitle className="text-base font-bold flex items-center text-slate-900 dark:text-white">
          <CalendarIcon className="h-4 w-4 text-orange-500 mr-2" />
          Training Calendar
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 flex flex-col items-center flex-1 w-full overflow-hidden">
        <div className="w-full max-w-[280px] mx-auto flex flex-col items-center justify-start mt-2">
          <TooltipProvider delayDuration={100}>
            <Calendar 
              mode="single"
              selected={today}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              startMonth={startDate}
              endMonth={endDate}
              className="w-full flex justify-center border-0 p-0"
              classNames={{
                day: "h-9 w-9 p-0 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center aria-selected:opacity-100",
                caption_label: "text-sm font-bold text-slate-900 dark:text-white",
                button_previous: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-700 dark:text-slate-300 absolute left-1 flex items-center justify-center",
                button_next: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-700 dark:text-slate-300 absolute right-1 flex items-center justify-center",
                weekday: "text-[0.8rem] font-bold text-slate-500 dark:text-slate-400 w-9 text-center",
                month: "w-full relative text-slate-900 dark:text-white",
              }}
              components={{
                DayButton: ({ day, modifiers, ...props }) => {
                  const isTodayDate = isSameDay(day.date, today);
                  const tasks = getTasksForDay(day.date);
                  
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          {...props}
                          className={cn(
                            "relative h-9 w-9 rounded-xl flex flex-col items-center justify-center font-bold text-sm transition-all outline-none mx-auto",
                            isTodayDate ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 z-10" :
                            "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                            modifiers.outside && "text-slate-300 dark:text-slate-600 cursor-default hover:bg-transparent pointer-events-none"
                          )}
                        >
                          <span className="z-10 leading-none">{day.date.getDate()}</span>
                          
                          {/* Task Dots */}
                          {!modifiers.outside && tasks.length > 0 && (
                            <div className="absolute bottom-[3px] flex gap-[2px] z-10">
                              {tasks.slice(0, 3).map((task, i) => (
                                <div key={i} className={cn("h-1 w-1 rounded-full", getDotColor(task.state), isTodayDate && "bg-white")} />
                              ))}
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      {!modifiers.outside && tasks.length > 0 && (
                        <TooltipContent side="top" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium p-3 rounded-xl shadow-xl border-0 z-[100] max-w-[200px]">
                          <p className="font-bold mb-1.5 border-b border-slate-700 dark:border-slate-200 pb-1">{format(day.date, 'EEEE, MMM d')}</p>
                          <div className="space-y-1.5">
                            {tasks.map((task, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <div className={cn("h-2 w-2 rounded-full mt-[3px] shrink-0", getDotColor(task.state))} />
                                <span className="leading-tight truncate">{task.title}</span>
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
          </TooltipProvider>
        </div>
        
        {/* Legend */}
        <div className="w-full flex items-center justify-center gap-4 mt-auto pt-6 pb-2 text-[10px] font-bold text-slate-500 uppercase">
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" />Completed</div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-orange-500" />In Progress</div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-rose-500" />Overdue</div>
        </div>
        
        <div className="w-full pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
            <span>Internship Progress</span>
            <span className="text-orange-600 dark:text-orange-400">Week 2 of 12</span>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={18} className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500 rounded-full" />
            <span className="text-xs font-black text-slate-900 dark:text-white">18%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
