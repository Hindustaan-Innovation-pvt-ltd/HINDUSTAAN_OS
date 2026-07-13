import React, { useState } from 'react';
import { Users, UserCheck, Activity, BellRing, ShieldCheck, Server, Key, Plus, ExternalLink, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AdminDashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [workspaceConfig, setWorkspaceConfig] = useState(() => {
    const saved = localStorage.getItem('workspace_auth_config');
    return saved ? JSON.parse(saved) : {
      ssoEnabled: true,
      twoFactorEnforced: true,
      publicSignups: false,
      autoProvisioning: true,
    };
  });

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage workspace settings and users securely.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-[#5B7CFF] hover:bg-[#5B7CFF]/90 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(91,124,255,0.3)]">
              <Plus className="h-4 w-4 mr-2" /> Invite Users
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Employees</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">124</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#5B7CFF]/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-[#5B7CFF]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Managers</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">12</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Active Users Today</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">98</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                <BellRing className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Pending Notifications</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">5</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">
            {/* User Account Summary */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  User Account Summary
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-[#5B7CFF]">View All</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-bold">User</th>
                      <th className="px-6 py-4 font-bold">Role</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Tanvy Pandey', email: 'tanvy@hindustaan.in', role: 'Employee', status: 'Active', login: '2 mins ago' },
                      { name: 'Aakash Gupta', email: 'aakash@hindustaan.in', role: 'Manager', status: 'Active', login: '1 hour ago' },
                      { name: 'Rahul Sharma', email: 'rahul@hindustaan.in', role: 'Employee', status: 'Inactive', login: '2 days ago' },
                      { name: 'Amanda Smith', email: 'amanda@hindustaan.in', role: 'Employee', status: 'Active', login: '4 hours ago' }
                    ].map((u, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-bold border-slate-200 dark:border-slate-700">{u.role}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{u.login}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Recent Workspace Activity */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold">Recent Workspace Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {[
                    { action: 'Security Policy updated', time: '10 mins ago', icon: ShieldCheck, color: 'text-[#5B7CFF]', bg: 'bg-[#5B7CFF]/10' },
                    { action: 'New Manager role assigned to Aakash Gupta', time: '2 hours ago', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { action: 'API Key regenerated for Webhook App', time: '5 hours ago', icon: Key, color: 'text-orange-500', bg: 'bg-orange-500/10' }
                  ].map((activity, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${activity.bg}`}>
                        <activity.icon className={`h-5 w-5 ${activity.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Workspace Configuration Status */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Workspace Status</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs font-bold text-[#5B7CFF] bg-[#5B7CFF]/10 hover:bg-[#5B7CFF]/20"
                    onClick={() => onNavigate && onNavigate('Workspace Settings')}
                  >
                    <Settings className="h-3 w-3 mr-1.5" /> Configure
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <Server className="h-4 w-4 text-[#5B7CFF]" /> Storage Usage
                    </div>
                    <span className="text-xs font-bold text-slate-500">45%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#5B7CFF] to-[#A855F7] w-[45%]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <Users className="h-4 w-4 text-emerald-500" /> Seats Used
                    </div>
                    <span className="text-xs font-bold text-slate-500">136 / 150</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[90%]" />
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">SSO Configuration</span>
                    <Badge className={workspaceConfig.ssoEnabled ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"}>
                      {workspaceConfig.ssoEnabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-3">
                    <span className="text-slate-500 font-medium">2FA Enforcement</span>
                    <Badge className={workspaceConfig.twoFactorEnforced ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"}>
                      {workspaceConfig.twoFactorEnforced ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-3">
                    <span className="text-slate-500 font-medium">Public Signups</span>
                    <Badge className={workspaceConfig.publicSignups ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"}>
                      {workspaceConfig.publicSignups ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-between h-12 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Manage Subscriptions <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
                <Button variant="ghost" className="w-full justify-between h-12 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Export Audit Logs <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
