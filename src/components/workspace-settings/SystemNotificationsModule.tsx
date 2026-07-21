import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, Shield, Wrench, Key, Sparkles, CreditCard, CheckCircle2, 
  Trash2, Pin, Check, ToggleLeft, AlertOctagon, HelpCircle, Info, BellRing
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  type: 'Security Alerts' | 'System Maintenance' | 'Login Activity' | 'Feature Updates' | 'Subscription Alerts';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
  isRead: boolean;
  isPinned: boolean;
}

const INITIAL_SYSTEM_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'sys-notif-1',
    title: 'Multiple Failed Login Attempts',
    description: 'We detected 5 failed login attempts on account admin@hindustaan.in from IP 192.168.1.105.',
    type: 'Security Alerts',
    priority: 'Critical',
    timestamp: '2026-07-14 10:22',
    isRead: false,
    isPinned: true
  },
  {
    id: 'sys-notif-2',
    title: 'Scheduled System Maintenance',
    description: 'Project OS services will undergo database server maintenance on Sunday, July 19, between 02:00 AM and 04:00 AM IST.',
    type: 'System Maintenance',
    priority: 'High',
    timestamp: '2026-07-13 18:00',
    isRead: false,
    isPinned: false
  },
  {
    id: 'sys-notif-3',
    title: 'New Integration: Slack Sync',
    description: 'You can now connect slack to sync task updates and employee standup reminders.',
    type: 'Feature Updates',
    priority: 'Low',
    timestamp: '2026-07-12 11:30',
    isRead: true,
    isPinned: false
  },
  {
    id: 'sys-notif-4',
    title: 'Subscription Seat Limit Alert',
    description: 'Your workspace has used 23 out of 25 available seats. Upgrade plan to invite more users.',
    type: 'Subscription Alerts',
    priority: 'Medium',
    timestamp: '2026-07-14 08:45',
    isRead: false,
    isPinned: false
  },
  {
    id: 'sys-notif-5',
    title: 'New Login from Windows PC',
    description: 'A new session was authenticated from Chrome on Windows, Mumbai, India.',
    type: 'Login Activity',
    priority: 'Medium',
    timestamp: '2026-07-14 09:12',
    isRead: true,
    isPinned: false
  }
];

