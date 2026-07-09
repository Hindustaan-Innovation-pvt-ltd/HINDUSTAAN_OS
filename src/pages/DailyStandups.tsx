import React, { useState, useEffect } from 'react';
import { Mic, Video, CheckCircle2, AlertCircle, MessageSquare, Clock, Calendar, CheckSquare, Edit3, Sparkles, TrendingUp, AlertTriangle, Flame, Percent, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useTheme } from '@/context/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MOCK_STANDUPS = [
  {
    id: 's1',
    user: 'Tanvy',
    initials: 'TP',
    role: 'Frontend Developer',
    status: 'Submitted',
    yesterday: 'Finished the responsive layout for the authentication screen.',
    today: 'Working on the Kanban drag-and-drop feature.',
    blockers: 'None so far, but might need help with React DnD.',
    time: '9:05 AM',
  },
  {
    id: 's2',
    user: 'Rahul Sharma',
    initials: 'RS',
    role: 'Backend Developer',
    status: 'Submitted',
    yesterday: 'Set up the initial database schema for notifications.',
    today: 'Creating the REST API endpoints for fetching logs.',
    blockers: 'Waiting on the AWS IAM permissions to deploy.',
    time: '9:15 AM',
  },
  {
    id: 's3',
    user: 'Priya Patel',
    initials: 'PP',
    role: 'Product Manager',
    status: 'Pending',
    yesterday: '',
    today: '',
    blockers: '',
    time: '',
  },
  {
    id: 's4',
    user: 'Amanda Smith',
    initials: 'AS',
    role: 'UI/UX Designer',
    status: 'Submitted',
    yesterday: 'Handed off the final Figma files for the dashboard.',
    today: 'Starting user research for the mobile app navigation.',
    blockers: 'None.',
    time: '9:42 AM',
  }
];

const MOCK_HISTORY = [
  {
    id: 'h1',
    user: 'Tanvy',
    initials: 'TP',
    role: 'Frontend Developer',
    dateGroup: 'Yesterday',
    yesterday: 'Integrated the ProjectProvider context into App.tsx.',
    today: 'Working on refining the Contribution Scores analytics page.',
    blockers: 'None.',
    time: '9:10 AM'
  },
  {
    id: 'h2',
    user: 'Rahul Sharma',
    initials: 'RS',
    role: 'Backend Developer',
    dateGroup: 'Yesterday',
    yesterday: 'Set up the initial schema for standup storage in database.',
    today: 'Working on logs API endpoints testing.',
    blockers: 'None.',
    time: '9:05 AM'
  },
  {
    id: 'h3',
    user: 'Amanda Smith',
    initials: 'AS',
    role: 'UI/UX Designer',
    dateGroup: 'Yesterday',
    yesterday: 'Designed high-fidelity mockups for Daily Standups page widgets.',
    today: 'Syncing with Tanvy on component specifications.',
    blockers: 'None.',
    time: '9:30 AM'
  },
  {
    id: 'h4',
    user: 'Tanvy',
    initials: 'TP',
    role: 'Frontend Developer',
    dateGroup: '2 Days Ago',
    yesterday: 'Implemented custom theme context for light/dark mode.',
    today: 'Debugging responsive design issues on main shell.',
    blockers: 'None.',
    time: '9:12 AM'
  },
  {
    id: 'h5',
    user: 'Rahul Sharma',
    initials: 'RS',
    role: 'Backend Developer',
    dateGroup: '2 Days Ago',
    yesterday: 'Configured supabase client initialization and auth routes.',
    today: 'Writing test cases for RLS policies.',
    blockers: 'None.',
    time: '9:00 AM'
  }
];

