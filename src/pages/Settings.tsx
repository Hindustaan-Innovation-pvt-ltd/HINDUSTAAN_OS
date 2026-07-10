import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, Bell, Palette, Link as LinkIcon, CheckCircle2, Moon, Sun, Monitor, ChevronLeft,
  Clock, Lock, Activity, FlaskConical, Users, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectedApps } from '../components/dashboard/settings/ConnectedApps';
import { Progress } from "@/components/ui/progress";
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';
import { updatePassword, getCurrentUser } from '@/lib/auth';

// Moved to inside component

export default function Settings({ session, defaultTab = null }: { session: any, defaultTab?: string | null }) {
  const { theme, themeMode, setThemeMode, toggleTheme, accentColor, setAccentColor, compactMode, setCompactMode } = useTheme();
  const role = session?.user?.user_metadata?.role || 'intern';
  

  const SETTINGS_SECTIONS = [
    { id: 'security', label: 'Account & Security', description: 'Manage your password and security preferences.', icon: Shield },
    { id: 'appearance', label: 'Appearance', description: 'Customize how the application looks on your device.', icon: Palette },
    { id: 'notifications', label: 'Notifications', description: 'Control how and when you receive alerts.', icon: Bell },
    { id: 'standups', label: 'Standup Settings', description: 'Customize daily standup reminders and formats.', icon: CheckCircle2 },
    { id: 'worklogs', label: 'Work Log Settings', description: 'Customize work tracking preferences.', icon: Clock },
    { id: 'privacy', label: 'Privacy', description: 'Manage data privacy and sharing.', icon: Lock },
    { id: 'integrations', label: 'Integrations', description: 'Manage your third-party integrations.', icon: LinkIcon },
    { id: 'activity', label: 'Activity Logs', description: 'View your recent account activity.', icon: Activity },
    { id: 'experimental', label: 'Experimental Features', description: 'Try out new beta features.', icon: FlaskConical },
  ];

  if (role === 'manager') {
    SETTINGS_SECTIONS.push(
      { id: 'team_standups', label: 'Team Standup Defaults', description: 'Configure standup schedule for your team.', icon: Users },
      { id: 'team_workhours', label: 'Team Work Hour Configuration', description: 'Set work hour targets for your team.', icon: Briefcase }
    );
  }

  const [activeTab, setActiveTab] = useState<string | null>(defaultTab || 'security');

  const [workLogSettings, setWorkLogSettings] = useState(() => {
    const saved = localStorage.getItem('worklog_settings');
    if (saved) return JSON.parse(saved);
    return {
      dailyGoal: 8,
      weeklyGoal: 40,
      enableTimer: true,
      autoTracking: false,
      autoStopLogout: true,
      startReminder: true,
      shortfallReminder: 'End of Day',
      viewPreference: 'Table View',
      autoSave: true,
      productivityInsights: true,
      exportPdf: true,
      exportCsv: false,
      exportCharts: true
    };
  });

  const updateWorkLogSetting = (key: string, value: any) => {
    setWorkLogSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const saveWorkLogSettings = () => {
    localStorage.setItem('worklog_settings', JSON.stringify(workLogSettings));
    toast.success('Work log settings saved successfully');
  };


  const [standupSettings, setStandupSettings] = useState(() => {
    const saved = localStorage.getItem('standup_settings');
    if (saved) return JSON.parse(saved);
    return {
      dailyReminder: true,
      reminderTime: '09:00',
      timeZone: 'Asia/Kolkata',
      submissionDeadline: '10:00 AM',
      formatYesterday: true,
      formatToday: true,
      formatBlockers: true,
      formatNotes: false,
      emailReminder: true,
      browserNotif: true,
      autoSendUnsubmitted: false,
    };
  });

  const updateStandupSetting = (key: string, value: any) => {
    setStandupSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const saveStandupSettings = () => {
    localStorage.setItem('standup_settings', JSON.stringify(standupSettings));
    toast.success('Standup settings saved successfully');
  };

  const [toggles, setToggles] = useState({
    taskAssigned: true,
    deadlineReminder: true,
    standupReminder: false,
    projectUpdates: true,
    emailNotif: true,
    pushNotif: true,
    twoFactor: false,
    compactMode: false
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { user, updateUser } = useUser();
  const avatarUrl = user?.avatar;
  const userName = user?.name || (role === 'manager' ? 'Aakash Gupta' : 'Tanvy Pandey');
  const userRole = user?.role || role;

const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Missing fields', { description: 'Please fill in both current and new passwords.' });
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Weak password', { description: 'New password must be at least 6 characters.' });
      return;
    }
    
    setIsUpdatingPassword(true);
    
    // Simulate slight network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      const user = getCurrentUser();
      if (!user) {
        toast.error('Authentication Error', { description: 'Please log in again to change password.' });
        return;
      }
      
      const result = updatePassword(user.email, currentPassword, newPassword);
      if (result.success) {
        toast.success('Success', { description: result.message });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        toast.error('Update Failed', { description: result.message });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'standups':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Standup Settings</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Customize how Daily Standups work.</p>
            </div>
            
            {role === 'manager' && (
              <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100">Manager Access</h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">As a manager, you can set the default standup schedule for your team here.</p>
                </div>
              </div>
            )}

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Daily Standup Reminder</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Receive a reminder to submit your standup.</p>
                  </div>
                  <Switch checked={standupSettings.dailyReminder} onCheckedChange={(val) => updateStandupSetting('dailyReminder', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Reminder Time</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">When should we remind you?</p>
                    </div>
                    <Input type="time" value={standupSettings.reminderTime} onChange={(e) => updateStandupSetting('reminderTime', e.target.value)} className="w-full sm:w-48 bg-white dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-700 font-medium focus:border-purple-500 focus:ring-purple-500/20" />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Time Zone</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Your local time zone.</p>
                    </div>
                    <Select value={standupSettings.timeZone} onValueChange={(val) => updateStandupSetting('timeZone', val)}>
                      <SelectTrigger className="w-full sm:w-64 bg-white dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-700 font-medium focus:ring-purple-500/20 focus:border-purple-500">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Standup Submission Deadline</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Time when standup is marked as late.</p>
                  </div>
                  <Select value={standupSettings.submissionDeadline} onValueChange={(val) => updateStandupSetting('submissionDeadline', val)}>
                    <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-700 font-medium focus:ring-purple-500/20 focus:border-purple-500">
                      <SelectValue placeholder="Select deadline" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="09:00 AM">9:00 AM</SelectItem>
                      <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                      <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                      <SelectItem value="Custom Time">Custom Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <CardTitle className="text-lg">Standup Format</CardTitle>
                <CardDescription>Select what sections are included in your daily standup.</CardDescription>
              </CardHeader>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="p-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Yesterday's Work</span>
                  <Switch checked={standupSettings.formatYesterday} onCheckedChange={(val) => updateStandupSetting('formatYesterday', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Today's Plan</span>
                  <Switch checked={standupSettings.formatToday} onCheckedChange={(val) => updateStandupSetting('formatToday', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Blockers</span>
                  <Switch checked={standupSettings.formatBlockers} onCheckedChange={(val) => updateStandupSetting('formatBlockers', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Additional Notes</span>
                  <Switch checked={standupSettings.formatNotes} onCheckedChange={(val) => updateStandupSetting('formatNotes', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Enable Email Reminder</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Send a quick email before the deadline.</p>
                  </div>
                  <Switch checked={standupSettings.emailReminder} onCheckedChange={(val) => updateStandupSetting('emailReminder', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Enable Browser Notification</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Show a push notification on your desktop.</p>
                  </div>
                  <Switch checked={standupSettings.browserNotif} onCheckedChange={(val) => updateStandupSetting('browserNotif', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Auto-send Reminder</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Send a final reminder if standup is not submitted on time.</p>
                  </div>
                  <Switch checked={standupSettings.autoSendUnsubmitted} onCheckedChange={(val) => updateStandupSetting('autoSendUnsubmitted', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
              </div>
            </Card>
            
            <div className="flex justify-end pt-4 pb-8">
              <Button onClick={saveStandupSettings} className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20 font-bold px-8 transition-transform active:scale-95">
                Save Changes
              </Button>
            </div>
          </div>
        );
      case 'worklogs':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Work Log Settings</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Customize work tracking and productivity preferences.</p>
            </div>
            
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Daily Work Goal (Hours)</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Your target hours per day.</p>
                    </div>
                    <Input type="number" value={workLogSettings.dailyGoal} onChange={(e) => updateWorkLogSetting('dailyGoal', Number(e.target.value))} className="w-full sm:w-48 bg-white dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-700 font-medium focus:border-purple-500 focus:ring-purple-500/20" />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Weekly Goal (Hours)</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Your target hours per week.</p>
                    </div>
                    <Input type="number" value={workLogSettings.weeklyGoal} onChange={(e) => updateWorkLogSetting('weeklyGoal', Number(e.target.value))} className="w-full sm:w-48 bg-white dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-700 font-medium focus:border-purple-500 focus:ring-purple-500/20" />
                  </div>
                </div>

                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Enable Work Timer</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Show a running timer in the dashboard.</p>
                  </div>
                  <Switch checked={workLogSettings.enableTimer} onCheckedChange={(val) => updateWorkLogSetting('enableTimer', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Enable Automatic Time Tracking</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Automatically log time spent active.</p>
                  </div>
                  <Switch checked={workLogSettings.autoTracking} onCheckedChange={(val) => updateWorkLogSetting('autoTracking', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Auto Stop Timer on Logout</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Stop any running timer when you log out.</p>
                  </div>
                  <Switch checked={workLogSettings.autoStopLogout} onCheckedChange={(val) => updateWorkLogSetting('autoStopLogout', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Reminder to Start Logging</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Remind if no work is logged during work hours.</p>
                  </div>
                  <Switch checked={workLogSettings.startReminder} onCheckedChange={(val) => updateWorkLogSetting('startReminder', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Shortfall Reminder</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">When to remind about low hours.</p>
                  </div>
                  <Select value={workLogSettings.shortfallReminder} onValueChange={(val) => updateWorkLogSetting('shortfallReminder', val)}>
                    <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-700 font-medium focus:ring-purple-500/20 focus:border-purple-500">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="Every 1 Hour">Every 1 Hour</SelectItem>
                      <SelectItem value="Every 2 Hours">Every 2 Hours</SelectItem>
                      <SelectItem value="End of Day">End of Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">View Preference</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Default layout for work logs.</p>
                  </div>
                  <Select value={workLogSettings.viewPreference} onValueChange={(val) => updateWorkLogSetting('viewPreference', val)}>
                    <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-700 font-medium focus:ring-purple-500/20 focus:border-purple-500">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="Timeline View">Timeline View</SelectItem>
                      <SelectItem value="Table View">Table View</SelectItem>
                      <SelectItem value="Calendar View">Calendar View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Auto-save Work Logs</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Automatically save draft work logs.</p>
                  </div>
                  <Switch checked={workLogSettings.autoSave} onCheckedChange={(val) => updateWorkLogSetting('autoSave', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                
                <div className="p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Enable Productivity Insights</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-purple-600/70 dark:group-hover:text-purple-400/70 transition-colors">Show AI suggestions for work efficiency.</p>
                  </div>
                  <Switch checked={workLogSettings.productivityInsights} onCheckedChange={(val) => updateWorkLogSetting('productivityInsights', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <CardTitle className="text-lg">Export Preferences</CardTitle>
                <CardDescription>Select what to include when exporting work logs.</CardDescription>
              </CardHeader>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="p-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Export as PDF</span>
                  <Switch checked={workLogSettings.exportPdf} onCheckedChange={(val) => updateWorkLogSetting('exportPdf', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Export as CSV</span>
                  <Switch checked={workLogSettings.exportCsv} onCheckedChange={(val) => updateWorkLogSetting('exportCsv', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Include Charts</span>
                  <Switch checked={workLogSettings.exportCharts} onCheckedChange={(val) => updateWorkLogSetting('exportCharts', val)} className="data-[state=checked]:bg-purple-600" />
                </div>
              </div>
            </Card>

            <div className="flex justify-end pt-4 pb-8">
              <Button onClick={saveWorkLogSettings} className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20 font-bold px-8 transition-transform active:scale-95">
                Save Changes
              </Button>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account & Security</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your password and security preferences.</p>
            </div>
            
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Change Password</CardTitle>
                <CardDescription className="font-semibold text-xs">Ensure your account is using a long, random password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Current Password</label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">New Password</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700" />
                </div>
                <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold mt-2">
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Two-Factor Authentication</h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                  </div>
                  <Switch checked={toggles.twoFactor} onCheckedChange={() => handleToggle('twoFactor')} />
                </div>
                
                <div className="p-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Active Sessions & Login History</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-500/5">
                      <div className="flex items-center gap-3">
                        <MonitorSmartphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Windows PC • Chrome</p>
                          <p className="text-xs font-medium text-slate-500">Mumbai, India • Current Session</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100 border-0 font-bold">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center gap-3">
                        <MonitorSmartphone className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">MacBook Pro • Safari</p>
                          <p className="text-xs font-medium text-slate-500">Bengaluru, India • July 5, 2026</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold">Revoke</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Control how and when you receive alerts.</p>
            </div>
            
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Task Assigned</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">When a new task is assigned to you.</p>
                  </div>
                  <Switch checked={toggles.taskAssigned} onCheckedChange={() => handleToggle('taskAssigned')} />
                </div>
                <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Deadline Reminder</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">24 hours before a task is due.</p>
                  </div>
                  <Switch checked={toggles.deadlineReminder} onCheckedChange={() => handleToggle('deadlineReminder')} />
                </div>
                <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Standup Reminder</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Daily reminder to submit your standup.</p>
                  </div>
                  <Switch checked={toggles.standupReminder} onCheckedChange={() => handleToggle('standupReminder')} />
                </div>
                <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Project Updates</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">When milestones are reached.</p>
                  </div>
                  <Switch checked={toggles.projectUpdates} onCheckedChange={() => handleToggle('projectUpdates')} />
                </div>
              </div>
            </Card>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-8 mb-4">Delivery Methods</h3>
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Email Notifications</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Receive digests and critical alerts via email.</p>
                  </div>
                  <Switch checked={toggles.emailNotif} onCheckedChange={() => handleToggle('emailNotif')} />
                </div>
                <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Push Notifications</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Browser notifications for real-time updates.</p>
                  </div>
                  <Switch checked={toggles.pushNotif} onCheckedChange={() => handleToggle('pushNotif')} />
                </div>
              </div>
            </Card>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Appearance</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Customize how the application looks on your device.</p>
            </div>
            
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Theme Preferences</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setThemeMode('light')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        themeMode === 'light' ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-orange-200"
                      )}
                    >
                      <Sun className={cn("h-8 w-8", themeMode === 'light' ? "text-orange-600" : "text-slate-400")} />
                      <span className={cn("text-sm font-bold", themeMode === 'light' ? "text-orange-700 dark:text-orange-400" : "text-slate-600 dark:text-slate-400")}>Light Theme</span>
                    </button>
                    
                    <button 
                      onClick={() => setThemeMode('dark')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        themeMode === 'dark' ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-orange-200"
                      )}
                    >
                      <Moon className={cn("h-8 w-8", themeMode === 'dark' ? "text-orange-600" : "text-slate-400")} />
                      <span className={cn("text-sm font-bold", themeMode === 'dark' ? "text-orange-700 dark:text-orange-400" : "text-slate-600 dark:text-slate-400")}>Dark Theme</span>
                    </button>

                    <button 
                      onClick={() => setThemeMode('system')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        themeMode === 'system' ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-orange-200"
                      )}
                    >
                      <Monitor className={cn("h-8 w-8", themeMode === 'system' ? "text-orange-600" : "text-slate-400")} />
                      <span className={cn("text-sm font-bold", themeMode === 'system' ? "text-orange-700 dark:text-orange-400" : "text-slate-600 dark:text-slate-400")}>System Theme</span>
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Accent Color</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setAccentColor('orange')} className={cn("h-8 w-8 rounded-full bg-[#f97316] hover:scale-110 transition-transform", accentColor === 'orange' && "ring-4 ring-[#f97316]/30 dark:ring-[#f97316]/50")}></button>
                    <button onClick={() => setAccentColor('blue')} className={cn("h-8 w-8 rounded-full bg-[#3b82f6] hover:scale-110 transition-transform", accentColor === 'blue' && "ring-4 ring-[#3b82f6]/30 dark:ring-[#3b82f6]/50")}></button>
                    <button onClick={() => setAccentColor('emerald')} className={cn("h-8 w-8 rounded-full bg-[#10b981] hover:scale-110 transition-transform", accentColor === 'emerald' && "ring-4 ring-[#10b981]/30 dark:ring-[#10b981]/50")}></button>
                    <button onClick={() => setAccentColor('rose')} className={cn("h-8 w-8 rounded-full bg-[#f43f5e] hover:scale-110 transition-transform", accentColor === 'rose' && "ring-4 ring-[#f43f5e]/30 dark:ring-[#f43f5e]/50")}></button>
                    <button onClick={() => setAccentColor('purple')} className={cn("h-8 w-8 rounded-full bg-[#a855f7] hover:scale-110 transition-transform", accentColor === 'purple' && "ring-4 ring-[#a855f7]/30 dark:ring-[#a855f7]/50")}></button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Compact Mode</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Reduce spacing to fit more content on screen.</p>
                  </div>
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 min-h-[calc(100vh-4rem)]">
      {!activeTab ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings Overview</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Manage your account preferences and application configuration.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Card 
                  key={section.id} 
                  onClick={() => setActiveTab(section.id)}
                  className="cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-500 dark:hover:border-orange-500/50 hover:shadow-md transition-all group"
                >
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{section.label}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{section.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab(null)} 
              className="rounded-xl font-bold h-10 px-4 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-4"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Overview
            </Button>
          </div>
          <div className="max-w-4xl mx-auto pb-12">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}
