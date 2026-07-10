import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, Shield, Bell, Palette, Link as LinkIcon, Database, Globe, HelpCircle, 
  Download, MonitorSmartphone, CheckCircle2, Moon, Sun, Monitor, ChevronLeft, Clock,
  Eye, EyeOff, QrCode, Smartphone, Laptop, AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ConnectedApps } from '../components/dashboard/settings/ConnectedApps';
import { Progress } from "@/components/ui/progress";
import { useTheme } from '../context/ThemeContext';
import { updatePassword } from '@/lib/auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const SETTINGS_SECTIONS = [
  { id: 'security', label: 'Account & Security', description: 'Manage your password and security preferences.', icon: Shield },
  { id: 'notifications', label: 'Notifications', description: 'Control how and when you receive alerts.', icon: Bell },
  { id: 'appearance', label: 'Appearance', description: 'Customize how the application looks on your device.', icon: Palette },
  { id: 'standup', label: 'Standup Settings', description: 'Customize daily standups and reminders.', icon: Clock },
  { id: 'apps', label: 'Connected Apps', description: 'Manage your third-party integrations.', icon: LinkIcon },
  { id: 'data', label: 'Data & Storage', description: 'Manage local cache and export your data.', icon: Database },
  { id: 'language', label: 'Language & Region', description: 'Customize your localization settings.', icon: Globe },
  { id: 'help', label: 'Help & Support', description: 'Get assistance and read documentation.', icon: HelpCircle },
];

