import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  X, 
  Loader2, 
  Eye, 
  CalendarDays, 
  CheckSquare, 
  Megaphone, 
  FolderKanban, 
  ShieldAlert, 
  Cpu 
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "leave" | "task" | "announcement" | "project" | "security" | "system";
  priority: "low" | "medium" | "high" | "critical";
  isRead: boolean;
  createdAt: string;
  redirectUrl?: string;

  // Legacy fields for backward compatibility
  unread?: boolean;
  category?: string;
  icon?: string;
  group?: string;
  metadata?: any;
  actions?: { label: string; primary?: boolean; actionType: string }[];
}

const DEFAULT_MANAGER_NOTIFICATIONS: any[] = [
  {
    id: String(1689360000000 + 1),
    title: 'New Leave Request',
    message: 'Tanvy Pandey applied for leave on July 15',
    type: 'leave',
    priority: 'medium',
    isRead: false,
    createdAt: new Date(Date.now() - 120000).toISOString(),
    category: 'Leave Management',
    icon: '📅',
    group: 'Today',
    metadata: {
      requestId: 1,
      type: 'leave_request',
      employee: 'Tanvy Pandey',
      date: '2026-07-15'
    },
    actions: [
      { label: 'Approve', primary: true, actionType: 'approve_leave' },
      { label: 'Reject', actionType: 'reject_leave' },
      { label: 'Comment', actionType: 'comment_leave' }
    ]
  },
  {
    id: String(1689360000000 + 2),
    title: 'Task Assigned',
    message: 'Rahul Sharma assigned Authentication Module to Tanvy.',
    type: 'task',
    priority: 'medium',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    category: 'Tasks',
    icon: '📋',
    group: 'Today'
  },
  {
    id: String(1689360000000 + 3),
    title: 'Standup Submitted',
    message: 'Priya Patel submitted her daily standup.',
    type: 'system',
    priority: 'low',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    category: 'Standups',
    icon: '📝',
    group: 'Yesterday'
  }
];

const DEFAULT_EMPLOYEE_NOTIFICATIONS: any[] = [
  {
    id: String(1689360000000 + 4),
    title: 'Leave Approved',
    message: 'Manager approved your leave request for July 15',
    type: 'leave',
    priority: 'medium',
    isRead: false,
    createdAt: new Date().toISOString(),
    category: 'Leave Management',
    icon: '✅',
    group: 'Today',
    metadata: {
      type: 'leave_approved',
      date: '2026-07-15'
    }
  },
  {
    id: String(1689360000000 + 5),
    title: 'Leave Commented',
    message: 'Manager commented on your leave request',
    type: 'leave',
    priority: 'medium',
    isRead: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    category: 'Leave Management',
    icon: '💬',
    group: 'Today',
    metadata: {
      type: 'leave_commented',
      date: '2026-07-15'
    }
  },
  {
    id: String(1689360000000 + 6),
    title: 'New Task Assigned',
    message: 'You have been assigned: Dashboard Analytics UI. Due Tomorrow',
    type: 'task',
    priority: 'high',
    isRead: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    category: 'Tasks',
    icon: '📋',
    group: 'Today'
  }
];

