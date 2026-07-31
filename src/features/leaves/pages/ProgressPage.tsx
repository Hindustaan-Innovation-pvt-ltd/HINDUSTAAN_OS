import React from 'react';
import { Target, Flag, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Mock Data ---
const PROJECTS = [
  { id: '1', name: 'Authentication Pipeline', progress: 70, status: 'On Track', color: 'bg-emerald-500' },
  { id: '2', name: 'Dashboard UI Revamp', progress: 45, status: 'At Risk', color: 'bg-rose-500' },
  { id: '3', name: 'Supabase Migration', progress: 90, status: 'Almost Done', color: 'bg-emerald-500' },
];

const MILESTONES = [
  { id: 'm1', name: 'Alpha Release', progress: 100, color: 'bg-slate-800 dark:bg-slate-400' },
  { id: 'm2', name: 'Beta Testing', progress: 60, color: 'bg-orange-500' },
  { id: 'm3', name: 'Public Launch', progress: 15, color: 'bg-slate-300 dark:bg-slate-700' },
];

export default function ProgressPage({ session }: { session?: any }) {
  const role = session?.user?.user_metadata?.role || 'manager';

  if (role !== 'manager') {
    return (
      <div className="flex h-[400px] items-center justify-center text-slate-400 dark:text-slate-500">
        <p>You do not have permission to view global progress.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Global Progress</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">High-level view of project velocity and milestones.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Project Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center mb-6">
            <Rocket className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
            Project Execution
          </h3>
          <div className="space-y-6">
            {PROJECTS.map(project => (
              <div key={project.id}>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-700 dark:text-slate-200">{project.name}</span>
                  <span className={cn("text-slate-500 dark:text-slate-400")}>{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <div className={cn("h-full rounded-full transition-all duration-1000", project.color)} style={{ width: `${project.progress}%` }}></div>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 text-right">
                  {project.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center mb-6">
            <Target className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
            Milestone Tracker
          </h3>
          <div className="space-y-6">
            {MILESTONES.map(milestone => (
              <div key={milestone.id}>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-700 dark:text-slate-200 flex items-center">
                    <Flag className="h-3.5 w-3.5 mr-1.5 text-slate-400 dark:text-slate-500" />
                    {milestone.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{milestone.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <div className={cn("h-full rounded-full transition-all duration-1000", milestone.color)} style={{ width: `${milestone.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
