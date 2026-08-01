import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  UploadCloud,
  Send,
  Save,
  MessageSquare,
  Calendar as CalendarIcon,
  Users,
  Loader2,
  Mail,
  MoreVertical,
  Check,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { LeaveCalendar } from '@/components/dashboard/LeaveCalendar';
import { LeaveApplicationWithDrafts } from '@/components/dashboard/LeaveApplicationWithDrafts';
import LeaveRequestDialog from '../components/LeaveRequestDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';
import api from '@/lib/api';

// 9. Mock Data
const MOCK_LEAVES: any[] = [];

const leaveBalance = {
  casual: { total: 10, used: 2, remaining: 8 },
  sick: { total: 6, used: 2, remaining: 4 },
  overall: { total: 16, used: 4, remaining: 12 }
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const mapBackendLeave = (l: any) => {
  const start = l.startDate ? l.startDate.split('T')[0] : '';
  const end = l.endDate ? l.endDate.split('T')[0] : '';

  const diffTime = l.startDate && l.endDate ? Math.abs(new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) : 0;
  const diffDays = l.startDate && l.endDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 : 1;

  return {
    id: l.id,
    userId: l.userId || l.user?.id || '',
    role: l.user?.role || 'employee',
    employee: l.user?.name || "Unassigned",
    avatar: l.user?.avatarUrl || '',
    department: l.user?.department || "General",
    type: l.type === 'Casual' ? 'Casual Leave' : l.type === 'Sick' ? 'Sick Leave' : l.type === 'Unpaid' ? 'Emergency Leave' : l.type,
    start: start,
    end: end,
    appliedOn: l.createdAt ? l.createdAt.split('T')[0] : '',
    reason: l.reason,
    status: l.status === 'Approved' ? 'Approved' as const : l.status === 'Rejected' ? 'Rejected' as const : 'Pending' as const,
    days: diffDays,
    hrNotified: l.status === 'Approved'
  };
};

export default function LeaveManagement() {
  const { user } = useUser();
  const role = user?.role || 'manager';
  const isManager = role === 'manager' || role === 'admin';
  const isAdmin = role === 'admin';
  const [adminViewRole, setAdminViewRole] = useState<'MANAGER' | 'ALL' | 'EMPLOYEE'>('ALL');

  useEffect(() => {
    if (isAdmin) {
      setAdminViewRole('ALL');
    }
  }, [isAdmin]);

  const [activeTab, setActiveTab] = useState(isManager ? 'requests' : 'apply');
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({
    casual: { total: 12, used: 0, remaining: 12 },
    sick: { total: 6, used: 0, remaining: 6 },
    overall: { total: 18, used: 0, remaining: 18 }
  });
  const [monthlyOverviewState, setMonthlyOverviewState] = useState<any | null>(null);

  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves');
      if (res.data?.success) {
        const raw = res.data.data || [];
        setLeaveData(raw.map(mapBackendLeave));
      }
    } catch (e) {
      console.error("Failed to fetch leaves:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveSummary = async () => {
    try {
      const res = await api.get('/leaves/summary');
      if (res.data?.success) {
        const stats = res.data.data || {};
        if (stats.monthlyOverview) {
          setMonthlyOverviewState(stats.monthlyOverview);
        }
        if (stats.balance) {
          const b = stats.balance;
          setBalances({
            casual: {
              total: Number(b.casual.total || 12),
              used: Number(b.casual.used || 0),
              remaining: Number(b.casual.remaining || 0),
            },
            sick: {
              total: Number(b.sick.total || 6),
              used: Number(b.sick.used || 0),
              remaining: Number(b.sick.remaining || 0),
            },
            overall: {
              total: Number(b.overall.total || 18),
              used: Number(b.overall.used || 0),
              remaining: Number(b.overall.remaining || 0),
            },
          });
        } else {
          const sickUsed = Number(stats.Sick || 0);
          const casualUsed = Number(stats.Casual || 0) + Number(stats.Earned || 0);
          const overallUsed = sickUsed + casualUsed;

          setBalances({
            casual: { total: 12, used: casualUsed, remaining: Math.max(0, 12 - casualUsed) },
            sick: { total: 6, used: sickUsed, remaining: Math.max(0, 6 - sickUsed) },
            overall: { total: 18, used: overallUsed, remaining: Math.max(0, 18 - overallUsed) }
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch leave summary:", e);
    }
  };

  const [selectedOverviewEmployee, setSelectedOverviewEmployee] = useState<string>('ALL');

  const overviewEmployees = useMemo(() => {
    const names = new Set<string>();
    leaveData.forEach((l: any) => {
      if (isAdmin) {
        if (adminViewRole === 'MANAGER' && l.role !== 'manager') return;
        if (adminViewRole === 'EMPLOYEE' && (l.role === 'manager' || l.role === 'admin')) return;
      } else if (isManager) {
        if (l.role === 'manager' || l.role === 'admin') return;
      }

      if (l.employee && l.employee !== 'Unassigned') {
        names.add(l.employee);
      }
    });
    return Array.from(names);
  }, [leaveData, isAdmin, isManager, adminViewRole]);

  const monthlyOverview = useMemo(() => {
    if (selectedOverviewEmployee === 'ALL' && monthlyOverviewState && leaveData.length === 0) {
      return monthlyOverviewState;
    }

    const currentYM = format(new Date(), 'yyyy-MM');
    const createStats = () => ({
      requestsThisMonth: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalDaysTakenThisMonth: 0,
    });
    const overview = {
      overall: createStats(),
      casual: createStats(),
      sick: createStats(),
      emergency: createStats(),
    };

    leaveData.forEach((leave: any) => {
      const isThisMonth = (leave.appliedOn && leave.appliedOn.startsWith(currentYM)) ||
                          (leave.start && leave.start.startsWith(currentYM));
      if (!isThisMonth) return;

      if (isAdmin) {
        if (adminViewRole === 'MANAGER' && leave.role !== 'manager') return;
        if (adminViewRole === 'EMPLOYEE' && (leave.role === 'manager' || leave.role === 'admin')) return;
      } else if (isManager) {
        if (leave.role === 'manager' || leave.role === 'admin') return;
      }

      if (selectedOverviewEmployee !== 'ALL' && leave.employee !== selectedOverviewEmployee) {
        return;
      }

      let key: 'casual' | 'sick' | 'emergency' = 'casual';
      if (leave.type === 'Sick Leave' || leave.type === 'Sick') key = 'sick';
      else if (leave.type === 'Emergency Leave' || leave.type === 'Unpaid' || leave.type === 'Earned') key = 'emergency';

      overview[key].requestsThisMonth++;
      if (leave.status === 'Approved') {
        overview[key].approved++;
        overview[key].totalDaysTakenThisMonth += (leave.days || 0);
      } else if (leave.status === 'Pending') {
        overview[key].pending++;
      } else if (leave.status === 'Rejected') {
        overview[key].rejected++;
      }

      overview.overall.requestsThisMonth++;
      if (leave.status === 'Approved') {
        overview.overall.approved++;
        overview.overall.totalDaysTakenThisMonth += (leave.days || 0);
      } else if (leave.status === 'Pending') {
        overview.overall.pending++;
      } else if (leave.status === 'Rejected') {
        overview.overall.rejected++;
      }
    });

    return overview;
  }, [leaveData, monthlyOverviewState, selectedOverviewEmployee, isAdmin, isManager, adminViewRole]);

  const employeeWiseOverview = useMemo(() => {
    const currentYM = format(new Date(), 'yyyy-MM');
    const map: Record<string, {
      employee: string;
      avatar: string;
      department: string;
      role: string;
      total: number;
      approved: number;
      pending: number;
      rejected: number;
      days: number;
      casual: number;
      sick: number;
      emergency: number;
    }> = {};

    leaveData.forEach((leave: any) => {
      const isThisMonth = (leave.appliedOn && leave.appliedOn.startsWith(currentYM)) ||
                          (leave.start && leave.start.startsWith(currentYM));
      if (!isThisMonth) return;

      if (isAdmin) {
        if (adminViewRole === 'MANAGER' && leave.role !== 'manager') return;
        if (adminViewRole === 'EMPLOYEE' && (leave.role === 'manager' || leave.role === 'admin')) return;
      } else if (isManager) {
        if (leave.role === 'manager' || leave.role === 'admin') return;
      }

      const emp = leave.employee || 'Unknown';
      if (!map[emp]) {
        map[emp] = {
          employee: emp,
          avatar: leave.avatar || '',
          department: leave.department || 'General',
          role: leave.role || 'employee',
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          days: 0,
          casual: 0,
          sick: 0,
          emergency: 0,
        };
      }

      map[emp].total++;
      if (leave.status === 'Approved') {
        map[emp].approved++;
        map[emp].days += (leave.days || 0);
      } else if (leave.status === 'Pending') {
        map[emp].pending++;
      } else if (leave.status === 'Rejected') {
        map[emp].rejected++;
      }

      if (leave.type === 'Sick Leave' || leave.type === 'Sick') map[emp].sick++;
      else if (leave.type === 'Emergency Leave' || leave.type === 'Unpaid' || leave.type === 'Earned') map[emp].emergency++;
      else map[emp].casual++;
    });

    return Object.values(map);
  }, [leaveData, isAdmin, isManager, adminViewRole]);

  // Sync tab with URL and check for selected request ID
  useEffect(() => {
    const handleRouteAndParams = () => {
      const path = window.location.pathname;
      if (path === '/manager/leave-management') {
        setActiveTab('requests');
      } else if (path === '/employee/leave') {
        setActiveTab('history');
      }

      // Check for selected leave request from notification
      const targetId = localStorage.getItem('selected_leave_request_id');
      if (targetId) {
        localStorage.removeItem('selected_leave_request_id');
        setHighlightedRequestId(targetId);
        // We will match it in leaveData once loaded
      }
    };

    window.addEventListener('popstate', handleRouteAndParams);
    handleRouteAndParams();
    fetchLeaves();
    fetchLeaveSummary();

    return () => {
      window.removeEventListener('popstate', handleRouteAndParams);
    };
  }, []);

  useEffect(() => {
    if (highlightedRequestId && leaveData.length > 0) {
      const foundReq = leaveData.find((l: any) => String(l.id) === String(highlightedRequestId) && l.status === 'Pending');
      if (foundReq) {
        setSelectedRequest(foundReq);
        setIsRequestDialogOpen(true);
        setHighlightedRequestId(null);
      }
    }
  }, [leaveData, highlightedRequestId]);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Comment Modal State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Leave Request Dialog State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  // 2. Email Notification Placeholder Flow - Loading States
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const onSubmitLeave = (leave: {
    type: string;
    emergencyContact: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    const typeMapping: Record<string, string> = {
      casual: "Casual",
      sick: "Sick",
      wfh: "Casual",
      half: "Casual",
      emergency: "Unpaid"
    };

    const type = typeMapping[leave.type] || "Casual";

    api.post('/leaves', {
      type,
      startDate: new Date(leave.startDate).toISOString(),
      endDate: new Date(leave.endDate).toISOString(),
      reason: leave.reason
    }).then((res: any) => {
      if (res.data?.success) {
        toast.success("Leave Applied Successfully", {
          description: isManager ? 'Awaiting admin approval.' : 'Awaiting manager approval.'
        });
        fetchLeaves();
        fetchLeaveSummary();
      }
    }).catch((err: any) => {
      toast.error("Application Failed", { description: err.response?.data?.message || err.message });
    });

    return true;
  };

  const handleApprove = async (id: string) => {
    const leaveObj = leaveData.find((l: any) => l.id === id);
    if (!leaveObj) return;

    setApprovingId(id);
    try {
      const res = await api.patch(`/leaves/${id}/status`, { status: 'Approved' });
      if (res.data?.success) {
        toast.success('Leave Approved Successfully.', {
          description: 'HR has been notified via email.'
        });
        fetchLeaves();
        fetchLeaveSummary();
      }
    } catch (err: any) {
      toast.error('Approval failed', { description: err.response?.data?.message || err.message });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const leaveObj = leaveData.find((l: any) => l.id === id);
    if (!leaveObj) return;

    setRejectingId(id);
    try {
      const res = await api.patch(`/leaves/${id}/status`, { status: 'Rejected' });
      if (res.data?.success) {
        toast.error('Leave Rejected', {
          description: 'Employee has been notified.'
        });
        fetchLeaves();
        fetchLeaveSummary();
      }
    } catch (err: any) {
      toast.error('Rejection failed', { description: err.response?.data?.message || err.message });
    } finally {
      setRejectingId(null);
    }
  };

  const openCommentModal = (id: string) => {
    setActiveRequestId(id);
    setCommentText('');
    setCommentModalOpen(true);
  };

  const submitComment = () => {
    setCommentModalOpen(false);
    setHighlightedRequestId(null);
    toast.success('Comment saved.');

    // Add comment notification for the employee
    const req = leaveData.find((l: any) => l.id === activeRequestId);
    if (req) {
      const newEmpNotification = {
        id: Date.now(),
        category: 'Leave Management',
        icon: '💬',
        title: 'Leave Commented',
        message: `Manager commented on your leave request for ${req.start}`,
        time: 'Just now',
        unread: true,
        group: 'Today',
        metadata: {
          type: 'leave_commented',
          date: req.start
        }
      };
      const savedEmpNotifications = localStorage.getItem('hindustaan_employee_notifications');
      let empNotifications = [];
      if (savedEmpNotifications) {
        try { empNotifications = JSON.parse(savedEmpNotifications); } catch (e) { }
      }
      localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifications]));
      window.dispatchEvent(new Event('employee-notifications-updated'));
      window.dispatchEvent(new Event('notifications-updated'));
    }
  };

  // Selected date leaves
  const selectedDateLeaves = selectedDate ? leaveData.filter((l: any) => {
    if (l.status === 'Rejected') return false;
    const start = parseLocalDate(l.start);
    const end = parseLocalDate(l.end);
    end.setHours(23, 59, 59, 999);
    return selectedDate >= start && selectedDate <= end;
  }) : [];

  // Statistics
  const pendingRequestsCount = leaveData.filter((l: any) => l.status === 'Pending').length;
  const approvedThisMonthCount = leaveData.filter((l: any) => l.status === 'Approved' && new Date(l.appliedOn).getMonth() === new Date().getMonth()).length;

  const todayLeavesCount = leaveData.filter((l: any) => {
    if (l.status !== 'Approved') return false;
    const start = parseLocalDate(l.start);
    const end = parseLocalDate(l.end);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    return now >= start && now <= end;
  }).length;

  const upcomingLeavesCount = leaveData.filter((l: any) => l.status === 'Approved' && parseLocalDate(l.start) > new Date()).length;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20 w-full p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Leave Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Manage your leaves, view history, and team availability.
        </p>
      </div>

      {isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-linear-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 backdrop-blur-xl shadow-sm border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20 shrink-0">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-wider truncate">Pending Requests</p>
                <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{pendingRequestsCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 backdrop-blur-xl shadow-sm border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider truncate">Approved This Month</p>
                <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{approvedThisMonthCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-linear-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10 backdrop-blur-xl shadow-sm border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20 shrink-0">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-purple-700/70 dark:text-purple-400/70 uppercase tracking-wider truncate">On Leave Today</p>
                <p className="text-2xl font-black text-purple-900 dark:text-purple-100">{todayLeavesCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-linear-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10 backdrop-blur-xl shadow-sm border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 shrink-0">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-blue-700/70 dark:text-blue-400/70 uppercase tracking-wider truncate">Upcoming Leaves</p>
                <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{upcomingLeavesCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full max-w-4xl flex flex-col sm:flex-row h-auto items-stretch sm:items-center gap-1 sm:gap-0">
          {!isManager ? (
            <>
              <TabsTrigger value="apply" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Apply Leave</TabsTrigger>
              <TabsTrigger value="history" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">My History</TabsTrigger>
            </>
          ) : isAdmin ? (
            <>
              <TabsTrigger value="requests" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">All Leave Requests</TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Team Calendar</TabsTrigger>
              <TabsTrigger value="balance" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Leave Overview</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="apply" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Apply Leave</TabsTrigger>
              <TabsTrigger value="history" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">My History</TabsTrigger>
              <TabsTrigger value="requests" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Team Leave Requests</TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Team Calendar</TabsTrigger>
              <TabsTrigger value="balance" className="flex-1 w-full sm:w-auto justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Leave Overview</TabsTrigger>
            </>
          )}
        </TabsList>

        <div className="mt-8">
          {/* Employee: Apply Leave */}
          <TabsContent value="apply">
            <LeaveApplicationWithDrafts onSubmitLeave={onSubmitLeave} role={role} />
          </TabsContent>

          {/* Employee: My History */}
          <TabsContent value="history">
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-xl font-bold">Leave History</CardTitle>
                <CardDescription>Track the status of your past and upcoming leaves.</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto p-4 md:p-6">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-xs text-slate-500 font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <tr>
                      <th className="px-6 py-4 rounded-l-xl">Applied On</th>
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Days</th>
                      <th className="px-6 py-4 text-right rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaveData
                      .filter((leave: any) => String(leave.userId) === String(user?.id) || leave.employee === user?.name)
                      .map((leave: any) => (
                      <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                        <td className="px-6 py-5 font-semibold text-slate-600 dark:text-slate-400">{leave.appliedOn}</td>
                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          {leave.type}
                        </td>
                        <td className="px-6 py-5 font-semibold text-slate-600 dark:text-slate-400">
                          {leave.start} <span className="text-slate-400 mx-1">→</span> {leave.end}
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-white">{leave.days}</td>
                        <td className="px-6 py-5 text-right">
                          {leave.status === 'Pending' && <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 px-3 py-1 text-xs font-bold shadow-sm">Pending</Badge>}
                          {leave.status === 'Approved' && <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 px-3 py-1 text-xs font-bold shadow-sm">Approved</Badge>}
                          {leave.status === 'Rejected' && <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50 px-3 py-1 text-xs font-bold shadow-sm">Rejected</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Monthly Leave Overview (Unpaid Leave System - Current Month Only) */}
          {isManager && (
            <TabsContent value="balance">
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Header Banner */}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Current Month Only • Unpaid Leave System
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {selectedOverviewEmployee === 'ALL'
                        ? `Leave Overview (${format(new Date(), 'MMMM yyyy')})`
                        : `${selectedOverviewEmployee} — Leave Overview (${format(new Date(), 'MMMM yyyy')})`}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      {selectedOverviewEmployee === 'ALL'
                        ? 'Real-time monthly leave request statistics and approval status distribution across all employees.'
                        : `Viewing unpaid leave request statistics and approval status for ${selectedOverviewEmployee}.`}
                    </p>
                  </div>

                  {isManager && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {isAdmin && (
                        <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminViewRole('ALL');
                              setSelectedOverviewEmployee('ALL');
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              adminViewRole === 'ALL'
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                                : "text-zinc-400 hover:text-white"
                            )}
                          >
                            All (Managers & Interns)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminViewRole('MANAGER');
                              setSelectedOverviewEmployee('ALL');
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              adminViewRole === 'MANAGER'
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                                : "text-zinc-400 hover:text-white"
                            )}
                          >
                            Managers Only
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminViewRole('EMPLOYEE');
                              setSelectedOverviewEmployee('ALL');
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              adminViewRole === 'EMPLOYEE'
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                                : "text-zinc-400 hover:text-white"
                            )}
                          >
                            Interns Only
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedOverviewEmployee}
                          onValueChange={setSelectedOverviewEmployee}
                        >
                          <SelectTrigger className="w-[240px] bg-white/5 border-white/15 text-white font-semibold rounded-xl">
                            <SelectValue placeholder="All Members" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                            <SelectItem value="ALL" className="font-bold">
                              {isAdmin && adminViewRole === 'MANAGER' ? 'All Managers Combined' : 'All Employees Combined'}
                            </SelectItem>
                            {overviewEmployees.map((name) => (
                              <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedOverviewEmployee !== 'ALL' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOverviewEmployee('ALL')}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5 Overall Monthly Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <span>Total Requests</span>
                      <CalendarDays className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {monthlyOverview.overall.requestsThisMonth}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">This month</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <span>Approved</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {monthlyOverview.overall.approved}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Requests approved</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <span>Pending</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400">
                      {monthlyOverview.overall.pending}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Awaiting decision</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <span>Rejected</span>
                      <XCircle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-rose-400">
                      {monthlyOverview.overall.rejected}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Requests rejected</p>
                  </div>

                  <div className="col-span-2 sm:col-span-1 rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <span>Leave Days</span>
                      <CalendarDays className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-purple-400">
                      {monthlyOverview.overall.totalDaysTakenThisMonth.toFixed(1)}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Total days taken</p>
                  </div>
                </div>
              </div>

              {/* Three Individual Cards: Casual Leave, Sick Leave, Emergency Leave */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                
                {/* 1. Casual Leave */}
                <div className="rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-2xl shadow-xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 hover:shadow-2xl transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                          <CalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white">Casual Leave</h4>
                          <span className="text-xs font-medium text-zinc-400">Unpaid Personal Leave</span>
                        </div>
                      </div>
                      <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1">
                        Monthly
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Requests This Month</span>
                        <span className="font-extrabold text-white text-base">{monthlyOverview.casual.requestsThisMonth}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Approved</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                          {monthlyOverview.casual.approved}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Pending</span>
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                          {monthlyOverview.casual.pending}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Rejected</span>
                        <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                          {monthlyOverview.casual.rejected}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-1">
                        <span className="text-zinc-300 font-bold">Total Days Taken</span>
                        <span className="font-black text-orange-400 text-lg">{monthlyOverview.casual.totalDaysTakenThisMonth.toFixed(1)} Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Distribution */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
                      <span>Approval Status</span>
                      <span>{monthlyOverview.casual.requestsThisMonth > 0 ? `${Math.round((monthlyOverview.casual.approved / monthlyOverview.casual.requestsThisMonth) * 100)}% Approved` : 'No requests yet'}</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.casual.requestsThisMonth > 0 ? (monthlyOverview.casual.approved / monthlyOverview.casual.requestsThisMonth) * 100 : 0}%` }}
                      />
                      <div 
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.casual.requestsThisMonth > 0 ? (monthlyOverview.casual.pending / monthlyOverview.casual.requestsThisMonth) * 100 : 0}%` }}
                      />
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.casual.requestsThisMonth > 0 ? (monthlyOverview.casual.rejected / monthlyOverview.casual.requestsThisMonth) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Sick Leave */}
                <div className="rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-2xl shadow-xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 hover:shadow-2xl transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white">Sick Leave</h4>
                          <span className="text-xs font-medium text-zinc-400">Medical &amp; Health Leave</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1">
                        Monthly
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Requests This Month</span>
                        <span className="font-extrabold text-white text-base">{monthlyOverview.sick.requestsThisMonth}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Approved</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                          {monthlyOverview.sick.approved}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Pending</span>
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                          {monthlyOverview.sick.pending}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Rejected</span>
                        <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                          {monthlyOverview.sick.rejected}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-1">
                        <span className="text-zinc-300 font-bold">Total Days Taken</span>
                        <span className="font-black text-emerald-400 text-lg">{monthlyOverview.sick.totalDaysTakenThisMonth.toFixed(1)} Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Distribution */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
                      <span>Approval Status</span>
                      <span>{monthlyOverview.sick.requestsThisMonth > 0 ? `${Math.round((monthlyOverview.sick.approved / monthlyOverview.sick.requestsThisMonth) * 100)}% Approved` : 'No requests yet'}</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.sick.requestsThisMonth > 0 ? (monthlyOverview.sick.approved / monthlyOverview.sick.requestsThisMonth) * 100 : 0}%` }}
                      />
                      <div 
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.sick.requestsThisMonth > 0 ? (monthlyOverview.sick.pending / monthlyOverview.sick.requestsThisMonth) * 100 : 0}%` }}
                      />
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.sick.requestsThisMonth > 0 ? (monthlyOverview.sick.rejected / monthlyOverview.sick.requestsThisMonth) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Emergency Leave */}
                <div className="rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-2xl shadow-xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 hover:shadow-2xl transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white">Emergency Leave</h4>
                          <span className="text-xs font-medium text-zinc-400">Urgent &amp; Special Circumstances</span>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold px-3 py-1">
                        Monthly
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Requests This Month</span>
                        <span className="font-extrabold text-white text-base">{monthlyOverview.emergency.requestsThisMonth}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Approved</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                          {monthlyOverview.emergency.approved}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Pending</span>
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                          {monthlyOverview.emergency.pending}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                        <span className="text-zinc-400 font-medium">Rejected</span>
                        <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                          {monthlyOverview.emergency.rejected}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-1">
                        <span className="text-zinc-300 font-bold">Total Days Taken</span>
                        <span className="font-black text-purple-400 text-lg">{monthlyOverview.emergency.totalDaysTakenThisMonth.toFixed(1)} Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Distribution */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
                      <span>Approval Status</span>
                      <span>{monthlyOverview.emergency.requestsThisMonth > 0 ? `${Math.round((monthlyOverview.emergency.approved / monthlyOverview.emergency.requestsThisMonth) * 100)}% Approved` : 'No requests yet'}</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.emergency.requestsThisMonth > 0 ? (monthlyOverview.emergency.approved / monthlyOverview.emergency.requestsThisMonth) * 100 : 0}%` }}
                      />
                      <div 
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.emergency.requestsThisMonth > 0 ? (monthlyOverview.emergency.pending / monthlyOverview.emergency.requestsThisMonth) * 100 : 0}%` }}
                      />
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${monthlyOverview.emergency.requestsThisMonth > 0 ? (monthlyOverview.emergency.rejected / monthlyOverview.emergency.requestsThisMonth) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Clean Analytics with Status Badges, Icons & Monthly Status Distribution */}
              <div className="rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-2xl shadow-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      Current Month Approval Distribution
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Visual distribution of Approved vs. Pending vs. Rejected leave applications for {format(new Date(), 'MMMM yyyy')}
                    </p>
                  </div>

                  {/* Status Badges Legend */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved ({monthlyOverview.overall.approved})
                    </Badge>
                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Pending ({monthlyOverview.overall.pending})
                    </Badge>
                    <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-1.5 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Rejected ({monthlyOverview.overall.rejected})
                    </Badge>
                  </div>
                </div>

                {/* Multi-Segment Distribution Bar */}
                <div className="space-y-2">
                  <div className="h-5 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/10 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-700"
                      style={{ width: `${monthlyOverview.overall.requestsThisMonth > 0 ? (monthlyOverview.overall.approved / monthlyOverview.overall.requestsThisMonth) * 100 : 0}%` }}
                      title={`Approved: ${monthlyOverview.overall.approved}`}
                    />
                    <div 
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-700"
                      style={{ width: `${monthlyOverview.overall.requestsThisMonth > 0 ? (monthlyOverview.overall.pending / monthlyOverview.overall.requestsThisMonth) * 100 : 0}%` }}
                      title={`Pending: ${monthlyOverview.overall.pending}`}
                    />
                    <div 
                      className="h-full bg-gradient-to-r from-rose-600 to-rose-500 transition-all duration-700"
                      style={{ width: `${monthlyOverview.overall.requestsThisMonth > 0 ? (monthlyOverview.overall.rejected / monthlyOverview.overall.requestsThisMonth) * 100 : 0}%` }}
                      title={`Rejected: ${monthlyOverview.overall.rejected}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 font-medium pt-1">
                    <span>Total Monthly Requests: <strong className="text-white">{monthlyOverview.overall.requestsThisMonth}</strong></span>
                    <span>Total Days Taken This Month: <strong className="text-purple-400">{monthlyOverview.overall.totalDaysTakenThisMonth.toFixed(1)} Days</strong></span>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    <strong className="text-white font-semibold">Policy Note:</strong> This is an unpaid leave management system. All leave requests shown above represent unpaid absence applications for the current calendar month ({format(new Date(), 'MMMM yyyy')}) only. No leave quotas, remaining days, accrued leave, or annual entitlements are tracked or calculated.
                  </p>
                </div>
              </div>

              {/* Employee-Wise Monthly Leave Breakdown Table (For Managers) */}
              {isManager && (
                <div className="rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-2xl shadow-xl p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <Users className="w-3.5 h-3.5" />
                        Team Breakdown • {format(new Date(), 'MMMM yyyy')}
                      </div>
                      <h3 className="text-xl font-black text-white">
                        {isAdmin && adminViewRole === 'ALL'
                          ? 'Organization-Wide Monthly Leave Activity (Managers & Interns)'
                          : isAdmin && adminViewRole === 'MANAGER'
                          ? 'Manager-Wise Monthly Leave Activity'
                          : isAdmin && adminViewRole === 'EMPLOYEE'
                          ? 'Intern & Employee Monthly Leave Activity'
                          : 'Intern & Employee Monthly Leave Activity (Team Overview)'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        {isAdmin && adminViewRole === 'ALL'
                          ? `Individual unpaid leave statistics across all managers and interns in ${format(new Date(), 'MMMM yyyy')}. Click any member to filter the overview cards above.`
                          : isAdmin && adminViewRole === 'MANAGER'
                          ? `Individual unpaid leave statistics for each manager in ${format(new Date(), 'MMMM yyyy')}. Click a manager to filter the overview cards above.`
                          : `Individual unpaid leave statistics for each intern/employee in ${format(new Date(), 'MMMM yyyy')}. Click a member to filter the overview cards above.`}
                      </p>
                    </div>

                    {selectedOverviewEmployee !== 'ALL' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOverviewEmployee('ALL')}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                      >
                        Show All
                      </Button>
                    )}
                  </div>

                  {employeeWiseOverview.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                      <p className="text-zinc-400 font-medium text-sm">No leave activity recorded for {format(new Date(), 'MMMM yyyy')}.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <th className="pb-3 pr-4">Member</th>
                            <th className="pb-3 px-4 text-center">Requests</th>
                            <th className="pb-3 px-4 text-center">Approved</th>
                            <th className="pb-3 px-4 text-center">Pending</th>
                            <th className="pb-3 px-4 text-center">Rejected</th>
                            <th className="pb-3 px-4 text-right">Leave Days Taken</th>
                            <th className="pb-3 pl-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {employeeWiseOverview.map((emp) => {
                            const isSelected = selectedOverviewEmployee === emp.employee;
                            return (
                              <tr
                                key={emp.employee}
                                className={cn(
                                  "hover:bg-white/5 transition-colors cursor-pointer",
                                  isSelected && "bg-white/10 border-l-2 border-cyan-400"
                                )}
                                onClick={() => setSelectedOverviewEmployee(isSelected ? 'ALL' : emp.employee)}
                              >
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-white/20">
                                      <AvatarImage src={emp.avatar} alt={emp.employee} />
                                      <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                                        {emp.employee.split(' ').map((n) => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-white">{emp.employee}</span>
                                        {emp.role === 'manager' ? (
                                          <Badge className="bg-purple-500/20 text-purple-300 font-extrabold text-[10px] px-1.5 py-0 border border-purple-500/30">
                                            MANAGER
                                          </Badge>
                                        ) : emp.role === 'admin' ? (
                                          <Badge className="bg-amber-500/20 text-amber-300 font-extrabold text-[10px] px-1.5 py-0 border border-amber-500/30">
                                            ADMIN
                                          </Badge>
                                        ) : null}
                                      </div>
                                      <div className="text-xs text-zinc-400">{emp.department}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Badge variant="outline" className="border-white/20 text-white font-extrabold">
                                    {emp.total}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {emp.approved}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {emp.pending}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    {emp.rejected}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-black text-purple-400">
                                  {emp.days.toFixed(1)} Days
                                </td>
                                <td className="py-3 pl-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOverviewEmployee(isSelected ? 'ALL' : emp.employee);
                                    }}
                                    className={cn(
                                      "text-xs font-bold",
                                      isSelected
                                        ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                        : "text-zinc-400 hover:text-white hover:bg-white/10"
                                    )}
                                  >
                                    {isSelected ? 'Selected' : 'Filter'}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </TabsContent>
          )}

          {/* Manager: Team Requests */}
          <TabsContent value="requests">
            <div className="space-y-6">
              <AnimatePresence>
                {leaveData.filter((l: any) => {
                  if (l.status !== 'Pending') return false;
                  if (String(l.userId) === String(user?.id) || l.employee === user?.name) return false;
                  if (!isAdmin && (l.role === 'manager' || l.role === 'admin')) return false;
                  return true;
                }).length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-xl">
                    <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">All Caught Up!</h3>
                    <p className="text-slate-500 font-medium">There are no pending leave requests to approve.</p>
                  </motion.div>
                ) : (
                  leaveData.filter((l: any) => {
                    if (l.status !== 'Pending') return false;
                    if (String(l.userId) === String(user?.id) || l.employee === user?.name) return false;
                    if (!isAdmin && (l.role === 'manager' || l.role === 'admin')) return false;
                    return true;
                  }).map((req: any) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0, overflow: 'hidden' }}
                      className={cn(
                        "border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden flex flex-col hover:shadow-xl transition-all cursor-pointer",
                        highlightedRequestId === req.id && "ring-2 ring-purple-500 animate-pulse border-purple-500"
                      )}
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsRequestDialogOpen(true);
                      }}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-stretch">

                        {/* Employee Info Section */}
                        <div className="p-6 lg:p-8 flex-1 flex flex-col md:flex-row gap-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                          <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-900 shadow-md">
                            <AvatarImage src={req.avatar} alt={req.employee} />
                            <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xl">{getInitials(req.employee)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h4 className="font-black text-xl text-slate-900 dark:text-white">{req.employee}</h4>
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">{req.department}</Badge>
                                {req.role === 'manager' && (
                                  <Badge className="bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/40">
                                    Manager • Admin Approval Required
                                  </Badge>
                                )}
                                {req.hrNotified && (
                                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                                    <Mail className="w-3 h-3 mr-1" /> HR Notified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applied on {req.appliedOn}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col gap-1 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Leave Details</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">{req.type}</Badge>
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                                    <CalendarDays className="h-4 w-4 mr-1.5 text-slate-400" />
                                    {req.days} Day{req.days > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{req.start} <span className="text-slate-400 mx-1">→</span> {req.end}</span>
                              </div>

                              <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-4 flex flex-col gap-1 border border-amber-100/50 dark:border-amber-900/30 shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600/70 dark:text-amber-500/70">Reason</span>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mt-1 leading-snug italic">
                                  "{req.reason}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions Section */}
                        <div className="p-6 lg:p-8 flex flex-col gap-3 justify-center w-full lg:w-70 bg-slate-50/50 dark:bg-slate-900/30">
                          <Button
                            className="w-full rounded-xl h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleApprove(req.id);
                            }}
                            disabled={approvingId === req.id || rejectingId === req.id}
                          >
                            {approvingId === req.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5 mr-2" /> Approve Leave</>}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full rounded-xl h-12 font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-900/20 shadow-sm"
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleReject(req.id);
                            }}
                            disabled={approvingId === req.id || rejectingId === req.id}
                          >
                            {rejectingId === req.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><XCircle className="h-5 w-5 mr-2" /> Reject</>}
                          </Button>
                          <div className="relative mt-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-slate-50 dark:bg-[#0B1120] px-2 text-slate-500 font-bold">Or</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            className="w-full rounded-xl h-11 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCommentModal(req.id);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Comment
                          </Button>
                        </div>

                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Manager: Team Calendar */}
          <TabsContent value="calendar">
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl p-4 md:p-8 overflow-hidden">
              <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">

                {/* Calendar Section */}
                <div className="w-full xl:w-2/3 shrink-0">
                  <LeaveCalendar
                    leaves={leaveData}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                  />
                </div>

                {/* Day Details Section */}
                <div className="w-full xl:w-1/3 flex flex-col pt-2 sm:pt-14">
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex-1">
                    <h3 className="text-2xl font-black mb-1 text-slate-900 dark:text-white">
                      {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                    </h3>

                    <div className="mt-8">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                        Employees on Leave
                      </p>

                      <div className="space-y-4">
                        {selectedDateLeaves.length > 0 ? (
                          selectedDateLeaves.map((leave: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                              <Avatar className="h-10 w-10 shadow-sm border border-slate-200 dark:border-slate-800">
                                <AvatarImage src={leave.avatar} alt={leave.employee} />
                                <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">{getInitials(leave.employee)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate">{leave.employee}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Type:</span>
                                  <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100 text-[10px] font-bold py-0 h-4 border border-rose-200 dark:border-rose-800 shrink-0">
                                    {leave.type}
                                  </Badge>
                                  <Badge className={cn(
                                    "text-[9px] uppercase px-1.5 py-0.5 rounded font-black border shrink-0",
                                    leave.status === 'Approved'
                                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                      : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                  )}>
                                    {leave.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 px-4 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-sm font-semibold text-slate-500">No employees are on leave today.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Comment Modal */}
      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent className="sm:max-w-106.25 rounded-3xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
              Add Comment
            </DialogTitle>
            <DialogDescription>
              Add a note to this leave request. This will be visible to the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your comment here..."
              className="min-h-30 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none font-medium text-sm focus:ring-2 focus:ring-blue-500/50 shadow-inner text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentModalOpen(false)} className="rounded-xl font-bold h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">Cancel</Button>
            <Button onClick={submitComment} className="rounded-xl font-bold h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">Save Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeaveRequestDialog
        request={selectedRequest}
        isOpen={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
