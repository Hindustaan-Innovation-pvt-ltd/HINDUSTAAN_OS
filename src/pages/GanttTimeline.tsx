import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CalendarDays, Filter, ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronRight as ChevronRightIcon, Clock, MoreHorizontal, Link2, AlertCircle, CheckCircle2, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GLOBAL_TEAM_MEMBERS } from '@/data/mockData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isSameMonth, addDays, subMonths, addMonths, differenceInDays, isWeekend, setMonth, setYear } from 'date-fns';
import { useProjects } from '@/context/ProjectContext';

type ProjectTask = {
  id: string;
  type: string;
  name: string;
  start: Date;
  end: Date;
  assignee: string;
  initials: string;
  progress: number;
  status: string;
};

type Project = {
  id: string;
  name: string;
  manager: string;
  color: string;
  tasks: ProjectTask[];
  members?: string[];
};

// Map global project state to Gantt timeline format
const mapGlobalProjectsToGantt = (globalProjects: any[], currentDate: Date): Project[] => {
  const monthStart = startOfMonth(currentDate);
  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
  
  return globalProjects.map((p, pIndex) => {
    return {
      id: p.id,
      name: p.name,
      manager: p.manager || 'Unassigned',
      color: p.color || colors[pIndex % colors.length],
      members: p.members || [],
      tasks: (p.tasks || []).map((t: any, tIndex: number) => {
        // Fallback dates if missing
        const endDate = t.due_date ? new Date(t.due_date) : addDays(monthStart, 5 + tIndex);
        const startDate = t.start_date ? new Date(t.start_date) : subMonths(endDate, 0) > monthStart ? addDays(endDate, -5) : monthStart;
        
        let progress = 0;
        let status = 'pending';
        if (t.status === 'Done') { progress = 100; status = 'completed'; }
        else if (t.status === 'In Progress') { progress = 50; status = 'on-track'; }
        else if (t.status === 'Blocked') { progress = 20; status = 'at-risk'; }

        const assignee = t.assignee || t.assignee_name || 'Unassigned';
        const initials = assignee !== 'Unassigned' ? assignee.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??';

        return {
          id: t.id || `t-${p.id}-${tIndex}`,
          type: 'task',
          name: t.title || t.name || 'Unnamed Task',
          start: startDate,
          end: endDate,
          assignee,
          initials,
          progress,
          status
        };
      })
    };
  });
};

