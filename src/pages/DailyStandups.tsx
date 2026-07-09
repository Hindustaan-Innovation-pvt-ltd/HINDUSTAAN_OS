import React from 'react';
import { Mic, Video, CheckCircle2, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

  // Filter standups to show only logged in employee if role is not manager
  const displayStandups = role !== 'manager'
    ? MOCK_STANDUPS.filter(s => s.user.toLowerCase().includes(currentUserName.split(' ')[0].toLowerCase()))
    : MOCK_STANDUPS;

  const submittedCount = displayStandups.filter(s => s.status === 'Submitted').length;
  const pendingCount = displayStandups.filter(s => s.status === 'Pending').length;

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
          <Button variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
            <Video className="h-4 w-4 mr-2 text-slate-400" /> Start Meeting
          </Button>
          <Button className="h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm">
            <Mic className="h-4 w-4 mr-2" /> Submit My Update
          </Button>
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
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yesterday</h4>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{standup.yesterday}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today</h4>
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
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blockers</h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-500">None.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Has not submitted yet.</p>
                </div>
              )}
            </div>
            
            {/* Card Footer */}
            {standup.status === 'Submitted' && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-slate-400">{standup.time}</span>
                {role === 'manager' && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-slate-500 hover:text-orange-600">
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
