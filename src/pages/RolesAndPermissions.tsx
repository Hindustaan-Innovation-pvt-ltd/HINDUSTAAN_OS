import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, UserCheck, ShieldAlert, History, UserCog, Search, Check, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRegisteredUsers, getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    // Load users
    const users = getRegisteredUsers();
    setUsersList(users);

    // Load History from localStorage
    const savedHistory = localStorage.getItem('hindustaan_role_history');
    if (savedHistory) {
      setHistoryList(JSON.parse(savedHistory));
    } else {
      // Seed default history records
      const demoHistory: RoleHistoryItem[] = [
        {
          id: 'h1',
          userName: 'Amanda Smith',
          userEmail: 'amanda@hindustaan.in',
          prevRole: 'intern',
          newRole: 'employee',
          changedBy: 'Aakash Gupta',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'h2',
          userName: 'Aakash Gupta',
          userEmail: 'manager1@hindustaan.in',
          prevRole: 'employee',
          newRole: 'manager',
          changedBy: 'admin',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      ];
      localStorage.setItem('hindustaan_role_history', JSON.stringify(demoHistory));
      setHistoryList(demoHistory);
    }
  }, []);

  const handleAssignRole = (e: React.FormEvent) => {
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
    if (prevRole === newRole.toLowerCase()) {
      toast.info('The user is already assigned this role.');
      return;
    }

    // 1. Update User in localStorage hindustaan_users
    const allUsers = getRegisteredUsers();
    const updatedUsers = allUsers.map(u => {
      if (u.email.toLowerCase() === targetUser.email.toLowerCase()) {
        return { ...u, role: newRole.toLowerCase() as any };
      }
      return u;
    });
    localStorage.setItem('hindustaan_users', JSON.stringify(updatedUsers));

    // 2. Create History Record
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

    // 3. Update component states
    setUsersList(updatedUsers);
    setHistoryList(updatedHistory);
    
    toast.success(`Successfully assigned role "${newRole}" to ${targetUser.name}!`);

    // Reset Form fields
    setSelectedUserId('');
    setSearchTerm('');
    setNewRole('');
    setIsDropdownOpen(false);
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

  // Compute predefined roles statistics
  const roleStats = {
    admin: usersList.filter(u => u.role === 'admin').length,
    manager: usersList.filter(u => u.role === 'manager').length,
    employee: usersList.filter(u => u.role === 'employee').length,
    intern: usersList.filter(u => u.role === 'employee' && u.designation?.toLowerCase().includes('intern')).length // or fallback/intern role if seeded
  };

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
      name: 'Employee', 
      count: usersList.filter(u => u.role === 'employee').length, 
      desc: 'Task assignment capability, daily standups log, work hours logs, and profile self-service.',
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }
  ];

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Roles & Permissions</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage user roles and role assignments.</p>
        </div>

        {/* Roles List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roles.map((r, idx) => (
            <Card key={idx} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-md hover:shadow-blue-200/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border", r.color)}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="font-extrabold px-2.5 py-0.5 text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {r.count} Registered
                  </Badge>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{r.name} Role</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{r.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Assign Role Panel */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-850">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <UserCog className="h-5 w-5 text-orange-500" /> Assign User Role
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAssignRole} className="space-y-5">
                  
                  {/* User Searchable Dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Select User *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
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
                        className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                      {selectedUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserId('');
                            setSearchTerm('');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    {/* Search results dropdown */}
                    {isDropdownOpen && !selectedUser && (
                      <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl custom-scrollbar">
                        {filteredSearchUsers.length > 0 ? (
                          filteredSearchUsers.map(u => (
                            <div
                              key={u.id}
                              onClick={() => {
                                setSelectedUserId(u.id || '');
                                setIsDropdownOpen(false);
                                setNewRole('');
                              }}
                              className="px-4 py-2.5 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-slate-100 dark:border-slate-850 last:border-b-0"
                            >
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-white">{u.name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{u.email}</div>
                              </div>
                              <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{u.role}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs italic text-slate-400 text-center">No users matched.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Current Role (Read Only) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Role</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedUser ? selectedUser.role.toUpperCase() : 'No user selected'}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-bold text-slate-550 dark:text-slate-400 cursor-not-allowed outline-none"
                    />
                  </div>

                  {/* New Role (Dropdown) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">New Role *</label>
                    <select
                      disabled={!selectedUserId}
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className={cn(
                        "w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer",
                        !selectedUserId && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
                      )}
                    >
                      <option value="">-- Choose New Role --</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1 h-10 rounded-xl border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!selectedUserId || !newRole}
                      className="flex-1 h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <History className="h-5 w-5 text-orange-500" /> Role Assignment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 dark:bg-slate-900/50 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">User</th>
                      <th className="px-6 py-4 font-bold">Previous Role</th>
                      <th className="px-6 py-4 font-bold">New Role</th>
                      <th className="px-6 py-4 font-bold">Changed By</th>
                      <th className="px-6 py-4 font-bold text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((h, i) => (
                      <tr key={h.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-900 dark:text-white">{h.userName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{h.userEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="uppercase font-bold text-[9px] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            {h.prevRole}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 uppercase font-bold text-[9px]">
                            {h.newRole}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {h.changedBy}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 text-xs">
                          {new Date(h.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {historyList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-450 italic font-medium">
                          No role assignment logs in system history logs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
