import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Key, Fingerprint, Lock, Unlock, Smartphone, MapPin, Search, AlertTriangle, LogOut, CheckCircle2, MonitorSmartphone, Clock, Activity, Users, Settings2, Globe, Building2, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SecuritySettings({ session }: { session?: any }) {
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; actionType: string; title: string; desc: string }>({ isOpen: false, actionType: '', title: '', desc: '' });
  const [confirmText, setConfirmText] = useState('');

  const [authSettings, setAuthSettings] = useState({
    passwordLogin: true,
    magicLink: true,
    rememberMe: true,
    forceReset: false,
    sessionTimeout: '1 Hour',
    maxFailedAttempts: '5'
  });

  const [mfaSettings, setMfaSettings] = useState({
    admin: true,
    manager: true,
    employee: false
  });

  const [workspaceRules, setWorkspaceRules] = useState({
    onlyCompanyEmail: true,
    restrictUnknown: false,
    restrictOutsideHours: true,
    restrictCountries: false,
  });

  const openConfirmDialog = (actionType: string, title: string, desc: string) => {
    setConfirmText('');
    setConfirmDialog({ isOpen: true, actionType, title, desc });
  };

  const handleConfirmDangerAction = () => {
    if (confirmText !== 'CONFIRM') {
      toast.error('Type CONFIRM exactly to proceed.');
      return;
    }
    toast.success(`${confirmDialog.title} executed successfully.`);
    setConfirmDialog({ isOpen: false, actionType: '', title: '', desc: '' });
  };

  const activeSessions = [
    { id: 1, user: 'Aakash Gupta', role: 'admin', device: 'MacBook Pro', browser: 'Chrome 120.0', ip: '192.168.1.1', lastActive: 'Just now', current: true },
    { id: 2, user: 'Amanda Smith', role: 'employee', device: 'Windows PC', browser: 'Edge 119.0', ip: '192.168.1.42', lastActive: '5 mins ago', current: false },
    { id: 3, user: 'Rahul Sharma', role: 'manager', device: 'iPhone 15 Pro', browser: 'Safari 17.1', ip: '10.0.0.5', lastActive: '1 hr ago', current: false },
  ];

  const auditLogs = [
    { id: 1, user: 'Aakash Gupta', role: 'admin', action: 'Workspace settings updated', type: 'Config', time: '10 mins ago', desc: 'Enabled SSO login' },
    { id: 2, user: 'System', role: 'system', action: 'Failed login detected', type: 'Alert', time: '1 hour ago', desc: '3 failed attempts from 45.33.22.11' },
    { id: 3, user: 'Rahul Sharma', role: 'manager', action: 'Permissions modified', type: 'Access', time: 'Yesterday', desc: 'Granted Project Manager access to Amanda Smith' },
  ];

  const rbacRoles = [
    { name: 'Admin', count: 2, permissions: 120, editable: true, restricted: 0, description: 'Full workspace access' },
    { name: 'Manager', count: 5, permissions: 45, editable: true, restricted: 75, description: 'Project & Team access' },
    { name: 'Employee', count: 25, permissions: 15, editable: false, restricted: 105, description: 'Personal access only' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div>
        <h2 className="text-page-title text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Shield className="h-8 w-8 text-indigo-500" />
          Security & Privacy
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl">
          Configure organization-wide security policies, access controls, monitoring, and authentication rules.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* LEFT COLUMN */}
        <div className="xl:col-span-7 flex flex-col gap-8">

          {/* 1. Authentication Settings */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Authentication Settings</CardTitle>
              </div>
              <CardDescription className="font-medium mt-1">Manage how users log into the workspace.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Password Login</h4>
                      <p className="text-xs text-slate-500">Allow standard email/password login.</p>
                    </div>
                    <Switch checked={authSettings.passwordLogin} onCheckedChange={(v) => setAuthSettings({ ...authSettings, passwordLogin: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Magic Link Login</h4>
                      <p className="text-xs text-slate-500">Allow passwordless email links.</p>
                    </div>
                    <Switch checked={authSettings.magicLink} onCheckedChange={(v) => setAuthSettings({ ...authSettings, magicLink: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Remember Me</h4>
                      <p className="text-xs text-slate-500">Allow extended 30-day sessions.</p>
                    </div>
                    <Switch checked={authSettings.rememberMe} onCheckedChange={(v) => setAuthSettings({ ...authSettings, rememberMe: v })} />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Session Timeout</label>
                    <Select value={authSettings.sessionTimeout} onValueChange={(v) => setAuthSettings({ ...authSettings, sessionTimeout: v })}>
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15 Minutes">15 Minutes</SelectItem>
                        <SelectItem value="30 Minutes">30 Minutes</SelectItem>
                        <SelectItem value="1 Hour">1 Hour</SelectItem>
                        <SelectItem value="4 Hours">4 Hours</SelectItem>
                        <SelectItem value="8 Hours">8 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Max Failed Login Attempts</label>
                    <Select value={authSettings.maxFailedAttempts} onValueChange={(v) => setAuthSettings({ ...authSettings, maxFailedAttempts: v })}>
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Attempts</SelectItem>
                        <SelectItem value="5">5 Attempts</SelectItem>
                        <SelectItem value="10">10 Attempts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Force Password Reset</h4>
                    <Switch checked={authSettings.forceReset} onCheckedChange={(v) => setAuthSettings({ ...authSettings, forceReset: v })} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 font-bold">Standard Auth Active</Badge>
                <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500 font-bold">SSO Disabled</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 3. Password Policy */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Password Policies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Minimum Length</label>
                    <Select defaultValue="12">
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 Characters</SelectItem>
                        <SelectItem value="10">10 Characters</SelectItem>
                        <SelectItem value="12">12 Characters</SelectItem>
                        <SelectItem value="16">16 Characters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Password Expiry</label>
                    <Select defaultValue="90">
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="Never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Require Uppercase</h4>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Require Numbers</h4>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Require Special Characters</h4>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Example Strong Password</p>
                <div className="flex items-center gap-3">
                  <code className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-widest bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">P@ssw0rd2026!</code>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-bold">Strong</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Active Device Management */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Active Sessions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 font-bold">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Device / Browser</th>
                    <th className="px-5 py-3">IP Address</th>
                    <th className="px-5 py-3">Last Active</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {s.user.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-slate-900 dark:text-white">{s.user}</span>
                          {s.current && <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-0 text-[10px] h-4 px-1.5 ml-1">Current</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{s.device}</p>
                        <p className="text-xs text-slate-500">{s.browser}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{s.ip}</td>
                      <td className="px-5 py-3 font-medium text-slate-600 dark:text-slate-400">{s.lastActive}</td>
                      <td className="px-5 py-3 text-right">
                        {!s.current && (
                          <Button variant="ghost" size="sm" className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold" onClick={() => toast.success('Session terminated')}>
                            Logout
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 7. RBAC & Permission Security */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">RBAC & Permissions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rbacRoles.map(role => (
                  <div key={role.name} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-950 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{role.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{role.description}</p>
                    <div className="mt-4 space-y-2 text-sm font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Active Users</span>
                        <span className="text-slate-900 dark:text-white font-bold">{role.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Allowed Rules</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{role.permissions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Restricted</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">{role.restricted}</span>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="font-bold border-slate-200 dark:border-slate-700">View</Button>
                      <Button variant="secondary" size="sm" className="font-bold" disabled={!role.editable}>Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 9. Danger Zone */}
          <Card className="rounded-2xl border-rose-300 dark:border-rose-900/50 shadow-sm overflow-hidden bg-rose-50/30 dark:bg-rose-950/10">
            <CardHeader className="p-6 border-b border-rose-100 dark:border-rose-900/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <CardTitle className="text-lg font-bold text-rose-700 dark:text-rose-400">Danger Zone</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/50">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Logout Everyone</h4>
                    <p className="text-xs text-slate-500">Invalidate all active sessions across the organization.</p>
                  </div>
                  <Button variant="destructive" className="font-bold shrink-0" onClick={() => openConfirmDialog('logout_all', 'Logout Everyone', 'This will log out all users immediately.')}>Execute</Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/50">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Disable Workspace Access</h4>
                    <p className="text-xs text-slate-500">Temporarily freeze all non-admin logins.</p>
                  </div>
                  <Button variant="destructive" className="font-bold shrink-0" onClick={() => openConfirmDialog('disable_access', 'Disable Workspace Access', 'This will prevent employees and managers from logging in.')}>Execute</Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/50">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Revoke All Magic Links</h4>
                    <p className="text-xs text-slate-500">Invalidate all unused magic link authentication tokens.</p>
                  </div>
                  <Button variant="destructive" className="font-bold shrink-0" onClick={() => openConfirmDialog('revoke_links', 'Revoke Magic Links', 'This will invalidate pending login links.')}>Execute</Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-5 flex flex-col gap-8">

          {/* 2. Two Factor Authentication */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Two Factor Authentication</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Enforce 2FA for Admins</h4>
                  <Switch checked={mfaSettings.admin} onCheckedChange={(v) => setMfaSettings({ ...mfaSettings, admin: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Enforce 2FA for Managers</h4>
                  <Switch checked={mfaSettings.manager} onCheckedChange={(v) => setMfaSettings({ ...mfaSettings, manager: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Optional for Employees</h4>
                  <Switch checked={mfaSettings.employee} onCheckedChange={(v) => setMfaSettings({ ...mfaSettings, employee: v })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-2xl font-black text-emerald-600">32</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Enabled</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-2xl font-black text-amber-500">8</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Pending</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-2xl font-black text-slate-400">14</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Disabled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Login Security Monitoring */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Security Monitoring</CardTitle>
                </div>
                <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400 font-bold border-0">2 Alerts</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Failed Logins Today</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">12</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">Locked Accounts</p>
                  <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1">1</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Suspicious Attempts</p>
                  <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">3</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Unknown Devices</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">4</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 8. Workspace Access Rules */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Workspace Access</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Company Emails Only</h4>
                  <Switch checked={workspaceRules.onlyCompanyEmail} onCheckedChange={(v) => setWorkspaceRules({ ...workspaceRules, onlyCompanyEmail: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Restrict Unknown Devices</h4>
                  <Switch checked={workspaceRules.restrictUnknown} onCheckedChange={(v) => setWorkspaceRules({ ...workspaceRules, restrictUnknown: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Restrict Outside Office Hours</h4>
                  <Switch checked={workspaceRules.restrictOutsideHours} onCheckedChange={(v) => setWorkspaceRules({ ...workspaceRules, restrictOutsideHours: v })} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allowed Domains</label>
                  <Input defaultValue="hindustaan.in" className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office Hours</label>
                  <div className="flex items-center gap-2">
                    <Input defaultValue="09:00" type="time" className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl" />
                    <span className="text-slate-400">to</span>
                    <Input defaultValue="19:00" type="time" className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Security Audit Logs */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Audit Logs</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 flex items-center gap-1.5" onClick={() => toast.success('Audit logs exported successfully.')}>
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => toast.info('Loading full audit history...')}>View All</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {log.type === 'Config' ? <Settings2 className="h-4 w-4" /> : log.type === 'Alert' ? <AlertTriangle className="h-4 w-4 text-rose-500" /> : <Shield className="h-4 w-4 text-indigo-500" />}
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{log.action}</span>
                        <span className="text-[10px] font-semibold text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-xs text-slate-500">{log.desc}</p>
                      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px] bg-indigo-100 text-indigo-700">{log.user[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{log.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, actionType: '', title: '', desc: '' })}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-rose-200 dark:border-rose-900">
          <DialogHeader>
            <DialogTitle className="text-rose-600 dark:text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-600 dark:text-slate-300 pt-2">
              {confirmDialog.desc}
              <br /><br />
              This action cannot be undone. To proceed, please type <strong className="text-slate-900 dark:text-white">CONFIRM</strong> below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type CONFIRM"
              className="font-mono text-center font-bold tracking-widest uppercase border-slate-300 dark:border-slate-700"
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setConfirmDialog({ isOpen: false, actionType: '', title: '', desc: '' })} className="font-bold">Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDangerAction} className="font-bold">Execute Action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
