import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TrainingCalendarWidget() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    // Enforce bounds if today is outside the range
    if (d < new Date(2026, 6, 1)) return new Date(2026, 6, 1);
    if (d > new Date(2026, 9, 1)) return new Date(2026, 9, 1);
    return d;
  });

  const startDate = new Date(2026, 6, 1); // July 1, 2026
  const endDate = new Date(2026, 9, 1);   // Oct 1, 2026

  const monthDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    
    let startDayOfWeek = firstDay.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7;
    
    // Padding for first week (empty cells)
    for (let i = 1; i < startDayOfWeek; i++) {
      days.push(null);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      let status = 'none';
      
      const isTrainingDay = d >= startDate && d <= endDate && d.getDay() !== 0;

      if (isTrainingDay) {
        if (d.getTime() === today.getTime()) {
          status = 'current';
        } else if (d < today) {
          status = 'done';
        } else {
          status = 'scheduled';
        }
      }

      // Hide numbers that fall outside the training period entirely as requested
      if (d < startDate || d > endDate) {
         days.push(null);
      } else {
         days.push({
           date: i,
           fullDate: d,
           status
         });
      }
    }

    return days;
  }, [selectedMonth]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthStr = `${monthNames[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;

  const canGoPrev = selectedMonth.getTime() > startDate.getTime();
  const canGoNext = selectedMonth.getTime() < new Date(2026, 9, 1).getTime();

  const prevMonth = () => {
    if (!canGoPrev) return;
    const newDate = new Date(selectedMonth);
    newDate.setMonth(selectedMonth.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const nextMonth = () => {
    if (!canGoNext) return;
    const newDate = new Date(selectedMonth);
    newDate.setMonth(selectedMonth.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5 w-full flex flex-col">
      <div className="flex items-center justify-between mb-6 relative">
        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight w-24">Your Training Days</h3>
        
        <div className="flex items-center space-x-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
          <button 
            onClick={prevMonth} 
            disabled={!canGoPrev}
            className={cn("p-1 rounded-md transition-colors", canGoPrev ? "hover:bg-slate-100 dark:hover:bg-slate-800" : "opacity-30 cursor-not-allowed")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[80px] text-center">{currentMonthStr}</span>
          <button 
            onClick={nextMonth} 
            disabled={!canGoNext}
            className={cn("p-1 rounded-md transition-colors", canGoNext ? "hover:bg-slate-100 dark:hover:bg-slate-800" : "opacity-30 cursor-not-allowed")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 gap-y-3 mb-6">
        {monthDays.map((d, i) => {
          if (!d) {
            return <div key={`empty-${i}`} className="w-8 h-8 mx-auto"></div>;
          }
          
          return (
            <div key={i} className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  d.status === 'current' ? "bg-amber-400 text-amber-950 shadow-sm" : 
                  "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {d.date}
              </div>
              
              {/* Status Dot */}
              <div className="mt-1 h-1.5 flex items-center justify-center">
                {d.status === 'current' && <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />}
                {d.status === 'done' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {d.status === 'scheduled' && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-y-2 items-center space-x-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white mr-1.5" />
          Current day
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
          Done
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mr-1.5" />
          Scheduled
        </div>
      </div>
    </div>
  );
}
