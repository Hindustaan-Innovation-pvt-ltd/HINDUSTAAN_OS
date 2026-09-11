import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, 
  ChevronLeft, ChevronRight, Activity, Flame, ShieldAlert, Sparkles, X, Info
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

  // Month navigation for Month View (Defaults to current viewing month, e.g. Sep 2026)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 8, 1)); // Sep 2026 default
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Sync initial records and fetch latest history for the selected user
  useEffect(() => {
    if (!isOpen || !user) return;

    // Prefill with existing records for this user
    const userInitial = initialRecords.filter(r => r.userId === user.id);
    setRecords(userInitial);

    // Fetch full history from server
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
  // 1. MONTH VIEW LOGIC (Calendar Grid with Days at Top - Image 2)
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

    // Pad next month days to complete 35 or 42 grid cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
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
  // 2. GITHUB-STYLE HEATMAP LOGIC (Continuous Timeline Heatmap)
  // -------------------------------------------------------------
  const heatmapData = useMemo(() => {
    // Generate past 16 weeks of days (112 days)
    const weeks: Array<Array<{
      date: Date;
      dateKey: string;
      records: AttendanceRecordItem[];
    }>> = [];

    const today = new Date();
    // End on upcoming Saturday
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));

    const totalWeeks = 16;
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

  // Selected date record details
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
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col bg-slate-950/95 border-slate-800/80 text-white rounded-3xl backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Avatar className="h-12 w-12 rounded-2xl border-2 border-slate-700 bg-slate-800 shadow-md">
                <AvatarFallback className="text-sm font-black bg-linear-to-br from-orange-500 to-amber-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-white">{user.name}</h2>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-[10px] font-black px-2 py-0.5 uppercase border",
                      user.role === 'manager'
                        ? "bg-purple-950/50 text-purple-300 border-purple-800"
                        : user.role === 'admin'
                          ? "bg-rose-950/50 text-rose-300 border-rose-800"
                          : "bg-blue-950/50 text-blue-300 border-blue-800"
                    )}
                  >
                    {user.role}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user.email} {user.department ? `• ${user.department}` : ''}
                </p>
              </div>
            </div>

            {/* View Switcher: Calendar vs Heatmap */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === 'calendar'
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Month Calendar
              </button>
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === 'heatmap'
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Flame className="h-3.5 w-3.5" />
                GitHub Heatmap
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2.5 mt-5">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">{stats.presentCount} Days</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
              <span className="text-base sm:text-lg font-black text-rose-400">{stats.absentCount} Days</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Worked</span>
              <span className="text-base sm:text-lg font-black text-blue-400">{stats.totalHours} hrs</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance</span>
              <span className="text-base sm:text-lg font-black text-amber-400">{stats.rate}%</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* VIEW 1: MONTH CALENDAR VIEW (Image 2 style with dates at top) */}
          {viewMode === 'calendar' && (
            <div className="space-y-4">
              {/* Month Navigation Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-bold text-white">{monthYearLabel}</span>
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
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const next = new Date(currentMonthDate);
                      next.setMonth(next.getMonth() + 1);
                      setCurrentMonthDate(next);
                    }}
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day Headers Row (Su Mo Tu We Th Fr Sa) */}
              <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-400 pb-2 border-b border-slate-800/60">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <div key={i} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid (Days 1..30) */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
                        "relative flex flex-col items-center justify-center p-2 rounded-2xl min-h-[58px] sm:min-h-[64px] border transition-all cursor-pointer text-center",
                        !cell.isCurrentMonth && "opacity-25 border-transparent text-slate-500",
                        cell.isCurrentMonth && "border-slate-800/80 bg-slate-900/50 hover:bg-slate-850 hover:border-slate-700",
                        isSelected && "ring-2 ring-orange-500 border-orange-500 bg-orange-500/10",
                        // Absent highlights
                        isAbsent && "bg-rose-950/20 border-rose-800/40",
                        // Present highlights
                        isPresent && "bg-emerald-950/20 border-emerald-800/40"
                      )}
                    >
                      {/* Day Number Circle */}
                      <span
                        className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-all",
                          cell.isToday && "bg-sky-500 text-white shadow-md shadow-sky-500/30",
                          !cell.isToday && isPresent && "text-emerald-300 font-black",
                          !cell.isToday && isAbsent && "text-rose-300 font-black",
                          !cell.isToday && !isPresent && !isAbsent && "text-slate-300"
                        )}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Status Badges on Calendar Day */}
                      <div className="flex items-center gap-1 mt-1">
                        {isPresent && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-900/60" title="Present" />
                        )}
                        {isAbsent && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-rose-900/60" title="Absent" />
                        )}
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" title="Active" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: GITHUB-STYLE CONTRIBUTION HEATMAP */}
          {viewMode === 'heatmap' && (
            <TooltipProvider delayDuration={100}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-bold text-white">Attendance Activity Heatmap (Past 16 Weeks)</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Hover over squares to inspect day logs
                  </div>
                </div>

                {/* Heatmap Matrix */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 overflow-x-auto">
                  <div className="inline-flex gap-1.5 min-w-[550px]">
                    {/* Day labels column */}
                    <div className="flex flex-col justify-between text-[9px] font-bold text-slate-500 pr-2 pt-1 pb-1">
                      <span>Sun</span>
                      <span>Tue</span>
                      <span>Thu</span>
                      <span>Sat</span>
                    </div>

                    {/* Week columns */}
                    {heatmapData.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1.5">
                        {week.map((dayItem, dIdx) => {
                          const latest = dayItem.records[0];
                          const isPresent = latest?.attendanceStatus === 'COMPLETED';
                          const isAbsent = latest?.attendanceStatus === 'MISSED_CHECKOUT' || latest?.attendanceStatus === 'ABSENT';
                          const isActive = latest?.attendanceStatus === 'ACTIVE';
                          const workedMins = latest?.workedMinutes || 0;

                          // Color classes based on status & duration
                          let bgClass = "bg-slate-800/60 border border-slate-700/40 hover:border-slate-500";
                          if (isActive) {
                            bgClass = "bg-sky-500 border-sky-400 shadow-sm shadow-sky-500/40 animate-pulse";
                          } else if (isAbsent) {
                            bgClass = "bg-rose-500 border-rose-400 shadow-sm shadow-rose-500/30";
                          } else if (isPresent) {
                            if (workedMins >= 480) {
                              bgClass = "bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/30";
                            } else if (workedMins >= 240) {
                              bgClass = "bg-emerald-600 border-emerald-500";
                            } else {
                              bgClass = "bg-emerald-700 border-emerald-600";
                            }
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
                                  onClick={() => {
                                    setSelectedDateStr(dayItem.dateKey);
                                  }}
                                  className={cn(
                                    "h-3.5 w-3.5 rounded-xs transition-all cursor-pointer",
                                    bgClass,
                                    selectedDateStr === dayItem.dateKey && "ring-2 ring-white ring-offset-1 ring-offset-slate-900"
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border-slate-700 text-white p-2.5 rounded-xl shadow-xl text-xs max-w-xs">
                                <p className="font-bold text-orange-400">{formattedDate}</p>
                                {latest ? (
                                  <div className="mt-1 space-y-0.5">
                                    <p className="font-semibold flex items-center gap-1">
                                      <span>Status:</span>
                                      <span className={isAbsent ? "text-rose-400 font-bold" : isPresent ? "text-emerald-400 font-bold" : "text-sky-400 font-bold"}>
                                        {isAbsent ? "ABSENT" : isPresent ? "PRESENT" : "ACTIVE"}
                                      </span>
                                    </p>
                                    <p className="text-[11px] text-slate-300">Worked: {latest.workedHours || '0h 0m'}</p>
                                    {isAbsent && latest.invalidReason && (
                                      <p className="text-[10px] text-rose-300">{latest.invalidReason}</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 mt-1">No check-in record</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-xs bg-rose-500" />
                        <span>Absent</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-xs bg-sky-500" />
                        <span>Active</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Less</span>
                      <span className="h-2.5 w-2.5 rounded-xs bg-slate-800" />
                      <span className="h-2.5 w-2.5 rounded-xs bg-emerald-700" />
                      <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
                      <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          )}

          {/* Selected Date Detailed Log Card */}
          {selectedDateStr && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Log Details for {new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(null)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {selectedDayRecords && selectedDayRecords.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayRecords.map((item, i) => {
                    const isAbs = item.attendanceStatus === 'MISSED_CHECKOUT' || item.attendanceStatus === 'ABSENT';
                    const isPres = item.attendanceStatus === 'COMPLETED';
                    const isAct = item.attendanceStatus === 'ACTIVE';

                    const inTime = item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-';
                    const outTime = item.checkOutTime && item.checkOutTime !== '-' ? new Date(item.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-';

                    return (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border",
                                isAbs && "bg-rose-500/10 text-rose-400 border-rose-500/30",
                                isPres && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                                isAct && "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              )}
                            >
                              {isAbs ? "ABSENT" : isPres ? "PRESENT" : "ACTIVE"}
                            </Badge>
                            <span className="font-bold text-white">Worked: {item.workedHours || '0h 0m'}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-2">
                            <span>Check-in: <strong className="text-slate-200">{inTime}</strong></span>
                            <span>•</span>
                            <span>Check-out: <strong className="text-slate-200">{outTime}</strong></span>
                          </div>
                          {isAbs && item.invalidReason && (
                            <p className="text-[11px] text-rose-400 font-medium">
                              Reason: {item.invalidReason}
                            </p>
                          )}
                        </div>

                        {item.ipAddress && (
                          <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 self-start sm:self-center">
                            IP: {item.ipAddress}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-1">
                  No attendance session was logged on this day.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
