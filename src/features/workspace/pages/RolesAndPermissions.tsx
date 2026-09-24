import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, UserCheck, ShieldAlert, History, UserCog, Search, Check, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getRegisteredUsers, getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface RoleHistoryItem {
  id: string;
  userName: string;
  userEmail: string;
  prevRole: string;
  newRole: string;
  changedBy: string;
  timestamp: string;
}

export default function RolesAndPermissions() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [historyList, setHistoryList] = useState<RoleHistoryItem[]>([]);
  
  // Selection Form State
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [newRole, setNewRole] = useState<string>('');

  const adminUser = getCurrentUser();
  const adminName = adminUser?.name || 'System Admin';

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users?page=1&limit=200');
      if (res.data?.success) {
        setUsersList(res.data.data.users || []);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Load History from localStorage (only real changes)
    const savedHistory = localStorage.getItem('hindustaan_role_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const filtered = parsed.filter((h: RoleHistoryItem) => 
          h.userName !== 'Amanda Smith' && h.userName !== 'Aakash Gupta' && h.changedBy !== 'Aakash Gupta'
        );
        setHistoryList(filtered);
        localStorage.setItem('hindustaan_role_history', JSON.stringify(filtered));
      } catch (e) {
        setHistoryList([]);
      }
    } else {
      setHistoryList([]);
    }
  }, []);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a user first.');
      return;
    }
    if (!newRole) {
      toast.error('Please select a new role.');
      return;
    }

    const targetUser = usersList.find(u => u.id === selectedUserId);
    if (!targetUser) {
      toast.error('User not found.');
      return;
    }

    const prevRole = targetUser.role;
    const mappedRole = newRole.toLowerCase() === 'intern' ? 'intern' : newRole.toLowerCase();
    if (prevRole === mappedRole) {
      toast.info('The user is already assigned this role.');
      return;
    }

    try {
      const res = await api.put(`/auth/profile/${selectedUserId}`, { role: mappedRole });
      if (res.data?.success) {
        toast.success(`Successfully assigned role "${newRole}" to ${targetUser.name}!`);
        
        // Log locally to history list
        const newHistoryRecord: RoleHistoryItem = {
          id: `role-hist-${Date.now()}`,
          userName: targetUser.name,
          userEmail: targetUser.email,
          prevRole: prevRole,
          newRole: newRole.toLowerCase(),
          changedBy: adminName,
          timestamp: new Date().toISOString()
        };
        const updatedHistory = [newHistoryRecord, ...historyList];
        localStorage.setItem('hindustaan_role_history', JSON.stringify(updatedHistory));
        setHistoryList(updatedHistory);
        
        fetchUsers();

        // Reset Form fields
        setSelectedUserId('');
        setSearchTerm('');
        setNewRole('');
        setIsDropdownOpen(false);
      }
    } catch (err: any) {
      toast.error("Role assignment failed", { description: err.response?.data?.message || err.message });
    }
  };

  const handleCancel = () => {
    setSelectedUserId('');
    setSearchTerm('');
    setNewRole('');
    setIsDropdownOpen(false);
  };

  // Find currently selected user details
  const selectedUser = usersList.find(u => u.id === selectedUserId);

  // Filter users based on search query in the searchable dropdown
  const filteredSearchUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roles = [
    { 
      name: 'Admin', 
      count: usersList.filter(u => u.role === 'admin').length, 
      desc: 'Full workspace permissions, system configurations, audits, and directory authority.',
      icon: ShieldAlert,
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    },
    { 
      name: 'Manager', 
      count: usersList.filter(u => u.role === 'manager').length, 
      desc: 'Project administration, team allocation, milestones review, and leaves approval.',
      icon: UserCog,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    },
    { 
      name: 'Intern', 
      count: usersList.filter(u => u.role === 'employee' || u.role === 'intern').length, 
      desc: 'Task assignment capability, work hours logs, project milestones, and profile self-service.',
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Roles & Permissions</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">Manage user roles and role assignments.</p>
      </div>

      {/* Roles List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map((r, idx) => (
          <Card key={idx} className="rounded-2xl border-border bg-card text-card-foreground shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border", r.color)}>
                  <r.icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="font-extrabold px-2.5 py-0.5 text-xs bg-muted text-muted-foreground">
                  {r.count} Registered
                </Badge>
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">{r.name} Role</h3>
                <p className="text-xs font-medium text-muted-foreground mt-1.5 leading-relaxed">{r.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Assign Role Panel */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <UserCog className="h-5 w-5 text-primary" /> Assign User Role
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAssignRole} className="space-y-5">
                {/* User Searchable Dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Select User *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search user by name or email..."
                      value={selectedUser ? selectedUser.name : searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (selectedUser) {
                          setSelectedUserId('');
                        }
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full h-10 pl-9 pr-8 rounded-xl border border-input bg-card text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {selectedUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserId('');
                          setSearchTerm('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Options */}
                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl custom-scrollbar">
                      {filteredSearchUsers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUserId(user.id || '');
                            setSearchTerm('');
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 flex items-center justify-between",
                            selectedUserId === user.id ? "bg-muted/60" : ""
                          )}
                        >
                          <div>
                            <p className="text-xs font-bold text-foreground">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{user.email}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold border-border text-muted-foreground">
                            {user.role === 'employee' ? 'intern' : user.role}
                          </Badge>
                        </div>
                      ))}
                      {filteredSearchUsers.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground font-semibold">
                          No users found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Role Selector Buttons */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Assign New Role *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Admin', 'Manager', 'Intern'].map(roleOption => {
                      const isSelected = newRole.toLowerCase() === roleOption.toLowerCase();
                      return (
                        <button
                          key={roleOption}
                          type="button"
                          onClick={() => setNewRole(roleOption.toLowerCase())}
                          className={cn(
                            "py-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1",
                            isSelected 
                              ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          {roleOption}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected User Overview Card */}
                {selectedUser && (
                  <div className="p-3.5 bg-muted/30 border border-border rounded-xl space-y-2 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">Current Assigned Role:</span>
                      <Badge variant="outline" className="uppercase font-bold text-[10px] border-border text-foreground">
                        {selectedUser.role === 'employee' ? 'intern' : selectedUser.role}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">Department:</span>
                      <span className="font-bold text-foreground">{selectedUser.department || 'General'}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 h-10 rounded-xl border-border text-foreground font-bold hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedUserId || !newRole}
                    className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Role
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Role History panel */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/20">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <History className="h-5 w-5 text-primary" /> Role Assignment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="w-full min-w-[650px] text-sm text-left">
                <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase text-muted-foreground">User</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase text-muted-foreground">Previous Role</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase text-muted-foreground">New Role</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase text-muted-foreground">Changed By</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase text-muted-foreground text-right">Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyList.map((h) => (
                    <TableRow key={h.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="font-extrabold text-foreground">{h.userName}</div>
                        <div className="text-xs text-muted-foreground font-medium mt-0.5">{h.userEmail}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="uppercase font-bold text-[9px] border-border text-muted-foreground">
                          {h.prevRole === 'employee' ? 'intern' : h.prevRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 uppercase font-bold text-[9px]">
                          {h.newRole === 'employee' ? 'intern' : h.newRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-foreground">
                        {h.changedBy}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-muted-foreground text-xs">
                        {new Date(h.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {historyList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic font-medium">
                        No role assignment logs in system history logs.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
