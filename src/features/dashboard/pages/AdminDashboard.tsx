import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Activity, BellRing, ShieldCheck, Server, Key, 
  Plus, ExternalLink, Search, Edit2, ShieldAlert, Power, 
  Trash2, HelpCircle, CheckCircle2, X, Filter, UserPlus, Briefcase, Mail, Phone, ChevronRight,
  Calendar, Clock, MapPin, Laptop, Lock, Shield, MessageSquare, PlusCircle, Send, Globe, Award, ClipboardList, CheckSquare, FolderKanban,
  User as UserIcon, CreditCard, Settings, Download, Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getRegisteredUsers, registerUser, getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminDashboard({ showOnlyRole }: { showOnlyRole?: 'employee' | 'manager' }) {
  // User Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [totalProjectsCount, setTotalProjectsCount] = useState<number>(0);
  const [adminStats, setAdminStats] = useState({
    totalEmployees: 0,
    activeTasks: 0,
    dbSize: '0 B',
    health: 'Healthy'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);
  const [activatingUser, setActivatingUser] = useState<User | null>(null);
  const [isToggleSubmit, setIsToggleSubmit] = useState(false);

  // Form Fields for Create/Edit
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'employee' | 'manager' | 'admin' | 'intern'>('employee');
  const [formDept, setFormDept] = useState('Engineering');
  const [formDesig, setFormDesig] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formManager, setFormManager] = useState('None');
  const [formPassword, setFormPassword] = useState('');
  const [formId, setFormId] = useState('');

  // Dashboard Overview state
  const [activities, setActivities] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_activity_feed');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // User Detail Panel State
  const [selectedDetailUser, setSelectedDetailUser] = useState<User | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'profile' | 'logins' | 'activity' | 'associated' | 'notes'>('profile');
  
  // Detail Data States
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [internalNotes, setInternalNotes] = useState<any[]>([]);
  
  // Timeline Filters
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [activityDatePreset, setActivityDatePreset] = useState('all');
  const [activityStartDate, setActivityStartDate] = useState('');
  const [activityEndDate, setActivityEndDate] = useState('');
  
  // Notes inputs
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Load user-specific detail data when selectedDetailUser changes
  useEffect(() => {
    if (!selectedDetailUser) return;
    
    const email = selectedDetailUser.email;
    
    // 1. Sessions History
    const sessionsKey = `sessions_${email}`;
    const savedSessions = localStorage.getItem(sessionsKey);
    if (savedSessions) {
      setLoginHistory(JSON.parse(savedSessions));
    } else {
      localStorage.setItem(sessionsKey, JSON.stringify([]));
      setLoginHistory([]);
    }
    
    // 2. Activity Timeline Feed
    const activitiesKey = `activities_${email}`;
    const savedActivities = localStorage.getItem(activitiesKey);
    if (savedActivities) {
      setActivityFeed(JSON.parse(savedActivities));
    } else {
      localStorage.setItem(activitiesKey, JSON.stringify([]));
      setActivityFeed([]);
    }
    
    // 3. Internal Notes
    const notesKey = `notes_${email}`;
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) {
      setInternalNotes(JSON.parse(savedNotes));
    } else {
      localStorage.setItem(notesKey, JSON.stringify([]));
      setInternalNotes([]);
    }
    
    // Reset filters
    setActivityTypeFilter('all');
    setActivityDatePreset('all');
    setActivityStartDate('');
    setActivityEndDate('');
    setNewNoteText('');
    setEditingNoteId(null);
    setDetailActiveTab('profile');
    
  }, [selectedDetailUser]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, deptFilter, statusFilter, showOnlyRole]);

  const handleRevokeSession = (sessionId: string) => {
    if (!selectedDetailUser) return;
    const email = selectedDetailUser.email;
    const sessionsKey = `sessions_${email}`;
    
    const updated = loginHistory.map(s => {
      if (s.id === sessionId) {
        return { ...s, isActive: false };
      }
      return s;
    });
    
    localStorage.setItem(sessionsKey, JSON.stringify(updated));
    setLoginHistory(updated);
    toast.success('Session successfully revoked!');
  };

  const handleAddNote = () => {
    if (!selectedDetailUser || !newNoteText.trim()) return;
    const email = selectedDetailUser.email;
    const notesKey = `notes_${email}`;
    
    const currentUserJson = localStorage.getItem('hindustaan_user');
    const authorName = currentUserJson ? JSON.parse(currentUserJson).name : 'Administrator';
    
    const newNote = {
      id: `note-${Date.now()}`,
      author: authorName,
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      content: newNoteText.trim()
    };
    
    const updated = [newNote, ...internalNotes];
    localStorage.setItem(notesKey, JSON.stringify(updated));
    setInternalNotes(updated);
    setNewNoteText('');
    toast.success('Internal note appended successfully!');
  };

  const handleEditNote = (noteId: string) => {
    const noteToEdit = internalNotes.find(n => n.id === noteId);
    if (noteToEdit) {
      setEditingNoteId(noteId);
      setEditingNoteText(noteToEdit.content);
    }
  };

  const handleSaveEditNote = (noteId: string) => {
    if (!selectedDetailUser || !editingNoteText.trim()) return;
    const email = selectedDetailUser.email;
    const notesKey = `notes_${email}`;
    
    const updated = internalNotes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          content: editingNoteText.trim(),
          timestamp: `${n.timestamp} (edited)`
        };
      }
      return n;
    });
    
    localStorage.setItem(notesKey, JSON.stringify(updated));
    setInternalNotes(updated);
    setEditingNoteId(null);
    setEditingNoteText('');
    toast.success('Note updated successfully!');
  };

  const getAssignedTasks = () => {
    if (!selectedDetailUser) return [];
    try {
      const savedTasks = localStorage.getItem('hindustaan_tasks_list');
      const allTasks = savedTasks ? JSON.parse(savedTasks) : [];
      return allTasks.filter((t: any) => 
        t.assignee && t.assignee.toLowerCase() === selectedDetailUser.name.toLowerCase()
      );
    } catch (e) {
      return [];
    }
  };

  const getAssociatedProjects = () => {
    if (!selectedDetailUser) return [];
    try {
      const savedProjects = localStorage.getItem('hindustaan_projects');
      const allProjects = savedProjects ? JSON.parse(savedProjects) : [];
      return allProjects.filter((p: any) => 
        p.manager === selectedDetailUser.name || 
        (p.team && p.team.some((member: any) => member.toLowerCase().includes(selectedDetailUser.name.toLowerCase())))
      );
    } catch (e) {
      return [];
    }
  };

  const getTeamMembers = () => {
    if (!selectedDetailUser) return [];
    return usersList.filter(u => 
      u.department === selectedDetailUser.department && 
      u.email.toLowerCase() !== selectedDetailUser.email.toLowerCase()
    );
  };

  const getUserWorkLogs = () => {
    if (!selectedDetailUser) return [];
    try {
      const savedLogs = localStorage.getItem('work_logs_list_v4') || localStorage.getItem('work_logs_list');
      const allLogs = savedLogs ? JSON.parse(savedLogs) : [];
      return allLogs.filter((l: any) => 
        l.userEmail && l.userEmail.toLowerCase() === selectedDetailUser.email.toLowerCase()
      );
    } catch (e) {
      return [];
    }
  };

  const getFilteredActivities = () => {
    return activityFeed.filter(act => {
      if (activityTypeFilter !== 'all' && act.type !== activityTypeFilter) {
        return false;
      }
      
      if (activityDatePreset === 'all') return true;
      
      const actTime = new Date(act.timestamp).getTime();
      const now = Date.now();
      
      if (activityDatePreset === '24h') {
        return now - actTime <= 86400000;
      } else if (activityDatePreset === '7d') {
        return now - actTime <= 86400000 * 7;
      } else if (activityDatePreset === '30d') {
        return now - actTime <= 86400000 * 30;
      } else if (activityDatePreset === 'custom') {
        if (activityStartDate) {
          const start = new Date(activityStartDate).getTime();
          if (actTime < start) return false;
        }
        if (activityEndDate) {
          const end = new Date(activityEndDate).getTime() + 86400000;
          if (actTime > end) return false;
        }
      }
      return true;
    });
  };

  useEffect(() => {
    if (showOnlyRole) {
      setFormRole(showOnlyRole);
    } else {
      setFormRole('employee');
    }
  }, [showOnlyRole]);

  const fetchAdminStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setAdminStats(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await api.get('/admin/users?page=1&limit=100');
      if (res.data?.success) {
        setUsersList(res.data.data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRealProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data?.success) {
        setTotalProjectsCount(res.data.data?.length || 0);
      }
    } catch (e) {
      console.error('Failed to fetch real project count:', e);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    fetchAdminUsers();
    fetchRealProjects();
  }, []);

  const navigateToView = (view: string) => {
    window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: { view } }));
  };

  const handleExportAuditLogs = () => {
    try {
      toast.loading("Preparing audit logs CSV...");
      setTimeout(() => {
        const headers = ["User Name", "Email", "Action Performed", "Module", "Timestamp"];
        const rows = activities.map(act => [
          act.user || "System",
          act.email || `${(act.user || "system").toLowerCase().replace(" ", ".")}@hindustaan.in`,
          act.action || "Performed action",
          act.target || "General",
          act.time || new Date().toISOString()
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_logs_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.dismiss();
        toast.success("Audit logs exported successfully!");
      }, 1000);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to export audit logs. Please try again.");
    }
  };

  const quickActions = [
    {
      title: "Manage Subscriptions",
      icon: CreditCard,
      action: () => navigateToView("Subscription Management"),
    },
    {
      title: "Export Audit Logs",
      icon: ExternalLink,
      action: handleExportAuditLogs,
    }
  ];

  const refreshUsers = () => {
    fetchAdminUsers();
    fetchAdminStats();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
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
      id: formId.trim() || (showOnlyRole === 'manager' 
        ? `MGR${Math.floor(100 + Math.random() * 900)}` 
        : `EMP${Math.floor(100 + Math.random() * 900)}`),
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: (showOnlyRole === 'manager' ? 'manager' : 'employee') as any,
      department: formDept,
      designation: formDesig.trim() || (showOnlyRole === 'manager' ? 'Product Manager' : 'Frontend Developer'),
      phone: formPhone.trim() || undefined,
      password: formPassword.trim() || (showOnlyRole === 'manager' ? 'Manager@123' : 'Employee@123'),
      isActive: true,
      reportingManager: showOnlyRole === 'manager' ? 'None' : formManager
    };

    const success = await registerUser(newUser);
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

  const handleConfirmDeactivate = async () => {
    if (!deactivatingUser?.id) return;
    setIsToggleSubmit(true);
    try {
      const res = await api.delete(`/admin/users/${deactivatingUser.id}`);
      if (res.data?.success) {
        toast.success(`Account for "${deactivatingUser.name}" has been deactivated successfully!`);
        refreshUsers();
        setDeactivatingUser(null);
      }
    } catch (e: any) {
      toast.error(`Failed to deactivate account`, { description: e.response?.data?.message || e.message });
    } finally {
      setIsToggleSubmit(false);
    }
  };

  const handleConfirmActivate = async () => {
    if (!activatingUser?.id) return;
    setIsToggleSubmit(true);
    try {
      const res = await api.put(`/admin/users/${activatingUser.id}/activate`);
      if (res.data?.success || res.status === 200) {
        toast.success(`Account for "${activatingUser.name}" has been activated successfully!`);
        refreshUsers();
        setActivatingUser(null);
      }
    } catch (e: any) {
      toast.error(`Failed to activate account`, { description: e.response?.data?.message || e.message });
    } finally {
      setIsToggleSubmit(false);
    }
  };

  const handleApproveUser = async (user: User) => {
    if (!user.id) return;
    try {
      const res = await api.post(`/auth/approve/${user.id}`, {});
      if (res.data?.success || res.status === 200) {
        toast.success(`Account for "${user.name}" has been approved successfully!`);
        refreshUsers();
      }
    } catch (e: any) {
      toast.error("Failed to approve account", { description: e.response?.data?.message || e.message });
    }
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

  const generateNewEmpId = () => {
    let newId = '';
    let isUnique = false;
    let attempts = 0;
    const prefix = showOnlyRole === 'manager' ? 'MGR' : 'EMP';
    while (!isUnique && attempts < 100) {
      const num = Math.floor(100 + Math.random() * 900);
      newId = `${prefix}${num}`;
      if (!usersList.some(u => u.id === newId)) {
        isUnique = true;
      }
      attempts++;
    }
    setFormId(newId);
  };

  // Filters & Calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeUsersCount = usersList.filter(u => u.isActive !== false && u.lastLogin && new Date(u.lastLogin) >= today).length;
  const totalInternsCount = usersList.filter(u => u.role === 'intern').length;
  const totalManagersCount = usersList.filter(u => u.role === 'manager').length;
  const totalEmployeesCount = totalInternsCount + totalManagersCount;
  const activeManagersList = usersList.filter(u => u.role === 'manager' && u.isActive !== false);
  const pendingNotifications = notifications.filter((n: any) => n.unread).length;


  const departments = ['Engineering', 'Product', 'HR', 'Marketing', 'Sales', 'IT'];

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.id && u.id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = u.role === showOnlyRole || (showOnlyRole === 'employee' && u.role === 'intern');
    const matchesDept = deptFilter === 'All' || u.department === deptFilter;
    const isActive = u.isActive !== false;
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && isActive && u.isApproved !== false) || 
      (statusFilter === 'Inactive' && !isActive) ||
      (statusFilter === 'Pending' && u.isApproved === false);

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {selectedDetailUser ? (
          // USER DETAIL FULL PAGE VIEW
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header / Back Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setSelectedDetailUser(null)}
                  variant="outline" 
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-transform active:scale-95"
                >
                  ← Back to Directory
                </Button>
                <div className="flex items-center gap-3 ml-2">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center text-sm font-black border shrink-0",
                    selectedDetailUser.isActive !== false
                      ? "bg-linear-to-br from-orange-500 to-amber-600 text-white border-orange-400"
                      : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800"
                  )}>
                    {selectedDetailUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedDetailUser.name}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      {selectedDetailUser.designation || 'Specialist'} • <span className="uppercase text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-650 dark:text-slate-300">{selectedDetailUser.role}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Tabs Card */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm overflow-hidden flex flex-col min-h-150">
              {/* Tab Navigation header */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto px-4 custom-scrollbar">
                {[
                  { id: 'profile', label: 'Full Profile', icon: UserIcon },
                  { id: 'logins', label: 'Session History', icon: Laptop },
                  { id: 'activity', label: 'Activity Timeline', icon: Clock },
                  { id: 'associated', label: 'Associated Data', icon: ClipboardList },
                  { id: 'notes', label: 'Internal Notes', icon: MessageSquare }
                ].filter(tab => {
                  if (selectedDetailUser.role === 'employee' || selectedDetailUser.role === 'intern' || selectedDetailUser.role === 'manager') {
                    return tab.id !== 'associated' && tab.id !== 'notes';
                  }
                  return true;
                }).map(tab => {
                  const Icon = tab.icon;
                  const active = detailActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDetailActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-4.5 text-xs font-bold transition-all border-b-2 outline-none whitespace-nowrap",
                        active
                          ? "border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-400"
                          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-200 dark:hover:border-slate-800"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content body */}
              <div className="p-6 bg-transparent space-y-6">
                
                {/* 1. Full Profile Tab */}
                {detailActiveTab === 'profile' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                            <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Role</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white capitalize">{selectedDetailUser.role}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Status</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">
                              {selectedDetailUser.isActive !== false ? 'Active' : 'Deactivated'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/60 overflow-hidden">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Personal & Employment Information</h3>
                      </div>
                      <CardContent className="p-5 space-y-4">
                        {[
                          { label: 'Full Name', value: selectedDetailUser.name, icon: UserIcon },
                          { label: 'Email Address', value: selectedDetailUser.email, icon: Mail },
                          { label: 'Phone Number', value: selectedDetailUser.phoneWa || selectedDetailUser.phone || 'Not provided', icon: Phone },
                          { label: 'Employee ID', value: selectedDetailUser.empId || 'Not Assigned', icon: Key },
                          { label: 'Department / Team', value: selectedDetailUser.department || 'Not Assigned', icon: Briefcase },
                          { label: 'Reporting Manager', value: selectedDetailUser.reportingManager || 'Not Assigned', icon: Users },
                          { label: 'Date Joined', value: selectedDetailUser.createdAt || selectedDetailUser.dateJoined ? new Date((selectedDetailUser.createdAt || selectedDetailUser.dateJoined) as string | Date).toLocaleDateString('en-US', { dateStyle: 'long' }) : 'Unknown', icon: Calendar }
                        ].map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-slate-150 dark:border-slate-800 last:border-0 gap-1.5 sm:gap-4">
                              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                                {item.label}
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 text-left sm:text-right">
                                {item.value}
                              </span>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 2. Login History / Session Info */}
                {detailActiveTab === 'logins' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Active & Recent Sessions</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage open web and mobile sessions for this user.</p>
                    </div>

                    <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/60 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 dark:text-slate-400 border-b border-slate-105 dark:border-slate-800">
                            <tr>
                              <th className="px-4 py-3 font-bold">Device & Location</th>
                              <th className="px-4 py-3 font-bold">IP Address</th>
                              <th className="px-4 py-3 font-bold">Timestamp</th>
                              <th className="px-4 py-3 font-bold text-right">Session State</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loginHistory.map((s) => (
                              <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <td className="px-4 py-3.5">
                                  <div className="flex items-start gap-2.5">
                                    <Laptop className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{s.device}</div>
                                      <div className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                                        <Globe className="h-3 w-3" /> {s.location}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{s.ipAddress}</td>
                                <td className="px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{s.timestamp}</td>
                                <td className="px-4 py-3.5 text-right">
                                  {s.isActive ? (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/25 text-[9px] font-black uppercase rounded py-0.5 px-1.5">Active</Badge>
                                      <Button
                                        onClick={() => handleRevokeSession(s.id)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 p-1.5 rounded-md flex items-center gap-1 mt-0.5"
                                      >
                                        <Lock className="h-3 w-3" /> Revoke
                                      </Button>
                                    </div>
                                  ) : (
                                    <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 text-[9px] font-bold uppercase rounded py-0.5 px-1.5 border-0">Revoked</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                )}

                {/* 3. Activity Timeline */}
                {detailActiveTab === 'activity' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/60 p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Activity Type</label>
                          <select
                            value={activityTypeFilter}
                            onChange={(e) => setActivityTypeFilter(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="all">All Activities</option>
                            <option value="task">Tasks Completed</option>
                            <option value="project">Projects Joined</option>
                            <option value="file">Files Uploaded</option>
                            <option value="status">Status Changes</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Date Range</label>
                          <select
                            value={activityDatePreset}
                            onChange={(e) => setActivityDatePreset(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="all">All Time</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="custom">Custom Date Range</option>
                          </select>
                        </div>
                      </div>

                      {activityDatePreset === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Start Date</label>
                            <input
                              type="date"
                              value={activityStartDate}
                              onChange={(e) => setActivityStartDate(e.target.value)}
                              className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">End Date</label>
                            <input
                              type="date"
                              value={activityEndDate}
                              onChange={(e) => setActivityEndDate(e.target.value)}
                              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      )}
                    </Card>

                    <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4.5 pl-6 space-y-6 mt-6">
                      {getFilteredActivities().map((activity) => {
                        let Icon = Activity;
                        let color = 'text-[#5B7CFF] bg-[#5B7CFF]/10 border-[#5B7CFF]/20';
                        
                        if (activity.type === 'project') {
                          Icon = FolderKanban;
                          color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                        } else if (activity.type === 'task') {
                          Icon = CheckSquare;
                          color = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
                        } else if (activity.type === 'file') {
                          Icon = Plus;
                          color = 'text-purple-500 bg-purple-500/10 border-purple-500/20';
                        }
                        
                        return (
                          <div key={activity.id} className="relative group animate-in fade-in slide-in-from-left-2 duration-200">
                            <div className={cn(
                              "absolute -left-9.25 top-0 h-7.5 w-7.5 rounded-full flex items-center justify-center border text-xs font-black shadow-sm transition-transform group-hover:scale-110",
                              color
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            <div className="bg-white dark:bg-[#0c1222]/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="text-xs font-extrabold text-slate-905 dark:text-white capitalize">
                                  {activity.action} <span className="text-orange-650 dark:text-orange-400 font-black">{activity.target}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  {new Date(activity.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                              </div>
                              {activity.description && (
                                <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-transparent">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {getFilteredActivities().length === 0 && (
                        <div className="py-8 text-center text-slate-405 dark:text-slate-500 italic text-xs font-bold bg-white dark:bg-[#0c1222]/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 pr-6">
                          No activities match the selected criteria.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Associated Data */}
                {detailActiveTab === 'associated' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-lg font-black text-slate-808 dark:text-white">96.4%</span>
                              <span className="text-[10px] text-emerald-650 dark:text-emerald-400 font-extrabold">(Excellent)</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-505/10 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hours Logged</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-lg font-black text-slate-800 dark:text-white">
                                {getUserWorkLogs().reduce((acc: number, curr: any) => acc + (curr.hours || 0), 0)} hrs
                              </span>
                              <span className="text-[10px] text-slate-455 dark:text-slate-400 font-bold">Total History</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tasks List */}
                    <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/60 overflow-hidden shadow-sm">
                      <div className="p-4.5 border-b border-slate-100 dark:border-slate-808 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-orange-500 shrink-0" /> Assigned Tasks ({getAssignedTasks().length})
                        </h3>
                      </div>
                      <CardContent className="p-0 max-h-55 overflow-y-auto custom-scrollbar">
                        {getAssignedTasks().map((task: any) => (
                          <div key={task.id} className="p-3.5 border-b border-slate-101 dark:border-slate-808 last:border-0 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold text-slate-805 dark:text-slate-205">{task.title}</p>
                                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-0.5 line-clamp-1">{task.description || 'No description provided.'}</p>
                              </div>
                              <Badge className={cn(
                                "text-[9px] font-black rounded uppercase py-0.5 shrink-0",
                                task.priority === 'High' ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                                task.priority === 'Medium' ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                                "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                              )}>{task.priority}</Badge>
                            </div>
                            <div className="flex items-center gap-2.5 mt-2.5">
                              <Badge variant="outline" className="text-[9px] font-extrabold uppercase rounded border-slate-202 dark:border-slate-808 dark:text-slate-455">{task.status}</Badge>
                              <span className="text-[10px] font-bold text-slate-400 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" /> {task.due_date || 'No due date'}
                              </span>
                            </div>
                          </div>
                        ))}
                        {getAssignedTasks().length === 0 && (
                          <div className="py-6 text-center text-slate-400 dark:text-slate-550 text-xs italic font-bold">No tasks currently assigned.</div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Associated Projects */}
                    <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/60 overflow-hidden shadow-sm">
                      <div className="p-4.5 border-b border-slate-101 dark:border-slate-808 bg-slate-50/50 dark:bg-slate-900/30">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-[#5B7CFF] shrink-0" /> Associated Projects ({getAssociatedProjects().length})
                        </h3>
                      </div>
                      <CardContent className="p-0">
                        {getAssociatedProjects().map((project: any) => (
                          <div key={project.id} className="p-3.5 border-b border-slate-100 dark:border-slate-808 last:border-0 flex items-center justify-between hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className={cn("h-2.5 w-2.5 rounded-full", project.status === 'Completed' ? 'bg-emerald-500' : project.status === 'On Hold' ? 'bg-amber-500' : 'bg-blue-555')} />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-202">{project.name}</span>
                              </div>
                              <p className="text-[10px] text-slate-405 font-bold mt-1">Deadline: {project.deadline || 'Dec 15'}</p>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase rounded dark:border-slate-808 dark:text-slate-455">{project.status}</Badge>
                          </div>
                        ))}
                        {getAssociatedProjects().length === 0 && (
                          <div className="py-6 text-center text-slate-400 dark:text-slate-505 text-xs italic font-bold">No associated projects.</div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Team Memberships */}
                    <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/60 overflow-hidden shadow-sm">
                      <div className="p-4.5 border-b border-slate-100 dark:border-slate-808 bg-slate-50/50 dark:bg-slate-900/30">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Users className="h-4 w-4 text-emerald-500 shrink-0" /> Department Team Members
                        </h3>
                      </div>
                      <CardContent className="p-0">
                        <div className="grid grid-cols-2 gap-3 p-3.5">
                          {getTeamMembers().map((member: any, i: number) => (
                            <div key={i} className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-lg">
                              <div className="h-7 w-7 rounded-full bg-slate-150 dark:bg-slate-800 text-[10px] font-black text-slate-650 dark:text-slate-350 flex items-center justify-center border border-slate-202 dark:border-slate-700">
                                {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-805 dark:text-slate-202 truncate">{member.name}</p>
                                <p className="text-[9px] font-semibold text-slate-455 truncate">{member.designation || 'Specialist'}</p>
                              </div>
                            </div>
                          ))}
                          {getTeamMembers().length === 0 && (
                            <div className="col-span-2 py-4 text-center text-slate-400 dark:text-slate-500 text-xs italic font-bold">No other team members in this department.</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timesheet Work Logs */}
                    <Card className="rounded-xl border-slate-200 dark:border-slate-805 bg-white dark:bg-[#0c1222]/60 overflow-hidden shadow-sm">
                      <div className="p-4.5 border-b border-slate-101 dark:border-slate-808 bg-slate-50/50 dark:bg-slate-900/30">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-purple-500 shrink-0" /> Recent Work Logs / Timesheet
                        </h3>
                      </div>
                      <CardContent className="p-0 max-h-55 overflow-y-auto overflow-x-auto custom-scrollbar">
                        <table className="w-full text-xs text-left min-w-125">
                          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-4 py-2 font-bold">Date</th>
                              <th className="px-4 py-2 font-bold">Task & Project</th>
                              <th className="px-4 py-2 font-bold">Hours</th>
                              <th className="px-4 py-2 font-bold text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getUserWorkLogs().map((log: any, i: number) => (
                              <tr key={i} className="border-b border-slate-101 dark:border-slate-805 last:border-0 hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-350">{log.date}</td>
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800 dark:text-slate-202 text-xs">{log.task}</div>
                                  <div className="text-[9px] text-slate-400 font-semibold mt-0.5">{log.project}</div>
                                </td>
                                <td className="px-4 py-3 font-extrabold text-slate-909 dark:text-white">{log.hours} hrs</td>
                                <td className="px-4 py-3 text-right">
                                  <Badge className={cn(
                                    "text-[9px] font-black rounded py-0.5 uppercase",
                                    log.status === 'Approved' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                    log.status === 'Pending' ? "bg-amber-50 text-amber-700 dark:bg-amber-505/10 dark:text-amber-400" :
                                    "bg-rose-50 text-rose-700 dark:bg-rose-550/10 dark:text-rose-400"
                                  )}>{log.status}</Badge>
                                </td>
                              </tr>
                            ))}
                            {getUserWorkLogs().length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-slate-505 text-xs italic font-bold">No work logs submitted.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 5. Internal Notes */}
                {detailActiveTab === 'notes' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Admin & Manager Internal Notes</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Notes here are only visible to administrators and management staff.</p>
                      </div>
                    </div>

                    <Card className="rounded-xl border-slate-202 dark:border-slate-808 bg-white dark:bg-[#0c1222]/60 p-4 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {editingNoteId ? 'Edit Internal Note' : 'Append New Note'}
                        </label>
                        <textarea
                          value={editingNoteId ? editingNoteText : newNoteText}
                          onChange={(e) => editingNoteId ? setEditingNoteText(e.target.value) : setNewNoteText(e.target.value)}
                          placeholder="Type a confidential team note regarding this user..."
                          rows={3}
                          className="w-full p-3 rounded-lg border border-slate-202 dark:border-slate-808 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-405 focus:outline-none focus:ring-1 focus:ring-orange-505 leading-relaxed"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        {editingNoteId && (
                          <Button
                            onClick={() => { setEditingNoteId(null); setEditingNoteText(''); }}
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs font-bold"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          onClick={editingNoteId ? () => handleSaveEditNote(editingNoteId) : handleAddNote}
                          disabled={editingNoteId ? !editingNoteText.trim() : !newNoteText.trim()}
                          className="h-8 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
                        >
                          {editingNoteId ? 'Save Changes' : 'Append Note'}
                        </Button>
                      </div>
                    </Card>

                    <div className="space-y-4">
                      {internalNotes.map((note) => (
                        <Card key={note.id} className="rounded-xl border-slate-202 dark:border-slate-808 bg-white dark:bg-[#0c1222]/60 shadow-sm p-4 relative group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-800 dark:text-white">{note.author}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-105 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-202 dark:border-slate-700 scale-90">Author</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold">{note.timestamp}</span>
                              <Button
                                onClick={() => handleEditNote(note.id)}
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md"
                                title="Edit note"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-705 dark:text-slate-305 leading-relaxed font-semibold font-sans whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </Card>
                      ))}

                      {internalNotes.length === 0 && (
                        <div className="py-8 text-center text-slate-400 dark:text-slate-500 italic text-xs font-bold bg-white dark:bg-[#0c1222]/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-805">
                          No internal notes recorded for this user.
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </Card>
          </div>
        ) : (
          // DIRECTORY LIST VIEW
          <>
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
          

        </div>

        {/* Conditional Content */}
        {!showOnlyRole ? (
          // Admin Overview Dashboard View
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-md hover:shadow-blue-200/50">
                <CardContent className="p-4 flex flex-col items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">Total Employees</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 leading-none">{totalEmployeesCount}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-md hover:shadow-blue-200/50">
                <CardContent className="p-4 flex flex-col items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">Total Interns</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 leading-none">{totalInternsCount}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in duration-300 delay- transition-all hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-md hover:shadow-blue-200/50">
                <CardContent className="p-4 flex flex-col items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#5B7CFF]/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-[#5B7CFF]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">Total Managers</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 leading-none">{totalManagersCount}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in duration-300 delay- transition-all hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-md hover:shadow-blue-200/50">
                <CardContent className="p-4 flex flex-col items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                    <FolderKanban className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">Total Projects</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 leading-none">{totalProjectsCount}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in duration-300 delay- transition-all hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-md hover:shadow-blue-200/50">
                <CardContent className="p-4 flex flex-col items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">Active Users Today</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 leading-none">{activeUsersCount}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222] shadow-sm animate-in fade-in duration-300 delay- transition-all hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-md hover:shadow-blue-200/50">
                <CardContent className="p-4 flex flex-col items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">Workspace Productivity</p>
                    <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 leading-none">92%</h3>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* User Account Summary */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-6">
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm overflow-hidden">
                  <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                    <CardTitle className="text-lg font-bold flex items-center justify-between text-slate-900 dark:text-white">
                      User Account Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-150">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4 font-bold">User</th>
                          <th className="px-6 py-4 font-bold">Role</th>
                          <th className="px-6 py-4 font-bold">Status</th>
                          <th className="px-6 py-4 font-bold">Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.slice(0, 4).map((u: any, i: number) => {
                          const initials = u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                          const isActive = u.isActive !== false;
                          return (
                            <tr 
                              key={i} 
                              className="border-b border-slate-100 dark:border-slate-800/60 cursor-pointer"
                              onClick={() => setSelectedDetailUser(u)}
                            >
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
                                    <div className="text-xs text-slate-450 dark:text-slate-400 leading-snug truncate max-w-37.5">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className={cn(
                                  "font-black tracking-wide rounded px-2 uppercase text-[9px]",
                                  u.role === 'admin' ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400" :
                                  u.role === 'manager' ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400" :
                                  "border-slate-255 bg-slate-50 text-slate-600 dark:border-slate-805 dark:bg-slate-900/60 dark:text-slate-350"
                                )}>{u.role}</Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={isActive ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs">
                                {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
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
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl w-full sm:w-auto">
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
                      <option value="Pending">Pending Approval</option>
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
                    {showOnlyRole === 'manager' ? 'Manager Directory' : 'Interns Directory'}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Showing {filteredUsers.length} of {usersList.filter(u => u.role === showOnlyRole).length} registered {showOnlyRole === 'manager' ? 'managers' : 'interns'}.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">User / ID</th>
                      <th className="px-6 py-4 font-bold">Designation & Department</th>

                      <th className="px-6 py-4 font-bold">Phone Number</th>
                      <th className="px-6 py-4 font-bold">System Role</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u, i) => {
                      const isActive = u.isActive !== false;
                      const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                        <tr 
                          key={i} 
                          className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/25 transition-colors cursor-pointer"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('.actions-cell')) return;
                            setSelectedDetailUser(u);
                          }}
                        >
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
                                <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-1 font-mono uppercase">{u.empId || 'Pending'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-850 dark:text-slate-200">{u.designation || 'Specialist'}</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-405 mt-0.5 flex items-center">
                              <Briefcase className="h-3 w-3 mr-1 text-slate-400" /> {u.department || 'Unassigned'}
                            </div>
                          </td>

                          <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                            {u.phoneWa || u.phone ? u.phoneWa || u.phone : <span className="text-xs italic text-slate-400">No phone</span>}
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
                            {u.isApproved === false ? (
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 font-bold py-0.5 rounded">
                                Pending Approval
                              </Badge>
                            ) : (
                              <Badge className={cn(
                                "font-bold py-0.5 rounded",
                                isActive 
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100/50" 
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100/50"
                              )}>
                                {isActive ? 'Active' : 'Deactivated'}
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right actions-cell">
                            <div className="flex items-center justify-end gap-2.5">
                              {u.isApproved === false && (
                                <Button
                                  onClick={() => handleApproveUser(u)}
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:text-emerald-400 dark:border-emerald-950/60 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                                  title="Approve Account"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              
                              <Button
                                onClick={() => isActive ? setDeactivatingUser(u) : setActivatingUser(u)}
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 rounded-lg border-slate-200",
                                  isActive
                                    ? "text-rose-500 hover:bg-rose-50 hover:border-rose-200 dark:text-red-400 dark:border-red-950/60 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                                    : "text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 dark:text-emerald-400 dark:border-emerald-950/60 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
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
                    {paginatedUsers.length === 0 && (
                      <tr>
                        <td colSpan={showOnlyRole === 'manager' ? 6 : 7} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                          No matching records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
              
              {filteredUsers.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="text-xs font-bold rounded-lg border-slate-200 dark:border-slate-700"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center justify-center px-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="text-xs font-bold rounded-lg border-slate-200 dark:border-slate-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
        </>
      )}
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-120 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {showOnlyRole === 'manager' ? 'Create Manager Account' : 'Create Intern Account'}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-450">
              {showOnlyRole === 'manager' ? 'Initialize a new secure cohort manager profile.' : 'Initialize a new secure cohort intern profile.'}
            </DialogDescription>
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
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">System Role</label>
                  <input
                    type="text"
                    readOnly
                    value={showOnlyRole === 'manager' ? 'Manager' : 'Intern'}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed focus:outline-none"
                  />
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

                {showOnlyRole !== 'manager' && (
                  <div className="space-y-1.5 col-span-2">
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
                )}

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

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={showOnlyRole === 'manager' ? 'Default: Manager@123' : 'Default: Employee@123'}
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
        <DialogContent className="sm:max-w-120 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden">
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

                <div className="space-y-1.5 col-span-2">
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

                <div className="space-y-1.5">
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

      {/* Deactivate User Dialog */}
      <Dialog open={!!deactivatingUser} onOpenChange={(open) => !open && setDeactivatingUser(null)}>
        <DialogContent className="sm:max-w-106.25 rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Power className="mr-2 h-5 w-5 text-rose-500" />
              Deactivate Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to deactivate <span className="font-semibold text-slate-900 dark:text-white">{deactivatingUser?.name}</span>?
            </p>
            <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
              This will disable their account.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setDeactivatingUser(null)} 
              className="rounded-xl font-bold"
              disabled={isToggleSubmit}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmDeactivate}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={isToggleSubmit}
            >
              {isToggleSubmit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Confirm & Deactivate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate User Dialog */}
      <Dialog open={!!activatingUser} onOpenChange={(open) => !open && setActivatingUser(null)}>
        <DialogContent className="sm:max-w-106.25 rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Power className="mr-2 h-5 w-5 text-emerald-500" />
              Activate Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to activate <span className="font-semibold text-slate-900 dark:text-white">{activatingUser?.name}</span>?
            </p>
            <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">
              This will re-enable their account and allow them to log in.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setActivatingUser(null)} 
              className="rounded-xl font-bold"
              disabled={isToggleSubmit}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmActivate}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={isToggleSubmit}
            >
              {isToggleSubmit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                "Confirm & Activate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
