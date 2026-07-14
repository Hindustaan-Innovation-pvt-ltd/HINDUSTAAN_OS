import React from 'react';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProjectsTab({ data, updateField }: { data: any, updateField: (key: string, value: any) => void }) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Project Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure default workflows and statuses for new projects.</p>
      </div>

      <SettingsSection 
        title="Creation Defaults" 
        description="These settings will be applied when creating new items unless specified otherwise."
      >
        <SettingsRow 
          title="Default Project Status" 
          description="The initial status assigned when a new project is created."
        >
          <Select 
            value={data.defaultProjectStatus || 'Planning'} 
            onValueChange={(val) => updateField('defaultProjectStatus', val)}
          >
            <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-64">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow 
          title="Default Task Status" 
          description="The initial column a new task will appear in."
        >
          <Select 
            value={data.defaultTaskStatus || 'To Do'} 
            onValueChange={(val) => updateField('defaultTaskStatus', val)}
          >
            <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-64">
              <SelectValue placeholder="Select Task Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        
        <SettingsRow 
          title="Default Priority" 
          description="The baseline urgency assigned to new tasks."
        >
          <Select 
            value={data.defaultPriority || 'Medium'} 
            onValueChange={(val) => updateField('defaultPriority', val)}
          >
            <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-64">
              <SelectValue placeholder="Select Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
