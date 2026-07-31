import React from 'react';

export default function MyTasksWidget() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 h-[320px] flex flex-col shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">My Active Tasks</h2>
      <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-medium">
        <p>No active tasks assigned.</p>
      </div>
    </div>
  );
}
