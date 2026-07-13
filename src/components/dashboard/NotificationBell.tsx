import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NotificationItem {
  id: number;
  category: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  group: string;
  metadata?: {
    requestId?: number;
    type?: string;
    employee?: string;
    date?: string;
  };
  actions?: { label: string; primary?: boolean; actionType: string }[];
  richContent?: boolean;
  details?: any;
}

const DEFAULT_MANAGER_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1689360000000 + 1,
    category: 'Leave Management',
    icon: '📅',
    title: 'New Leave Request',
    message: 'Tanvy Pandey applied for leave on July 15',
    time: '2 minutes ago',
    unread: true,
    group: 'Today',
    metadata: {
      requestId: 1,
      type: 'leave_request',
      employee: 'Tanvy Pandey',
      date: '2026-07-15'
    }
  },
  {
    id: 1689360000000 + 2,
    category: 'Tasks',
    icon: '📋',
    title: 'Task Assigned',
    message: 'Rahul Sharma assigned Authentication Module to Tanvy.',
    time: '1 hour ago',
    unread: true,
    group: 'Today'
  },
  {
    id: 1689360000000 + 3,
    category: 'Standups',
    icon: '📝',
    title: 'Standup Submitted',
    message: 'Priya Patel submitted her daily standup.',
    time: 'Yesterday',
    unread: false,
    group: 'Yesterday'
  }
];

const DEFAULT_EMPLOYEE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1689360000000 + 4,
    category: 'Leave Management',
    icon: '✅',
    title: 'Leave Approved',
    message: 'Manager approved your leave request for July 15',
    time: 'Just now',
    unread: true,
    group: 'Today',
    metadata: {
      type: 'leave_approved',
      date: '2026-07-15'
    }
  },
  {
    id: 1689360000000 + 5,
    category: 'Leave Management',
    icon: '💬',
    title: 'Leave Commented',
    message: 'Manager commented on your leave request',
    time: '5 mins ago',
    unread: true,
    group: 'Today',
    metadata: {
      type: 'leave_commented',
      date: '2026-07-15'
    }
  },
  {
    id: 1689360000000 + 6,
    category: 'Tasks',
    icon: '📋',
    title: 'New Task Assigned',
    message: 'You have been assigned: Dashboard Analytics UI. Due Tomorrow',
    time: '2 hours ago',
    unread: false,
    group: 'Today'
  }
];

interface NotificationBellProps {
  onNavigate?: (view: string) => void;
}

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const { user } = useUser();
  const role = user?.role || 'employee';
  const isManager = role === 'manager';

  const storageKey = isManager ? 'hindustaan_notifications' : 'hindustaan_employee_notifications';
  const defaultNotifications = isManager ? DEFAULT_MANAGER_NOTIFICATIONS : DEFAULT_EMPLOYEE_NOTIFICATIONS;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load and synchronize state
  const loadNotifications = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved && saved !== 'null') {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing notifications', e);
        setNotifications(defaultNotifications);
      }
    } else {
      localStorage.setItem(storageKey, JSON.stringify(defaultNotifications));
      setNotifications(defaultNotifications);
    }
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
    localStorage.setItem(storageKey, JSON.stringify(newNotifs));
    // Dispatch global events to notify context/other components
    window.dispatchEvent(new Event(isManager ? 'notifications-updated' : 'employee-notifications-updated'));
  };

  const currentUserName = user?.user_metadata?.name || user?.name || "Tanvy Pandey";
  const visibleNotifications = isManager ? notifications : notifications.filter(n => !n.metadata?.employeeName || n.metadata.employeeName === currentUserName);
  const unreadCount = visibleNotifications.filter(n => n.unread).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.map(n => ({ ...n, unread: false }));
    saveNotifications(updated);
    toast.success('All notifications marked as read');
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveNotifications([]);
    toast.success('Notifications cleared');
  };

  const handleActionClick = (e: React.MouseEvent, notification: NotificationItem, actionType: string) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("notification-action", { detail: { actionType, notification } }));
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // 1. Mark as read immediately
    const updated = notifications.map(n => n.id === notification.id ? { ...n, unread: false } : n);
    saveNotifications(updated);

    // 2. Perform cross-role routing and state changes
    if (isManager) {
      if (notification.metadata?.requestId) {
        localStorage.setItem('selected_leave_request_id', String(notification.metadata.requestId));
      }
      // Route manager to /manager/leave-management
      window.history.pushState({}, '', '/manager/leave-management');
      window.dispatchEvent(new Event('popstate'));
      if (onNavigate) {
        onNavigate('Leave Management');
      }
    } else {
      // Route employee to /employee/leave
      window.history.pushState({}, '', '/employee/leave');
      window.dispatchEvent(new Event('popstate'));
      if (onNavigate) {
        onNavigate('Leave Management');
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
        className="w-80 p-2 bg-slate-900/95 border-slate-800 rounded-xl shadow-2xl text-white backdrop-blur-md z-[1000] border origin-top-right animate-in fade-in-50 zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
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
              className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-0.5"
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
                          "relative mx-1 p-2 rounded-lg transition-all hover:bg-slate-800/80 group cursor-pointer flex gap-3",
                          notification.unread ? "bg-slate-800/40" : ""
                        )}
                      >
                        {notification.unread && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-500 rounded-r-full" />
                        )}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs">
                          {notification.icon}
                        </div>
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-xs font-bold truncate text-slate-100",
                              notification.unread ? "text-white" : "text-slate-300"
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-[8px] font-semibold text-slate-500 whitespace-nowrap shrink-0">{notification.time}</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 leading-snug break-words whitespace-pre-wrap">
                            {notification.message}
                          </p>
                          {notification.actions && notification.actions.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {notification.actions.map(action => (
                                <Button 
                                  key={action.label}
                                  size="sm" 
                                  variant={action.primary ? "default" : "outline"}
                                  className={cn("h-6 text-[10px] px-2 py-0", action.primary ? "bg-orange-600 hover:bg-orange-700" : "border-slate-700 text-slate-300")}
                                  onClick={(e) => handleActionClick(e, notification, action.actionType)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
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
          <div className="p-1 border-t border-slate-800 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll} 
              className="h-7 text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg w-full flex items-center justify-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear All
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
