import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, Shield, Bell, Palette, Link as LinkIcon, Database, Globe, HelpCircle, 
  Download, MonitorSmartphone, CheckCircle2, Moon, Sun, Monitor, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectedApps } from '../components/dashboard/settings/ConnectedApps';
import { Progress } from "@/components/ui/progress";
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { updatePassword, getCurrentUser } from '@/lib/auth';

const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile Information', description: 'Manage your personal details and workspace identity.', icon: User },
  { id: 'security', label: 'Account & Security', description: 'Manage your password and security preferences.', icon: Shield },
  { id: 'notifications', label: 'Notifications', description: 'Control how and when you receive alerts.', icon: Bell },
  { id: 'appearance', label: 'Appearance', description: 'Customize how the application looks on your device.', icon: Palette },
  { id: 'apps', label: 'Connected Apps', description: 'Manage your third-party integrations.', icon: LinkIcon },
  { id: 'data', label: 'Data & Storage', description: 'Manage local cache and export your data.', icon: Database },
  { id: 'language', label: 'Language & Region', description: 'Customize your localization settings.', icon: Globe },
  { id: 'help', label: 'Help & Support', description: 'Get assistance and read documentation.', icon: HelpCircle },
];

export default function Settings({ session, defaultTab = null }: { session: any, defaultTab?: string | null }) {
  const { theme, themeMode, setThemeMode, toggleTheme, accentColor, setAccentColor, compactMode, setCompactMode } = useTheme();
  const role = session?.user?.user_metadata?.role || 'intern';
  
  const [activeTab, setActiveTab] = useState<string | null>(defaultTab);

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

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => localStorage.getItem('userAvatar'));
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          setAvatarUrl(compressedDataUrl);
          try {
            localStorage.setItem('userAvatar', compressedDataUrl);
            toast.success('Avatar Updated');
            window.dispatchEvent(new Event('avatar-updated'));
          } catch (err) {
            toast.error('Error', { description: 'Image too large to save to profile.' });
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

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
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Information</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your personal details and workspace identity.</p>
            </div>
            
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <Avatar className="h-24 w-24 border-4 border-slate-50 dark:border-slate-900 shadow-md">
                      {avatarUrl && <AvatarImage src={avatarUrl} />}
                      <AvatarFallback className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-2xl font-bold">
                        {role === 'manager' ? 'AG' : 'TP'}
                      </AvatarFallback>
                    </Avatar>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl font-bold border-slate-200 dark:border-slate-700">Change Avatar</Button>
                  </div>
                  
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                        <Input defaultValue={role === 'manager' ? 'Aakash Gupta' : 'Tanvy Pandey'} className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                        <Input defaultValue={session?.user?.email || 'user@hindustaan.in'} disabled className="rounded-xl bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 font-medium text-slate-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Department</label>
                        <Select defaultValue="engineering">
                          <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Role</label>
                        <Input defaultValue={role === 'manager' ? 'Manager' : 'Frontend Developer Intern'} disabled className="rounded-xl bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 font-medium text-slate-500" />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Internship Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cohort</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Summer 2026</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Manager</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Aakash Gupta</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Date</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Jun 1, 2026</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">End Date</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Oct 1, 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex justify-end">
                <Button className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold px-6">Save Changes</Button>
              </CardFooter>
            </Card>
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
                    <span className="text-xs font-bold text-slate-500">45 MB / 500 MB</span>
                  </div>
                  <Progress value={9} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500" />
                  <p className="text-[10px] font-semibold text-slate-500 mt-2">Cache size includes local drafts and offline data.</p>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Clear Cache</Button>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Export Data</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">Download a copy of your work logs, tasks, and standups.</p>
                  <Button className="rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold">
                    <Download className="mr-2 h-4 w-4" /> Download Reports (CSV)
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
