import React, { useEffect, useState, useMemo } from 'react';
import { 
  Clock, Calendar, Search, X, Download, RefreshCw, 
  CheckCircle2, XCircle, PlayCircle, ShieldAlert, Wifi, Globe, 
  Filter, User, ChevronLeft, ChevronRight, Activity, ArrowUpDown, MapPin,
  CalendarDays, BarChart3, TrendingUp, Award, Sparkles, Check, AlertTriangle
} from 'lucide-react';
import { getBrowserCoordinates, getCityFromCoordinates } from '@/lib/geo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import UserAttendanceHeatmapModal from '@/components/attendance/UserAttendanceHeatmapModal';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  department?: string;
  checkInTime: string;
  checkOutTime: string;
  workedMinutes: number;
  workedHours: string;
  configuredWorkingHours: number;
  attendanceStatus: 'ACTIVE' | 'COMPLETED' | 'MISSED_CHECKOUT' | string;
  statusDisplay: string;
  invalidReason?: string | null;
  ipAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string;
}

// Helpers for date calculations
const toDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMondayOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

export default function AttendanceLogs() {
  const { user } = useUser();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // Navigation tab: 'daily' | 'weekly' | 'monthly' | 'all'
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');

  // Master records state
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCheckInOutSubmitting, setIsCheckInOutSubmitting] = useState(false);

  // Selected date states for views
  const [selectedDayStr, setSelectedDayStr] = useState<string>(toDateKey(new Date()));
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getMondayOfWeek(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modal state
  const [selectedUserForCalendar, setSelectedUserForCalendar] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  } | null>(null);

  // Fetch Attendance Records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/history?limit=1000');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setRecords(res.data.data);
      } else {
        toast.error('Failed to load attendance records');
      }
    } catch (err: any) {
      console.error('Error fetching attendance logs:', err);
      toast.error(err.response?.data?.message || 'Could not fetch attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Quick Check In / Check Out action
  const handleQuickCheckInOut = async (type: 'checkin' | 'checkout') => {
    setIsCheckInOutSubmitting(true);
    try {
      let payload: Record<string, any> = {};
      if (type === 'checkin') {
        try {
          const coords = await getBrowserCoordinates();
          payload = { latitude: coords.latitude, longitude: coords.longitude };
        } catch (geoErr: any) {
          toast.error(geoErr.message || 'Location access is required for attendance check-in.');
          setIsCheckInOutSubmitting(false);
          return;
        }
      }
      const res = await api.post(`/auth/${type}`, payload);
      if (res.data?.success) {
        toast.success(res.data.message || `Successfully ${type === 'checkin' ? 'checked in' : 'checked out'}`);
        window.dispatchEvent(new Event('auth_status_changed'));
        await fetchRecords();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${type}`);
    } finally {
      setIsCheckInOutSubmitting(false);
    }
  };

  // Check if current user has an active session
  const currentUserActiveRecord = useMemo(() => {
    return records.find(r => r.userId === user?.id && r.attendanceStatus === 'ACTIVE');
  }, [records, user?.id]);

  // Overall Statistics across all records
  const stats = useMemo(() => {
    const total = records.length;
    const active = records.filter(r => r.attendanceStatus === 'ACTIVE').length;
    const completed = records.filter(r => r.attendanceStatus === 'COMPLETED').length;
    const absent = records.filter(r => r.attendanceStatus === 'MISSED_CHECKOUT' || r.attendanceStatus === 'ABSENT').length;
    return { total, active, completed, absent };
  }, [records]);

  // Date formatters
  const formatDate = (isoString: string) => {
    if (!isoString || isoString === '-') return '-';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString || isoString === '-') return '-';
    try {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  // -------------------------------------------------------------
  // 1. DAILY LOGS DATA
  // -------------------------------------------------------------
  const dailyRecords = useMemo(() => {
    return records.filter(r => {
      if (!r.checkInTime || r.checkInTime === '-') return false;
      const key = toDateKey(new Date(r.checkInTime));
      if (key !== selectedDayStr) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (r.userName || '').toLowerCase().includes(q);
        const matchEmail = (r.userEmail || '').toLowerCase().includes(q);
        const matchIp = (r.ipAddress || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchIp) return false;
      }
      if (roleFilter !== 'all' && r.userRole !== roleFilter) return false;
      if (statusFilter !== 'all' && r.attendanceStatus !== statusFilter) return false;

      return true;
    });
  }, [records, selectedDayStr, searchQuery, roleFilter, statusFilter]);

  const dailyStats = useMemo(() => {
    const dayRecords = records.filter(r => r.checkInTime && toDateKey(new Date(r.checkInTime)) === selectedDayStr);
    const totalPresent = dayRecords.length;
    const activeNow = dayRecords.filter(r => r.attendanceStatus === 'ACTIVE').length;
    const completed = dayRecords.filter(r => r.attendanceStatus === 'COMPLETED').length;
    const missed = dayRecords.filter(r => r.attendanceStatus === 'MISSED_CHECKOUT').length;
    const totalMinutes = dayRecords.reduce((acc, r) => acc + (r.workedMinutes || 0), 0);
    const avgMinutes = totalPresent > 0 ? Math.round(totalMinutes / totalPresent) : 0;
    const avgHoursStr = `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m`;

    return { totalPresent, activeNow, completed, missed, avgHoursStr };
  }, [records, selectedDayStr]);

  // Day navigation
  const shiftDay = (days: number) => {
    const parts = selectedDayStr.split('-');
    const current = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    current.setDate(current.getDate() + days);
    setSelectedDayStr(toDateKey(current));
  };

  // -------------------------------------------------------------
  // 2. WEEKLY LOGS DATA (Monday to Sunday Matrix)
  // -------------------------------------------------------------
  const weekDays = useMemo(() => {
    const days: { date: Date; dateStr: string; label: string; shortLabel: string; isToday: boolean }[] = [];
    const todayStr = toDateKey(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedWeekStart);
      d.setDate(d.getDate() + i);
      const str = toDateKey(d);
      days.push({
        date: d,
        dateStr: str,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        shortLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: str === todayStr
      });
    }
    return days;
  }, [selectedWeekStart]);

  const weeklyMatrix = useMemo(() => {
    const weekStartStr = weekDays[0].dateStr;
    const weekEndStr = weekDays[6].dateStr;

    // Filter records in this week
    const weekRecords = records.filter(r => {
      if (!r.checkInTime) return false;
      const key = toDateKey(new Date(r.checkInTime));
      return key >= weekStartStr && key <= weekEndStr;
    });

    // Group by User
    const userMap = new Map<string, {
      userId: string;
      userName: string;
      userRole: string;
      userEmail: string;
      department?: string;
      days: Record<string, AttendanceRecord | null>;
      totalMinutes: number;
    }>();

    // Initialize all users present in records
    records.forEach(r => {
      if (!userMap.has(r.userId)) {
        userMap.set(r.userId, {
          userId: r.userId,
          userName: r.userName || 'Employee',
          userRole: r.userRole || 'employee',
          userEmail: r.userEmail || '',
          department: r.department || 'General',
          days: {},
          totalMinutes: 0
        });
      }
    });

    // Populate daily records
    weekRecords.forEach(r => {
      const userObj = userMap.get(r.userId);
      if (userObj) {
        const key = toDateKey(new Date(r.checkInTime));
        // Keep the latest or completed record if multiple
        if (!userObj.days[key] || r.attendanceStatus === 'COMPLETED') {
          userObj.days[key] = r;
        }
        userObj.totalMinutes += (r.workedMinutes || 0);
      }
    });

    let list = Array.from(userMap.values());

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => 
        u.userName.toLowerCase().includes(q) || 
        u.userEmail.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'all') {
      list = list.filter(u => u.userRole === roleFilter);
    }

    return list;
  }, [records, weekDays, searchQuery, roleFilter]);

  const weeklyStats = useMemo(() => {
    const totalMinutes = weeklyMatrix.reduce((acc, u) => acc + u.totalMinutes, 0);
    const totalHours = Math.round(totalMinutes / 60);
    const activeMembers = weeklyMatrix.filter(u => u.totalMinutes > 0).length;
    const avgHoursPerPerson = activeMembers > 0 ? (totalHours / activeMembers).toFixed(1) : '0';

    return { totalHours, activeMembers, avgHoursPerPerson };
  }, [weeklyMatrix]);

  const shiftWeek = (weeks: number) => {
    const next = new Date(selectedWeekStart);
    next.setDate(next.getDate() + (weeks * 7));
    setSelectedWeekStart(next);
  };

  // -------------------------------------------------------------
  // 3. MONTHLY SUMMARY DATA
  // -------------------------------------------------------------
  const monthlySummary = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${selectedYear}-${pad(selectedMonth)}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const endStr = `${selectedYear}-${pad(selectedMonth)}-${pad(lastDay)}`;

    const monthRecords = records.filter(r => {
      if (!r.checkInTime) return false;
      const key = toDateKey(new Date(r.checkInTime));
      return key >= startStr && key <= endStr;
    });

    const userMap = new Map<string, {
      userId: string;
      userName: string;
      userRole: string;
      userEmail: string;
      department?: string;
      presentDays: Set<string>;
      missedDays: Set<string>;
      totalMinutes: number;
    }>();

    // Initialize users
    records.forEach(r => {
      if (!userMap.has(r.userId)) {
        userMap.set(r.userId, {
          userId: r.userId,
          userName: r.userName || 'Employee',
          userRole: r.userRole || 'employee',
          userEmail: r.userEmail || '',
          department: r.department || 'General',
          presentDays: new Set(),
          missedDays: new Set(),
          totalMinutes: 0
        });
      }
    });

    monthRecords.forEach(r => {
      const u = userMap.get(r.userId);
      if (u) {
        const key = toDateKey(new Date(r.checkInTime));
        if (r.attendanceStatus === 'COMPLETED' || r.attendanceStatus === 'ACTIVE') {
          u.presentDays.add(key);
          u.totalMinutes += (r.workedMinutes || 0);
        } else if (r.attendanceStatus === 'MISSED_CHECKOUT') {
          u.missedDays.add(key);
        }
      }
    });

    let list = Array.from(userMap.values()).map(u => {
      const presentCount = u.presentDays.size;
      const missedCount = u.missedDays.size;
      const totalAttended = presentCount + missedCount;
      const attendanceRate = totalAttended > 0 ? Math.round((presentCount / totalAttended) * 100) : 100;
      const totalHours = (u.totalMinutes / 60).toFixed(1);
      const avgHoursPerDay = presentCount > 0 ? (u.totalMinutes / presentCount / 60).toFixed(1) : '0';

      return {
        ...u,
        presentCount,
        missedCount,
        attendanceRate,
        totalHours,
        avgHoursPerDay
      };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => u.userName.toLowerCase().includes(q) || u.userEmail.toLowerCase().includes(q));
    }
    if (roleFilter !== 'all') {
      list = list.filter(u => u.userRole === roleFilter);
    }

    return list;
  }, [records, selectedMonth, selectedYear, searchQuery, roleFilter]);

  const shiftMonth = (offset: number) => {
    let m = selectedMonth + offset;
    let y = selectedYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const monthLabel = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth, selectedYear]);

  // -------------------------------------------------------------
  // 4. ALL RECORDS / HISTORY FILTERING
  // -------------------------------------------------------------
  const filteredAllRecords = useMemo(() => {
    return records.filter(rec => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (rec.userName || '').toLowerCase().includes(q);
        const matchEmail = (rec.userEmail || '').toLowerCase().includes(q);
        const matchIp = isAdminOrManager && (rec.ipAddress || '').toLowerCase().includes(q);
        const matchDept = (rec.department || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchIp && !matchDept) return false;
      }

      if (statusFilter !== 'all' && rec.attendanceStatus !== statusFilter) return false;
      if (roleFilter !== 'all' && rec.userRole !== roleFilter) return false;

      if (dateFilter !== 'all' && rec.checkInTime) {
        const checkInMs = new Date(rec.checkInTime).getTime();
        const nowMs = Date.now();
        if (dateFilter === 'today') {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          if (checkInMs < todayStart.getTime()) return false;
        } else if (dateFilter === '7d') {
          if (nowMs - checkInMs > 7 * 86400000) return false;
        } else if (dateFilter === '30d') {
          if (nowMs - checkInMs > 30 * 86400000) return false;
        }
      }

      return true;
    });
  }, [records, searchQuery, statusFilter, roleFilter, dateFilter, isAdminOrManager]);

  const totalPages = Math.max(1, Math.ceil(filteredAllRecords.length / itemsPerPage));
  const paginatedAllRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAllRecords.slice(start, start + itemsPerPage);
  }, [filteredAllRecords, currentPage, itemsPerPage]);

  // Export CSV
  const handleExportCSV = () => {
    const recordsToExport = activeTab === 'daily' ? dailyRecords : filteredAllRecords;
    if (recordsToExport.length === 0) {
      toast.error('No records available to export.');
      return;
    }

    const headers = [
      'Employee Name', 'Email', 'Role', 'Department', 'Date', 
      'Check In', 'Check Out', 'Duration', 'Max Limit (Hours)', 
      'Status', ...(isAdminOrManager ? ['IP Address'] : []), 'Reason'
    ];

    const rows = recordsToExport.map(r => [
      r.userName || 'Employee',
      r.userEmail || '',
      r.userRole || '',
      r.department || 'General',
      formatDate(r.checkInTime),
      formatTime(r.checkInTime),
      formatTime(r.checkOutTime),
      r.workedHours || '',
      r.configuredWorkingHours || 9,
      r.statusDisplay || r.attendanceStatus,
      ...(isAdminOrManager ? [r.ipAddress || 'Not recorded'] : []),
      r.invalidReason || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_logs_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Attendance logs exported successfully!');
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-orange-500" />
            Attendance Logs & Tracker
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of check-in/checkout timelines, daily attendance, weekly breakdown, and monthly summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Check-in / Check-out button */}
          {currentUserActiveRecord ? (
            <Button
              onClick={() => handleQuickCheckInOut('checkout')}
              disabled={isCheckInOutSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 px-4 rounded-xl shadow-sm flex items-center gap-2"
            >
              <Activity className="w-4 h-4 animate-pulse" />
              Check Out (Active)
            </Button>
          ) : (
            <Button
              onClick={() => handleQuickCheckInOut('checkin')}
              disabled={isCheckInOutSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-xl shadow-sm flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Check In Now
            </Button>
          )}

          <Button
            variant="outline"
            onClick={fetchRecords}
            disabled={loading}
            className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
            title="Refresh logs"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="h-10 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5"
          >
            <Download className="h-4 w-4 text-orange-500" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-muted/40 p-1.5 rounded-2xl border border-border">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => { setActiveTab('daily'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all",
              activeTab === 'daily'
                ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Calendar className="h-4 w-4 text-orange-500" />
            Daily Logs
          </button>

          <button
            onClick={() => { setActiveTab('weekly'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all",
              activeTab === 'weekly'
                ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Weekly Breakdown
          </button>

          <button
            onClick={() => { setActiveTab('monthly'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all",
              activeTab === 'monthly'
                ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <CalendarDays className="h-4 w-4 text-emerald-500" />
            Monthly Summary
          </button>

          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all",
              activeTab === 'all'
                ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Clock className="h-4 w-4 text-purple-500" />
            All History Logs ({records.length})
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search employee..."
            className="pl-8 pr-7 h-9 text-xs rounded-xl border-input bg-card text-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY LOGS VIEW                                     */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-5">
          {/* Daily Date Selector Bar */}
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shiftDay(-1)}
                  className="h-9 w-9 p-0 rounded-xl"
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 font-bold text-sm sm:text-base px-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>
                    {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  {selectedDayStr === toDateKey(new Date()) && (
                    <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-[10px] font-extrabold uppercase">
                      Today
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shiftDay(1)}
                  className="h-9 w-9 p-0 rounded-xl"
                  title="Next Day"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={selectedDayStr}
                  onChange={(e) => e.target.value && setSelectedDayStr(e.target.value)}
                  className="h-9 text-xs rounded-xl border-input bg-muted/40 w-36 font-semibold"
                />
                {selectedDayStr !== toDateKey(new Date()) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDayStr(toDateKey(new Date()))}
                    className="h-9 text-xs font-bold rounded-xl"
                  >
                    Go to Today
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Daily KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Present Today</span>
                <span className="text-2xl sm:text-3xl font-black text-foreground">{dailyStats.totalPresent}</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Now</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{dailyStats.activeNow}</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed Shifts</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{dailyStats.completed}</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Average Hours Worked</span>
                <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{dailyStats.avgHoursStr}</span>
              </CardContent>
            </Card>
          </div>

          {/* Daily Table */}
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-emerald-500" />
                  Daily Check-In & Check-Out Timeline ({dailyRecords.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Timelines of check-ins and check-outs for {selectedDayStr}
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {dailyRecords.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <Calendar className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-bold text-foreground">No attendance records on this day</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No employees have checked in for {selectedDayStr}.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border">
                      <TableHead className="px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Employee</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Check In Time</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Check Out Time</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Worked Hours</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Office IP / Geofence</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyRecords.map((rec) => {
                      const isMissed = rec.attendanceStatus === 'MISSED_CHECKOUT';
                      const isActive = rec.attendanceStatus === 'ACTIVE';
                      const isCompleted = rec.attendanceStatus === 'COMPLETED';

                      return (
                        <TableRow
                          key={rec.id}
                          onClick={() => setSelectedUserForCalendar({
                            id: rec.userId,
                            name: rec.userName || 'Employee',
                            email: rec.userEmail || '',
                            role: rec.userRole || 'employee',
                            department: rec.department
                          })}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/60"
                        >
                          <TableCell className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg border border-border bg-muted shrink-0">
                                <AvatarFallback className="text-xs font-bold text-muted-foreground">
                                  {(rec.userName || 'E').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground truncate text-sm">{rec.userName}</span>
                                  <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 uppercase">
                                    {rec.userRole}
                                  </Badge>
                                </div>
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {rec.userEmail} {rec.department ? `• ${rec.department}` : ''}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <PlayCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-foreground">{formatTime(rec.checkInTime)}</span>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-foreground">
                                {rec.checkOutTime && rec.checkOutTime !== '-' ? (
                                  <>
                                    {formatTime(rec.checkOutTime)}
                                    {rec.checkOutTime.includes('T13:30:00') && (
                                      <span className="ml-1 text-[9px] bg-orange-500/10 text-orange-600 px-1 py-0.5 rounded font-bold">
                                        7:00 PM Auto
                                      </span>
                                    )}
                                  </>
                                ) : isActive ? (
                                  <span className="text-emerald-500 font-bold animate-pulse">Working Now</span>
                                ) : (
                                  '--:--'
                                )}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-xs font-bold whitespace-nowrap">
                            <span className={isActive ? "text-emerald-500" : isMissed ? "text-rose-500" : "text-foreground"}>
                              {rec.workedHours || '0h 0m'}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <div className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                                <Wifi className="h-3 w-3 text-orange-500" />
                                <span>{rec.ipAddress || '192.168.1.54'}</span>
                              </div>
                              {rec.latitude && rec.longitude ? (
                                <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <MapPin className="h-3 w-3" />
                                  <span>{getCityFromCoordinates(rec.latitude, rec.longitude)}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">Office Premise</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border",
                                isMissed
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : isActive
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 animate-pulse"
                                    : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                              )}
                            >
                              {isActive ? 'ACTIVE' : isMissed ? 'ABSENT' : 'COMPLETED'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: WEEKLY BREAKDOWN VIEW                               */}
      {/* ========================================================= */}
      {activeTab === 'weekly' && (
        <div className="space-y-5">
          {/* Weekly Selector Bar */}
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shiftWeek(-1)}
                  className="h-9 w-9 p-0 rounded-xl"
                  title="Previous Week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 font-bold text-sm sm:text-base px-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span>
                    {weekDays[0].label} &mdash; {weekDays[6].label}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shiftWeek(1)}
                  className="h-9 w-9 p-0 rounded-xl"
                  title="Next Week"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeekStart(getMondayOfWeek(new Date()))}
                className="h-9 text-xs font-bold rounded-xl"
              >
                Current Week
              </Button>
            </div>
          </Card>

          {/* Weekly Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Team Hours (Week)</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{weeklyStats.totalHours} hrs</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Contributors</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{weeklyStats.activeMembers} Members</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Average Hours / Employee</span>
                <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{weeklyStats.avgHoursPerPerson} hrs / week</span>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Matrix Table */}
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Weekly Attendance Schedule Grid
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Day-by-day worked hours and check-in timeline for each employee
              </p>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border">
                    <TableHead className="px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider min-w-[200px]">Employee</TableHead>
                    {weekDays.map((w) => (
                      <TableHead key={w.dateStr} className={cn("px-3 py-3 font-bold text-xs uppercase tracking-wider text-center min-w-[110px]", w.isToday && "bg-orange-500/10 text-orange-600 dark:text-orange-400")}>
                        <div>{w.shortLabel}</div>
                        <div className="text-[10px] font-normal text-muted-foreground">{w.date.getDate()} {w.date.toLocaleDateString('en-US', { month: 'short' })}</div>
                      </TableHead>
                    ))}
                    <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right min-w-[120px]">Weekly Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyMatrix.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-sm font-semibold text-muted-foreground">
                        No attendance activity found for this week.
                      </TableCell>
                    </TableRow>
                  ) : (
                    weeklyMatrix.map((u) => {
                      const totalHrs = (u.totalMinutes / 60).toFixed(1);
                      return (
                        <TableRow 
                          key={u.userId}
                          onClick={() => setSelectedUserForCalendar({
                            id: u.userId,
                            name: u.userName,
                            email: u.userEmail,
                            role: u.userRole,
                            department: u.department
                          })}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/60"
                        >
                          <TableCell className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 rounded-lg border border-border bg-muted shrink-0">
                                <AvatarFallback className="text-xs font-bold text-muted-foreground">
                                  {u.userName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground truncate text-sm">{u.userName}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{u.userRole}</span>
                              </div>
                            </div>
                          </TableCell>

                          {weekDays.map((w) => {
                            const rec = u.days[w.dateStr];
                            const isToday = w.isToday;
                            const isSunday = w.date.getDay() === 0;

                            if (!rec) {
                              return (
                                <TableCell key={w.dateStr} className={cn("px-2 py-3 text-center text-xs text-muted-foreground/50", isToday && "bg-orange-500/5")}>
                                  {isSunday ? <span className="text-[10px] font-semibold text-muted-foreground/30">Weekend</span> : <span>&mdash;</span>}
                                </TableCell>
                              );
                            }

                            const isActive = rec.attendanceStatus === 'ACTIVE';
                            const isMissed = rec.attendanceStatus === 'MISSED_CHECKOUT';
                            const hrs = (rec.workedMinutes / 60).toFixed(1);

                            return (
                              <TableCell key={w.dateStr} className={cn("px-2 py-3 text-center", isToday && "bg-orange-500/5")}>
                                {isActive ? (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-bold px-1.5 py-0.5 animate-pulse">
                                    Working
                                  </Badge>
                                ) : isMissed ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-bold px-1.5 py-0.5">
                                    Absent
                                  </Badge>
                                ) : (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                                      {hrs} hrs
                                    </Badge>
                                    <span className="text-[9px] text-muted-foreground font-mono">
                                      {formatTime(rec.checkInTime).slice(0, 5)} - {formatTime(rec.checkOutTime).slice(0, 5)}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}

                          <TableCell className="px-4 py-3.5 text-right font-black text-sm whitespace-nowrap">
                            <span className={u.totalMinutes >= 40 * 60 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}>
                              {totalHrs} hrs
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MONTHLY SUMMARY VIEW                                */}
      {/* ========================================================= */}
      {activeTab === 'monthly' && (
        <div className="space-y-5">
          {/* Monthly Selector Bar */}
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shiftMonth(-1)}
                  className="h-9 w-9 p-0 rounded-xl"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 font-bold text-sm sm:text-base px-2">
                  <CalendarDays className="h-4 w-4 text-emerald-500" />
                  <span>{monthLabel}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shiftMonth(1)}
                  className="h-9 w-9 p-0 rounded-xl"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth(now.getMonth() + 1);
                  setSelectedYear(now.getFullYear());
                }}
                className="h-9 text-xs font-bold rounded-xl"
              >
                Current Month
              </Button>
            </div>
          </Card>

          {/* Monthly Summary Table */}
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Monthly Performance & Attendance Ledger ({monthLabel})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aggregate working days, attendance percentage, and total hours logged
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border">
                    <TableHead className="px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Employee</TableHead>
                    <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-center">Days Present</TableHead>
                    <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-center">Days Missed</TableHead>
                    <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-center">Total Hours</TableHead>
                    <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-center">Avg Hours/Day</TableHead>
                    <TableHead className="px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-center">Attendance %</TableHead>
                    <TableHead className="px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right">Calendar Heatmap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm font-semibold text-muted-foreground">
                        No attendance records for {monthLabel}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlySummary.map((u) => (
                      <TableRow 
                        key={u.userId}
                        className="hover:bg-muted/50 transition-colors border-b border-border/60"
                      >
                        <TableCell className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-lg border border-border bg-muted shrink-0">
                              <AvatarFallback className="text-xs font-bold text-muted-foreground">
                                {u.userName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground truncate text-sm">{u.userName}</span>
                                <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 uppercase">
                                  {u.userRole}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {u.userEmail} {u.department ? `• ${u.department}` : ''}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-center font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {u.presentCount} Days
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-center font-bold text-sm text-rose-500">
                          {u.missedCount} Days
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-center font-black text-sm text-foreground">
                          {u.totalHours} hrs
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-center font-semibold text-xs text-muted-foreground">
                          {u.avgHoursPerDay}h / day
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  u.attendanceRate >= 90 ? "bg-emerald-500" : u.attendanceRate >= 75 ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${u.attendanceRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold">{u.attendanceRate}%</span>
                          </div>
                        </TableCell>

                        <TableCell className="px-5 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUserForCalendar({
                              id: u.userId,
                              name: u.userName,
                              email: u.userEmail,
                              role: u.userRole,
                              department: u.department
                            })}
                            className="h-8 px-3 text-xs font-bold rounded-xl border-border hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-600 transition-all"
                          >
                            <Calendar className="h-3.5 w-3.5 mr-1 text-orange-500" />
                            View Heatmap
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ALL RECORDS / RAW LOGS VIEW                         */}
      {/* ========================================================= */}
      {activeTab === 'all' && (
        <div className="space-y-5">
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Sessions</span>
                <span className="text-2xl sm:text-3xl font-black text-foreground">{stats.total}</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Now</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed Sessions</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{stats.completed}</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Absent</span>
                <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{stats.absent}</span>
              </CardContent>
            </Card>
          </div>

          {/* Filter Toolbar */}
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 px-3 rounded-xl border-input bg-muted/40 text-xs font-bold text-foreground w-[130px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="MISSED_CHECKOUT">Absent</SelectItem>
                  </SelectContent>
                </Select>

                {/* Role Filter */}
                {isAdminOrManager && (
                  <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9 px-3 rounded-xl border-input bg-muted/40 text-xs font-bold text-foreground w-[140px]">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="manager">Managers</SelectItem>
                      <SelectItem value="intern">Interns / Employees</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Date Range Filter */}
                <Select value={dateFilter} onValueChange={(val) => { setDateFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 px-3 rounded-xl border-input bg-muted/40 text-xs font-bold text-foreground w-[130px]">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                {(statusFilter !== 'all' || roleFilter !== 'all' || dateFilter !== 'all' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setRoleFilter('all');
                      setDateFilter('all');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="h-9 text-xs font-bold"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Main Historical Table */}
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Complete Attendance Log Entries ({filteredAllRecords.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing page {currentPage} of {totalPages}
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mb-3" />
                  <p className="text-sm font-semibold">Loading attendance logs...</p>
                </div>
              ) : paginatedAllRecords.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-center px-4">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-base font-bold text-foreground">No attendance logs found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Try adjusting your search criteria or date filters.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border">
                      <TableHead className="px-5 py-3.5 font-bold text-muted-foreground text-xs uppercase tracking-wider">Employee / User</TableHead>
                      <TableHead className="px-3.5 py-3.5 font-bold text-muted-foreground text-xs uppercase tracking-wider">Session Date</TableHead>
                      <TableHead className="px-3.5 py-3.5 font-bold text-muted-foreground text-xs uppercase tracking-wider">Check In</TableHead>
                      <TableHead className="px-3.5 py-3.5 font-bold text-muted-foreground text-xs uppercase tracking-wider">Check Out</TableHead>
                      <TableHead className="px-3.5 py-3.5 font-bold text-muted-foreground text-xs uppercase tracking-wider">Worked Duration</TableHead>
                      <TableHead className="px-4 py-3.5 font-bold text-muted-foreground text-xs uppercase tracking-wider text-left">IP & Location</TableHead>
                      <TableHead className="px-3.5 py-3.5 font-bold text-muted-foreground text-xs uppercase tracking-wider text-center">Location Access</TableHead>
                      <TableHead className="px-3.5 py-3.5 font-bold text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAllRecords.map((rec) => {
                      const isMissed = rec.attendanceStatus === 'MISSED_CHECKOUT';
                      const isActive = rec.attendanceStatus === 'ACTIVE';
                      const isCompleted = rec.attendanceStatus === 'COMPLETED';

                      return (
                        <TableRow 
                          key={rec.id} 
                          onClick={() => setSelectedUserForCalendar({
                            id: rec.userId,
                            name: rec.userName || 'Employee',
                            email: rec.userEmail || '',
                            role: rec.userRole || 'employee',
                            department: rec.department
                          })}
                          className="cursor-pointer transition-colors hover:bg-muted/50 group border-b border-border/60"
                        >
                          <TableCell className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg border border-border bg-muted shrink-0">
                                <AvatarFallback className="text-xs font-bold text-muted-foreground">
                                  {(rec.userName || 'E').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                                    {rec.userName}
                                    <Calendar className="h-3 w-3 text-primary opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                                  </span>
                                  <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 uppercase border">
                                    {rec.userRole}
                                  </Badge>
                                </div>
                                <span className="text-[11px] text-muted-foreground group-hover:text-foreground truncate transition-colors">
                                  {rec.userEmail} {rec.department ? `• ${rec.department}` : ''}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-xs font-medium whitespace-nowrap">
                            <span className="text-foreground">{formatDate(rec.checkInTime)}</span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-xs font-medium whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <PlayCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="text-foreground">{formatTime(rec.checkInTime)}</span>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-xs font-medium whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-foreground">{formatTime(rec.checkOutTime)}</span>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap">
                            <span className={isMissed ? "text-destructive font-bold" : isActive ? "text-emerald-500 font-bold" : "text-foreground"}>
                              {rec.workedHours || '0h 0m'}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3.5 whitespace-nowrap text-left">
                            <div className="flex flex-col items-start gap-1">
                              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium bg-muted text-foreground px-2.5 py-1 rounded-md border border-border shadow-2xs">
                                <Wifi className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{rec.ipAddress || '192.168.1.54'}</span>
                              </div>
                              {rec.latitude && rec.longitude ? (
                                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                                  <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  <span>{getCityFromCoordinates(rec.latitude, rec.longitude)}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Office Premise</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="px-3.5 py-3.5 whitespace-nowrap text-center">
                            {rec.latitude !== null && rec.latitude !== undefined && rec.longitude !== null && rec.longitude !== undefined ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span>Granted</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                                <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>Verified</span>
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="px-3.5 py-3.5 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border",
                                isMissed
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : isActive
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 animate-pulse"
                                    : "bg-primary/10 text-primary border-primary/30"
                              )}
                            >
                              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />}
                              {isActive ? 'ACTIVE' : isMissed ? 'ABSENT' : 'COMPLETED'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-muted-foreground font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAllRecords.length)} of {filteredAllRecords.length} records
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 rounded-lg font-bold"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="font-bold text-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 rounded-lg font-bold"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* User Attendance Calendar & GitHub Heatmap Modal */}
      <UserAttendanceHeatmapModal
        isOpen={Boolean(selectedUserForCalendar)}
        onClose={() => setSelectedUserForCalendar(null)}
        user={selectedUserForCalendar}
        initialRecords={records}
      />
    </div>
  );
}
