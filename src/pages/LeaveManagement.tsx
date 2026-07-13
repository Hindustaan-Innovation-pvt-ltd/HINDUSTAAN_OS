import React, { useState, useMemo, useEffect } from 'react';
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
import { LeaveCommentHistory, type LeaveComment } from '@/components/dashboard/LeaveCommentHistory';
import { LeaveApplicationWithDrafts } from '@/components/dashboard/LeaveApplicationWithDrafts';
import LeaveRequestDialog from '@/components/manager/LeaveRequestDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';

// 9. Mock Data
const MOCK_LEAVES = [
  { id: 1, employee: "Tanvy Pandey", avatar: 'https://i.pravatar.cc/150?u=tanvy', department: "Engineering", type: "Sick Leave", start: "2026-07-11", end: "2026-07-13", appliedOn: "2026-07-10", reason: "Fever and medical consultation.", status: "Pending", days: 3 },
  { id: 2, employee: "Priya", avatar: 'https://i.pravatar.cc/150?u=priya', department: "Design", type: "WFH", start: "2026-07-11", end: "2026-07-11", appliedOn: "2026-07-09", reason: "Internet maintenance at home.", status: "Approved", days: 1, hrNotified: true },
  { id: 3, employee: "Rahul Sharma", avatar: 'https://i.pravatar.cc/150?u=rahul', department: "Engineering", type: "Casual Leave", start: "2026-07-15", end: "2026-07-18", appliedOn: "2026-07-05", reason: "Family function out of station.", status: "Pending", days: 4 },
  { id: 4, employee: "Amit Kumar", avatar: 'https://i.pravatar.cc/150?u=amit', department: "Marketing", type: "Casual Leave", start: "2026-07-11", end: "2026-07-12", appliedOn: "2026-07-01", reason: "Personal work.", status: "Approved", days: 2, hrNotified: true },
  { id: 5, employee: "Sara", avatar: 'https://i.pravatar.cc/150?u=sara', department: "HR", type: "Sick Leave", start: "2026-07-11", end: "2026-07-11", appliedOn: "2026-07-11", reason: "Not feeling well.", status: "Approved", days: 1, hrNotified: true },
  { id: 6, employee: "John Doe", avatar: 'https://i.pravatar.cc/150?u=john', department: "Sales", type: "Emergency Leave", start: "2026-07-11", end: "2026-07-11", appliedOn: "2026-07-11", reason: "Personal emergency.", status: "Approved", days: 1, hrNotified: true },
];

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