function normalizeNotification(notif: any): NotificationItem {
  const isRead = notif.isRead !== undefined ? notif.isRead : (notif.unread !== undefined ? !notif.unread : false);
  
  let type: "leave" | "task" | "announcement" | "project" | "security" | "system" = "system";
  if (notif.type) {
    type = notif.type;
  } else if (notif.category) {
    const cat = notif.category.toLowerCase();
    if (cat.includes('leave')) type = 'leave';
    else if (cat.includes('task')) type = 'task';
    else if (cat.includes('announcement')) type = 'announcement';
    else if (cat.includes('project')) type = 'project';
    else if (cat.includes('security')) type = 'security';
    else if (cat.includes('system') || cat.includes('config')) type = 'system';
  }
  
  let priority: "low" | "medium" | "high" | "critical" = "medium";
  if (notif.priority) {
    priority = notif.priority;
  } else {
    const titleLower = (notif.title || '').toLowerCase();
    const msgLower = (notif.message || '').toLowerCase();
    if (titleLower.includes('critical') || msgLower.includes('critical') || titleLower.includes('security') || titleLower.includes('alert')) {
      priority = 'critical';
    } else if (titleLower.includes('high') || msgLower.includes('urgent') || titleLower.includes('rejected')) {
      priority = 'high';
    } else if (titleLower.includes('low') || titleLower.includes('joined') || titleLower.includes('submitted')) {
      priority = 'low';
    }
  }

  let redirectUrl = notif.redirectUrl || '';
  if (!redirectUrl && notif.category) {
    const isManager = window.location.pathname.startsWith('/manager') || window.location.pathname.startsWith('/admin');
    if (notif.category === 'Leave Management') {
      redirectUrl = isManager ? '/manager/leave-management' : '/employee/leave';
    } else if (notif.category === 'Tasks') {
      redirectUrl = isManager ? '/manager/tasks' : '/employee/tasks';
    } else if (notif.category === 'Standups') {
      redirectUrl = isManager ? '/manager/daily-standups' : '/employee/time-standup';
    }
  }
  
  let createdAt = notif.createdAt || '';
  if (!createdAt) {
    if (notif.id && (typeof notif.id === 'number' || !isNaN(Number(notif.id)))) {
      createdAt = new Date(Number(notif.id)).toISOString();
    } else {
      createdAt = new Date().toISOString();
    }
  }

  return {
    id: String(notif.id || Date.now() + Math.random().toString(36).substr(2, 9)),
    title: notif.title || 'Notification',
    message: notif.message || notif.desc || '',
    type,
    priority,
    isRead,
    createdAt,
    redirectUrl,
    unread: !isRead,
    category: notif.category || (type === 'leave' ? 'Leave Management' : type === 'task' ? 'Tasks' : type === 'announcement' ? 'Announcements' : 'System'),
    icon: notif.icon,
    group: notif.group,
    metadata: notif.metadata,
    actions: notif.actions
  };
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'leave':
      return <CalendarDays className="h-4 w-4 text-orange-500" />;
    case 'task':
      return <CheckSquare className="h-4 w-4 text-blue-500" />;
    case 'announcement':
      return <Megaphone className="h-4 w-4 text-purple-500" />;
    case 'project':
      return <FolderKanban className="h-4 w-4 text-emerald-500" />;
    case 'security':
      return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    case 'system':
    default:
      return <Cpu className="h-4 w-4 text-slate-500" />;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'critical':
      return <Badge className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-[9px] px-1 py-0 h-4 rounded">Critical</Badge>;
    case 'high':
      return <Badge className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-[9px] px-1 py-0 h-4 rounded">High</Badge>;
    case 'medium':
      return <Badge className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-[9px] px-1 py-0 h-4 rounded">Medium</Badge>;
    case 'low':
    default:
      return <Badge className="bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-bold text-[9px] px-1 py-0 h-4 rounded">Low</Badge>;
  }
};

const formatTimestamp = (isoString: string) => {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Just now';
  }
};