export default function SystemNotificationsModule() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('projectos_sys_notif_settings');
    return saved ? JSON.parse(saved) : {
      browser: true,
      email: true,
      push: false
    };
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'security' | 'critical'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/system');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch system notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    localStorage.setItem('projectos_sys_notif_settings', JSON.stringify(settings));
  }, [settings]);

  const handleToggleSetting = (key: 'browser' | 'email' | 'push') => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings updated.');
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/system/${id}/read`);
      if (res.data?.success) {
        toast.success('Notification marked as read.');
        fetchNotifications();
      }
    } catch (err: any) {
      toast.error('Action failed', { description: err.response?.data?.message || err.message });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.post('/notifications/system/read-all');
      if (res.data?.success) {
        toast.success('All notifications marked as read.');
        fetchNotifications();
      }
    } catch (err: any) {
      toast.error('Action failed', { description: err.response?.data?.message || err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/notifications/system/${id}`);
      if (res.data?.success) {
        toast.success('Notification deleted.');
        fetchNotifications();
      }
    } catch (err: any) {
      toast.error('Delete failed', { description: err.response?.data?.message || err.message });
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/system/${id}/pin`);
      if (res.data?.success) {
        const isPinned = res.data.data.isPinned;
        toast.success(isPinned ? 'Notification pinned to top.' : 'Notification unpinned.');
        fetchNotifications();
      }
    } catch (err: any) {
      toast.error('Action failed', { description: err.response?.data?.message || err.message });
    }
  };

  // Filter application
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'security') return n.type === 'Security Alerts';
    if (activeFilter === 'critical') return n.priority === 'Critical';
    return true;
  });

  // Sort: pinned first, then timestamp desc
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Helper to resolve icon based on type
  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'Security Alerts': return <Shield className="h-5 w-5 text-rose-500" />;
      case 'System Maintenance': return <Wrench className="h-5 w-5 text-blue-500" />;
      case 'Login Activity': return <Key className="h-5 w-5 text-amber-500" />;
      case 'Feature Updates': return <Sparkles className="h-5 w-5 text-purple-500" />;
      case 'Subscription Alerts': return <CreditCard className="h-5 w-5 text-emerald-500" />;
      default: return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  // Helper to resolve priority badge styling
  const getPriorityBadge = (priority: SystemNotification['priority']) => {
    switch (priority) {
      case 'Critical': return <Badge className="bg-rose-500 text-white hover:bg-rose-600 border-0 font-bold">Critical</Badge>;
      case 'High': return <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-0 font-bold">High</Badge>;
      case 'Medium': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0 font-bold">Medium</Badge>;
      case 'Low': return <Badge className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-0 font-bold">Low</Badge>;
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-page-title text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <BellRing className="h-8 w-8 text-indigo-500" />
          System Notifications
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl">
          Manage alerts and system communication settings.
        </p>
      </div>

      {/* Settings Panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ToggleLeft className="h-4 w-4 text-orange-500" /> System Notification Routing
          </CardTitle>
          <CardDescription className="text-xs font-semibold">Configure routing preferences for system events.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850">
            <div>
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Browser Alerts</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Show notifications inside the app drawer.</p>
            </div>
            <Switch checked={settings.browser} onCheckedChange={() => handleToggleSetting('browser')} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850">
            <div>
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Email Routing</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Forward critical security events to admin email.</p>
            </div>
            <Switch checked={settings.email} onCheckedChange={() => handleToggleSetting('email')} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850">
            <div>
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Push Notifications</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Deliver native OS desktop push alerts.</p>
            </div>
            <Switch checked={settings.push} onCheckedChange={() => handleToggleSetting('push')} />
          </div>
        </CardContent>
      </Card>

      {/* Toolbar / Filters */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/50 p-1 w-full sm:w-auto justify-center sm:justify-start">
            {(['all', 'unread', 'security', 'critical'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                  activeFilter === filter 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800/40 dark:hover:text-white'
                }`}
              >
                {filter === 'all' ? 'All Alerts' : filter}
              </button>
            ))}
          </div>

          {notifications.some(n => !n.isRead) && (
            <Button 
              onClick={handleMarkAllAsRead} 
              variant="outline" 
              size="sm" 
              className="rounded-xl font-bold border-slate-200 dark:border-slate-800 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Check className="h-3.5 w-3.5 mr-1" /> Mark All as Read
            </Button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-800 h-[150px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Bell className="h-6 w-6 mb-1 text-slate-350" />
            <p className="text-xs font-semibold">No system notifications found.</p>
          </Card>
        ) : (
          sortedNotifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm transition-all relative overflow-hidden ${
                !notif.isRead ? 'border-l-4 border-l-[#5B7CFF]' : ''
              } ${notif.isPinned ? 'ring-1 ring-orange-500/30' : ''}`}
            >
              {notif.isPinned && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500" title="Pinned Alert">
                  <Pin className="h-3 w-3 fill-orange-500" />
                </div>
              )}

              <CardContent className="p-5 flex items-start gap-4">
                {/* Category Icon */}
                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1 pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{notif.title}</span>
                    {getPriorityBadge(notif.priority)}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{notif.type}</span>
                  </div>

                  <p className="text-xs font-medium text-slate-650 dark:text-slate-300 leading-relaxed">{notif.description}</p>
                  
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">{notif.timestamp}</p>
                </div>

                {/* Actions Panel */}
                <div className="flex items-center gap-1 self-center shrink-0">
                  {!notif.isRead && (
                    <Button 
                      onClick={() => handleMarkAsRead(notif.id)}
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                      title="Mark as Read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleTogglePin(notif.id)}
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${notif.isPinned ? 'text-orange-500' : 'text-slate-450'}`}
                    title={notif.isPinned ? "Unpin" : "Pin"}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleDelete(notif.id)}
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
