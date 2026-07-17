import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNotifications } from '@/context/NotificationContext';
import type { NotificationItem } from '@/context/NotificationContext';

interface NotificationBellProps {
  onNavigate?: (view: string) => void;
}

export function EmployeeNotificationBell({ onNavigate }: NotificationBellProps = {}) {
  const { notifications, markAsRead, clearAll, clearNotification } = useNotifications();
  const { user } = useUser();
  const role = user?.role || 'employee';
  const isManager = role === 'manager';

  const [activeCommentId, setActiveCommentId] = useState<string | number | null>(null);
  const [commentText, setCommentText] = useState('');

  const currentUserName = user?.name || "Tanvy Pandey";
  // The backend API should handle filtering for the user.
  const visibleNotifications = notifications;
  const unreadCount = visibleNotifications.filter(n => n.unread).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    visibleNotifications.forEach(n => {
      if (n.unread) {
        markAsRead(n.id);
      }
    });
    toast.success('All notifications marked as read');
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAll();
    toast.success('All notifications cleared');
  };

  const handleDelete = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    clearNotification(id);
    toast.success('Notification cleared');
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
          id: Date.now(),
          category: 'Leave Management',
          icon: isApproved ? 'Γ£à' : 'Γ¥î',
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

      markAsRead(notification.id);
      
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
      managerId: (user as any)?.id || 'manager-1',
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
        id: Date.now(),
        category: 'Leave Management',
        icon: '≡ƒÆ¼',
        title: 'Manager Commented',
        message: `≡ƒÆ¼ ${user?.name || "Manager"} commented:\n"${commentText}"`,
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
    
    // Mark as read and clear comment actions
    markAsRead(notification.id);

    toast.success("Comment added successfully");
    setActiveCommentId(null);
    setCommentText('');
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // 1. Mark as read immediately
    markAsRead(notification.id);

    // 2. Perform cross-role routing and state changes
    let targetPath = '';
    let targetView = '';

    if (notification.category === 'Leave Management') {
      targetPath = isManager ? '/manager/leave-management' : '/employee/leave';
      targetView = 'Leave Management';
      if (isManager && notification.metadata?.requestId) {
        localStorage.setItem('selected_leave_request_id', String(notification.metadata.requestId));
      }
    } else if (notification.category === 'Tasks') {
      targetPath = isManager ? '/manager/tasks' : '/employee/tasks';
      targetView = isManager ? 'Tasks' : 'My Tasks';
    } else if (notification.category === 'Standups') {
      targetPath = isManager ? '/manager/daily-standups' : '/employee/time-standup'; 
      targetView = isManager ? 'Daily Standups' : 'Daily Standup';
    } else {
      targetPath = isManager ? '/manager/dashboard' : '/employee/dashboard';
      targetView = 'Dashboard';
    }

    if (targetPath) {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new Event('popstate'));
      if (onNavigate && targetView) {
        onNavigate(targetView);
      }
    }
  };

  // Group notifications
  const grouped = visibleNotifications.reduce((acc, curr) => {
    const groupName = curr.group || 'Today';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(curr);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button" 
          className="relative -m-2.5 p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors duration-200 outline-none cursor-pointer"
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
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
        className="w-80 p-2 bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl text-slate-900 dark:text-white backdrop-blur-md z-[1000] border origin-top-right animate-in fade-in-50 zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 text-white border-0 font-bold px-1.5 py-0 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-0.5"
            >
              <Check className="h-3 w-3" />
              All Read
            </button>
          </div>
        </div>

        <ScrollArea className="max-h-[350px] overflow-y-auto pr-1">
          {visibleNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs font-semibold">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {['Today', 'Yesterday', 'Earlier'].map(groupName => {
                const groupItems = grouped[groupName];
                if (!groupItems || groupItems.length === 0) return null;
                
                return (
                  <div key={groupName} className="space-y-1">
                    <div className="px-3 py-1 flex items-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{groupName}</span>
                    </div>
                    {groupItems.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "relative mx-1 p-2 rounded-lg transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 group cursor-pointer flex gap-3",
                          notification.unread ? "bg-slate-50 dark:bg-slate-800/40" : ""
                        )}
                      >
                        {notification.unread && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-500 rounded-r-full" />
                        )}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                          {notification.icon}
                        </div>
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-xs font-bold truncate",
                                notification.unread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                              )}>
                                {notification.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[8px] font-semibold text-slate-500 whitespace-nowrap">{notification.time}</span>
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug break-words whitespace-pre-wrap">
                            {notification.message}
                          </p>
                          {notification.actions && notification.actions.length > 0 && (
                            activeCommentId === notification.id ? (
                              <div className="flex items-center gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                                  <Input 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Type your comment..."
                                    style={{ fontSize: '11px' }}
                                    className="h-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-2 py-0 focus-visible:ring-1 focus-visible:ring-orange-500"
                                    autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); submitCommentLeave(e, notification); }
                                  }}
                                />
                                <Button size="sm" onClick={(e) => submitCommentLeave(e, notification)} className="h-6 px-2 bg-orange-600 hover:bg-orange-700 text-[10px] font-bold text-white shrink-0">Send</Button>
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setActiveCommentId(null); setCommentText(''); }} className="h-6 px-1.5 text-slate-500 hover:text-slate-700 shrink-0"><X className="h-3 w-3" /></Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 mt-2">
                                {notification.actions.map(action => (
                                  <Button 
                                    key={action.label}
                                    size="sm" 
                                    variant={action.primary ? "default" : "outline"}
                                    className={cn("h-6 text-[10px] px-2 py-0", action.primary ? "bg-orange-600 hover:bg-orange-700 text-white" : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300")}
                                    onClick={(e) => handleActionClick(e, notification, action.actionType || '')}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-1 border-t border-slate-200 dark:border-slate-800 flex justify-end">
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
  );
}