interface NotificationBellProps {
  onNavigate?: (view: string) => void;
}

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const { user } = useUser();
  const role = user?.role || 'employee';
  const isManager = role === 'manager' || role === 'admin';

  const storageKey = isManager ? 'hindustaan_notifications' : 'hindustaan_employee_notifications';
  const defaultNotifications = isManager ? DEFAULT_MANAGER_NOTIFICATIONS : DEFAULT_EMPLOYEE_NOTIFICATIONS;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [animateBell, setAnimateBell] = useState(false);

  const prevUnreadCount = useRef(0);

  // Load and synchronize state
  const loadNotifications = () => {
    const saved = localStorage.getItem(storageKey);
    let items: any[] = [];
    if (saved && saved !== 'null') {
      try {
        items = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing notifications', e);
        items = defaultNotifications;
      }
    } else {
      localStorage.setItem(storageKey, JSON.stringify(defaultNotifications));
      items = defaultNotifications;
    }
    const normalized = items.map(normalizeNotification);
    setNotifications(normalized);
  };

  useEffect(() => {
    loadNotifications();

    const handleSync = () => {
      loadNotifications();
    };

    window.addEventListener('notifications-updated', handleSync);
    window.addEventListener('employee-notifications-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('notifications-updated', handleSync);
      window.removeEventListener('employee-notifications-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [role, storageKey]);

  const saveNotifications = (newNotifs: NotificationItem[]) => {
    setNotifications(newNotifs);
    const toSave = newNotifs.map(n => ({
      ...n,
      unread: !n.isRead,
      category: n.type === 'leave' ? 'Leave Management' : (n.type === 'task' ? 'Tasks' : (n.type === 'announcement' ? 'Announcements' : 'System')),
      metadata: n.metadata || { type: n.type },
      actions: n.actions || []
    }));
    localStorage.setItem(storageKey, JSON.stringify(toSave));
    window.dispatchEvent(new Event(isManager ? 'notifications-updated' : 'employee-notifications-updated'));
  };

  const currentUserName = user?.name || "Tanvy Pandey";
  const visibleNotifications = isManager 
    ? notifications 
    : notifications.filter(n => !n.metadata?.employee || n.metadata.employee === currentUserName);
  
  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setAnimateBell(true);
      const timer = setTimeout(() => setAnimateBell(false), 1500);
      return () => clearTimeout(timer);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  };

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.map(n => ({ ...n, isRead: true, unread: false }));
    saveNotifications(updated);
    toast.success('All notifications marked as read');
  };

  const markAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true, unread: false } : n);
    saveNotifications(updated);
    toast.success('Notification marked as read');
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveNotifications([]);
    toast.success('Notifications cleared');
  };

  const handleViewAllRedirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.history.pushState({}, '', '/admin/notifications');
    window.dispatchEvent(new Event('popstate'));
    if (onNavigate) {
      onNavigate('System Notifications');
    }
  };

  const handleActionClick = (e: React.MouseEvent, notification: NotificationItem, actionType: string) => {
    e.stopPropagation();

    if (actionType === 'approve_leave' || actionType === 'reject_leave' || actionType === 'comment_leave') {
      const requestId = notification.metadata?.requestId;
      if (!requestId) return;

      if (actionType === 'comment_leave') {
        setActiveCommentId(notification.id);
        setCommentText('');
        return;
      }

      const allLeaves = JSON.parse(localStorage.getItem('hindustaan_leave_data') || '[]');
      let employeeNotifReq: any = null;
      const updatedLeaves = allLeaves.map((l: any) => {
        if (l.id === requestId) {
          employeeNotifReq = l;
          return { ...l, status: actionType === 'approve_leave' ? 'Approved' : 'Rejected', hrNotified: true, processedAt: Date.now() };
        }
        return l;
      });
      localStorage.setItem('hindustaan_leave_data', JSON.stringify(updatedLeaves));
      window.dispatchEvent(new Event('leave-data-updated'));

      if (employeeNotifReq) {
        const savedEmpNotifs = localStorage.getItem('hindustaan_employee_notifications');
        let empNotifs = savedEmpNotifs && savedEmpNotifs !== 'null' ? JSON.parse(savedEmpNotifs) : [];
        const isApproved = actionType === 'approve_leave';
        const newEmpNotification = {
          id: String(Date.now()),
          category: 'Leave Management',
          icon: isApproved ? '✅' : '❌',
          title: isApproved ? 'Leave Approved' : 'Leave Rejected',
          message: `Manager ${isApproved ? 'approved' : 'rejected'} your leave request for ${employeeNotifReq.start}`,
          time: 'Just now',
          unread: true,
          group: 'Today',
          metadata: {
            type: 'leave_status_update',
            date: employeeNotifReq.start,
            employeeName: employeeNotifReq.employee,
            requestId: employeeNotifReq.id
          }
        };
        localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifs]));
        window.dispatchEvent(new Event('employee-notifications-updated'));
      }

      const updatedNotifs = notifications.map(n => {
        if (n.id === notification.id) {
          return { ...n, isRead: true, unread: false, actions: [] };
        }
        return n;
      });
      saveNotifications(updatedNotifs);
      
      toast.success(actionType === 'approve_leave' ? "Leave request approved" : "Leave request rejected");
      return;
    }

    window.dispatchEvent(new CustomEvent("notification-action", { detail: { actionType, notification } }));
  };

  const submitCommentLeave = (e: React.MouseEvent | React.KeyboardEvent, notification: NotificationItem) => {
    e.stopPropagation();
    if (!commentText.trim()) return;
    const requestId = notification.metadata?.requestId;
    if (!requestId) return;

    const existing = JSON.parse(localStorage.getItem('hindustaan_leave_comments') || '[]');
    existing.push({
      id: Date.now().toString(),
      leaveId: requestId,
      managerId: user?.id || 'manager-1',
      managerName: user?.name || "Manager",
      comment: commentText,
      edited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    localStorage.setItem('hindustaan_leave_comments', JSON.stringify(existing));

    const allLeaves = JSON.parse(localStorage.getItem('hindustaan_leave_requests') || '[]');
    const req = allLeaves.find((l: any) => l.id === requestId);
    if (req) {
      const savedEmpNotifs = localStorage.getItem('hindustaan_employee_notifications');
      let empNotifs = savedEmpNotifs && savedEmpNotifs !== 'null' ? JSON.parse(savedEmpNotifs) : [];
      const newEmpNotification = {
        id: String(Date.now()),
        category: 'Leave Management',
        icon: '💬',
        title: 'Manager Commented',
        message: `💬 ${user?.name || "Manager"} commented:\n"${commentText}"`,
        time: 'Just now',
        unread: true,
        group: 'Today',
        metadata: {
          type: 'leave_commented',
          date: req.start,
          employeeName: req.employee,
          requestId: req.id
        }
      };
      localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifs]));
      window.dispatchEvent(new Event('employee-notifications-updated'));
    }
    
    const updatedNotifs = notifications.map(n => {
      if (n.id === notification.id) {
        return { ...n, isRead: true, unread: false, actions: [] };
      }
      return n;
    });
    saveNotifications(updatedNotifs);

    toast.success("Comment added successfully");
    setActiveCommentId(null);
    setCommentText('');
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    const updated = notifications.map(n => n.id === notification.id ? { ...n, isRead: true, unread: false } : n);
    saveNotifications(updated);

    if (role === 'admin' && notification.type === 'leave') {
      return;
    }

    let targetPath = notification.redirectUrl || '';
    let targetView = '';

    if (!targetPath) {
      if (notification.type === 'leave') {
        targetPath = isManager ? '/manager/leave-management' : '/employee/leave';
        targetView = 'Leave Management';
        if (isManager && notification.metadata?.requestId) {
          localStorage.setItem('selected_leave_request_id', String(notification.metadata.requestId));
        }
      } else if (notification.type === 'task') {
        targetPath = isManager ? '/manager/tasks' : '/employee/tasks';
        targetView = isManager ? 'Tasks' : 'My Tasks';
      } else if (notification.type === 'announcement') {
        targetPath = '/admin/notifications';
        targetView = 'Announcement Center';
      } else if (notification.type === 'system' || notification.type === 'security') {
        targetPath = '/admin/notifications';
        targetView = 'System Notifications';
      } else {
        targetPath = isManager ? '/manager/dashboard' : '/employee/dashboard';
        targetView = 'Dashboard';
      }
    } else {
      if (targetPath.includes('leave')) targetView = 'Leave Management';
      else if (targetPath.includes('task')) targetView = isManager ? 'Tasks' : 'My Tasks';
      else if (targetPath.includes('announcement')) targetView = 'Announcement Center';
      else if (targetPath.includes('notifications')) targetView = 'System Notifications';
    }

    if (targetPath) {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new Event('popstate'));
      if (onNavigate && targetView) {
        onNavigate(targetView);
      }
    }
  };

  const latestNotifications = visibleNotifications.slice(0, 10);

  return (
    <>
      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(4deg); }
          90% { transform: rotate(-2deg); }
        }
      `}</style>
      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button 
            type="button" 
            className="relative -m-2.5 p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors duration-200 outline-none cursor-pointer"
          >
            <span className="sr-only">View notifications</span>
            <Bell className={cn("h-6 w-6 transition-transform", animateBell && "animate-[bell-ring_1.5s_ease-in-out_infinite]")} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#050816]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              </span>
            )}
          </button>
        </PopoverTrigger>
        
        <PopoverContent 
          align="end" 
          sideOffset={8}
          className="w-96 p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl text-slate-900 dark:text-white backdrop-blur-md z-[1000] border origin-top-right animate-in fade-in-50 zoom-in-95 duration-200 overflow-hidden"
        >
          {/* Dropdown Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-950 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-rose-500 text-white border-0 font-extrabold px-1.5 py-0 text-[10px] rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Mark All Read
                </button>
              )}
              <button 
                onClick={handleViewAllRedirect}
                className="text-xs font-bold text-[#5B7CFF] hover:text-[#4a6be6] transition-colors flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                View All
              </button>
            </div>
          </div>

          {/* List Area */}
          <ScrollArea className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#5B7CFF]" />
                <p className="text-xs font-semibold mt-3 text-slate-400">Loading notifications...</p>
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 mb-3 border border-slate-100 dark:border-slate-800">
                  <Bell className="h-6 w-6 opacity-60" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">No new notifications</p>
                <p className="text-xs font-medium text-slate-500 mt-1 text-center">We'll alert you when something active requires your attention.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {latestNotifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "relative p-4 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group cursor-pointer flex gap-3.5 items-start",
                      !notification.isRead ? "bg-slate-50/40 dark:bg-slate-800/20" : ""
                    )}
                  >
                    {/* Read/Unread dot indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-1 top-[22px] w-2 h-2 bg-[#5B7CFF] rounded-full" />
                    )}

                    {/* Icon container */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Info Block */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-xs font-bold leading-normal truncate pr-4",
                          !notification.isRead ? "text-slate-950 dark:text-white" : "text-slate-600 dark:text-slate-400"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">{formatTimestamp(notification.createdAt)}</span>
                      </div>
                      
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug break-words whitespace-pre-wrap">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        {getPriorityBadge(notification.priority)}
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 capitalize">{notification.type}</span>
                      </div>

                      {/* Interactive Leave request Action buttons */}
                      {notification.actions && notification.actions.length > 0 && (
                        activeCommentId === notification.id ? (
                          <div className="flex items-center gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                            <Input 
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Type comment..."
                              style={{ fontSize: '11px' }}
                              className="h-7 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 px-2 py-0 focus-visible:ring-1 focus-visible:ring-orange-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); submitCommentLeave(e, notification); }
                              }}
                            />
                            <Button size="sm" onClick={(e) => submitCommentLeave(e, notification)} className="h-6 px-2 bg-orange-600 hover:bg-orange-700 text-[10px] font-bold text-white shrink-0">Send</Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setActiveCommentId(null); setCommentText(''); }} className="h-6 px-1.5 text-slate-500 hover:text-slate-700 shrink-0"><X className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                            {notification.actions.map(action => (
                              <Button 
                                key={action.label}
                                size="sm" 
                                variant={action.primary ? "default" : "outline"}
                                className={cn("h-6 text-[10px] px-2.5 py-0 font-bold", action.primary ? "bg-orange-600 hover:bg-orange-700 text-white border-0" : "border-slate-350 dark:border-slate-700 text-slate-700 dark:text-slate-300")}
                                onClick={(e) => handleActionClick(e, notification, action.actionType)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )
                      )}
                    </div>

                    {/* Small Tick Button to mark as read manually */}
                    {!notification.isRead && (
                      <button
                        onClick={(e) => markAsRead(e, notification.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 border border-slate-200/50 dark:border-slate-700 shadow-sm"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer Action */}
          {visibleNotifications.length > 0 && !loading && (
            <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll} 
                className="h-7 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg w-full flex items-center justify-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear All
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
