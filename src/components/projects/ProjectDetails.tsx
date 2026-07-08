import React from 'react';
import { ArrowLeft, CheckCircle2, Clock, Flag, LayoutGrid, Target, Users, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ProjectDetails({ project, onBack }: { project: any, onBack: () => void }) {
  // Mock Milestones
  const milestones = [
    { id: 1, title: 'Requirement Gathering', status: 'completed', date: 'Oct 01' },
    { id: 2, title: 'UI/UX Design', status: 'completed', date: 'Oct 15' },
    { id: 3, title: 'Frontend Development', status: 'in-progress', date: 'Nov 10' },
    { id: 4, title: 'Backend Integration', status: 'pending', date: 'Nov 25' },
    { id: 5, title: 'Beta Testing', status: 'pending', date: 'Dec 05' },
  ];

  // Mock Tasks
  const tasks = [
    { id: 't1', title: 'Design System Setup', status: 'Done', assignee: 'Amanda S.' },
    { id: 't2', title: 'Authentication Flow', status: 'Done', assignee: 'Rahul S.' },
    { id: 't3', title: 'Dashboard Layout', status: 'In Progress', assignee: 'Priya P.' },
    { id: 't4', title: 'API Integration', status: 'In Progress', assignee: 'Rohan G.' },
    { id: 't5', title: 'User Profile Page', status: 'To Do', assignee: 'Unassigned' },
    { id: 't6', title: 'Email Notifications', status: 'To Do', assignee: 'Unassigned' },
  ];

  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const totalTasks = tasks.length;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-orange-600 hover:border-orange-200 dark:hover:border-orange-900/50 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{project.name}</h2>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Lead: <span className="font-semibold text-slate-700 dark:text-slate-300">{project.manager || 'Unassigned'}</span></span>
            <span>•</span>
            <span>Due: <span className="font-semibold text-slate-700 dark:text-slate-300">{project.deadline || 'TBD'}</span></span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Tasks</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalTasks}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <LayoutGrid className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Completed</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedTasks}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Milestones</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{milestones.length}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Flag className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="relative z-10">
            <p className="text-sm font-bold opacity-90">Overall Progress</p>
            <p className="text-3xl font-black mt-1">{progress}%</p>
          </div>
          <div className="relative z-10 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Target className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Milestones Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Flag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project Milestones</h3>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
            {milestones.map((milestone, i) => (
              <div key={milestone.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10", 
                  milestone.status === 'completed' ? "bg-emerald-500" : 
                  milestone.status === 'in-progress' ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-800"
                )}>
                  {milestone.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-white" /> : 
                   milestone.status === 'in-progress' ? <Clock className="h-4 w-4 text-white" /> :
                   <div className="h-2 w-2 rounded-full bg-slate-400" />
                  }
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-500">{milestone.date}</span>
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider", 
                      milestone.status === 'completed' ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20" : 
                      milestone.status === 'in-progress' ? "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/20" : "text-slate-500 border-slate-200 dark:border-slate-800"
                    )}>
                      {milestone.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{milestone.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Board / List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Task Tracker</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            {['To Do', 'In Progress', 'Done'].map(status => (
              <div key={status} className="flex flex-col bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">{status}</h4>
                  <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {tasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span className="text-xs font-medium text-slate-500">{task.assignee}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === status).length === 0 && (
                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      <span className="text-xs font-medium text-slate-400">No tasks</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