export default function LeaveManagement({ session }: { session: any }) {
  const role = session?.user?.user_metadata?.role || 'manager';
  const isManager = role === 'manager';

  const [activeTab, setActiveTab] = useState(isManager ? 'requests' : 'apply');
  const [managerRequestsTab, setManagerRequestsTab] = useState<'pending' | 'processed'>('pending');

  const [leaveData, setLeaveData] = useState(() => {
    const stored = localStorage.getItem('hindustaan_leave_data');
    return stored ? JSON.parse(stored) : MOCK_LEAVES;
  });

  const [highlightedRequestId, setHighlightedRequestId] = useState<number | null>(null);
  const [leaveComments, setLeaveComments] = useState<LeaveComment[]>(() => {
    const stored = localStorage.getItem('hindustaan_leave_comments');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('hindustaan_leave_comments', JSON.stringify(leaveComments));
  }, [leaveComments]);

  const handleEditComment = (commentId: string, newText: string) => {
    setLeaveComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const updated = { ...c, comment: newText, edited: true, updatedAt: new Date().toISOString() };
        
        // Update employee notification
        const req = leaveData.find((l: any) => l.id === c.leaveId);
        if (req) {
          const empNotifs = JSON.parse(localStorage.getItem('hindustaan_employee_notifications') || '[]');
          const notif = {
            id: Date.now(),
            category: 'Leave Management',
            icon: '💬',
            title: 'Leave Comment Edited',
            message: `💬 ${session?.user?.user_metadata?.name || 'Manager'} edited comment:
"${newText}"`,
            time: 'Just now',
            unread: true,
            group: 'Today',
            metadata: { type: 'leave_commented', date: req.start, requestId: req.id, employeeName: req.employee }
          };
          localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([notif, ...empNotifs]));
          window.dispatchEvent(new Event('employee-notifications-updated'));
        }
        return updated;
      }
      return c;
    }));
    toast.success('Comment updated');
  };

  const handleDeleteComment = (commentId: string) => {
    const comment = leaveComments.find(c => c.id === commentId);
    setLeaveComments(prev => prev.filter(c => c.id !== commentId));
    
    if (comment) {
        const req = leaveData.find((l: any) => l.id === comment.leaveId);
        if (req) {
          const empNotifs = JSON.parse(localStorage.getItem('hindustaan_employee_notifications') || '[]');
          const notif = {
            id: Date.now(),
            category: 'Leave Management',
            icon: '🗑️',
            title: 'Leave Comment Deleted',
            message: `Comment was removed by ${session?.user?.user_metadata?.name || 'Manager'}.`,
            time: 'Just now',
            unread: true,
            group: 'Today',
            metadata: { type: 'leave_commented', date: req.start, requestId: req.id, employeeName: req.employee }
          };
          localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([notif, ...empNotifs]));
          window.dispatchEvent(new Event('employee-notifications-updated'));
        }
    }
    toast.success('Comment deleted');
  };


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
        const reqId = Number(targetId);
        const storedLeaves = localStorage.getItem('hindustaan_leave_data');
        const currentLeaves = storedLeaves ? JSON.parse(storedLeaves) : leaveData;
        const foundReq = currentLeaves.find((l: any) => l.id === reqId && l.status === 'Pending');
        if (foundReq) {
          setHighlightedRequestId(reqId);
          setSelectedRequest(foundReq);
          setIsRequestDialogOpen(true);
          localStorage.removeItem('selected_leave_request_id');
        }
      }
    };

    const handleSync = () => {
      const stored = localStorage.getItem('hindustaan_leave_data');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLeaveData((prev: any) => {
            if (JSON.stringify(prev) !== stored) {
              return parsed;
            }
            return prev;
          });
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('popstate', handleRouteAndParams);
    window.addEventListener('leave-data-updated', handleSync);
    window.addEventListener('storage', (e) => {
      if (e.key === 'hindustaan_leave_data') {
        handleSync();
      }
    });

    // Run once on mount
    handleRouteAndParams();
    handleSync();

    return () => {
      window.removeEventListener('popstate', handleRouteAndParams);
      window.removeEventListener('leave-data-updated', handleSync);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('hindustaan_leave_data', JSON.stringify(leaveData));
    window.dispatchEvent(new Event('leave-data-updated'));
  }, [leaveData]);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Comment Modal State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  // Leave Request Dialog State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  // 2. Email Notification Placeholder Flow - Loading States
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const onSubmitLeave = (leave: {
    type: string;
    emergencyContact: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    const start = parseLocalDate(leave.startDate);
    const end = parseLocalDate(leave.endDate);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const typeMapping: Record<string, string> = {
      casual: "Casual Leave",
      sick: "Sick Leave",
      wfh: "WFH",
      half: "Half Day",
      emergency: "Emergency Leave"
    };

    const employeeName = session?.user?.user_metadata?.name || "Tanvy Pandey";
    const employeeDept = session?.user?.user_metadata?.department || "Engineering";

    const newRequest = {
      id: Date.now(),
      employee: employeeName,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(employeeName)}`,
      department: employeeDept,
      type: typeMapping[leave.type] || "Casual Leave",
      start: leave.startDate,
      end: leave.endDate,
      appliedOn: format(new Date(), 'yyyy-MM-dd'),
      reason: leave.reason,
      status: "Pending" as const,
      days: diffDays,
      hrNotified: false
    };

    setLeaveData((prev: any[]) => [newRequest, ...prev]);

    // Add manager notification
    const newManagerNotification = {
      id: Date.now(),
      category: 'Leave Management',
      icon: '📝',
      title: 'New Leave Request',
      message: `${employeeName}

${leave.type} • ${diffDays} Day${diffDays > 1 ? 's' : ''}

Reason:
"${leave.reason}"`,
      time: 'Just now',
      unread: true,
      group: 'Today',
      metadata: {
        requestId: newRequest.id,
        type: 'leave_request',
        employee: employeeName,
        date: leave.startDate
      },
      actions: [
        { label: 'Approve', primary: true, actionType: 'approve_leave' },
        { label: 'Reject', primary: false, actionType: 'reject_leave' },
        { label: 'Comment', primary: false, actionType: 'comment_leave' }
      ]
    };
    const savedNotifications = localStorage.getItem('hindustaan_notifications');
    let managerNotifications = [];
    if (savedNotifications) {
      try { managerNotifications = JSON.parse(savedNotifications); } catch (e) {}
    }
    localStorage.setItem('hindustaan_notifications', JSON.stringify([newManagerNotification, ...managerNotifications]));
    window.dispatchEvent(new Event('notifications-updated'));

    return true;
  };

  // 10. Future Backend Integration Comments
  // Future Backend Flow:
  // Employee Applies Leave -> Manager Approves -> POST /api/leaves/:id/approve -> Backend sends email to HR -> Calendar updates automatically

  const handleApprove = async (id: number) => {
    const leaveObj = leaveData.find((l: any) => l.id === id);
    if (!leaveObj) return;

    setLeaveData((prev: any[]) => prev.map((l: any) => {
      if (l.id === id) {
        return { ...l, status: 'Approved', hrNotified: true };
      }
      return l;
    }));

    toast.success('Leave Approved Successfully.', {
      description: 'HR has been notified via email.'
    });

    // Add employee notification
    const leaveDateFormatted = leaveObj.start;
    const newEmpNotification = {
      id: Date.now(),
      category: 'Leave Management',
      icon: '✅',
      title: 'Leave Approved',
      message: `Manager approved your leave request for ${leaveDateFormatted}`,
      time: 'Just now',
      unread: true,
      group: 'Today',
      metadata: {
        type: 'leave_approved',
        date: leaveDateFormatted,
        employeeName: leaveObj.employee
      }
    };
    const savedEmpNotifications = localStorage.getItem('hindustaan_employee_notifications');
    let empNotifications = [];
    if (savedEmpNotifications) {
      try { empNotifications = JSON.parse(savedEmpNotifications); } catch (e) {}
    }
    localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifications]));
    window.dispatchEvent(new Event('employee-notifications-updated'));
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const handleReject = async (id: number) => {
    const leaveObj = leaveData.find((l: any) => l.id === id);
    if (!leaveObj) return;

    setLeaveData((prev: any[]) => prev.map((l: any) => {
      if (l.id === id) {
        return { ...l, status: 'Rejected' };
      }
      return l;
    }));

    toast.error('Leave Rejected', {
      description: 'Employee has been notified.'
    });

    // Add employee notification
    const leaveDateFormatted = leaveObj.start;
    const newEmpNotification = {
      id: Date.now(),
      category: 'Leave Management',
      icon: '❌',
      title: 'Leave Rejected',
      message: `Manager rejected your leave request for ${leaveDateFormatted}`,
      time: 'Just now',
      unread: true,
      group: 'Today',
      metadata: {
        type: 'leave_rejected',
        date: leaveDateFormatted,
        employeeName: leaveObj.employee
      }
    };
    const savedEmpNotifications = localStorage.getItem('hindustaan_employee_notifications');
    let empNotifications = [];
    if (savedEmpNotifications) {
      try { empNotifications = JSON.parse(savedEmpNotifications); } catch (e) {}
    }
    localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifications]));
    window.dispatchEvent(new Event('employee-notifications-updated'));
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const openCommentModal = (id: number) => {
    setActiveRequestId(id);
    setCommentText('');
    setCommentModalOpen(true);
  };

  const submitComment = () => {
    if (!commentText.trim()) return;
    const newComment: LeaveComment = {
      id: `lc-${Date.now()}`,
      leaveId: activeRequestId!,
      managerId: session?.user?.id || 'm1',
      managerName: session?.user?.user_metadata?.name || 'Rahul Sharma',
      comment: commentText.trim(),
      edited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLeaveComments(prev => [...prev, newComment]);
    
    setCommentModalOpen(false);
    setHighlightedRequestId(null);
    toast.success('Comment saved.');
    
    // Add comment notification for the employee
    const req = leaveData.find((l: any) => l.id === activeRequestId);
    if (req) {
      const savedEmpNotifs = localStorage.getItem('hindustaan_employee_notifications');
      let empNotifs = savedEmpNotifs && savedEmpNotifs !== 'null' ? JSON.parse(savedEmpNotifs) : [];
      const newEmpNotification = {
        id: Date.now(),
        category: 'Leave Management',
        icon: '💬',
        title: 'Manager Commented',
        message: `💬 ${newComment.managerName} commented:
"${newComment.comment}"`,
        time: 'Just now',
        unread: true,
        group: 'Today',
        metadata: {
          type: 'leave_commented',
          date: req.start,
          requestId: req.id
        }
      };
      localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifs]));
      window.dispatchEvent(new Event('employee-notifications-updated'));
    }
  };

  // Selected date leaves
  const selectedDateLeaves = selectedDate ? leaveData.filter((l: any) => {
    if (l.status === 'Rejected') return false;
    const start = parseLocalDate(l.start);
    const end = parseLocalDate(l.end);
    end.setHours(23,59,59,999);
    return selectedDate >= start && selectedDate <= end;
  }) : [];

  // Statistics
  const pendingRequestsCount = leaveData.filter((l: any) => l.status === 'Pending').length;
  const approvedThisMonthCount = leaveData.filter((l: any) => l.status === 'Approved' && new Date(l.appliedOn).getMonth() === new Date().getMonth()).length;
  
  const todayLeavesCount = leaveData.filter((l: any) => {
    if (l.status !== 'Approved') return false;
    const start = parseLocalDate(l.start);
    const end = parseLocalDate(l.end);
    end.setHours(23,59,59,999);
    const now = new Date();
    return now >= start && now <= end;
  }).length;

  const upcomingLeavesCount = leaveData.filter((l: any) => l.status === 'Approved' && parseLocalDate(l.start) > new Date()).length;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20 w-full p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Leave Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Manage your leaves, view history, and team availability.
        </p>
      </div>

      {isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 backdrop-blur-xl shadow-sm border">
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
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 backdrop-blur-xl shadow-sm border">
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
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10 backdrop-blur-xl shadow-sm border">
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
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10 backdrop-blur-xl shadow-sm border">
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
        <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full max-w-3xl flex flex-col sm:flex-row !h-auto items-stretch sm:items-center gap-1 sm:gap-0">
          {!isManager ? (
            <>
              <TabsTrigger value="apply" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Apply Leave</TabsTrigger>
              <TabsTrigger value="history" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">My History</TabsTrigger>
              <TabsTrigger value="balance" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">Leave Balance</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="requests" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">
                Pending Requests ({leaveData.filter((l: any) => l.status === 'Pending').length})
              </TabsTrigger>
              <TabsTrigger value="history" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">
                Leave History ({leaveData.filter((l: any) => l.status !== 'Pending').length})
              </TabsTrigger>
              <TabsTrigger value="calendar" className="!h-auto flex-1 w-full sm:w-auto min-h-[40px] justify-center items-center py-2 px-2 sm:px-4 rounded-lg font-medium text-sm transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100 whitespace-normal sm:whitespace-nowrap">
                Team Calendar
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <div className="mt-8">
          {/* Employee: Apply Leave */}
          <TabsContent value="apply">
            <LeaveApplicationWithDrafts onSubmitLeave={onSubmitLeave} />
          </TabsContent>

          {/* Employee: My History */}
          {!isManager && (<TabsContent value="history">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {leaveData.filter((l: any) => l.employee === (session?.user?.user_metadata?.name || "Tanvy Pandey")).length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-xl">
                    <p className="text-slate-500 font-medium">You have not applied for any leaves yet.</p>
                  </div>
                ) : (
                  leaveData.filter((l: any) => l.employee === (session?.user?.user_metadata?.name || "Tanvy Pandey")).map((req: any) => {
                    const lastComment = leaveComments.filter(c => c.leaveId === req.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                    return (
                      <motion.div
                        layout
                        key={`emp-history-${req.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-[18px] p-5 flex flex-col justify-between max-h-[240px] shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-blue-500/10 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/20"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-black text-slate-900 dark:text-white text-base">{req.type}</h4>
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{req.start} <span className="mx-1">→</span> {req.end}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{req.days} Day{req.days > 1 ? 's' : ''}</p>
                            </div>
                            {req.status === 'Pending' && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">PENDING ⏳</Badge>}
                            {req.status === 'Approved' && <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">APPROVED ✅</Badge>}
                            {req.status === 'Rejected' && <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-0">REJECTED ❌</Badge>}
                          </div>
                          
                          {lastComment ? (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 line-clamp-3">
                              <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Manager Feedback</p>
                              <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{lastComment.comment}"</p>
                            </div>
                          ) : (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                              <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Reason Submitted</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 italic line-clamp-2">"{req.reason}"</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] text-slate-400 font-bold">Applied On: {req.appliedOn}</p>
                          {lastComment && <p className="text-[10px] text-slate-500 font-bold">{lastComment.managerName}</p>}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>
          )}

          {/* Employee: Leave Balance */}
          <TabsContent value="balance">
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Leaves Quota</span>
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950 dark:text-white mb-1">24.0</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Days allocated for FY 2026</p>
                  </div>
                </Card>

                <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Leaves Availed</span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950 dark:text-white mb-1">5.0</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Days used in current cycle</p>
                  </div>
                </Card>

                <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Available Balance</span>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950 dark:text-white mb-1">19.0</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Days available to apply</p>
                  </div>
                </Card>

                <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Pending Requests</span>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950 dark:text-white mb-1">3.0</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Days awaiting manager approval</p>
                  </div>
                </Card>
              </div>

              {/* Detailed Breakdown Section */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Leave Types Progress Bars */}
                <div className="xl:col-span-2 space-y-6">
                  <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl p-6 sm:p-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Leave Categories</h3>
                    <div className="space-y-6">
                      
                      {/* Casual Leave */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Casual Leave (CL)</span>
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 text-[10px] font-bold border border-orange-200 dark:border-orange-900/50">8.0 Left</Badge>
                          </div>
                          <span className="font-extrabold text-slate-500 dark:text-slate-400">4.0 / 12.0 Days Used</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: '33.33%' }} />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Mainly for short-duration personal purposes. Accrues 1.0 day/month.</p>
                      </div>

                      {/* Sick Leave */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Sick Leave (SL)</span>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-900/50">5.0 Left</Badge>
                          </div>
                          <span className="font-extrabold text-slate-500 dark:text-slate-400">1.0 / 6.0 Days Used</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '16.66%' }} />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">To be availed on medical grounds only. Doctor certificate required for &gt; 2 days.</p>
                      </div>

                      {/* Earned/Privilege Leave */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Privilege Leave (PL)</span>
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 text-[10px] font-bold border border-blue-200 dark:border-blue-900/50">6.0 Left</Badge>
                          </div>
                          <span className="font-extrabold text-slate-500 dark:text-slate-400">0.0 / 6.0 Days Used</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '0%' }} />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Accumulated leaves carried forward or encashable at year end.</p>
                      </div>

                      {/* Emergency / Special Leave */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Emergency / Special Leave</span>
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 text-[10px] font-bold border border-purple-200 dark:border-purple-900/50">No Limit</Badge>
                          </div>
                          <span className="font-extrabold text-slate-500 dark:text-slate-400">0.0 Days Used</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '0%' }} />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Granted in bereavement or critical circumstances. HR approval required.</p>
                      </div>

                    </div>
                  </Card>
                </div>

                {/* Policy and Ledger Panel */}
                <div className="space-y-6">
                  
                  {/* Leave Log / Ledger */}
                  <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl p-6">
                    <h4 className="font-black text-slate-900 dark:text-white text-md mb-4">Activity Log</h4>
                    <div className="space-y-4">
                      
                      <div className="flex items-start gap-3 border-l-2 border-orange-500 pl-3 py-1">
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Casual Leave Applied</span>
                          <span className="block text-[10px] text-slate-400">Jul 11, 2026 (Tanvy Pandey)</span>
                        </div>
                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">-3.0 Days</span>
                      </div>

                      <div className="flex items-start gap-3 border-l-2 border-emerald-500 pl-3 py-1">
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Sick Leave Approved</span>
                          <span className="block text-[10px] text-slate-400">Jul 10, 2026 (Tanvy Pandey)</span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">-1.0 Day</span>
                      </div>

                      <div className="flex items-start gap-3 border-l-2 border-blue-500 pl-3 py-1">
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Quarterly Grant Credit</span>
                          <span className="block text-[10px] text-slate-400">Jul 01, 2026</span>
                        </div>
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">+6.0 Days</span>
                      </div>

                      <div className="flex items-start gap-3 border-l-2 border-slate-300 pl-3 py-1">
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Yearly Grant Credited</span>
                          <span className="block text-[10px] text-slate-400">Jan 01, 2026</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">+18.0 Days</span>
                      </div>

                    </div>
                  </Card>

                  {/* Policy Info Card */}
                  <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-slate-900/10 border p-6">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                      <Info className="w-5 h-5" />
                      <h4 className="font-bold text-sm">Leave Policy Guidelines</h4>
                    </div>
                    <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400 list-disc list-inside">
                      <li>Leaves must be applied at least 3 days in advance.</li>
                      <li>Unused SL expires on Dec 31, 2026.</li>
                      <li>PL can carry forward up to maximum of 45 days.</li>
                      <li>Manager validation requires explanation.</li>
                    </ul>
                  </Card>

                </div>

              </div>

            </div>
          </TabsContent>

          {/* Manager: Team Requests */}
          {isManager && (
            <TabsContent value="requests">
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {leaveData.filter((l: any) => l.status === 'Pending').length === 0 ? (
                      <motion.div key="empty-pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-xl">
                        <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                          <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">All Caught Up!</h3>
                        <p className="text-slate-500 font-medium">There are no pending leave requests to approve.</p>
                      </motion.div>
                    ) : (
                      leaveData.filter((l: any) => l.status === 'Pending').map((req: any) => (
                        <motion.div 
                          key={`pending-${req.id}`}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0, overflow: 'hidden' }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
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
                                <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xl">{getInitials(req.employee)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-4">
                                <div>
                                  <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h4 className="font-black text-xl text-slate-900 dark:text-white">{req.employee}</h4>
                                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">{req.department}</Badge>
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
                            <div className="p-6 lg:p-8 flex flex-col gap-3 justify-center w-full lg:w-[280px] bg-slate-50/50 dark:bg-slate-900/30">
                              <Button 
                                className="w-full rounded-xl h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20" 
                                onClick={(e) => {
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
                                onClick={(e) => {
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
                            <div className="px-6 lg:px-8 pb-6 lg:pb-8">
                              <LeaveCommentHistory 
                                leaveId={req.id} 
                                comments={leaveComments} 
                                isManager={true} 
                                onEditComment={handleEditComment} 
                                onDeleteComment={handleDeleteComment} 
                              />
                            </div>
                        </motion.div>
                      ))
                    )}
                </AnimatePresence>
              </div>
            </TabsContent>
          )}

          {/* Manager: Processed History */}
          {isManager && (
            <TabsContent value="history">
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {leaveData.filter((l: any) => l.status !== 'Pending').length === 0 ? (
                        <motion.div key="empty-history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full text-center py-16 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-xl">
                          <p className="text-slate-500 font-medium">No processed leaves found.</p>
                        </motion.div>
                      ) : (
                        leaveData.filter((l: any) => l.status !== 'Pending').map((req: any) => {
                          const lastComment = leaveComments.filter(c => c.leaveId === req.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                          return (
                            <motion.div
                              layout
                              key={`processed-${req.id}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-[18px] p-5 flex flex-col justify-between max-h-[220px] shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-blue-500/10 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/20"
                            >
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-black text-slate-900 dark:text-white text-base">{req.employee}</h4>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{req.type} • {req.start}</p>
                                  </div>
                                  <Badge className={req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}>
                                    {req.status === 'Approved' ? 'APPROVED ✅' : 'REJECTED ❌'}
                                  </Badge>
                                </div>
                                
                                {lastComment ? (
                                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 line-clamp-2">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Manager Comment</p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{lastComment.comment}"</p>
                                  </div>
                                ) : (
                                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Manager Comment</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No comments provided.</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                  <p className="text-[10px] text-slate-500 font-bold">{req.status} by Manager</p>
                                  <p className="text-[10px] text-slate-400">{req.appliedOn}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-blue-600 dark:text-blue-400" onClick={() => openCommentModal(req.id)}>
                                  {lastComment ? 'Edit Comment' : 'Add Comment'}
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                </AnimatePresence>
              </div>
            </TabsContent>
          )}
          
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
        <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
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
              className="min-h-[120px] rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none font-medium text-sm focus:ring-2 focus:ring-blue-500/50 shadow-inner text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
