import React, { useEffect, useState, useMemo } from 'react';
import { 
  Clock, Calendar, Search, X, Download, RefreshCw, 
  CheckCircle2, PlayCircle, ShieldAlert, Wifi, Globe, 
  Filter, User, ChevronLeft, ChevronRight, Activity, ArrowUpDown, MapPin
} from 'lucide-react';
import { getBrowserCoordinates } from '@/lib/geo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

export default function AttendanceLogs() {
  const { user } = useUser();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCheckInOutSubmitting, setIsCheckInOutSubmitting] = useState(false);
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
      const res = await api.get('/attendance/history');
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

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const active = records.filter(r => r.attendanceStatus === 'ACTIVE').length;
    const completed = records.filter(r => r.attendanceStatus === 'COMPLETED').length;
    const absent = records.filter(r => r.attendanceStatus === 'MISSED_CHECKOUT' || r.attendanceStatus === 'ABSENT').length;
    return { total, active, completed, absent };
  }, [records]);

  // Date formatter helpers
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

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // 1. Search Query (Name, Email, IP)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (rec.userName || '').toLowerCase().includes(q);
        const matchEmail = (rec.userEmail || '').toLowerCase().includes(q);
        const matchIp = isAdminOrManager && (rec.ipAddress || '').toLowerCase().includes(q);
        const matchDept = (rec.department || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchIp && !matchDept) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && rec.attendanceStatus !== statusFilter) {
        return false;
      }

      // 3. Role Filter
      if (roleFilter !== 'all' && rec.userRole !== roleFilter) {
        return false;
      }

      // 4. Date Filter
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
  }, [records, searchQuery, statusFilter, roleFilter, dateFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records available to export.');
      return;
    }

    const headers = [
      'Employee Name',
      'Email',
      'Role',
      'Department',
      'Date',
      'Check In',
      'Check Out',
      'Duration',
      'Max Policy Limit (Hours)',
      'Status',
      ...(isAdminOrManager ? ['Exact IP Address'] : []),
      'Reason'
    ];

    const rows = filteredRecords.map(r => [
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
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_logs_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Attendance logs exported successfully!');
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-orange-500" />
            Attendance Logs
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of employee check-in timelines, worked duration, and exact IP addresses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Check-in/Check-out button */}
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

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Sessions</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.total}</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Now</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed Sessions</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{stats.completed}</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Absent</span>
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{stats.absent}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name, email, or exact IP address..."
              className="pl-9 pr-8 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer w-full sm:w-auto flex-1 sm:flex-none min-w-[120px]"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED_CHECKOUT">Absent</option>
            </select>

            {/* Role Filter (Managers/Admins) */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer w-full sm:w-auto flex-1 sm:flex-none min-w-[120px]"
              >
                <option value="all">All Roles</option>
                <option value="manager">Managers</option>
                <option value="intern">Interns / Employees</option>
              </select>
            )}

            {/* Date Range Filter */}
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer w-full sm:w-auto flex-1 sm:flex-none min-w-[120px]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Clear Filter button */}
            {(searchQuery || statusFilter !== 'all' || roleFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                  setDateFilter('all');
                  setCurrentPage(1);
                }}
                className="h-10 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Log Entries ({filteredRecords.length})
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing page {currentPage} of {totalPages}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mb-3" />
              <p className="text-sm font-semibold">Loading attendance logs...</p>
            </div>
          ) : paginatedRecords.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center px-4">
              <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">No attendance logs found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Try adjusting your search criteria or date filters. New check-in sessions will appear here automatically.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[850px] text-sm text-left">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-black">Employee / User</th>
                  <th className="px-3.5 py-3.5 font-black">Session Date</th>
                  <th className="px-3.5 py-3.5 font-black">Check In</th>
                  <th className="px-3.5 py-3.5 font-black">Check Out</th>
                  <th className="px-3.5 py-3.5 font-black">Worked Duration</th>
                  <th className="px-3.5 py-3.5 font-black">Status</th>
                  {isAdminOrManager && (
                    <th className="px-4 py-3.5 font-black text-left">Connected IP & Location</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedRecords.map((rec) => {
                  const isMissed = rec.attendanceStatus === 'MISSED_CHECKOUT';
                  const isActive = rec.attendanceStatus === 'ACTIVE';
                  const isCompleted = rec.attendanceStatus === 'COMPLETED';

                  const initials = (rec.userName || 'E')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr 
                      key={rec.id} 
                      onClick={() => setSelectedUserForCalendar({
                        id: rec.userId,
                        name: rec.userName || 'Employee',
                        email: rec.userEmail || '',
                        role: rec.userRole || 'employee',
                        department: rec.department
                      })}
                      className="cursor-pointer transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/40 group"
                      title="Click to open attendance calendar & heatmap"
                    >
                      {/* User Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0">
                            <AvatarFallback className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white truncate text-sm group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                                {rec.userName}
                                <Calendar className="h-3 w-3 text-sky-500 dark:text-sky-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                              </span>
                              <Badge 
                                variant="outline"
                                className={cn(
                                  "text-[9px] font-black px-1.5 py-0 uppercase border",
                                  rec.userRole === 'manager'
                                    ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                                    : rec.userRole === 'admin'
                                      ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                      : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                )}
                              >
                                {rec.userRole === 'manager' ? 'MGR' : rec.userRole === 'admin' ? 'ADM' : 'EMP'}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 truncate transition-colors">
                              {rec.userEmail} {rec.department ? `• ${rec.department}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap">
                        <span className="text-slate-700 dark:text-slate-200 dark:group-hover:text-white transition-colors">
                          {formatDate(rec.checkInTime)}
                        </span>
                      </td>

                      {/* Check-In */}
                      <td className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PlayCircle className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-200 dark:group-hover:text-white transition-colors">
                            {formatTime(rec.checkInTime)}
                          </span>
                        </div>
                      </td>

                      {/* Check-Out */}
                      <td className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 dark:group-hover:text-slate-300 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-200 dark:group-hover:text-white transition-colors">
                            {formatTime(rec.checkOutTime)}
                          </span>
                        </div>
                      </td>

                      {/* Worked Duration */}
                      <td className="px-4 py-3.5 text-xs font-bold whitespace-nowrap">
                        <span className={isMissed ? "text-rose-600 dark:text-rose-400" : isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white dark:group-hover:text-white"}>
                          {rec.workedHours || '0h 0m'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 ml-1 font-normal dark:group-hover:text-slate-300">
                          (Max: {rec.configuredWorkingHours || 9}h)
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {(() => {
                          const targetMinutes = (rec.configuredWorkingHours || 9) * 60;
                          const isTargetReached = (rec.workedMinutes || 0) >= targetMinutes;
                          
                          let badgeText = rec.statusDisplay || rec.attendanceStatus;
                          if (isMissed) {
                            badgeText = 'ABSENT';
                          } else if (isActive) {
                            badgeText = 'ACTIVE';
                          } else if (isCompleted) {
                            badgeText = isTargetReached ? 'COMPLETED' : (rec.workedHours || `${Math.floor((rec.workedMinutes || 0) / 60)}h ${(rec.workedMinutes || 0) % 60}m`);
                          }

                          return (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-black tracking-wider px-2 py-0.5 border",
                                isMissed
                                  ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                  : isActive
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 animate-pulse"
                                    : isTargetReached
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                      : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              )}
                            >
                              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />}
                              {badgeText}
                            </Badge>
                          );
                        })()}
                        {isMissed && (
                          <p className="text-[10px] text-rose-400 mt-1 max-w-xs truncate" title={rec.invalidReason || "Forgot to checkout within maximum working hours + 1 extra hour."}>
                            {rec.invalidReason || "Absent - Forgot to checkout within working hours (+1 hour extra window)."}
                          </p>
                        )}
                      </td>

                      {/* Connected IP & Location (Admin & Manager Only) */}
                      {isAdminOrManager && (
                        <td className="px-4 py-3.5 whitespace-nowrap text-left">
                          <div className="flex flex-col items-start gap-1">
                            {rec.ipAddress ? (
                              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                                <Wifi className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span>{rec.ipAddress}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono italic">No IP recorded</span>
                            )}
                            {rec.latitude && rec.longitude ? (
                              <div 
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400" 
                                title={`GPS Coordinates: ${rec.latitude}, ${rec.longitude}`}
                              >
                                <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                                <span>{rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                                <MapPin className="h-3 w-3 text-slate-400 opacity-60 shrink-0" />
                                <span>Office Network</span>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>

        {/* Table Footer / Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-lg font-bold border-slate-200 dark:border-slate-800"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="font-bold text-slate-700 dark:text-slate-300 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-lg font-bold border-slate-200 dark:border-slate-800"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

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
