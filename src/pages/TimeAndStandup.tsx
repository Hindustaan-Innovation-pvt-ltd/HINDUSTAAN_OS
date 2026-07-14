import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Send 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TimeAndStandup({ session }: { session?: any }) {
  const role = session?.user?.user_metadata?.role || 'intern';
  
  const currentHour = new Date().getHours();
  const isSubmissionWindowOpen = currentHour >= 8 && currentHour < 11;

  // Standup State
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const hasBlockers = blockers.trim().length > 0;

  // Time Tracking State
  const [selectedTask, setSelectedTask] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [workNote, setWorkNote] = useState('');
  const [cumulativeHours, setCumulativeHours] = useState(6.5); // Mock starting hours for today
  
  const handleStandupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Standup submitted successfully!');
    setYesterday('');
    setToday('');
    setBlockers('');
  };

  const handleTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(hoursWorked) || 0;
    setCumulativeHours(prev => prev + hrs);
    setHoursWorked('');
    setWorkNote('');
    setSelectedTask('');
    alert('Time logged successfully!');
  };

  const exceedsCap = (cumulativeHours + (parseFloat(hoursWorked) || 0)) > 10;

  // Mock Calendar Heatmap Data
  const weeklyLog = [
    { day: 'Mon', hours: 8 },
    { day: 'Tue', hours: 9.5 },
    { day: 'Wed', hours: 4 },
    { day: 'Thu', hours: cumulativeHours },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ];

  // Mock Manager Data
  const TEAM_SUBMISSIONS = [
    {
      id: '1', name: 'Amanda Smith', role: 'Frontend Intern',
      standup: { yesterday: 'Built the new Kanban UI components.', today: 'Integrating dark mode fixes.', blockers: 'Figma API token expired and waiting for renewal.' },
      logs: [{ task: 'Landing Page', hours: 3.5 }, { task: 'Navbar', hours: 3 }]
    },
    {
      id: '2', name: 'Rahul Sharma', role: 'Backend Intern',
      standup: { yesterday: 'Configured Supabase schemas.', today: 'Writing RLS policies.', blockers: 'None.' },
      logs: [{ task: 'API Integration', hours: 8 }]
    },
    {
      id: '3', name: 'Priya Patel', role: 'UX Intern',
      standup: { yesterday: 'User testing sessions.', today: 'Consolidating feedback report.', blockers: 'Waiting on video recordings to process.' },
      logs: [{ task: 'User Interviews', hours: 4 }, { task: 'Data Entry', hours: 2 }]
    }
  ];

  if (role === 'manager') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Team Submissions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review daily standups and time logs for all employees.</p>
        </div>

        <div className="space-y-6">
          {TEAM_SUBMISSIONS.map(intern => (
            <div key={intern.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col p-6">
              
              <div className="flex items-center space-x-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-bold border-2 border-white shadow-sm text-lg">
                  {intern.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{intern.name}</h4>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{intern.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Standup */}
                <div>
                  <h5 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Daily Standup
                  </h5>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Yesterday</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{intern.standup.yesterday}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Today</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{intern.standup.today}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Blockers</p>
                      <p className={cn("text-sm font-semibold", intern.standup.blockers !== 'None.' ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-200")}>{intern.standup.blockers}</p>
                    </div>
                  </div>
                </div>

                {/* Logs */}
                <div>
                  <h5 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                    <Clock className="h-4 w-4 mr-2" /> Time Logs
                  </h5>
                  <div className="space-y-3">
                    {intern.logs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{log.task}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">{log.hours}h</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white pt-4">
                      <span>Total Today</span>
                      <span className="text-orange-600 dark:text-orange-400">{intern.logs.reduce((acc, log) => acc + log.hours, 0)} hrs</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Core Tracking</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Submit your morning standup and log project hours.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* COLUMN A: DAILY STANDUP */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Daily Standup</h3>
            </div>
            {isSubmissionWindowOpen ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 mr-1.5 animate-pulse"></span>
                Submission Window Open
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Late Submission Flag Active
              </span>
            )}
          </div>

          {/* Standup Form */}
          <form onSubmit={handleStandupSubmit} className="flex-1 p-6 space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                What did you complete yesterday? <span className="text-rose-500">*</span>
              </label>
              <textarea 
                required
                value={yesterday}
                onChange={e => setYesterday(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 p-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none h-24"
                placeholder="e.g., Finished the backend API integration for user profiles..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                What are you working on today? <span className="text-rose-500">*</span>
              </label>
              <textarea 
                required
                value={today}
                onChange={e => setToday(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 p-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none h-24"
                placeholder="e.g., Building out the frontend Kanban drag-and-drop components..."
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Are there any current blockers?
                </label>
                {hasBlockers && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:text-rose-300 uppercase tracking-wider animate-in fade-in zoom-in duration-300">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Manager Alert
                  </span>
                )}
              </div>
              <textarea 
                value={blockers}
                onChange={e => setBlockers(e.target.value)}
                className={cn(
                  "w-full rounded-xl border p-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 transition-all resize-none h-24",
                  hasBlockers 
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/50" 
                    : "border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 focus:border-orange-500 focus:ring-orange-500/10"
                )}
                placeholder="List anything slowing you down..."
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <span>Submit Standup</span>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* COLUMN B: WORK LOG & TIME TRACKING */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          {/* Section Header */}
          <div className="flex items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
            <h3 className="font-bold text-slate-900 dark:text-white">Time Tracking</h3>
          </div>

          {/* Time Entry Form */}
          <form onSubmit={handleTimeSubmit} className="p-6 space-y-6 border-b border-slate-100 dark:border-slate-800">
            
            {exceedsCap && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-bold text-amber-800">Daily Cap Warning</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    This entry pushes your total tracked time today to {(cumulativeHours + (parseFloat(hoursWorked) || 0)).toFixed(1)}h, exceeding the daily 10h target threshold.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Assigned Task
                </label>
                <select 
                  required
                  value={selectedTask}
                  onChange={e => setSelectedTask(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 p-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 cursor-pointer"
                >
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="" disabled>Select a task...</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="t-1">Design Authentication Split Screen</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="t-2">Configure Supabase RLS Policies</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="t-3">Implement Kanban Drag-and-Drop</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Hours
                </label>
                <input 
                  required
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="12"
                  value={hoursWorked}
                  onChange={e => setHoursWorked(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 p-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Work Note
              </label>
              <input 
                required
                type="text"
                value={workNote}
                onChange={e => setWorkNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 p-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                placeholder="Briefly describe what you did..."
              />
            </div>

            <button 
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Log Time Entry</span>
            </button>
          </form>

          {/* Calendar Heatmap View */}
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 mt-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-200">
                <Calendar className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500" />
                Weekly Summary
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total: <span className="text-slate-900 dark:text-white">{weeklyLog.reduce((a, b) => a + b.hours, 0).toFixed(1)}h</span>
              </div>
            </div>

            <div className="flex justify-between items-end h-20 gap-2">
              {weeklyLog.map((day, idx) => {
                // Heatmap dynamic coloring logic
                let colorClass = "bg-slate-200 dark:bg-slate-700";
                if (day.hours > 0 && day.hours <= 4) colorClass = "bg-orange-300 dark:bg-orange-400/60";
                else if (day.hours > 4 && day.hours <= 8) colorClass = "bg-orange-400 dark:bg-orange-500";
                else if (day.hours > 8) colorClass = "bg-orange-500 dark:bg-orange-600";

                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                    {/* Floating Tooltip on Hover */}
                    <div className="absolute -top-7 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {day.hours.toFixed(1)}h
                    </div>
                    {/* Heatmap Bar */}
                    <div 
                      className={cn("w-full rounded-sm transition-all duration-500", colorClass)}
                      style={{ height: `${Math.max((day.hours / 12) * 100, 4)}%` }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase">{day.day}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Heatmap Legend */}
            <div className="flex items-center justify-end mt-4 space-x-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <div className="flex items-center"><div className="w-2 h-2 rounded-sm bg-slate-200 dark:bg-slate-700 mr-1"></div> 0h</div>
              <div className="flex items-center"><div className="w-2 h-2 rounded-sm bg-orange-300 dark:bg-orange-400/60 mr-1"></div> &lt;4h</div>
              <div className="flex items-center"><div className="w-2 h-2 rounded-sm bg-orange-400 dark:bg-orange-500 mr-1"></div> 4-8h</div>
              <div className="flex items-center"><div className="w-2 h-2 rounded-sm bg-orange-500 dark:bg-orange-600 mr-1"></div> 8h+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
