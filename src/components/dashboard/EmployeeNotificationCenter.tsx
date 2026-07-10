import React, { useState } from 'react';
import { 
  Bell, Check, Trash2, Settings, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import TaskDetailsModal from './TaskDetailsModal';

type Priority = 'Critical' | 'Important' | 'Success' | 'Information';

// Dummy data matching the prompt requirements
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    category: 'Tasks',
    icon: '📋',
    title: 'New Task',
    message: 'New task assigned: Dashboard Analytics UI. Due Tomorrow',
    time: '2 minutes ago',
    unread: true,
    group: 'Today',
    priority: 'Important' as Priority,
    actions: [
      { label: 'View Task', primary: true }
    ]
  },
  {
    id: 2,
    category: 'Tasks',
    icon: '🚨',
    title: 'Deadline Reminder',
    message: 'Your Login Page task is due today.',
    time: '1 hour ago',
    unread: true,
    group: 'Today',
    priority: 'Critical' as Priority,
  },
  {
    id: 3,
    category: 'Tasks',
    icon: '✅',
    title: 'Task Status Updated',
    message: 'Manager approved your Dashboard UI.',
    time: '2 hours ago',
    unread: false,
    group: 'Today',
    priority: 'Success' as Priority,
  },
  {
    id: 4,
    category: 'Standups',
    icon: '📝',
    title: 'Standup Reminder',
    message: "Don't forget to submit today's standup.",
    time: '3 hours ago',
    unread: true,
    group: 'Today',
    priority: 'Important' as Priority,
    actions: [
      { label: 'Submit Now', primary: true }
    ]
  },
  {
    id: 5,
    category: 'Work Logs',
    icon: '⏱',
    title: 'Work Log Approved',
    message: 'Your work log has been approved.',
    time: '5 hours ago',
    unread: false,
    group: 'Today',
    priority: 'Success' as Priority,
  },
  {
    id: 6,
    category: 'All', // General
    icon: '🏆',
    title: 'Contribution Update',
    message: 'Your contribution score increased to 91%.',
    time: 'Yesterday',
    unread: false,
    group: 'Yesterday',
    priority: 'Success' as Priority,
  },
  {
    id: 7,
    category: 'Tasks',
    icon: '🎯',
    title: 'Milestone Completed',
    message: 'Sprint 2 milestone completed. Great job!',
    time: 'Yesterday',
    unread: false,
    group: 'Yesterday',
    priority: 'Success' as Priority,
  },
  {
    id: 8,
    category: 'Tasks',
    icon: '💬',
    title: 'Manager Comment',
    message: 'Ajay commented on your task.',
    time: 'Yesterday',
    unread: false,
    group: 'Yesterday',
    priority: 'Important' as Priority,
    actions: [
      { label: 'Read Comment', primary: true }
    ]
  },
  {
    id: 9,
    category: 'All', // General
    icon: '📅',
    title: 'Meeting Reminder',
    message: 'Frontend Standup starts in 10 minutes.',
    time: '2 days ago',
    unread: false,
    group: 'Earlier',
    priority: 'Important' as Priority,
  },
  {
    id: 10,
    category: 'All', // General
    icon: '📚',
    title: 'New Resource',
    message: 'Figma Design System.pdf shared with you.',
    time: '3 days ago',
    unread: false,
    group: 'Earlier',
    priority: 'Information' as Priority,
    actions: [
      { label: 'Open File', primary: true }
    ]
  }
];

