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
import { INITIAL_TASKS } from '@/data/mockData';
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

import { GLOBAL_TEAM_MEMBERS } from '@/data/mockData';
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

export function AssignTaskDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    const loadDialogData = async () => {
      try {
        const [projRes, teamRes] = await Promise.all([
          api.get('/projects'),
          api.get('/team')
        ]);
        if (projRes.data?.success) setDbProjects(projRes.data.data || []);
        if (teamRes.data?.success) setTeamMembers(teamRes.data.data.members || []);
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
      assigneeId: '',
      priority: 'Medium',
      status: 'To Do',
      estimatedHours: undefined,
      milestone: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof assignTaskSchema>) => {
    setLoading(true);
    const loggedIn = getCurrentUser();
    const assignee = teamMembers.find(i => i.id === values.assigneeId);
    const project = dbProjects.find(p => p.id === values.projectId);

    // Save to backend database
    try {
      const backendPriority = values.priority.toLowerCase() === 'normal' ? 'medium' : values.priority.toLowerCase();
      const res = await api.post('/tasks', {
        title: values.title,
        desc: values.description || '',
        projectId: values.projectId,
        assigneeId: values.assigneeId || undefined,
        priority: backendPriority,
        startDate: values.startDate ? new Date(values.startDate) : undefined,
        dueDate: values.dueDate ? new Date(values.dueDate) : undefined,
        status: values.status === 'Done' ? 'done' : values.status === 'In Progress' ? 'in-progress' : values.status === 'In Review' ? 'in-review' : 'todo'
      });

      if (res.data?.success) {
        toast.success('Task created and assigned successfully on server!');
        // Update local cache for immediate feedback
        const newTask = {
          id: res.data.data?.id || `t-${Date.now()}`,
          title: values.title,
          description: values.description || '',
          project_tag: project ? project.name : 'General',
          assignee_name: assignee ? assignee.name : 'Unassigned',
          assignee_id: values.assigneeId,
          priority: (values.priority || 'Normal') as any,
          due_date: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : 'No Date',
          status: (values.status || 'To Do') as any,
        };

        const saved = localStorage.getItem('hindustaan_tasks_list');
        const existingTasks = saved ? JSON.parse(saved) : INITIAL_TASKS;
        const updatedTasks = [newTask, ...existingTasks];
        localStorage.setItem('hindustaan_tasks_list', JSON.stringify(updatedTasks));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'hindustaan_tasks_list',
          newValue: JSON.stringify(updatedTasks)
        }));
      }
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
            Create and assign a new task to an intern.
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
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Task Title <span className="text-orange-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Landing Page Design" className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-orange-500" {...field} />
                      </FormControl>
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
                          {dbProjects.map(project => (
                            <SelectItem key={project.id} value={project.id} className="font-medium">{project.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide task details, links, or acceptance criteria..." 
                        className="resize-none h-20 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-orange-500" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assignee & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        {teamMembers.find(i => i.id === field.value)?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{teamMembers.find(i => i.id === field.value)?.name}</span>
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
                                {teamMembers.map((intern) => (
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
                                        {intern.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span>{intern.name}</span>
                                      <span className="text-xs text-slate-500">{intern.designation || 'Intern'}</span>
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

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-orange-500">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl">
                          <SelectItem value="Low"><Badge variant="outline" className="text-slate-500 border-slate-200">Low</Badge></SelectItem>
                          <SelectItem value="Medium"><Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-500/10">Medium</Badge></SelectItem>
                          <SelectItem value="High"><Badge variant="outline" className="text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-500/10">High</Badge></SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status & Milestone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-orange-500">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl">
                          <SelectItem value="To Do">To Do</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="In Review">In Review</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="milestone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Milestone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-orange-500">
                            <SelectValue placeholder="No milestone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl">
                          <SelectItem value="none" className="italic text-slate-500">No milestone</SelectItem>
                          {MILESTONES.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates & Hours */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-1.5">
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800",
                                !field.value && "text-slate-500 dark:text-slate-400"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-1.5">
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800",
                                !field.value && "text-slate-500 dark:text-slate-400"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Est. Hours</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.5" 
                          placeholder="e.g. 5" 
                          className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-orange-500" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
