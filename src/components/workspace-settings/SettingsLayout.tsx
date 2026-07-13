import React from 'react';
import { cn } from '@/lib/utils';

export function SettingsSection({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mb-10", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
        {description && <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      <div className="bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {children}
        </div>
      </div>
    </section>
  );
}

export function SettingsRow({ 
  title, 
  description, 
  children,
  vertical = false
}: { 
  title: string; 
  description?: React.ReactNode; 
  children: React.ReactNode;
  vertical?: boolean;
}) {
  if (vertical) {
    return (
      <div className="p-6 flex flex-col gap-3 transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-900/30">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
          {description && <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</div>}
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-900/30">
      <div className="flex-1 pr-4 max-w-2xl">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
        {description && <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</div>}
      </div>
      <div className="w-full sm:w-auto min-w-[200px] flex sm:justify-end shrink-0">
        {children}
      </div>
    </div>
  );
}