export default function Settings({ session }: { session: any }) {
  const { theme, toggleTheme } = useTheme();
  const role = session?.user?.user_metadata?.role || 'intern';
  
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [storageUsed, setStorageUsed] = useState(45);

  const handleClearCache = () => {
    const sessionUser = localStorage.getItem('hindustaan_user');
    const sessionUserS = sessionStorage.getItem('hindustaan_user');
    const users = localStorage.getItem('hindustaan_users');

    localStorage.clear();
    sessionStorage.clear();

    if (sessionUser) localStorage.setItem('hindustaan_user', sessionUser);
    if (sessionUserS) sessionStorage.setItem('hindustaan_user', sessionUserS);
    if (users) localStorage.setItem('hindustaan_users', users);

    setStorageUsed(1.2);
    toast.success("Cache cleared successfully", {
      description: "Application cache and temporary state have been reset."
    });
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Page Title
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("Project OS - Workspace Summary Report", 14, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 35, 196, 35);
      
      // Safe JSON LocalStorage Loader Helper
      const getJSONData = (key: string, fallback: any) => {
        try {
          const val = localStorage.getItem(key);
          if (!val || val === 'null' || val === 'undefined') return fallback;
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : fallback;
        } catch (e) {
          return fallback;
        }
      };
      
      // Load Workspace Data
      const logs = getJSONData('work_logs_list_v4', getJSONData('work_logs_list', [
        { date: "Jul 10, 2026", name: "Amanda Smith", project: "Frontend Core", task: "Component Refactoring", hours: 8.5, status: "Approved" },
        { date: "Jul 10, 2026", name: "Rahul Sharma", project: "Backend Core", task: "Database Optimization", hours: 7.2, status: "Approved" },
        { date: "Jul 10, 2026", name: "Tanvy Pandey", project: "Frontend Core", task: "Kanban Board & Work Logs", hours: 6.0, status: "Pending" }
      ]));
      
      const tasks = getJSONData('hindustaan_tasks_list', [
        { title: "Design System Setup", status: "Done", assignee_name: "Amanda Smith", project_tag: "ProjectOS Redesign", priority: "High" },
        { title: "Authentication Flow", status: "Done", assignee_name: "Rahul Sharma", project_tag: "ProjectOS Redesign", priority: "High" },
        { title: "Dashboard Layout", status: "In Progress", assignee_name: "Priya Patel", project_tag: "ProjectOS Redesign", priority: "Medium" }
      ]);
      
      const standups = getJSONData('hindustaan_standups', [
        { user: "Tanvy", role: "Frontend Developer", yesterday: "Finished responsive layout.", today: "Kanban drag-and-drop.", blockers: "None." },
        { user: "Rahul Sharma", role: "Backend Developer", yesterday: "Database schema setup.", today: "REST API endpoints.", blockers: "None." }
      ]);

      // 1. Work Logs Section
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Recent Work Logs", 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Date', 'Employee', 'Project', 'Task', 'Hours', 'Status']],
        body: logs.map((l: any) => [
          l.date || l.formattedDate || '', 
          l.name || l.employeeName || '', 
          l.project || '', 
          l.task || '', 
          `${l.hours || 0}h`, 
          l.status || 'Approved'
        ]),
        headStyles: { fillColor: [91, 124, 255] },
        theme: 'striped'
      });
      
      const nextY1 = (doc as any).lastAutoTable.finalY + 15;
      
      // 2. Tasks Section
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Tasks Summary", 14, nextY1);
      
      autoTable(doc, {
        startY: nextY1 + 5,
        head: [['Task Title', 'Status', 'Assignee', 'Project', 'Priority']],
        body: tasks.map((t: any) => [
          t.title || '', 
          t.status || '', 
          t.assignee_name || t.assignee || 'Unassigned', 
          t.project_tag || '', 
          t.priority || 'Medium'
        ]),
        headStyles: { fillColor: [168, 85, 247] },
        theme: 'striped'
      });
      
      const nextY2 = (doc as any).lastAutoTable.finalY + 15;
      
      // 3. Standups Section
      let startStandupY = nextY2 + 5;
      if (nextY2 > 240) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("3. Daily Standups", 14, 20);
        startStandupY = 25;
      } else {
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("3. Daily Standups", 14, nextY2);
      }
      
      autoTable(doc, {
        startY: startStandupY,
        head: [['User', 'Role', 'Yesterday\'s Work', 'Today\'s Plan', 'Blockers']],
        body: standups.map((s: any) => [
          s.user || '', 
          s.role || '', 
          s.yesterday || '', 
          s.today || '', 
          s.blockers || 'None'
        ]),
        headStyles: { fillColor: [16, 185, 129] },
        theme: 'striped'
      });
      
      // Use Blob and anchor element for maximum browser download reliability
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Project_OS_Workspace_Report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("PDF Report Downloaded");
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to generate PDF report: ${error?.message || error}`);
    }
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

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [twoFactorDisableModalOpen, setTwoFactorDisableModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => localStorage.getItem('twoFactorEnabled') === 'true');

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('loginSessions');
    return saved ? JSON.parse(saved) : [
      { id: 1, device: "Windows PC", browser: "Chrome", location: "Mumbai, India", date: "Current Session", current: true },
      { id: 2, device: "MacBook Pro", browser: "Safari", location: "Bengaluru, India", date: "July 5, 2026", current: false }
    ];
  });
  const [sessionToRevoke, setSessionToRevoke] = useState<number | null>(null);

  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { label: '', color: 'bg-slate-200 dark:bg-slate-800', width: '0%' };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    
    if (strength <= 2) return { label: 'Weak', color: 'bg-rose-500', width: '33%' };
    if (strength === 3) return { label: 'Medium', color: 'bg-amber-500', width: '66%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const handleUpdatePassword = () => {
    if (!currentPassword) return toast.error('Current password required.');
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return toast.error('Password does not meet requirements.');
    }
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      
      const userEmail = session?.user?.email || (role === 'manager' ? 'manager1@hindustaan.in' : 'employee1@hindustaan.in');
      const result = updatePassword(userEmail, currentPassword, newPassword);
      
      if (result.success) {
        toast.success(result.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        localStorage.setItem('passwordUpdated', Date.now().toString());
      } else {
        toast.error('Authentication Error', { description: result.message });
      }
    }, 1500);
  };

  const handleEnable2FA = () => {
    if (otpValue === '123456') {
      setTwoFactorEnabled(true);
      localStorage.setItem('twoFactorEnabled', 'true');
      setTwoFactorModalOpen(false);
      setOtpValue('');
      toast.success('Two Factor Authentication Enabled');
    } else {
      toast.error('Invalid verification code');
    }
  };

  const handleDisable2FA = () => {
    setTwoFactorEnabled(false);
    localStorage.setItem('twoFactorEnabled', 'false');
    setTwoFactorDisableModalOpen(false);
    toast.success('Two Factor Authentication Disabled');
  };

  const handleRevokeSession = () => {
    if (sessionToRevoke !== null) {
      const updated = sessions.filter((s: any) => s.id !== sessionToRevoke);
      setSessions(updated);
      localStorage.setItem('loginSessions', JSON.stringify(updated));
      setSessionToRevoke(null);
      toast.success('Session revoked.');
    }
  };

  const [standupSettings, setStandupSettings] = useState(() => {
    const saved = localStorage.getItem('standupSettings');
    return saved ? JSON.parse(saved) : {
      dailyReminder: true,
      reminderTime: '09:00 AM',
      timeZone: 'Asia/Kolkata',
      deadline: '10:00 AM',
      formatYesterday: true,
      formatToday: true,
      formatBlockers: true,
      formatNotes: true,
      emailReminder: true,
      browserNotification: true,
      autoSendReminder: false
    };
  });

  const handleStandupToggle = (key: keyof typeof standupSettings) => {
    setStandupSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStandupSelect = (key: string, value: string) => {
    setStandupSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const saveStandupSettings = () => {
    localStorage.setItem('standupSettings', JSON.stringify(standupSettings));
    toast.success('Standup Settings Saved', { description: 'Your preferences have been updated successfully.' });
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'standup':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Standup Settings</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Customize how Daily Standups work for you {role === 'manager' && 'and your team'}.</p>
            </div>
            
            <Card className="rounded-2xl border-violet-500/20 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
              <CardContent className="p-6 space-y-6">
                
                {/* Reminders & Timings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Timings & Alerts</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Daily Standup Reminder</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Receive an alert to submit your standup.</p>
                    </div>
                    <Switch checked={standupSettings.dailyReminder} onCheckedChange={() => handleStandupToggle('dailyReminder')} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Reminder Time</label>
                      <Select value={standupSettings.reminderTime} onValueChange={(val) => handleStandupSelect('reminderTime', val)}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/50 font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Time Zone</label>
                      <Select value={standupSettings.timeZone} onValueChange={(val) => handleStandupSelect('timeZone', val)}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/50 font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Submission Deadline</label>
                    <Select value={standupSettings.deadline} onValueChange={(val) => handleStandupSelect('deadline', val)}>
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/50 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                        <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                        <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                        <SelectItem value="Custom">Custom Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Format Toggles */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4">Standup Format Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'formatYesterday', label: "Yesterday's Work" },
                      { key: 'formatToday', label: "Today's Plan" },
                      { key: 'formatBlockers', label: "Blockers" },
                      { key: 'formatNotes', label: "Additional Notes" }
                    ].map(fmt => (
                      <div key={fmt.key} className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{fmt.label}</span>
                        <Switch checked={standupSettings[fmt.key as keyof typeof standupSettings] as boolean} onCheckedChange={() => handleStandupToggle(fmt.key as keyof typeof standupSettings)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifications & Automation */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4">Notifications & Automation</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailReminder', label: 'Enable Email Reminder', desc: 'Receive a daily email prompting your standup.' },
                      { key: 'browserNotification', label: 'Enable Browser Notification', desc: 'Get a push notification in your browser.' },
                      { key: 'autoSendReminder', label: 'Auto-send reminder if missed', desc: 'Automatically nudge if standup is not submitted by deadline.' }
                    ].map(notif => (
                      <div key={notif.key} className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{notif.label}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{notif.desc}</p>
                        </div>
                        <Switch checked={standupSettings[notif.key as keyof typeof standupSettings] as boolean} onCheckedChange={() => handleStandupToggle(notif.key as keyof typeof standupSettings)} />
                      </div>
                    ))}
                  </div>
                </div>

                {role === 'manager' && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Manager Access</h3>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-3">You can enforce these standup configurations as the default for your entire team.</p>
                      <Button variant="outline" className="text-xs font-bold border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">Set as Team Default</Button>
                    </div>
                  </div>
                )}
                
              </CardContent>
              <CardFooter className="p-6 pt-0 flex justify-end">
                <Button onClick={saveStandupSettings} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold px-8 shadow-md">
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      case 'security':
        const pwdStrength = calculatePasswordStrength(newPassword);
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
                <div className="space-y-1.5 max-w-md relative">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Current Password</label>
                  <div className="relative">
                    <Input type={showPassword.current ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 pr-10" />
                    <button type="button" onClick={() => setShowPassword(p => ({...p, current: !p.current}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 max-w-md relative">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <Input type={showPassword.new ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 pr-10" />
                    <button type="button" onClick={() => setShowPassword(p => ({...p, new: !p.new}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Strength</div>
                        <div className={`text-[10px] font-bold uppercase ${pwdStrength.color.replace('bg-', 'text-')}`}>{pwdStrength.label}</div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${pwdStrength.color}`} style={{ width: pwdStrength.width }}></div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 max-w-md relative">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <div className="relative">
                    <Input type={showPassword.confirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 pr-10" />
                    <button type="button" onClick={() => setShowPassword(p => ({...p, confirm: !p.confirm}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button disabled={isUpdatingPassword} onClick={handleUpdatePassword} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold mt-2">
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Two-Factor Authentication</h3>
                      {twoFactorEnabled && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400">2FA Enabled</Badge>}
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                  </div>
                  <Switch checked={twoFactorEnabled} onCheckedChange={(checked) => {
                    if (checked) setTwoFactorModalOpen(true);
                    else setTwoFactorDisableModalOpen(true);
                  }} />
                </div>
                
                <div className="p-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Active Sessions & Login History</h3>
                  <div className="space-y-3">
                    {sessions.map((s: any) => (
                      <div key={s.id} className={cn("flex items-center justify-between p-3 rounded-xl border", s.current ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-500/5" : "border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30")}>
                        <div className="flex items-center gap-3">
                          {s.device.includes('PC') || s.device.includes('Mac') ? <Laptop className={cn("h-5 w-5", s.current ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")} /> : <Smartphone className={cn("h-5 w-5", s.current ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")} />}
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{s.device} • {s.browser}</p>
                            <p className="text-xs font-medium text-slate-500">{s.location} • {s.date}</p>
                          </div>
                        </div>
                        {s.current ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100 border-0 font-bold">Active</Badge>
                        ) : (
                          <Button onClick={() => setSessionToRevoke(s.id)} variant="ghost" size="sm" className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold">Revoke</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modals */}
            <Dialog open={twoFactorModalOpen} onOpenChange={setTwoFactorModalOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-white">Enable Two Factor Authentication</DialogTitle>
                  <DialogDescription className="text-slate-500">Scan this QR code with your authenticator app.</DialogDescription>
                </DialogHeader>
                <div className="py-4 flex flex-col items-center gap-6">
                  <div className="p-4 bg-white rounded-xl border-2 border-slate-100 shadow-sm">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                  <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center block">Secret Key</label>
                    <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-center font-mono text-sm tracking-widest text-slate-900 dark:text-white select-all">
                      PRJ-OS-4K8D-92JS-7HF2
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center block">Enter 6-digit Code</label>
                    <Input type="text" maxLength={6} placeholder="123456" value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} className="text-center tracking-[1em] font-mono text-lg rounded-xl h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTwoFactorModalOpen(false)} className="rounded-xl border-slate-200 dark:border-slate-700">Cancel</Button>
                  <Button onClick={handleEnable2FA} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">Verify & Enable</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={twoFactorDisableModalOpen} onOpenChange={setTwoFactorDisableModalOpen}>
              <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-200 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-rose-600"><AlertTriangle className="h-5 w-5"/> Disable Two Factor Authentication?</DialogTitle>
                  <DialogDescription className="text-slate-500">This will reduce the security of your account. Are you sure?</DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setTwoFactorDisableModalOpen(false)} className="rounded-xl border-slate-200 dark:border-slate-700">Cancel</Button>
                  <Button onClick={handleDisable2FA} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">Disable</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={sessionToRevoke !== null} onOpenChange={(open) => !open && setSessionToRevoke(null)}>
              <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-200 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-rose-600"><AlertTriangle className="h-5 w-5"/> Remove this device session?</DialogTitle>
                  <DialogDescription className="text-slate-500">You will be logged out on that device immediately.</DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setSessionToRevoke(null)} className="rounded-xl border-slate-200 dark:border-slate-700">Cancel</Button>
                  <Button onClick={handleRevokeSession} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">Revoke</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
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
                      onClick={() => theme !== 'light' && toggleTheme()}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        theme === 'light' ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-orange-200"
                      )}
                    >
                      <Sun className={cn("h-8 w-8", theme === 'light' ? "text-orange-600" : "text-slate-400")} />
                      <span className={cn("text-sm font-bold", theme === 'light' ? "text-orange-700 dark:text-orange-400" : "text-slate-600 dark:text-slate-400")}>Light Theme</span>
                    </button>
                    
                    <button 
                      onClick={() => theme !== 'dark' && toggleTheme()}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        theme === 'dark' ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-orange-200"
                      )}
                    >
                      <Moon className={cn("h-8 w-8", theme === 'dark' ? "text-orange-600" : "text-slate-400")} />
                      <span className={cn("text-sm font-bold", theme === 'dark' ? "text-orange-700 dark:text-orange-400" : "text-slate-600 dark:text-slate-400")}>Dark Theme</span>
                    </button>

                    <button 
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Monitor className="h-8 w-8 text-slate-400" />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">System Theme</span>
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Accent Color</h3>
                  <div className="flex items-center gap-3">
                    <button className="h-8 w-8 rounded-full bg-orange-500 ring-4 ring-orange-500/20"></button>
                    <button className="h-8 w-8 rounded-full bg-blue-500 hover:scale-110 transition-transform"></button>
                    <button className="h-8 w-8 rounded-full bg-emerald-500 hover:scale-110 transition-transform"></button>
                    <button className="h-8 w-8 rounded-full bg-rose-500 hover:scale-110 transition-transform"></button>
                    <button className="h-8 w-8 rounded-full bg-purple-500 hover:scale-110 transition-transform"></button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Compact Mode</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Reduce spacing to fit more content on screen.</p>
                  </div>
                  <Switch checked={toggles.compactMode} onCheckedChange={() => handleToggle('compactMode')} />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'apps':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ConnectedApps />
          </div>
        );
      case 'data':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data & Storage</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage local cache and export your data.</p>
            </div>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Storage Used</h3>
                    <span className="text-xs font-bold text-slate-500">{storageUsed.toFixed(1)} MB / 500 MB</span>
                  </div>
                  <Progress value={(storageUsed / 500) * 100} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500" />
                  <p className="text-[10px] font-semibold text-slate-500 mt-2">Cache size includes local drafts and offline data.</p>
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={handleClearCache} variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Clear Cache</Button>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Export Data</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">Download a copy of your work logs, tasks, and standups.</p>
                  <Button onClick={handleDownloadPDF} className="rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold">
                    <Download className="mr-2 h-4 w-4" /> Download Reports (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'language':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Language & Region</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Customize your localization settings.</p>
            </div>
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Language</label>
                  <Select defaultValue="en">
                    <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="hi">Hindi (India)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Time Zone</label>
                  <Select defaultValue="ist">
                    <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="ist">India Standard Time (IST) - UTC+05:30</SelectItem>
                      <SelectItem value="utc">Universal Time Coordinated (UTC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Date Format</label>
                  <Select defaultValue="dmy">
                    <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Help & Support</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Get assistance and read documentation.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">FAQ</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Find answers to common questions about Hindustaan OS.</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Documentation</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Read detailed guides on using workspace tools.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    <MonitorSmartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Contact Support</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Get in touch with our internal IT team.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Report Bug</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Report unexpected behavior or errors.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