export default function GanttTimeline({ session }: { session?: any }) {
  const { projects: globalProjects, addProject } = useProjects();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  
  const projects = useMemo(() => mapGlobalProjectsToGantt(globalProjects, currentDate), [globalProjects, currentDate]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // New Project State
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectManager, setNewProjectManager] = useState('');
  const [newProjectMembers, setNewProjectMembers] = useState<string[]>([]);
  const [newProjectColor, setNewProjectColor] = useState('bg-orange-500');

  // Filter State
  const [filters, setFilters] = useState({
    showCompleted: true,
    showOnTrack: true,
    showAtRisk: true,
    showPending: true,
    showMilestones: true,
  });

  const daysInMonth = useMemo(() => eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }), [currentDate]);

  const toggleProject = (projectId: string) => {
    setCollapsedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const jumpToDate = (date: Date | undefined) => {
    if (!date) return;
    setCurrentDate(date);
  };

  const jumpToToday = () => setCurrentDate(new Date());
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Scroll to selected date
  useEffect(() => {
    if (scrollRef.current) {
      // Find the index of the current date in the currently displayed month
      // If we just jumped months, we want to scroll to the exact day if it's the same month as currentDate
      const targetDate = currentDate;
      const index = daysInMonth.findIndex(d => format(d, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd'));
      
      if (index !== -1) {
        const dayWidth = 48; // w-12 is 48px
        scrollRef.current.scrollLeft = (index * dayWidth) - (scrollRef.current.clientWidth / 2) + 288; // 288 is w-72
      } else {
        scrollRef.current.scrollLeft = 0;
      }
    }
  }, [currentDate, daysInMonth]);

  const handleAddProject = () => {
    if (!newProjectName || !newProjectManager) return;
    
    addProject({
      id: `p-${Date.now()}`,
      name: newProjectName,
      manager: newProjectManager,
      color: newProjectColor,
      tasks: [],
      members: newProjectMembers,
      status: 'In Progress'
    });
    setNewProjectOpen(false);
    setNewProjectName('');
    setNewProjectManager('');
    setNewProjectMembers([]);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-500 border-emerald-600';
      case 'on-track': return 'bg-blue-500 border-blue-600';
      case 'at-risk': return 'bg-rose-500 border-rose-600';
      default: return 'bg-slate-400 border-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case 'on-track': return <CircleDashed className="h-3 w-3 text-blue-500 animate-[spin_4s_linear_infinite]" />;
      case 'at-risk': return <AlertCircle className="h-3 w-3 text-rose-500" />;
      default: return <CircleDashed className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950/20">
      {/* Enterprise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 font-bold uppercase tracking-wider text-[10px]">Enterprise View</Badge>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Master Gantt Schedule
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Cross-functional project timelines and resource allocation.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={jumpToToday} 
            variant="outline" 
            className="h-9 rounded-lg border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50"
          >
            <Clock className="h-4 w-4 mr-2 text-slate-400" /> Today
          </Button>

          {/* Date Picker Popover */}
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/60 p-0.5">
            <Button onClick={prevMonth} variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-8 text-sm font-black px-4 text-slate-700 dark:text-slate-200 w-36 text-center uppercase tracking-wide rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-0">
                  {format(currentDate, 'MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" align="center">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 border-r border-slate-100 dark:border-slate-800 pr-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 px-2">Quick Jumps</span>
                    <Button variant="ghost" className="justify-start text-sm font-bold rounded-xl" onClick={jumpToToday}>Today</Button>
                    <Button variant="ghost" className="justify-start text-sm font-bold rounded-xl" onClick={() => jumpToDate(addDays(new Date(), 1))}>Tomorrow</Button>
                    <Button variant="ghost" className="justify-start text-sm font-bold rounded-xl" onClick={() => jumpToDate(addDays(new Date(), 7))}>Next Week</Button>
                    <Button variant="ghost" className="justify-start text-sm font-bold rounded-xl text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => jumpToDate(endOfMonth(new Date()))}>Month End</Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => {
                      if (date) jumpToDate(date);
                    }}
                    className="p-0"
                  />
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={nextMonth} variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 rounded-lg border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold shadow-sm hover:bg-slate-50 relative">
                <Filter className="h-4 w-4 mr-2 text-slate-400" /> Filter
                {Object.values(filters).some(v => !v) && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-5 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Display Filters</h4>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 rounded-lg" onClick={() => setFilters({showCompleted: true, showOnTrack: true, showAtRisk: true, showPending: true, showMilestones: true})}>Reset</Button>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer sr-only" checked={filters.showCompleted} onChange={(e) => setFilters(prev => ({...prev, showCompleted: e.target.checked}))} />
                    <div className="h-5 w-5 rounded border-2 border-slate-200 dark:border-slate-700 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all"></div>
                    <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Completed</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer sr-only" checked={filters.showOnTrack} onChange={(e) => setFilters(prev => ({...prev, showOnTrack: e.target.checked}))} />
                    <div className="h-5 w-5 rounded border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all"></div>
                    <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">On Track</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer sr-only" checked={filters.showAtRisk} onChange={(e) => setFilters(prev => ({...prev, showAtRisk: e.target.checked}))} />
                    <div className="h-5 w-5 rounded border-2 border-slate-200 dark:border-slate-700 peer-checked:border-rose-500 peer-checked:bg-rose-500 transition-all"></div>
                    <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">At Risk</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer sr-only" checked={filters.showPending} onChange={(e) => setFilters(prev => ({...prev, showPending: e.target.checked}))} />
                    <div className="h-5 w-5 rounded border-2 border-slate-200 dark:border-slate-700 peer-checked:border-slate-500 peer-checked:bg-slate-500 transition-all"></div>
                    <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Pending</span>
                  </div>
                </label>
                <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-3" />
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer sr-only" checked={filters.showMilestones} onChange={(e) => setFilters(prev => ({...prev, showMilestones: e.target.checked}))} />
                    <div className="h-5 w-5 rounded border-2 border-slate-200 dark:border-slate-700 peer-checked:border-amber-500 peer-checked:bg-amber-500 transition-all"></div>
                    <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 transform rotate-45 bg-amber-500 border border-amber-600 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Milestones</span>
                  </div>
                </label>
              </div>
            </PopoverContent>
          </Popover>

          {/* New Project Dialog */}
          <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold shadow-sm">
                <Plus className="h-4 w-4 mr-2" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Create New Project</DialogTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set up a new master project timeline. This will be visible to all assigned teams.</p>
              </DialogHeader>
              <div className="grid gap-6 p-6 py-5">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Q4 Marketing Push" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 focus-visible:ring-orange-500 font-bold text-slate-900 dark:text-white shadow-sm"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="manager" className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team Leader</Label>
                  <Select value={newProjectManager} onValueChange={setNewProjectManager}>
                    <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 focus:ring-orange-500 font-bold text-slate-900 dark:text-white shadow-sm">
                      <SelectValue placeholder="Select a team leader" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl max-h-[220px] overflow-y-auto scrollbar-hide">
                      {GLOBAL_TEAM_MEMBERS.map(m => m.name).map((emp, i) => {
                        const colors = ['bg-orange-100 text-orange-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700'];
                        const colorClass = colors[i % colors.length];
                        return (
                          <SelectItem key={emp} value={emp}>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-6 w-6"><AvatarFallback className={`text-[9px] font-black ${colorClass}`}>{emp.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                              <span className="font-bold">{emp}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 mt-1">
                  <Label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Additional Team Members (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-auto min-h-[44px] rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 font-bold text-slate-900 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-left">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {newProjectMembers.length > 0 ? (
                            newProjectMembers.map(member => (
                              <Badge key={member} variant="secondary" className="rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-200/50 dark:border-slate-700/50 px-2.5 py-1 flex items-center gap-1.5">
                                {member}
                                <div 
                                  className="cursor-pointer rounded-full p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors opacity-70 hover:opacity-100"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setNewProjectMembers(prev => prev.filter(m => m !== member));
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </div>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 font-medium py-1">Select team members...</span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1.5 rounded-xl border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-950" align="start">
                      <div className="flex flex-col max-h-[220px] overflow-y-auto scrollbar-hide">
                        {GLOBAL_TEAM_MEMBERS.map(m => m.name).filter(m => m !== newProjectManager).map((member) => (
                          <div
                            key={member}
                            onClick={() => {
                              setNewProjectMembers(prev => 
                                prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
                              )
                            }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors",
                              newProjectMembers.includes(member) && "bg-slate-50 dark:bg-slate-900/40"
                            )}
                          >
                            <div className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border shadow-sm transition-colors",
                              newProjectMembers.includes(member)
                                ? "bg-orange-500 border-orange-500 text-white"
                                : "bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                            )}>
                              {newProjectMembers.includes(member) && <CheckCircle2 className="h-3 w-3" />}
                            </div>
                            <span className={cn(
                              "text-sm font-semibold",
                              newProjectMembers.includes(member) ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                            )}>{member}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Theme Color</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {[
                      { name: 'Orange', value: 'bg-orange-500' },
                      { name: 'Blue', value: 'bg-blue-500' },
                      { name: 'Emerald', value: 'bg-emerald-500' },
                      { name: 'Indigo', value: 'bg-indigo-500' },
                      { name: 'Rose', value: 'bg-rose-500' },
                      { name: 'Purple', value: 'bg-purple-500' },
                    ].map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewProjectColor(color.value)}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ring-offset-2 dark:ring-offset-slate-950",
                          color.value,
                          newProjectColor === color.value 
                            ? "ring-2 ring-slate-900 dark:ring-white scale-110" 
                            : "opacity-80 hover:opacity-100 hover:scale-110 hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-700"
                        )}
                        title={color.name}
                      >
                        {newProjectColor === color.value && <CheckCircle2 className="h-4 w-4 text-white drop-shadow-sm" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 sm:justify-between items-center">
                <Button variant="ghost" onClick={() => setNewProjectOpen(false)} className="rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white">Cancel</Button>
                <Button 
                  onClick={handleAddProject} 
                  disabled={!newProjectName || !newProjectManager}
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Launch Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-lg overflow-hidden flex flex-col relative ring-1 ring-slate-900/5 mt-6">
        
        {/* Legend */}
        <div className="flex items-center gap-6 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Completed</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> On Track</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /> At Risk</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400" /> Pending</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 transform rotate-45 bg-amber-500 border border-amber-600" /> Milestone</div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto smooth-scroll hide-scrollbar">
          <div className="min-w-max">
            
            {/* Timeline Header */}
            <div className="flex sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-72 shrink-0 p-4 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-50 bg-white/95 dark:bg-slate-900/95 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Work Breakdown</span>
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex relative">
                {daysInMonth.map((day, i) => {
                  const today = isToday(day);
                  const weekend = isWeekend(day);
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "w-12 shrink-0 flex flex-col items-center justify-center py-2 border-r border-slate-100 dark:border-slate-800/50 last:border-0 relative transition-colors",
                        today ? "bg-blue-50/80 dark:bg-blue-500/10" : weekend ? "bg-slate-50/50 dark:bg-slate-800/20" : ""
                      )}
                    >
                      {today && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                      )}
                      <span className={cn("text-[10px] font-black uppercase tracking-wider", today ? "text-blue-600 dark:text-blue-400" : weekend ? "text-slate-400" : "text-slate-500")}>
                        {format(day, 'EEE')}
                      </span>
                      <span className={cn("text-sm font-black", today ? "text-blue-700 dark:text-blue-300" : weekend ? "text-slate-400" : "text-slate-700 dark:text-slate-300")}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Body */}
            <div className="relative">
              {/* Background Grid Lines */}
              <div className="absolute top-0 bottom-0 left-72 right-0 flex pointer-events-none z-0">
                {daysInMonth.map((day, i) => {
                  const today = isToday(day);
                  const weekend = isWeekend(day);
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "w-12 shrink-0 border-r border-slate-100 dark:border-slate-800/40 transition-colors",
                        today ? "bg-blue-50/30 dark:bg-blue-500/5 ring-1 ring-blue-500/20" : weekend ? "bg-slate-50/50 dark:bg-slate-800/20" : ""
                      )} 
                    />
                  );
                })}
              </div>

              {projects.map((project, pIdx) => {
                const isCollapsed = collapsedProjects[project.id];
                const isOdd = pIdx % 2 !== 0;
                
                // Apply filters to tasks
                const visibleTasks = project.tasks.filter(task => {
                  if (task.type === 'milestone' && !filters.showMilestones) return false;
                  if (task.status === 'completed' && !filters.showCompleted) return false;
                  if (task.status === 'on-track' && !filters.showOnTrack) return false;
                  if (task.status === 'at-risk' && !filters.showAtRisk) return false;
                  if (task.status === 'pending' && !filters.showPending) return false;
                  return true;
                });

                // Skip rendering empty projects if filters hide everything (optional, but clean)
                // if (visibleTasks.length === 0 && project.tasks.length > 0) return null;

                return (
                  <div key={project.id} className="group relative z-10 mb-6 border-y border-slate-200 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/20 shadow-sm">
                    {/* Project Row */}
                    <div className="flex items-stretch border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer bg-slate-50/80 dark:bg-slate-900/40" onClick={() => toggleProject(project.id)}>
                      <div className="w-72 shrink-0 p-3 pl-4 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-30 transition-colors flex items-center justify-between shadow-[1px_0_0_0_rgba(0,0,0,0.05)] bg-slate-50/95 dark:bg-slate-900/95">
                        <div className="flex items-center gap-3 overflow-hidden pr-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 shrink-0">
                            {isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          <div className={cn("w-1.5 h-6 rounded-full shrink-0", project.color)} />
                          <span className="text-sm font-black text-slate-900 dark:text-white truncate">{project.name}</span>
                        </div>
                        <Avatar className="h-6 w-6 ring-2 ring-white dark:ring-slate-800 shrink-0 shadow-sm" title={`Manager: ${project.manager}`}>
                          <AvatarFallback className="text-[9px] font-bold bg-slate-200 text-slate-700">{project.manager.split(' ').map((n: string)=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 flex items-center"></div>
                    </div>

                    {/* Task Rows */}
                    <TooltipProvider delayDuration={200}>
                      {!isCollapsed && visibleTasks.map((task) => {
                        const startIndex = differenceInDays(task.start, startOfMonth(currentDate));
                        const taskDuration = differenceInDays(task.end, task.start) + 1;
                        
                        let visibleStart = Math.max(0, startIndex);
                        let visibleEnd = Math.min(daysInMonth.length, startIndex + taskDuration);
                        let visibleDuration = visibleEnd - visibleStart;
                        const isVisible = visibleDuration > 0;
                        const isMilestone = task.type === 'milestone';

                        return (
                          <div key={task.id} className="flex items-stretch border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                            <div className={cn("w-72 shrink-0 p-3 pl-8 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-20 backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.02)] flex items-center justify-between group/task bg-white/95 dark:bg-slate-900/95 border-l-4", project.color ? project.color.replace('bg-', 'border-') : 'border-transparent')}>
                              <div className="flex flex-col overflow-hidden w-full pr-2">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(task.status)}
                                  <span className={cn("text-xs font-bold truncate", isMilestone ? "text-amber-600 dark:text-amber-500" : "text-slate-700 dark:text-slate-300")}>{task.name}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 pl-5 uppercase tracking-wider truncate mt-0.5">{project.name}</span>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-500">
                                  <Link2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex-1 relative flex py-3">
                              <div className="h-8 w-full invisible" />
                              
                              {isVisible && !isMilestone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                      <div 
                                        className={cn(
                                          "absolute top-3 h-8 rounded-md flex items-center cursor-pointer transition-all hover:shadow-md shadow-sm overflow-hidden border border-black/10 dark:border-white/10",
                                          project.color,
                                          task.status === 'at-risk' && "ring-2 ring-rose-500 ring-offset-1 dark:ring-offset-slate-900 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse",
                                          task.status === 'pending' && "opacity-40 hover:opacity-60"
                                        )}
                                      style={{
                                        left: `${visibleStart * 48 + 4}px`, 
                                        width: `${visibleDuration * 48 - 8}px`
                                      }}
                                    >
                                      {task.status === 'on-track' && (
                                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px)' }} />
                                      )}
                                      <div className="absolute top-0 bottom-0 left-0 bg-black/20" style={{ width: `${task.progress}%` }} />
                                      
                                      <div className="relative z-10 flex items-center justify-between w-full px-2">
                                        <span className="text-[11px] font-black text-white truncate drop-shadow-md">{task.progress}%</span>
                                        <Avatar className="h-5 w-5 ring-2 ring-white/20 shadow-sm shrink-0">
                                          <AvatarFallback className="text-[9px] font-bold bg-white text-slate-900">{task.initials}</AvatarFallback>
                                        </Avatar>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-slate-900 border-slate-800 text-white shadow-xl p-3 rounded-xl z-[100]">
                                    <div className="space-y-2">
                                      <p className="font-black text-sm">{task.name}</p>
                                      <div className="flex flex-col gap-1 text-xs text-slate-300 font-medium">
                                        <div className="flex justify-between gap-4">
                                          <span>Assignee:</span> <span className="text-white font-bold">{task.assignee}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span>Dates:</span> <span className="text-white font-bold">{format(task.start, 'MMM d')} - {format(task.end, 'MMM d')}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span>Status:</span> <span className="text-white font-bold capitalize">{task.status} ({task.progress}%)</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {isVisible && isMilestone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div 
                                      className="absolute top-3 h-8 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-20"
                                      style={{
                                        left: `${visibleStart * 48}px`, 
                                        width: `48px`
                                      }}
                                    >
                                      <div className="w-5 h-5 transform rotate-45 bg-amber-500 border-2 border-amber-600 shadow-md flex items-center justify-center" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-slate-900 border-slate-800 text-white shadow-xl p-3 rounded-xl z-[100]">
                                    <p className="font-black text-sm text-amber-400">Milestone: {task.name}</p>
                                    <p className="text-xs text-slate-300 font-medium mt-1">Date: {format(task.start, 'MMMM d, yyyy')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </TooltipProvider>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