export default function DailyStandups({ session }: { session?: any }) {
  const role = session?.user?.user_metadata?.role || 'employee';
  const email = session?.user?.email || 'user@hindustaan.in';
  
  let currentUserName = 'Tanvy';
  if (email.toLowerCase().includes('amanda')) {
    currentUserName = 'Amanda Smith';
  } else if (email.toLowerCase().includes('rahul')) {
    currentUserName = 'Rahul Sharma';
  } else if (email.toLowerCase().includes('priya')) {
    currentUserName = 'Priya Patel';
  }

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const tickColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#cbd5e1';

  const [standups, setStandups] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_standups');
    return (saved && saved !== 'null') ? JSON.parse(saved) : MOCK_STANDUPS;
  });
  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('hindustaan_standup_history');
    return (saved && saved !== 'null') ? JSON.parse(saved) : MOCK_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('hindustaan_standups', JSON.stringify(standups));
  }, [standups]);

  useEffect(() => {
    localStorage.setItem('hindustaan_standup_history', JSON.stringify(history));
  }, [history]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ yesterday: '', today: '', blockers: '' });
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());
  const [viewingStandup, setViewingStandup] = useState<any | null>(null);

  // Quick Notes State
  const [note, setNote] = useState(() => {
    return localStorage.getItem(`hindustaan_notes_${currentUserName}`) || '';
  });

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNote(value);
    localStorage.setItem(`hindustaan_notes_${currentUserName}`, value);
  };

  // Pull real counts from localStorage
  const savedTasks = localStorage.getItem('hindustaan_tasks_list');
  const allTasks = (savedTasks && savedTasks !== 'null') ? JSON.parse(savedTasks) : [];
  const allTasksArray = Array.isArray(allTasks) ? allTasks : [];
  
  const firstName = (currentUserName || '').split(' ')[0].toLowerCase();
  const myTasks = allTasksArray.filter((t: any) =>
    t && (t.assignee_name?.toLowerCase().includes(firstName) || t.assignee_id === (
      ['Amanda Smith','Rahul Sharma','Priya Patel'].indexOf(currentUserName) >= 0
        ? `u-${['Amanda Smith','Rahul Sharma','Priya Patel'].indexOf(currentUserName) + 1}`
        : 'u-4'
    ))
  );

  const tasksCompletedCount = myTasks.filter((t: any) => t && t.status === 'Done').length;
  const tasksPendingCount = myTasks.filter((t: any) => t && t.status !== 'Done').length;
  const sprintProgress = myTasks.length > 0 
    ? Math.round((tasksCompletedCount / myTasks.length) * 100)
    : 0;

  const savedLogs = localStorage.getItem('work_logs_list');
  const allLogs = (savedLogs && savedLogs !== 'null') ? JSON.parse(savedLogs) : [];
  const allLogsArray = Array.isArray(allLogs) ? allLogs : [];
  
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const hoursLoggedToday = allLogsArray
    .filter((l: any) => l && l.name?.toLowerCase().includes(firstName) && l.date === todayStr)
    .reduce((acc: number, l: any) => acc + (Number(l.hours) || 0), 0);

  // Compute upcoming deadlines safely
  const upcomingDeadlines = myTasks
    .filter((t: any) => t && t.status !== 'Done' && t.due_date && !isNaN(Date.parse(t.due_date)))
    .map((t: any) => {
      const dueDate = new Date(t.due_date);
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      dueDate.setHours(0,0,0,0);
      const isOverdue = dueDate < todayDate;
      const isToday = dueDate.getTime() === todayDate.getTime();
      return {
        ...t,
        isOverdue,
        isToday
      };
    })
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Filter standups to show only logged in employee (recent 2-3) if role is not manager
  const displayStandups = role !== 'manager'
    ? standups.filter(s => s && s.user && s.user.toLowerCase().includes(firstName)).slice(0, 3)
    : standups;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.yesterday || !formData.today) return;
    
    const newStandup = {
      id: `s-${Date.now()}`,
      user: currentUserName,
      initials: (currentUserName || 'E').split(' ').map(n=>n[0]).join(''),
      role: role === 'manager' ? 'Product Manager' : 'Developer',
      status: 'Submitted',
      yesterday: formData.yesterday,
      today: formData.today,
      blockers: formData.blockers || 'None.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add the new standup to the top of active standups list (slides older ones right)
    setStandups(prev => [newStandup, ...prev]);

    // Also add to the top of standup history
    const historyEntry = {
      ...newStandup,
      dateGroup: 'Today'
    };
    setHistory(prev => [historyEntry, ...prev]);

    setIsModalOpen(false);
    setFormData({ yesterday: '', today: '', blockers: '' });
  };

  const submittedCount = displayStandups.filter(s => s.status === 'Submitted').length;
  const pendingCount = displayStandups.filter(s => s.status === 'Pending').length;

  const handleRemindAll = () => {
    toast.success(`Reminders sent to all ${pendingCount} pending team members!`);
    setSentReminders(new Set(standups.filter(s => s.status === 'Pending').map(s => s.id)));
  };

  const handleSendReminder = (standup: any) => {
    toast.success(`Reminder sent to ${standup.user}!`);
    setSentReminders(prev => new Set(prev).add(standup.id));
  };

  // Filter history to show only logged in employee standups if role is not manager
  const filteredHistory = history.filter(h => {
    if (!h || !h.user) return false;
    if (role !== 'manager') {
      return h.user.toLowerCase().includes(firstName);
    }
    return h.user.toLowerCase().includes(historySearch.toLowerCase());
  });

  const groupedHistory = filteredHistory.reduce((acc: any, item: any) => {
    if (item && item.dateGroup) {
      if (!acc[item.dateGroup]) {
        acc[item.dateGroup] = [];
      }
      acc[item.dateGroup].push(item);
    }
    return acc;
  }, {});

  if (showHistory) {
    return (
      <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHistory(false)}
                className="h-8 px-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold"
              >
                &larr; Back
              </Button>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Standup History</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-10">
              Overview of all past async standups submitted by the team.
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search history by name..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50 font-bold px-3 py-1 text-xs">
            {filteredHistory.length} Total Submissions
          </Badge>
        </div>

        {/* History List */}
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([dateGroup, items]: [string, any]) => (
            <div key={dateGroup} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{dateGroup}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((standup: any) => (
                  <div 
                    key={standup.id} 
                    onClick={() => setViewingStandup(standup)}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-md cursor-pointer hover:border-orange-500/40 animate-in fade-in"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                          <AvatarFallback className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 font-bold">{standup.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{standup.user}</h3>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{standup.role}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-0 font-bold tracking-wider uppercase text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        Submitted
                      </Badge>
                    </div>

                    <div className="p-5 flex-1 flex flex-col gap-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Yesterday</h4>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{standup.yesterday}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Today</h4>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{standup.today}</p>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{standup.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 font-medium">
              No historical entries found matching your query.
            </div>
          )}
        </div>

        {/* Re-use Dialog for Details view in History */}
        <Dialog open={!!viewingStandup} onOpenChange={(open) => !open && setViewingStandup(null)}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
            {viewingStandup && (
              <>
                <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                    <AvatarFallback className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 font-bold">
                      {viewingStandup.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                      {viewingStandup.user}
                    </DialogTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {viewingStandup.role} · {viewingStandup.time}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 font-bold text-xs uppercase">
                    Submitted
                  </Badge>
                </DialogHeader>
                <div className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Yesterday</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                      {viewingStandup.yesterday}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Today</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                      {viewingStandup.today}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Blockers</span>
                    <p className={cn(
                      "text-sm leading-relaxed font-medium p-3 rounded-xl border",
                      viewingStandup.blockers && viewingStandup.blockers !== 'None.'
                        ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/40 text-slate-500 dark:text-slate-400"
                    )}>
                      {viewingStandup.blockers || 'None.'}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button onClick={() => setViewingStandup(null)} className="h-10 rounded-xl px-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold">
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Standups</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {role !== 'manager' 
              ? 'Review your logged daily standup report for today.' 
              : "Review your team's async standup reports for today."}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => toast.success('Meeting Started', { description: "Joining your team's video room..."})} variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
            <Video className="h-4 w-4 mr-2 text-slate-400" /> Start Meeting
          </Button>
          <Button onClick={() => toast('Opening Standup Form...')} className="h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm">
            <Mic className="h-4 w-4 mr-2" /> Submit My Update
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowHistory(true)}
            className="h-10 rounded-xl border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold"
          >
            <Clock className="h-4 w-4 mr-2 text-slate-400" /> Standup History
          </Button>
        </div>
      </div>

      {/* Stats & History Row */}
      <div className="flex flex-row justify-between items-center w-full mb-8 gap-4">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm w-fit">
          <div className="px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submitted</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{submittedCount}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <div className="px-4 py-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{pendingCount}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Standup Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayStandups.map(standup => (
          <div
            key={standup.id}
            onClick={() => standup.status === 'Submitted' && setViewingStandup(standup)}
            className={cn(
              "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-md",
              standup.status === 'Submitted' && "cursor-pointer hover:border-orange-500/40"
            )}
          >
            
            {/* Card Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                  <AvatarFallback className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 font-bold">{standup.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{standup.user}</h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{standup.role}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "border-0 font-bold tracking-wider uppercase text-[9px] px-2 py-0.5",
                standup.status === 'Submitted' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              )}>
                {standup.status}
              </Badge>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col gap-4">
              {standup.status === 'Submitted' ? (
                <>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Yesterday</h4>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{standup.yesterday}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Today</h4>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{standup.today}</p>
                  </div>
                  {standup.blockers && standup.blockers !== 'None.' && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 mt-auto">
                      <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Blockers</h4>
                      <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{standup.blockers}</p>
                    </div>
                  )}
                  {standup.blockers === 'None.' && (
                    <div className="mt-auto">
                      <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Blockers</h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">None.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className={cn("text-sm font-semibold text-slate-500 dark:text-slate-400", role === 'manager' && "mb-4")}>Has not submitted yet.</p>
                  {role === 'manager' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSendReminder(standup)}
                      disabled={sentReminders.has(standup.id)}
                      className="h-8 rounded-lg font-bold border-orange-200 text-orange-600 dark:border-orange-900/50 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 disabled:opacity-50 disabled:border-slate-200 disabled:text-slate-500 dark:disabled:border-slate-800 dark:disabled:text-slate-500"
                    >
                      {sentReminders.has(standup.id) ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Sent!</>
                      ) : (
                        <><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Send Reminder</>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Card Footer */}
            {standup.status === 'Submitted' && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between transition-opacity">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{standup.time}</span>
                {role === 'manager' && (
                  <Button onClick={() => toast('Opening Reply Thread...')} variant="ghost" size="sm" className="h-7 text-xs font-bold text-slate-500 hover:text-orange-600">
                    <MessageSquare className="h-3 w-3 mr-1.5" /> Reply
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {role !== 'manager' && (
        <div className="mt-12 space-y-8 animate-in fade-in duration-700">
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Today's Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Card 1: Tasks Completed */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tasks Completed</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{tasksCompletedCount}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <CheckSquare className="h-6 w-6" />
                </div>
              </div>

              {/* Card 2: Tasks Pending */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tasks Pending</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{tasksPendingCount}</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>

              {/* Card 3: Hours Logged Today */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hours Logged Today</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{hoursLoggedToday.toFixed(1)}h</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                  <Clock className="h-6 w-6" />
                </div>
              </div>

              {/* Card 4: Current Sprint Progress */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sprint Progress</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{sprintProgress}%</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-xl">
                  <Percent className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left side (8 cols): Upcoming Deadlines + Weekly Standup Activity */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Upcoming Deadlines */}
              <Card className="rounded-2xl border-slate-200 dark:border-slate-700/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                    Upcoming Deadlines
                  </CardTitle>
                  <CardDescription>Track key milestones and scheduled due dates.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {upcomingDeadlines.length > 0 ? (
                      upcomingDeadlines.map((task: any) => {
                        let colorClass = "text-slate-600 dark:text-slate-400";
                        if (task.isOverdue) {
                          colorClass = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded";
                        } else if (task.isToday) {
                          colorClass = "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded";
                        }
                        return (
                          <div key={task.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{task.project_tag}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={cn("text-xs font-bold font-mono", colorClass)}>
                                {task.due_date}
                              </span>
                              <Badge className={cn(
                                "text-[10px] font-black border-0 uppercase tracking-wider",
                                task.priority === 'High' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" :
                                task.priority === 'Normal' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                                "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              )}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-slate-400 font-medium text-sm">No upcoming deadlines. All caught up!</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Standup Activity */}
              <Card className="rounded-2xl border-slate-200 dark:border-slate-700/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base flex items-center">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                    Weekly Standup Activity
                  </CardTitle>
                  <CardDescription>Standups submitted over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { day: 'Mon', submitted: 1 },
                        { day: 'Tue', submitted: 1 },
                        { day: 'Wed', submitted: 0 },
                        { day: 'Thu', submitted: 1 },
                        { day: 'Fri', submitted: 1 },
                        { day: 'Sat', submitted: 0 },
                        { day: 'Sun', submitted: 0 },
                      ]} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} allowDecimals={false} domain={[0, 1]} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                        <Bar dataKey="submitted" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right side (4 cols): Productivity Insights + Quick Notes */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Productivity Insights */}
              <Card className="rounded-2xl border-slate-200 dark:border-slate-700/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base flex items-center">
                    <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                    Productivity Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Hours Worked</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">6.4 hrs/day</span>
                  </div>
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Standup Streak</span>
                    <span className="text-sm font-black text-orange-600 flex items-center gap-1">
                      <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
                      5 Days
                    </span>
                  </div>
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completion Rate</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{sprintProgress}%</span>
                  </div>
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tasks Finished This Week</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{tasksCompletedCount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Notes */}
              <Card className="rounded-2xl border-amber-200 dark:border-amber-800/60 shadow-sm bg-amber-50/40 dark:bg-amber-950/15 overflow-hidden">
                <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-900/30">
                  <CardTitle className="text-base flex items-center text-amber-850 dark:text-amber-300">
                    <Edit3 className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                    Quick Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <textarea
                    value={note}
                    onChange={handleNoteChange}
                    placeholder="Write a sticky note for today's goals or ideas..."
                    className="w-full h-32 bg-transparent border-none outline-none resize-none text-sm text-slate-800 dark:text-slate-300 placeholder:text-amber-600/40 dark:placeholder:text-amber-400/30 leading-relaxed font-medium"
                  />
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      )}

      <Dialog open={!!viewingStandup} onOpenChange={(open) => !open && setViewingStandup(null)}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
          {viewingStandup && (
            <>
              <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                  <AvatarFallback className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 font-bold">
                    {viewingStandup.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    {viewingStandup.user}
                  </DialogTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {viewingStandup.role} · {viewingStandup.time}
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 font-bold text-xs uppercase">
                  {viewingStandup.status}
                </Badge>
              </DialogHeader>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Yesterday</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    {viewingStandup.yesterday}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Today</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    {viewingStandup.today}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Blockers</span>
                  <p className={cn(
                    "text-sm leading-relaxed font-medium p-3 rounded-xl border",
                    viewingStandup.blockers && viewingStandup.blockers !== 'None.'
                      ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400"
                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/40 text-slate-500 dark:text-slate-400"
                  )}>
                    {viewingStandup.blockers || 'None.'}
                  </p>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button onClick={() => setViewingStandup(null)} className="h-10 rounded-xl px-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold">
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