export function EmployeeNotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_employee_notifications');
    if (saved && saved !== 'null') {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing employee notifications', e);
      }
    }
    localStorage.setItem('hindustaan_employee_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  });

  React.useEffect(() => {
    localStorage.setItem('hindustaan_employee_notifications', JSON.stringify(notifications));
  }, [notifications]);

  React.useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('hindustaan_employee_notifications');
      if (saved && saved !== 'null') {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('employee-notifications-updated', handleSync);
    return () => {
      window.removeEventListener('employee-notifications-updated', handleSync);
    };
  }, []);

  const [activeTab, setActiveTab] = useState('All');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const MOCK_TASK = {
    id: 'nt-2',
    title: 'Dashboard Analytics UI',
    description: 'Design the new charts layout for the analytics page using recharts.',
    project_tag: 'Frontend Core',
    assignee_name: 'Employee',
    assignee_id: 'u-1',
    priority: 'Normal',
    due_date: 'Oct 15, 2026',
    status: 'In Progress',
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = activeTab === 'All' 
    ? notifications 
    : notifications.filter(n => n.category === activeTab);

  // Group notifications
  const grouped = filteredNotifications.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, typeof notifications>);

  const getPriorityStyles = (priority: Priority) => {
    switch(priority) {
      case 'Critical': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
      case 'Important': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
      case 'Success': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'Information': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };
  
  const getPriorityDot = (priority: Priority) => {
    switch(priority) {
      case 'Critical': return 'bg-rose-500';
      case 'Important': return 'bg-orange-500';
      case 'Success': return 'bg-emerald-500';
      case 'Information': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button" 
          className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 relative transition-colors duration-200 outline-none"
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[380px] p-0 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-0 font-bold px-1.5 py-0">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition-colors flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            </div>
          </div>
          
          <Tabs defaultValue="All" onValueChange={setActiveTab}>
            <TabsList className="h-8 w-full bg-slate-200/50 dark:bg-slate-800 p-0.5 grid grid-cols-4 gap-1 rounded-lg">
              {['All', 'Tasks', 'Work Logs', 'Standups'].map(tab => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="text-[10px] font-bold rounded-md px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-sm"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="h-[400px]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
              <Bell className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm font-medium">No notifications found.</p>
            </div>
          ) : (
            <div className="p-2 space-y-4">
              {['Today', 'Yesterday', 'Earlier'].map(groupName => {
                const groupItems = grouped[groupName];
                if (!groupItems || groupItems.length === 0) return null;
                
                return (
                  <div key={groupName} className="space-y-1">
                    <div className="px-3 py-1.5 flex items-center sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur z-10">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{groupName}</span>
                    </div>
                    {groupItems.map((notification: any) => (
                      <div 
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={cn(
                          "relative p-3 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group cursor-pointer",
                          notification.unread ? "bg-orange-50/50 dark:bg-orange-900/10" : ""
                        )}
                      >
                        {notification.unread && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full" />
                        )}
                        <div className="flex gap-3">
                          <div className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base",
                            notification.unread ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700" : "bg-slate-100 dark:bg-slate-800/50 grayscale opacity-70"
                          )}>
                            {notification.icon}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                "text-sm font-bold truncate flex items-center gap-1.5",
                                notification.unread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                              )}>
                                <span className={cn("h-1.5 w-1.5 rounded-full", getPriorityDot(notification.priority))} />
                                {notification.title}
                              </p>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">{notification.time}</span>
                            </div>
                            <p className={cn(
                              "text-xs font-medium leading-relaxed",
                              notification.unread ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
                            )}>
                              {notification.message}
                            </p>
                            
                            {notification.actions && (
                              <div className="flex items-center gap-2 mt-3">
                                {notification.actions.map((action: any, i: number) => (
                                  <Button 
                                    key={i}
                                    variant={action.primary ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                      "h-7 text-xs font-bold rounded-lg px-3",
                                      action.primary ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                    )}
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (action.label === 'View Task') {
                                        setSelectedTask(MOCK_TASK);
                                      } else {
                                        toast.success(`Action "${action.label}" executed successfully!`);
                                      }
                                      markAsRead(notification.id); 
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={() => toast.info('Navigating to all notifications...')} className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View All Notifications
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(true)} className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg">
            <Settings className="mr-1.5 h-3.5 w-3.5" /> Notification Settings
          </Button>
        </div>

      </DropdownMenuContent>
    </DropdownMenu>

    {/* Settings Dialog */}
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Notification Settings</DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Manage how you receive alerts and updates.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-slate-900 dark:text-white">Push Notifications</Label>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Receive alerts inside the app.</p>
            </div>
            <Switch defaultChecked onCheckedChange={(checked) => toast.success(`Push notifications ${checked ? 'enabled' : 'disabled'}`)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-slate-900 dark:text-white">Email Digests</Label>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Receive daily summary emails.</p>
            </div>
            <Switch defaultChecked onCheckedChange={(checked) => toast.success(`Email digests ${checked ? 'enabled' : 'disabled'}`)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-slate-900 dark:text-white">Mention Alerts</Label>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Notify me when someone mentions me.</p>
            </div>
            <Switch defaultChecked onCheckedChange={(checked) => toast.success(`Mention alerts ${checked ? 'enabled' : 'disabled'}`)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Task Details Modal */}
    <TaskDetailsModal 
      task={selectedTask}
      currentUser={{ id: 'u-1', role: 'intern', name: 'Employee' }}
      isOpen={!!selectedTask}
      onClose={() => setSelectedTask(null)}
    />
    </>
  );
}
