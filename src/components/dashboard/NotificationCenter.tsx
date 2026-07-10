import React, { useState } from 'react';
import { 
  Bell, Check, Trash2, Settings, ExternalLink, FileText, Clock, 
  UserPlus, Calendar, Target, AlertTriangle, Video, CheckSquare, ShieldAlert 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import TaskDetailsModal from './TaskDetailsModal';
import { useNotifications } from '@/context/NotificationContext';

export function NotificationCenter() {
  const { notifications, markAsRead: contextMarkAsRead, clearAll: contextClearAll, setNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState('All');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const handleApproveExtension = (notification: any) => {
    const { taskId, days, taskTitle, employeeName } = notification.metadata || {};
    if (!taskId || !days) {
      toast.error('Invalid extension request data.');
      return;
    }

    // 1. Extend task due date in local storage
    const savedTasks = localStorage.getItem('hindustaan_tasks_list');
    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks);
        let taskFound = false;
        const updatedTasks = tasks.map((t: any) => {
          if (t.id === taskId || String(t.id) === String(taskId)) {
            taskFound = true;
            const current = new Date(t.due_date);
            if (!isNaN(current.getTime())) {
              current.setDate(current.getDate() + Number(days));
              // Format back to YYYY-MM-DD
              const year = current.getFullYear();
              const month = String(current.getMonth() + 1).padStart(2, '0');
              const day = String(current.getDate()).padStart(2, '0');
              t.due_date = `${year}-${month}-${day}`;
            }
          }
          return t;
        });
        if (taskFound) {
          localStorage.setItem('hindustaan_tasks_list', JSON.stringify(updatedTasks));
          window.dispatchEvent(new Event('tasks-updated'));
        }
      } catch (e) {
        console.error('Error updating task list', e);
      }
    }

    // 2. Add notification to employee notification list
    const savedEmpNotifications = localStorage.getItem('hindustaan_employee_notifications');
    let empNotifications = [];
    if (savedEmpNotifications && savedEmpNotifications !== 'null') {
      try {
        empNotifications = JSON.parse(savedEmpNotifications);
      } catch (e) {
        console.error(e);
      }
    }
    const newEmpNotification = {
      id: Date.now(),
      category: 'Tasks',
      icon: '✅',
      title: 'Extension Request Approved',
      message: `Your request for a ${days}-day extension on "${taskTitle}" has been approved.`,
      time: 'Just now',
      unread: true,
      group: 'Today',
      priority: 'Success'
    };
    localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifications]));
    window.dispatchEvent(new Event('employee-notifications-updated'));

    // 3. Update notification message and clear actions
    setNotifications(prev => prev.map(n => {
      if (n.id === notification.id) {
        return {
          ...n,
          unread: false,
          message: `Approved: Extended deadline of "${taskTitle}" by ${days} days for ${employeeName}.`,
          actions: undefined
        };
      }
      return n;
    }));

    toast.success('Extension Approved!', {
      description: `Extended "${taskTitle}" by ${days} days.`
    });
  };

  const handleRejectExtension = (notification: any) => {
    const { taskTitle, employeeName } = notification.metadata || {};

    // 1. Add notification to employee notification list
    const savedEmpNotifications = localStorage.getItem('hindustaan_employee_notifications');
    let empNotifications = [];
    if (savedEmpNotifications && savedEmpNotifications !== 'null') {
      try {
        empNotifications = JSON.parse(savedEmpNotifications);
      } catch (e) {
        console.error(e);
      }
    }
    const newEmpNotification = {
      id: Date.now(),
      category: 'Tasks',
      icon: '❌',
      title: 'Extension Request Rejected',
      message: `Your request for an extension on "${taskTitle}" has been rejected.`,
      time: 'Just now',
      unread: true,
      group: 'Today',
      priority: 'Critical'
    };
    localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifications]));
    window.dispatchEvent(new Event('employee-notifications-updated'));

    // 2. Update notification message and clear actions
    setNotifications(prev => prev.map(n => {
      if (n.id === notification.id) {
        return {
          ...n,
          unread: false,
          message: `Rejected: Extension request for "${taskTitle}" by ${employeeName}.`,
          actions: undefined
        };
      }
      return n;
    }));

    toast.info('Extension Rejected', {
      description: `Rejection sent for "${taskTitle}".`
    });
  };

  const MOCK_TASK = {
    id: 'nt-1',
    title: 'Authentication Module',
    description: 'Implement secure login and registration flow with JWT.',
    project_tag: 'Frontend Core',
    assignee_name: 'Tanvy',
    assignee_id: 'u-4',
    priority: 'High',
    due_date: 'Oct 12, 2026',
    status: 'To Do',
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev: any) => prev.map((n: any) => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    contextMarkAsRead(id);
  };

  const clearAll = () => {
    contextClearAll();
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
      
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "p-0 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-[9999] flex flex-col",
          // Desktop (>1024px)
          "lg:w-[420px] lg:rounded-2xl lg:border lg:border-slate-200 lg:dark:border-slate-800 lg:h-auto lg:max-h-[85vh]",
          // Tablet (768px-1024px)
          "md:max-lg:!fixed md:max-lg:!top-3 md:max-lg:!right-3 md:max-lg:!bottom-3 md:max-lg:w-[360px] md:max-lg:h-[calc(100vh-24px)] md:max-lg:rounded-2xl md:max-lg:!translate-x-0 md:max-lg:!translate-y-0",
          // Mobile (<768px)
          "max-md:!fixed max-md:!top-0 max-md:!right-0 max-md:!bottom-0 max-md:w-[min(92vw,380px)] max-md:h-[100dvh] max-md:rounded-l-[24px] max-md:rounded-r-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:border-y-0 max-md:border-r-0 max-md:border-l max-md:shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
          // Dark mode exact match styling requested
          "dark:bg-[linear-gradient(180deg,rgba(15,18,40,0.98),rgba(10,12,30,0.98))] dark:border-[rgba(120,120,255,0.15)]",
          // Animation overrides for slide in
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "max-md:data-[state=open]:slide-in-from-right-full max-md:data-[state=closed]:slide-out-to-right-full max-md:transition-transform max-md:duration-300"
        )}
      >
        {/* Mobile Backdrop Overlay Hack (render inside the portal but positioned outside) */}
        <div className="md:hidden fixed inset-0 -z-10 bg-black/55 backdrop-blur-[6px] w-[100vw] h-[100vh] -translate-x-full pointer-events-none" />
        
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
            <TabsList className="h-8 w-full bg-slate-200/50 dark:bg-slate-800 p-0.5 grid grid-cols-5 gap-1 rounded-lg">
              {['All', 'Tasks', 'Projects', 'Team', 'System'].map(tab => (
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
        <ScrollArea className="flex-1 overflow-y-auto max-h-[100vh] pb-[env(safe-area-inset-bottom)]">
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
                            notification.unread 
                              ? "bg-indigo-500/10 dark:bg-[#6366F1]/12 border-l-2 border-l-indigo-500 dark:border-l-purple-500 shadow-sm" 
                              : "bg-slate-100 dark:bg-slate-800/50 grayscale opacity-70"
                          )}>
                            {notification.icon}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                "text-sm font-bold truncate",
                                notification.unread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                              )}>
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
                            
                            {notification.priority && (
                              <Badge variant="outline" className="mt-1 text-[9px] border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-900/20 font-bold uppercase tracking-wider">
                                Priority: {notification.priority}
                              </Badge>
                            )}

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
                                      if (action.actionType === 'approve_extension') {
                                        handleApproveExtension(notification);
                                      } else if (action.actionType === 'reject_extension') {
                                        handleRejectExtension(notification);
                                      } else {
                                        if (action.label === 'View Task') {
                                          setSelectedTask(MOCK_TASK);
                                        } else {
                                          toast.success(`Action "${action.label}" executed successfully!`);
                                        }
                                        markAsRead(notification.id); 
                                      }
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
        <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-3 gap-1">
          <Button variant="ghost" size="sm" onClick={() => toast.info('Navigating to all notifications...')} className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View All
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { clearAll(); toast.success('Notifications cleared'); }} className="h-8 text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(true)} className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg">
            <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
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
      currentUser={{ id: 'manager-1', role: 'manager', name: 'Admin User' }}
      isOpen={!!selectedTask}
      onClose={() => setSelectedTask(null)}
    />
    </>
  );
}
