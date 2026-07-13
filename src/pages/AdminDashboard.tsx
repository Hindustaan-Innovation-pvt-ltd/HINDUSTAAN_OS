import React, { useState } from 'react';
import { Users, UserCheck, Activity, BellRing, ShieldCheck, Server, Key, Plus, ExternalLink, UserPlus, Search, Filter, Briefcase, Edit2, Power } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [showOnlyRole, setShowOnlyRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formId, setFormId] = useState('');
  const [formRole, setFormRole] = useState('employee');
  const [formDept, setFormDept] = useState('Engineering');
  const [formDesig, setFormDesig] = useState('');
  const [formManager, setFormManager] = useState('None');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
  const activeManagersList = [{ name: 'Aakash Gupta' }, { name: 'Sarah Connor' }];

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormId('');
    setFormRole('employee');
    setFormDept('Engineering');
    setFormDesig('');
    setFormManager('None');
    setFormPhone('');
    setFormPassword('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('User created successfully');
    setIsCreateOpen(false);
  };

  const openEditModal = (user: any) => {
    setFormName(user.name);
    setFormEmail(user.email);
    setFormId(user.id || '');
    setFormRole(user.role.toLowerCase());
    setFormDept(user.department || 'Engineering');
    setFormDesig(user.designation || '');
    setFormManager(user.reportingManager || 'None');
    setFormPhone(user.phone || '');
    setIsEditOpen(true);
  };

  const toggleUserActive = (user: any) => {
    toast.success(`User status toggled`);
  };

  const mockUsers = [
    { name: 'Tanvy Pandey', email: 'tanvy@hindustaan.in', role: 'employee', isActive: true, designation: 'Frontend Engineer', department: 'Engineering', reportingManager: 'Aakash Gupta' },
    { name: 'Aakash Gupta', email: 'aakash@hindustaan.in', role: 'manager', isActive: true, designation: 'Engineering Manager', department: 'Engineering', reportingManager: 'None' },
    { name: 'Rahul Sharma', email: 'rahul@hindustaan.in', role: 'employee', isActive: false, designation: 'QA Tester', department: 'Engineering', reportingManager: 'Aakash Gupta' },
  ];

  const filteredUsers = mockUsers.filter(u => {
    if (showOnlyRole !== 'all' && u.role !== showOnlyRole) return false;
    if (deptFilter !== 'All' && u.department !== deptFilter) return false;
    if (statusFilter === 'Active' && !u.isActive) return false;
    if (statusFilter === 'Inactive' && u.isActive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              User Management
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Manage workspace accounts, roles, and designations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              className="bg-[#5B7CFF] hover:bg-[#5B7CFF]/90 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Add User
            </Button>
          </div>
        </div>

        {/* User Management Directory */}
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filters and Search Toolbar */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm p-4">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B7CFF]/50 transition-all text-sm font-medium"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl">
                  <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1.5">Filters:</span>

                  <select
                    value={showOnlyRole}
                    onChange={(e) => setShowOnlyRole(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-[#5B7CFF]/50"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="manager">Managers</option>
                    <option value="employee">Employees</option>
                  </select>

                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-[#5B7CFF]/50"
                  >
                    <option value="All">All Depts</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-[#5B7CFF]/50"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Deactivated</option>
                  </select>
                </div>

                {(searchQuery || deptFilter !== 'All' || statusFilter !== 'All' || showOnlyRole !== 'all') && (
                  <Button
                    variant="ghost"
                    onClick={() => { setSearchQuery(''); setDeptFilter('All'); setStatusFilter('All'); setShowOnlyRole('all'); }}
                    className="text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* User Account Summary Table */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">User / ID</th>
                    <th className="px-6 py-4 font-bold">Designation & Dept</th>
                    <th className="px-6 py-4 font-bold">Manager</th>
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
                              "h-9 w-9 rounded-full flex items-center justify-center text-xs font-extrabold border shrink-0",
                              isActive ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400" : "bg-slate-100 text-slate-500"
                            )}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white">{u.name}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{u.designation || 'Specialist'}</div>
                          <div className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Briefcase className="h-3 w-3 mr-1" /> {u.department || 'Unassigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {u.reportingManager}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="uppercase text-[10px] tracking-wide">{u.role}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 text-rose-700 hover:bg-rose-100"}>
                            {isActive ? 'Active' : 'Deactivated'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button onClick={() => openEditModal(u)} variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-4 w-4 text-slate-500" /></Button>
                            <Button onClick={() => toggleUserActive(u)} variant="ghost" size="icon" className="h-8 w-8"><Power className="h-4 w-4 text-slate-500" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic font-medium">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* MODALS */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>Add a new user to the workspace.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Name</label>
                  <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Email</label>
                  <input required type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#5B7CFF] text-white">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); setIsEditOpen(false); toast.success('Updated'); }}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Name</label>
                  <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Role</label>
                  <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#5B7CFF] text-white">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
