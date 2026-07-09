import React, { useState } from 'react';
import { Mic, Video, CheckCircle2, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

export default function DailyStandups({ session }: { session?: any }) {
  const role = session?.user?.user_metadata?.role || 'intern';
  const email = session?.user?.email || 'user@hindustaan.in';
  
  let currentUserName = 'Tanvy';
  if (email.toLowerCase().includes('amanda')) {
    currentUserName = 'Amanda Smith';
  } else if (email.toLowerCase().includes('rahul')) {
    currentUserName = 'Rahul Sharma';
  } else if (email.toLowerCase().includes('priya')) {
    currentUserName = 'Priya Patel';
  }

  const [standups, setStandups] = useState(MOCK_STANDUPS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ yesterday: '', today: '', blockers: '' });
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());

  // Filter standups to show only logged in employee if role is not manager
  const displayStandups = role !== 'manager'
    ? standups.filter(s => s.user.toLowerCase().includes(currentUserName.split(' ')[0].toLowerCase()))
    : standups;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.yesterday || !formData.today) return;
    
    const newStandup = {
      id: `s-${Date.now()}`,
      user: currentUserName,
      initials: currentUserName.split(' ').map(n=>n[0]).join(''),
      role: role === 'manager' ? 'Product Manager' : 'Developer',
      status: 'Submitted',
      yesterday: formData.yesterday,
      today: formData.today,
      blockers: formData.blockers || 'None.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Replace the pending entry for this user, or just add it to the top
    setStandups(prev => [newStandup, ...prev.filter(s => s.user !== currentUserName)]);
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
        
        <div className="flex items-center gap-3">
          {role === 'manager' && pendingCount > 0 && (
            <Button 
              onClick={handleRemindAll} 
              disabled={sentReminders.size >= pendingCount}
              className="h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm disabled:opacity-50"
            >
              {sentReminders.size >= pendingCount ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Reminders Sent</>
              ) : (
                <><AlertCircle className="h-4 w-4 mr-2" /> Remind All ({pendingCount})</>
              )}
            </Button>
          )}

          <Button variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hidden sm:flex">
            <Video className="h-4 w-4 mr-2 text-slate-400" /> Start Meeting
          </Button>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Button onClick={() => setIsModalOpen(true)} className={cn("h-10 rounded-xl font-bold shadow-sm transition-colors", role === 'manager' ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" : "bg-orange-600 hover:bg-orange-700 text-white")}>
              <Mic className="h-4 w-4 mr-2" /> Submit My Update
            </Button>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0">
              <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Daily Standup</DialogTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">What did you work on, and what's next?</p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yesterday" className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">What did you do yesterday?</Label>
                  <Textarea id="yesterday" required value={formData.yesterday} onChange={e => setFormData({...formData, yesterday: e.target.value})} placeholder="e.g. Completed the UI for the dashboard..." className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 rounded-xl resize-none text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="today" className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">What will you do today?</Label>
                  <Textarea id="today" required value={formData.today} onChange={e => setFormData({...formData, today: e.target.value})} placeholder="e.g. Start integrating the API endpoints..." className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 rounded-xl resize-none text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blockers" className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Any blockers? (Optional)</Label>
                  <Textarea id="blockers" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} placeholder="e.g. Waiting for backend team to fix the auth endpoint..." className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 rounded-xl resize-none text-slate-900 dark:text-white" />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl text-slate-900 dark:text-white" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">Submit Update</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-8 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm w-fit">
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

      {/* Standup Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayStandups.map(standup => (
          <div key={standup.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-md">
            
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
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10">
                    <MessageSquare className="h-3 w-3 mr-1.5" /> Reply
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
