import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn, logActivity } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

// Mock Data
const PROJECTS = [
  { id: 'p1', name: 'Authentication Flow Pipeline' },
  { id: 'p2', name: 'Dashboard UI Revamp' },
  { id: 'p3', name: 'Supabase Data Migration' },
  { id: 'p4', name: 'Role-Based Access Control' },
  { id: 'p5', name: 'Email Notifications System' },
];

const MILESTONES = [
  { id: 'm1', name: 'Alpha Release' },
  { id: 'm2', name: 'Beta Testing' },
  { id: 'm3', name: 'Production Launch' },
];

const assignTaskSchema = z.object({
  title: z.string().min(1, 'Task Title is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  assigneeId: z.string().min(1, 'Assignee is required'),
  priority: z.string(),
  status: z.string(),
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().optional(),
  milestone: z.string().optional(),
}).refine(data => {
  if (data.startDate && data.dueDate) {
    return data.dueDate >= data.startDate;
  }
  return true;
}, {
  message: "Due Date cannot be before Start Date",
  path: ["dueDate"],
});

export function AssignTaskDialog({ open, onOpenChange, defaultAssigneeId, defaultAssigneeName, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, defaultAssigneeId?: string, defaultAssigneeName?: string, onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [dbTasks, setDbTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    const loadDialogData = async () => {
      try {
        const [projRes, teamRes, taskRes] = await Promise.all([
          api.get('/projects'),
          api.get('/team'),
          api.get('/tasks')
        ]);
        if (projRes.data?.success) {
          const allProjs = projRes.data.data || [];
          setDbProjects(allProjs.filter((p: any) => !p.status || p.status.toLowerCase() === 'active'));
        }
        if (teamRes.data?.success) setTeamMembers(teamRes.data.data.members || []);
        if (taskRes.data?.success) setDbTasks(taskRes.data.data || []);
      } catch (err) {
        console.warn('Failed to load dialog metadata:', err);
      }
    };
    loadDialogData();
  }, [open]);

  const form = useForm<z.infer<typeof assignTaskSchema>>({
    resolver: zodResolver(assignTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      assigneeId: defaultAssigneeId || '',
      priority: 'Medium',
      status: 'To Do',
      estimatedHours: undefined,
      milestone: '',
    },
  });

  useEffect(() => {
    if (open && defaultAssigneeId) {
      form.setValue('assigneeId', defaultAssigneeId);
    }
  }, [open, defaultAssigneeId, form]);

  const activeProjects = dbProjects.length > 0 ? dbProjects : [];
  let activeTeamMembers = teamMembers.length > 0 ? teamMembers : [];
  if (defaultAssigneeId && defaultAssigneeName && !activeTeamMembers.some(m => m.id === defaultAssigneeId)) {
    activeTeamMembers = [{ id: defaultAssigneeId, name: defaultAssigneeName }, ...activeTeamMembers];
  }

  const onSubmit = async (values: z.infer<typeof assignTaskSchema>) => {
    setLoading(true);
    
    const loggedIn = getCurrentUser();
    const assignee = activeTeamMembers.find(i => i.id === values.assigneeId);
    const project = activeProjects.find(p => p.id === values.projectId);
    
    const newTask = {
      id: `t-${Date.now()}`,
      title: values.title,
      description: values.description || '',
      project_tag: project ? project.name : 'General',
      assignee_name: assignee ? assignee.name : 'Unassigned',
      assignee_id: values.assigneeId,
      priority: (values.priority || 'Normal') as 'High' | 'Normal' | 'Low',
      due_date: values.dueDate ? format(values.dueDate, 'MMM dd, yyyy') : 'No Date',
      status: (values.status || 'To Do') as 'To Do' | 'In Progress' | 'In Review' | 'Done',
    };

    const saved = localStorage.getItem('hindustaan_tasks_list');
    const existingTasks = saved ? JSON.parse(saved) : [];
    const updatedTasks = [newTask, ...existingTasks];
    
    localStorage.setItem('hindustaan_tasks_list', JSON.stringify(updatedTasks));
    
    // Dispatch local StorageEvent for real-time tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'hindustaan_tasks_list',
      newValue: JSON.stringify(updatedTasks)
    }));

    // Log Activity
    logActivity('Manager', 'assigned task to', assignee ? assignee.name : 'Unknown', 'assign');

    // Save to backend database
    try {
      const existingTask = dbTasks.find(t => t.title === values.title || t.id === values.title);
      if (existingTask) {
        await api.patch(`/tasks/${existingTask.id}/assign`, {
          userId: values.assigneeId
        });
        if (values.projectId && values.projectId !== existingTask.projectId && values.projectId !== existingTask.project?.id) {
          await api.patch(`/tasks/${existingTask.id}`, { projectId: values.projectId });
        }
      } else {
        const backendPriority = values.priority.toLowerCase() === 'normal' ? 'medium' : values.priority.toLowerCase();
        await api.post('/tasks', {
          title: values.title,
          desc: values.description || '',
          projectId: values.projectId,
          assigneeId: values.assigneeId || undefined,
          priority: backendPriority,
          startDate: values.startDate ? new Date(values.startDate) : undefined,
          dueDate: values.dueDate ? new Date(values.dueDate) : undefined,
          status: values.status === 'Done' ? 'done' : values.status === 'In Progress' ? 'in-progress' : values.status === 'In Review' ? 'in-review' : 'todo'
        });
      }

      toast.success('Task assigned successfully to ' + (assignee?.name || defaultAssigneeName || 'team member') + '!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('Could not save task to database', { description: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] rounded-xl overflow-hidden bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 shadow-2xl">
        
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Assign New Task</DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {defaultAssigneeName ? `Assign task and project to ${defaultAssigneeName}.` : `Assign task and project to team member.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[80vh]">
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Title & Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Task <span className="text-orange-500">*</span></FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          const matchedTask = dbTasks.find(t => t.title === val || t.id === val);
                          if (matchedTask) {
                            const matchedProj = activeProjects.find(p => p.name === matchedTask.project_tag || p.id === matchedTask.projectId);
                            if (matchedProj) {
                              form.setValue('projectId', matchedProj.id);
                            }
                          }
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-orange-500">
                            <SelectValue placeholder="Select task from list" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl max-h-[300px]">
                          {dbTasks.length > 0 ? (
                            dbTasks.map(task => (
                              <SelectItem key={task.id} value={task.title} className="font-medium">{task.title}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="No tasks available" disabled className="font-medium">No tasks available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Project <span className="text-orange-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-orange-500">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl">
                          {activeProjects.map(project => (
                            <SelectItem key={project.id} value={project.id} className="font-medium">{project.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Assign To (Only shown when not pre-selected from an employee card) */}
              {!defaultAssigneeId && (
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col pt-1.5">
                        <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Assign To <span className="text-orange-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "justify-between rounded-lg font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white",
                                  !field.value && "text-slate-500 dark:text-slate-400 font-normal"
                                )}
                              >
                                {field.value
                                  ? (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-[9px] bg-orange-100 text-orange-700">
                                          {activeTeamMembers.find(i => i.id === field.value)?.initials || activeTeamMembers.find(i => i.id === field.value)?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{activeTeamMembers.find(i => i.id === field.value)?.name}</span>
                                    </div>
                                  )
                                  : "Select intern..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl" align="start">
                            <Command>
                              <CommandInput placeholder="Search intern..." />
                              <CommandList>
                                <CommandEmpty>No intern found.</CommandEmpty>
                                <CommandGroup>
                                  {activeTeamMembers.map((intern) => (
                                    <CommandItem
                                      value={intern.name}
                                      key={intern.id}
                                      onSelect={() => {
                                        form.setValue("assigneeId", intern.id);
                                      }}
                                      className="flex items-center gap-2 cursor-pointer font-medium"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          intern.id === field.value
                                            ? "opacity-100 text-orange-500"
                                            : "opacity-0"
                                        )}
                                      />
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                          {intern.initials || intern.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span>{intern.name}</span>
                                        <span className="text-xs text-slate-500">{intern.designation || intern.role || 'Intern'}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 transition-colors">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Assign Task
              </Button>
            </DialogFooter>
          </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}
