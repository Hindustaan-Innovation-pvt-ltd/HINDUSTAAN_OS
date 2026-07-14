import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Activity, BellRing, ShieldCheck, Server, Key, 
  Plus, ExternalLink, Search, Edit2, ShieldAlert, Power, 
  Trash2, HelpCircle, CheckCircle2, X, Filter, UserPlus, Briefcase, Mail, Phone, ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getRegisteredUsers, registerUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { GLOBAL_ACTIVITY_FEED, GLOBAL_NOTIFICATIONS } from '@/data/mockData';

export default function AdminDashboard({ showOnlyRole }: { showOnlyRole?: 'employee' | 'manager' }) {
  // User Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form Fields for Create/Edit
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'employee' | 'manager' | 'admin'>('employee');
  const [formDept, setFormDept] = useState('Engineering');
  const [formDesig, setFormDesig] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formManager, setFormManager] = useState('None');
  const [formPassword, setFormPassword] = useState('');
  const [formId, setFormId] = useState('');

  // Dashboard Overview state
  const [activities, setActivities] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_activity_feed');
    return saved ? JSON.parse(saved) : GLOBAL_ACTIVITY_FEED;
  });

  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_notifications');
    return saved ? JSON.parse(saved) : GLOBAL_NOTIFICATIONS;
  });

  useEffect(() => {
    if (showOnlyRole) {
      setFormRole(showOnlyRole);
    } else {
      setFormRole('employee');
    }
  }, [showOnlyRole]);

  useEffect(() => {
    // Load registered users on mount
    setUsersList(getRegisteredUsers());

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hindustaan_users' && e.newValue) setUsersList(JSON.parse(e.newValue));
      if (e.key === 'hindustaan_activity_feed' && e.newValue) setActivities(JSON.parse(e.newValue));
      if (e.key === 'hindustaan_notifications' && e.newValue) setNotifications(JSON.parse(e.newValue));
    };
    
    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.key === 'hindustaan_users') {
        setUsersList(typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : getRegisteredUsers());
      }
      if (e.detail.key === 'hindustaan_activity_feed') {
        setActivities(typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : GLOBAL_ACTIVITY_FEED);
      }
      if (e.detail.key === 'hindustaan_notifications') {
        setNotifications(typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : GLOBAL_NOTIFICATIONS);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate as EventListener);
    };
  }, []);

  const refreshUsers = () => {
    const fresh = getRegisteredUsers();
    setUsersList(fresh);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    const allUsers = getRegisteredUsers();
    if (allUsers.some(u => u.email.toLowerCase() === formEmail.toLowerCase())) {
      toast.error('User with this email already exists.');
      return;
    }

    const newUser: User = {
      id: formId.trim() || `EMP${Math.floor(100 + Math.random() * 900)}`,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      department: formDept,
      designation: formDesig.trim() || (formRole === 'manager' ? 'Product Manager' : 'Frontend Developer'),
      phone: formPhone.trim() || undefined,
      password: formPassword.trim() || 'Employee@123',
      isActive: true,
      reportingManager: formManager
    };

    const success = registerUser(newUser);
    if (success) {
      toast.success(`User "${formName}" created successfully!`);
      setIsCreateOpen(false);
      resetForm();
      refreshUsers();
    } else {
      toast.error('Failed to create user account.');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    const allUsers = getRegisteredUsers();
    // Check email uniqueness if email changed
    if (formEmail.toLowerCase() !== selectedUser.email.toLowerCase() && 
        allUsers.some(u => u.email.toLowerCase() === formEmail.toLowerCase())) {
      toast.error('User with this email already exists.');
      return;
    }

    const updatedUsers = allUsers.map(u => {
      if (u.email.toLowerCase() === selectedUser.email.toLowerCase()) {
        return {
          ...u,
          id: formId.trim() || u.id,
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          department: formDept,
          designation: formDesig.trim(),
          phone: formPhone.trim() || undefined,
          reportingManager: formManager,
          password: formPassword.trim() || u.password
        };
      }
      return u;
    });

    localStorage.setItem('hindustaan_users', JSON.stringify(updatedUsers));
    
    // Dispatch local storage update event
    window.dispatchEvent(new CustomEvent('local-storage-update', {
      detail: { key: 'hindustaan_users', value: JSON.stringify(updatedUsers) }
    }));

    toast.success(`User "${formName}" updated successfully!`);
    setIsEditOpen(false);
    resetForm();
    refreshUsers();
  };

  const toggleUserActive = (user: User) => {
    const allUsers = getRegisteredUsers();
    const updated = allUsers.map(u => {
      if (u.email.toLowerCase() === user.email.toLowerCase()) {
        const nextState = u.isActive === undefined ? false : !u.isActive;
        toast.success(`Account for "${u.name}" has been ${nextState ? 'activated' : 'deactivated'}.`);
        return { ...u, isActive: nextState };
      }
      return u;
    });
    localStorage.setItem('hindustaan_users', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('local-storage-update', {
      detail: { key: 'hindustaan_users', value: JSON.stringify(updated) }
    }));
    refreshUsers();
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormDept(user.department || 'Engineering');
    setFormDesig(user.designation || '');
    setFormPhone(user.phone || '');
    setFormManager(user.reportingManager || 'None');
    setFormPassword('');
    setFormId(user.id || '');
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole(showOnlyRole || 'employee');
    setFormDept('Engineering');
    setFormDesig('');
    setFormPhone('');
    setFormManager('None');
    setFormPassword('');
    setFormId('');
    setSelectedUser(null);
  };

  // Filters & Calculations
  const activeUsersCount = usersList.filter(u => u.isActive !== false).length;
  const totalEmployeesCount = usersList.filter(u => u.role === 'employee').length;
  const totalManagersCount = usersList.filter(u => u.role === 'manager').length;
  const activeManagersList = usersList.filter(u => u.role === 'manager' && u.isActive !== false);
  const pendingNotifications = notifications.filter((n: any) => n.unread).length;

  const departments = ['Engineering', 'Product', 'HR', 'Marketing', 'Sales', 'IT'];

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.id && u.id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = u.role === showOnlyRole;
    const matchesDept = deptFilter === 'All' || u.department === deptFilter;
    const isActive = u.isActive !== false;
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && isActive) || 
      (statusFilter === 'Inactive' && !isActive);

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {!showOnlyRole ? 'Admin Dashboard' : showOnlyRole === 'manager' ? 'Managers' : 'Employees'}
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              {!showOnlyRole 
                ? 'Overview of organization roles, stats, and activities.'
                : showOnlyRole === 'manager' 
                  ? 'Manage manager accounts, departments, and active statuses.' 
                  : 'Manage employee accounts, roles, and designations.'}
            </p>
          </div>
          
          {showOnlyRole && (
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => { resetForm(); setIsCreateOpen(true); }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-500/10 transition-transform active:scale-95"
              >
                <UserPlus className="h-4 w-4 mr-2" /> Add {showOnlyRole === 'manager' ? 'Manager' : 'Employee'}
              </Button>
            </div>
          )}
        </div>

        {/* Conditional Content */}
        {!showOnlyRole ? (
          // Admin Overview Dashboard View
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in duration-300">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Employees</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalEmployeesCount}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in duration-300 delay-75">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#5B7CFF]/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-[#5B7CFF]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Managers</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalManagersCount}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in duration-300 delay-150">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Active Users Today</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{activeUsersCount}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in duration-300 delay-200">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <BellRing className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Pending Notifications</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{pendingNotifications}</h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Split layout: Team Directory vs Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Team Members Card */}
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm overflow-hidden lg:col-span-2">
                <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Active Team Directory</CardTitle>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">A quick glance at current active users in the registry.</p>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-bold">User / ID</th>
                        <th className="px-6 py-4 font-bold">Designation & Department</th>
                        <th className="px-6 py-4 font-bold">System Role</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.slice(0, 5).map((u, i) => {
                        const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        const isActive = u.isActive !== false;
                        return (
                          <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/25 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-9 w-9 rounded-full flex items-center justify-center text-xs font-extrabold border shrink-0",
                                  isActive
                                    ? "bg-orange-50 text-orange-700 border-orange-250 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"
                                    : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800"
                                )}>
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 dark:text-white leading-snug">{u.name}</div>
                                  <div className="text-xs text-slate-450 dark:text-slate-400 leading-snug truncate max-w-[150px]">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{u.designation || 'Specialist'}</div>
                              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{u.department || 'Unassigned'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={cn(
                                "font-black tracking-wide rounded px-2 uppercase text-[9px]",
                                u.role === 'admin' ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400" :
                                u.role === 'manager' ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400" :
                                "border-slate-250 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-350"
                              )}>
                                {u.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={cn(
                                "font-bold py-0.5 rounded text-[10px]",
                                isActive 
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                              )}>
                                {isActive ? 'Active' : 'Deactivated'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Recent Workspace Activity */}
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm col-span-1">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Workspace Activities</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {activities.slice(0, 5).map((activity: any, i: number) => {
                      let Icon = Activity;
                      let color = 'text-[#5B7CFF]';
                      let bg = 'bg-[#5B7CFF]/10';

                      if (activity.type === 'project' || activity.type === 'assign') {
                        Icon = ShieldCheck;
                        color = 'text-emerald-500';
                        bg = 'bg-emerald-500/10';
                      } else if (activity.type === 'task' || activity.type === 'log') {
                        Icon = Key;
                        color = 'text-orange-500';
                        bg = 'bg-orange-500/10';
                      }

                      return (
                        <div key={i} className="flex gap-4">
                          <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${bg}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {activity.user} {activity.action} <span className="font-extrabold text-orange-600 dark:text-orange-400">{activity.target}</span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // CRUD Registry View
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filters and Search Toolbar */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={showOnlyRole === 'manager' 
                      ? "Search managers by name, email, or ID..." 
                      : "Search employees by name, email, or ID..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/55 transition-all text-sm font-medium"
                  />
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl">
                    <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1.5">Filters:</span>
                    
                    {/* Department Filter */}
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-orange-500/20"
                    >
                      <option value="All">All Departments</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-orange-500/20"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Deactivated</option>
                    </select>
                  </div>

                  {(searchQuery || deptFilter !== 'All' || statusFilter !== 'All') && (
                    <Button 
                      variant="ghost" 
                      onClick={() => { setSearchQuery(''); setDeptFilter('All'); setStatusFilter('All'); }}
                      className="text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Directory Table Card */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm overflow-hidden">
              <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    {showOnlyRole === 'manager' ? 'Manager Directory' : 'Employee Directory'}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Showing {filteredUsers.length} of {usersList.filter(u => u.role === showOnlyRole).length} registered {showOnlyRole === 'manager' ? 'managers' : 'employees'}.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">User / ID</th>
                      <th className="px-6 py-4 font-bold">Designation & Department</th>
                      <th className="px-6 py-4 font-bold">Reporting Manager</th>
                      <th className="px-6 py-4 font-bold">Phone Number</th>
                      <th className="px-6 py-4 font-bold">System Role</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => {
                      const isActive = u.isActive !== false;
                      const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/25 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-9 w-9 rounded-full flex items-center justify-center text-xs font-extrabold border shrink-0 transition-transform hover:scale-105",
                                isActive 
                                  ? "bg-orange-550/10 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" 
                                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800"
                              )}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 dark:text-white leading-snug truncate">{u.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug font-medium mt-0.5 truncate">{u.email}</div>
                                <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-1 font-mono uppercase">{u.id || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-850 dark:text-slate-200">{u.designation || 'Specialist'}</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-405 mt-0.5 flex items-center">
                              <Briefcase className="h-3 w-3 mr-1 text-slate-400" /> {u.department || 'Unassigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                            {u.reportingManager && u.reportingManager !== 'None' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                {u.reportingManager}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                            {u.phone ? u.phone : <span className="text-xs italic text-slate-400">No phone</span>}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={cn(
                              "font-black tracking-wide rounded px-2.5 py-0.5 uppercase text-[10px]",
                              u.role === 'admin' ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400" :
                              u.role === 'manager' ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400" :
                              "border-slate-250 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-350"
                            )}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={cn(
                              "font-bold py-0.5 rounded",
                              isActive 
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100/50" 
                                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100/50"
                            )}>
                              {isActive ? 'Active' : 'Deactivated'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <Button 
                                onClick={() => openEditModal(u)}
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                                title="Edit details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                onClick={() => toggleUserActive(u)}
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800",
                                  isActive
                                    ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-550/10 hover:border-rose-200"
                                    : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-550/10 hover:border-emerald-200"
                                )}
                                title={isActive ? 'Deactivate account' : 'Activate account'}
                              >
                                <Power className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                          No matching records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Create Employee Account</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-450">Initialize a new secure cohort employee profile.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit}>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="E.g. Amanda Smith"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="E.g. amanda@hindustaan.in"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee ID</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="E.g. EMP123"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">System Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Designation</label>
                  <input
                    type="text"
                    value={formDesig}
                    onChange={(e) => setFormDesig(e.target.value)}
                    placeholder="E.g. Frontend Lead"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Reporting Manager</label>
                  <select
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/55 cursor-pointer"
                  >
                    <option value="None">None</option>
                    {activeManagersList.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="E.g. +91 9876543210"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Default: Employee@123"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-850 gap-2 shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateOpen(false)}
                className="h-10 rounded-xl border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Edit Employee Details</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-450">Modify properties and assign roles dynamically.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit}>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee ID</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">System Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Designation</label>
                  <input
                    type="text"
                    value={formDesig}
                    onChange={(e) => setFormDesig(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Reporting Manager</label>
                  <select
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/55 cursor-pointer"
                  >
                    <option value="None">None</option>
                    {activeManagersList.filter(m => m.email.toLowerCase() !== formEmail.toLowerCase()).map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">New Password (leave empty to keep current)</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter new password if changing"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-850 gap-2 shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                className="h-10 rounded-xl border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
