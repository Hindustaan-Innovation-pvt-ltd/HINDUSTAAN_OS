import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle2, 
  ChevronLeft, ChevronRight, Activity, Flame, X, Check, XCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export interface AttendanceRecordItem {
  id: string;
  userId: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  department?: string;
  checkInTime: string;
  checkOutTime: string;
  workedMinutes: number;
  workedHours: string;
  configuredWorkingHours?: number;
  attendanceStatus: 'ACTIVE' | 'COMPLETED' | 'MISSED_CHECKOUT' | string;
  statusDisplay?: string;
  invalidReason?: string | null;
  ipAddress?: string | null;
}

interface UserAttendanceHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  } | null;
  initialRecords?: AttendanceRecordItem[];
}

export default function UserAttendanceHeatmapModal({
  isOpen,
  onClose,
  user,
  initialRecords = []
}: UserAttendanceHeatmapModalProps) {
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'heatmap'>('calendar');

  // Month navigation for Month View (Defaults to September 2026)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 8, 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Sync initial records and fetch latest history for the selected user
  useEffect(() => {
    if (!isOpen || !user) return;

    const userInitial = initialRecords.filter(r => r.userId === user.id);
    setRecords(userInitial);

    const fetchUserHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/attendance/history?userId=${user.id}`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRecords(res.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch extra attendance records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserHistory();
  }, [isOpen, user?.id]);

  // Map attendance records by Date string YYYY-MM-DD
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecordItem[]>();
    records.forEach((rec) => {
      if (!rec.checkInTime || rec.checkInTime === '-') return;
      try {
        const d = new Date(rec.checkInTime);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const existing = map.get(dateKey) || [];
        existing.push(rec);
        map.set(dateKey, existing);
      } catch (e) {
        // Ignore invalid date strings
      }
    });
    return map;
  }, [records]);

  // Overall Statistics for this user
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let activeCount = 0;
    let totalMinutes = 0;

    records.forEach((rec) => {
      if (rec.attendanceStatus === 'COMPLETED') {
        presentCount++;
        totalMinutes += rec.workedMinutes || 0;
      } else if (rec.attendanceStatus === 'MISSED_CHECKOUT' || rec.attendanceStatus === 'ABSENT') {
        absentCount++;
      } else if (rec.attendanceStatus === 'ACTIVE') {
        activeCount++;
      }
    });

    const totalDays = presentCount + absentCount;
    const rate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;
    const totalHours = (totalMinutes / 60).toFixed(1);

    return { presentCount, absentCount, activeCount, totalHours, rate };
  }, [records]);

  // -------------------------------------------------------------
  // 1. MONTH VIEW LOGIC (Compact, 100% visible at 100% zoom)
  // -------------------------------------------------------------
  const monthYearLabel = useMemo(() => {
    return currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonthDate]);

  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNum: number;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      records: AttendanceRecordItem[];
    }> = [];

    // Pad previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        records: recordsByDate.get(dateKey) || []
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = 
        today.getFullYear() === year && 
        today.getMonth() === month && 
        today.getDate() === i;

      days.push({
        dayNum: i,
        dateKey,
        isCurrentMonth: true,
        isToday,
        records: recordsByDate.get(dateKey) || []
      });
    }

    // Only pad to 35 if total days fit, else pad to 42
    const targetLength = days.length <= 35 ? 35 : 42;
    const remaining = targetLength - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNum: i,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        records: recordsByDate.get(dateKey) || []
      });
    }

    return days;
  }, [currentMonthDate, recordsByDate]);

  // -------------------------------------------------------------
  // 2. GITHUB-STYLE HEATMAP LOGIC
  // -------------------------------------------------------------
  const heatmapData = useMemo(() => {
    const weeks: Array<Array<{
      date: Date;
      dateKey: string;
      records: AttendanceRecordItem[];
    }>> = [];

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));

    const totalWeeks = 15;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (totalWeeks * 7) + 1);

    const curr = new Date(startDate);

    for (let w = 0; w < totalWeeks; w++) {
      const currentWeek: Array<{
        date: Date;
        dateKey: string;
        records: AttendanceRecordItem[];
      }> = [];

      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(curr);
        const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        currentWeek.push({
          date: dateObj,
          dateKey,
          records: recordsByDate.get(dateKey) || []
        });
        curr.setDate(curr.getDate() + 1);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [recordsByDate]);

  const selectedDayRecords = useMemo(() => {
    if (!selectedDateStr) return null;
    return recordsByDate.get(selectedDateStr) || [];
  }, [selectedDateStr, recordsByDate]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] sm:max-w-[510px] w-[95vw] bg-[#0c1222] border border-slate-800 text-white rounded-3xl shadow-2xl p-0 overflow-hidden focus:outline-none">
        {/* Compact Header */}
        <div className="p-4 pb-3 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800 shrink-0">
                <AvatarFallback className="text-xs font-black bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-white truncate">{user.name}</h2>
                  <Badge 
                    variant="outline"
                    className="text-[9px] font-black px-1.5 py-0 uppercase border bg-purple-950/50 text-purple-300 border-purple-800 shrink-0"
                  >
                    {user.role}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* View Switcher Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === 'calendar'
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                Month Calendar
              </button>
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === 'heatmap'
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Flame className="h-3 w-3" />
                GitHub Heatmap
              </button>
            </div>
          </div>

          {/* Sleek Compact Inline Metrics Strip */}
          <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-slate-800/60 text-[11px]">
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Present: <strong>{stats.presentCount}d</strong></span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              <span>Absent: <strong>{stats.absentCount}d</strong></span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Worked: <strong>{stats.totalHours}h</strong></span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center gap-1 ml-auto">
              <Activity className="h-3 w-3" />
              <span>{stats.rate}%</span>
            </div>
          </div>
        </div>

        {/* Modal Main Body - Fixed Height, ZERO Vertical Scrolling for Calendar */}
        <div className="p-4 pt-3">
          {viewMode === 'calendar' && (
            <div className="space-y-2.5">
              {/* Month Header Navigation */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-xs font-black text-white tracking-wide">{monthYearLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const prev = new Date(currentMonthDate);
                      prev.setMonth(prev.getMonth() - 1);
                      setCurrentMonthDate(prev);
                    }}
                    className="h-7 w-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const next = new Date(currentMonthDate);
                      next.setMonth(next.getMonth() + 1);
                      setCurrentMonthDate(next);
                    }}
                    className="h-7 w-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Day Headers Row (Su Mo Tu We Th Fr Sa) */}
              <div className="grid grid-cols-7 text-center font-bold text-[11px] text-slate-400 pb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <div key={i} className="py-0.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid: Perfectly Compact (All 30/31 dates 100% visible) */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, idx) => {
                  const hasRecords = cell.records.length > 0;
                  const latest = hasRecords ? cell.records[0] : null;
                  const isPresent = latest?.attendanceStatus === 'COMPLETED';
                  const isAbsent = latest?.attendanceStatus === 'MISSED_CHECKOUT' || latest?.attendanceStatus === 'ABSENT';
                  const isActive = latest?.attendanceStatus === 'ACTIVE';
                  const isSelected = selectedDateStr === cell.dateKey;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDateStr(cell.dateKey)}
                      className={cn(
                        "relative flex flex-col items-center justify-center h-10 sm:h-11 rounded-xl transition-all cursor-pointer select-none",
                        !cell.isCurrentMonth && "opacity-20 text-slate-500",
                        cell.isCurrentMonth && "hover:bg-slate-800/80 bg-slate-900/40 border border-slate-800/60",
                        isSelected && "ring-2 ring-violet-500 border-violet-500 bg-violet-500/10",
                        isAbsent && "bg-rose-950/20 border-rose-800/40",
                        isPresent && "bg-emerald-950/20 border-emerald-800/40"
                      )}
                    >
                      {/* Day Number Circle */}
                      <span
                        className={cn(
                          "flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition-all",
                          cell.isToday && "bg-sky-500 text-white shadow-sm shadow-sky-500/40 font-black",
                          !cell.isToday && isPresent && "text-emerald-400 font-bold",
                          !cell.isToday && isAbsent && "text-rose-400 font-bold",
                          !cell.isToday && !isPresent && !isAbsent && "text-slate-300"
                        )}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Tiny Status Dot */}
                      <div className="h-1 flex items-center justify-center">
                        {isPresent && (
                          <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        )}
                        {isAbsent && (
                          <span className="h-1 w-1 rounded-full bg-rose-500" />
                        )}
                        {isActive && (
                          <span className="h-1 w-1 rounded-full bg-sky-400 animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend Strip */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 px-1 border-t border-slate-800/60">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Present</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>Absent</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <span>Today</span>
                  </span>
                </div>
                <span className="text-slate-500">Click date for shift log</span>
              </div>
            </div>
          )}

          {/* VIEW 2: GITHUB-STYLE CONTRIBUTION HEATMAP */}
          {viewMode === 'heatmap' && (
            <TooltipProvider delayDuration={100}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-black text-white">Attendance Activity Heatmap (Past 15 Weeks)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Hover for details</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-x-auto">
                  <div className="inline-flex gap-1">
                    <div className="flex flex-col justify-between text-[8px] font-bold text-slate-500 pr-1 py-0.5">
                      <span>S</span>
                      <span>T</span>
                      <span>T</span>
                      <span>S</span>
                    </div>

                    {heatmapData.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1">
                        {week.map((dayItem, dIdx) => {
                          const latest = dayItem.records[0];
                          const isPresent = latest?.attendanceStatus === 'COMPLETED';
                          const isAbsent = latest?.attendanceStatus === 'MISSED_CHECKOUT' || latest?.attendanceStatus === 'ABSENT';
                          const isActive = latest?.attendanceStatus === 'ACTIVE';
                          const workedMins = latest?.workedMinutes || 0;

                          let bgClass = "bg-slate-800/60 border border-slate-700/40";
                          if (isActive) {
                            bgClass = "bg-sky-500 border-sky-400";
                          } else if (isAbsent) {
                            bgClass = "bg-rose-500 border-rose-400";
                          } else if (isPresent) {
                            if (workedMins >= 480) bgClass = "bg-emerald-500 border-emerald-400";
                            else if (workedMins >= 240) bgClass = "bg-emerald-600 border-emerald-500";
                            else bgClass = "bg-emerald-700 border-emerald-600";
                          }

                          const formattedDate = dayItem.date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });

                          return (
                            <Tooltip key={dIdx}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDateStr(dayItem.dateKey)}
                                  className={cn(
                                    "h-3 w-3 rounded-xs transition-all cursor-pointer",
                                    bgClass,
                                    selectedDateStr === dayItem.dateKey && "ring-2 ring-white ring-offset-1 ring-offset-slate-900"
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border-slate-700 text-white p-2 rounded-lg shadow-xl text-[11px] max-w-xs">
                                <p className="font-bold text-orange-400">{formattedDate}</p>
                                {latest ? (
                                  <div className="mt-0.5 space-y-0.5">
                                    <p className="font-semibold">
                                      Status: <span className={isAbsent ? "text-rose-400" : isPresent ? "text-emerald-400" : "text-sky-400"}>
                                        {isAbsent ? "ABSENT" : isPresent ? "PRESENT" : "ACTIVE"}
                                      </span>
                                    </p>
                                    <p className="text-slate-300">Worked: {latest.workedHours || '0h 0m'}</p>
                                  </div>
                                ) : (
                                  <p className="text-slate-400">No session logged</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-rose-500" /> Absent</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-sky-500" /> Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Less</span>
                      <span className="h-2 w-2 rounded-xs bg-slate-800" />
                      <span className="h-2 w-2 rounded-xs bg-emerald-700" />
                      <span className="h-2 w-2 rounded-xs bg-emerald-600" />
                      <span className="h-2 w-2 rounded-xs bg-emerald-500" />
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          )}

          {/* Selected Date Details Pill / Banner (Compact) */}
          {selectedDateStr && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="font-bold text-white">
                  {new Date(selectedDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:
                </span>
                {selectedDayRecords && selectedDayRecords.length > 0 ? (
                  <>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0 border",
                        (selectedDayRecords[0].attendanceStatus === 'MISSED_CHECKOUT' || selectedDayRecords[0].attendanceStatus === 'ABSENT')
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : selectedDayRecords[0].attendanceStatus === 'COMPLETED'
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-sky-500/10 text-sky-400 border-sky-500/30"
                      )}
                    >
                      {(selectedDayRecords[0].attendanceStatus === 'MISSED_CHECKOUT' || selectedDayRecords[0].attendanceStatus === 'ABSENT')
                        ? "ABSENT"
                        : selectedDayRecords[0].attendanceStatus}
                    </Badge>
                    <span className="text-slate-300 text-[11px]">
                      In: {selectedDayRecords[0].checkInTime ? new Date(selectedDayRecords[0].checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                    </span>
                    <span className="text-slate-400 text-[11px]">•</span>
                    <span className="text-slate-300 text-[11px]">
                      Worked: {selectedDayRecords[0].workedHours || '0h 0m'}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 text-[11px]">No session recorded</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                className="text-slate-400 hover:text-white p-0.5 shrink-0 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
