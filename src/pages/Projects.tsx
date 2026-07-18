import React, { useState } from 'react';
import { Briefcase, LayoutTemplate, Plus, ChevronRight, MoreVertical, Search, Filter, Edit2, Trash2, X, ChevronDown, Check, CalendarDays, BarChart2, Users, AlertTriangle, TrendingUp, CalendarIcon, RotateCcw, FolderKanban, CheckSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import ProjectDetails from '@/components/projects/ProjectDetails';
import { Badge } from '@/components/ui/badge';


// --- Mock Data ---
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GANTT_TASKS: any[] = [];

import { useProjects } from '@/context/ProjectContext';
import { useNotifications } from '@/context/NotificationContext';
import api from '@/lib/api';

export default function Projects({ session }: { session?: any }) {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('All');
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newProject, setNewProject] = useState({ name: '', manager: '', managerId: '', deadline: '', budget: '', priority: 'Medium', tasks: [] as any[] });
  const [leads, setLeads] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await api.get('/team/profiles');
        if (res.data?.success) {
          const employees = res.data.data.filter((p: any) => p.role === 'intern' || p.role === 'employee');
          setLeads(employees);
        }
      } catch (err) {
        console.error("Failed to fetch leads:", err);
      }
    };
    fetchLeads();
  }, []);
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date());

  const role = session?.user?.user_metadata?.role || 'intern';

  const baseProjects = (role === 'manager' || role === 'admin' ? projects : [projects[0]]).filter(Boolean);

  const handleSaveProject = () => {
    if (!newProject.name) return;

    if (editingProjectId) {
      updateProject(editingProjectId, {
        name: newProject.name,
        manager: newProject.manager,
        managerId: newProject.managerId,
        deadline: newProject.deadline,
        tasks: newProject.tasks,
        budget: newProject.budget ? (newProject.budget.toString().startsWith('$') ? newProject.budget : `$${newProject.budget}`) : 'TBD'
      });
    } else {
      const colors = [
        { iconColor: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400', strokeColor: '#9333ea' },
        { iconColor: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', strokeColor: '#0891b2' },
        { iconColor: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400', strokeColor: '#db2777' }
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const project = {
        id: Date.now().toString(),
        name: newProject.name,
        tasks: newProject.tasks.length > 0 ? newProject.tasks : [],
        milestones: [],
        status: 'Not Started',
        progress: 0,
        iconColor: randomColor.iconColor,
        strokeColor: randomColor.strokeColor,
        manager: newProject.manager || 'Unassigned',
        managerId: newProject.managerId || '',
        deadline: newProject.deadline || 'TBD',
        budget: newProject.budget ? (newProject.budget.toString().startsWith('$') ? newProject.budget : `$${newProject.budget}`) : 'TBD'
      };

      addProject(project);
      addNotification({
        type: 'success',
        category: 'Projects',
        icon: '🚀',
        title: 'Project Created',
        message: `New project "${newProject.name}" has been created successfully.`,
        group: 'Today',
      });
    }

    setIsModalOpen(false);
    setEditingProjectId(null);
    setNewProject({ name: '', manager: '', managerId: '', deadline: '', budget: '', priority: 'Medium', tasks: [] });
  };

  const startOfCurrentWeek = startOfWeek(selectedWeekDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  const displayedProjects = baseProjects.filter(p => {
    if (activeTab === 'Active') return p.status !== 'Completed' && p.status !== 'Aborted';
    if (activeTab === 'Completed') return p.status === 'Completed';
    return true;
  });

  const groupedProjects = React.useMemo(() => {
    const seed = selectedWeekDate.getDate();

    // Vibrant distinct color palette for timeline
    const PROJECT_PALETTE = [
      { bg: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', stroke: '#e11d48', border: 'border-rose-200 dark:border-rose-500/30' },
      { bg: 'bg-blue-50 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', stroke: '#3b82f6', border: 'border-blue-200 dark:border-blue-500/30' },
      { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', stroke: '#10b981', border: 'border-emerald-200 dark:border-emerald-500/30' },
      { bg: 'bg-purple-50 dark:bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', stroke: '#8b5cf6', border: 'border-purple-200 dark:border-purple-500/30' },
      { bg: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', stroke: '#f59e0b', border: 'border-amber-200 dark:border-amber-500/30' },
      { bg: 'bg-cyan-50 dark:bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400', stroke: '#06b6d4', border: 'border-cyan-200 dark:border-cyan-500/30' },
    ];

    return displayedProjects.map((p, pIndex) => {
      const palette = PROJECT_PALETTE[pIndex % PROJECT_PALETTE.length];
      const pTasks: any[] = [];
      p.tasks?.forEach((t: any, tIndex: number) => {
        if (t.status === 'Done' && seed % 2 === 0) return;
        // Waterfall logic so tasks don't overlap randomly
        const start = tIndex % 5; // 0, 1, 2, 3, 4
        let duration = 2 + (tIndex % 3); // 2, 3, 4

        // Ensure it fits within the 7-day grid
        if (start + duration > 7) {
          duration = 7 - start;
        }

        pTasks.push({
          id: t.id + seed + tIndex,
          name: t.title,
          start,
          duration,
          assignee: t.assignee
        });
      });
      const isProjectCompleted = p.status === 'Completed' || (p.tasks && p.tasks.length > 0 && p.tasks.every((t: any) => t.status === 'Done'));

      return {
        ...p,
        isCompleted: isProjectCompleted,
        iconColor: `${palette.bg} ${palette.text}`,
        strokeColor: palette.stroke,
        headerBg: palette.bg,
        headerBorder: palette.border,
        timelineTasks: pTasks.slice(0, 4) // Show up to 4 tasks per project
      };
    }); // Show all projects in this view
  }, [displayedProjects, selectedWeekDate]);

  if (selectedProject) {
    const liveProject = projects.find((p: any) => p.id === selectedProject.id) || selectedProject;
    return <ProjectDetails project={liveProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Project Timeline</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">High-level Gantt chart outlining task execution over the current week.</p>
        </div>
        {role === 'manager' && (
          <button onClick={() => {
            setEditingProjectId(null);
            setNewProject({ name: '', manager: '', managerId: '', deadline: '', budget: '', priority: 'Medium', tasks: [] });
            setIsModalOpen(true);
          }} className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> New Project
          </button>
        )}
      </div>

      {/* Project Overview List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">Active Projects</h3>
          </div>
          <div className="flex space-x-4 text-sm font-bold">
            <button
              onClick={() => setActiveTab('All')}
              className={cn("pb-1", activeTab === 'All' ? "text-slate-900 dark:text-white border-b-2 border-orange-600 dark:border-orange-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300")}
            >All</button>
            <button
              onClick={() => setActiveTab('Active')}
              className={cn("pb-1", activeTab === 'Active' ? "text-slate-900 dark:text-white border-b-2 border-orange-600 dark:border-orange-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300")}
            >Active</button>
            <button
              onClick={() => setActiveTab('Completed')}
              className={cn("pb-1", activeTab === 'Completed' ? "text-slate-900 dark:text-white border-b-2 border-orange-600 dark:border-orange-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300")}
            >Completed</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-slate-50/30 dark:bg-slate-900/10">
          {displayedProjects.map((project, idx) => {
            const completedTasks = project.tasks.filter((t: any) => t.status === 'Done').length;
            const totalTasks = project.tasks.length;
            const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            const isPastDue = project.deadline && project.deadline !== 'TBD' && new Date(project.deadline).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

            // Mock avatars for premium look
            const mockAvatars = [
              `https://i.pravatar.cc/150?u=${project.id}1`,
              `https://i.pravatar.cc/150?u=${project.id}2`,
              `https://i.pravatar.cc/150?u=${project.id}3`
            ];

            return (
              <div
                key={project.id}
                className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-800/80 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.5)] hover:bg-white/90 dark:hover:bg-slate-900/90 transition-all duration-500 hover:-translate-y-1.5 cursor-pointer overflow-hidden flex flex-col"
                onClick={() => setSelectedProject(project)}
              >
                {/* Premium Background Gradient Glow */}
                <div
                  className="absolute -right-20 -top-20 w-40 h-40 rounded-full blur-[70px] opacity-20 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"
                  style={{ backgroundColor: project.strokeColor || '#f97316' }}
                />

                <div className="p-5 relative z-10 border-b border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] border border-slate-100/50 dark:border-slate-800/50 backdrop-blur-md relative overflow-hidden",
                        project.iconColor
                      )}
                    >
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent" />
                      <LayoutTemplate className="h-5 w-5 relative z-10" />
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Badge variant={
                        project.status === 'Completed' ? 'default' :
                          project.status === 'In Progress' ? 'secondary' :
                            project.status === 'Aborted' ? 'destructive' :
                              'outline'
                      } className={cn(
                        "font-black tracking-widest uppercase text-[8px] px-2 py-0.5 rounded-md backdrop-blur-md border",
                        project.status === 'Completed' && "bg-emerald-500/10 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
                        project.status === 'In Progress' && "bg-blue-500/10 text-blue-700 border-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
                        project.status === 'On Hold' && "bg-amber-500/10 text-amber-700 border-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
                        project.status === 'Not Started' && "bg-slate-500/10 text-slate-700 border-slate-200/50 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
                        project.status === 'Aborted' && "bg-red-500/10 text-red-700 border-red-200/50 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
                      )}>
                        {project.status}
                      </Badge>

                      {(role === 'manager' || role === 'admin') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-6 w-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors outline-none focus:ring-2 focus:ring-orange-500/50 backdrop-blur-sm">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-200 dark:border-slate-800 shadow-2xl p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-[100]">
                            <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => {
                              setEditingProjectId(project.id);
                              setNewProject({
                                name: project.name,
                                manager: project.manager,
                                managerId: project.managerId || '',
                                deadline: project.endDate || '',
                                budget: project.budget && project.budget !== 'TBD' ? project.budget.replace('$', '') : '',
                                priority: 'Medium',
                                tasks: (project.tasks || []).map((t: any) => ({
                                  id: t.id,
                                  title: t.title,
                                  status: t.status,
                                  assignee: t.assignee || t.assignee_name || 'Unassigned',
                                  assigneeId: t.assigneeId || t.assignee_id || null
                                }))
                              });
                              setIsModalOpen(true);
                            }}>
                              <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            {project.status === 'Aborted' ? (
                              <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg text-emerald-600 focus:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => {
                                updateProject(project.id, { status: 'In Progress' });
                              }}>
                                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg text-amber-600 focus:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30" onClick={() => {
                                updateProject(project.id, { status: 'Aborted' });
                              }}>
                                <X className="mr-2 h-3.5 w-3.5" /> Abort
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => {
                              deleteProject(project.id);
                            }}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 tracking-tight">{project.name}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-1.5">
                        {mockAvatars.map((src, i) => (
                          <img key={i} src={src} className="h-6 w-6 rounded-full border border-white dark:border-slate-900 object-cover" alt="team" />
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Lead: <span className="text-slate-800 dark:text-slate-200">{project.manager}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50/50 dark:bg-slate-900/30 flex-1 flex flex-col justify-between space-y-4 relative z-10">
                  <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50 backdrop-blur-sm">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 mb-1 text-slate-500 dark:text-slate-400">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Budget</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{project.budget}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                    <div className="flex flex-col items-end">
                      <div className={cn("flex items-center gap-1 mb-1", isPastDue ? "text-rose-600 dark:text-rose-500" : "text-slate-500 dark:text-slate-400")}>
                        {isPastDue ? <AlertTriangle className="h-3 w-3" /> : <CalendarIcon className="h-3 w-3" />}
                        <span className="text-[9px] font-black uppercase tracking-wider">Deadline</span>
                      </div>
                      <span className={cn("text-sm font-bold flex items-center gap-1.5", isPastDue ? "text-rose-600 dark:text-rose-500" : "text-slate-800 dark:text-slate-200")}>
                        {project.deadline} {isPastDue && <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Past Due</span>}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                      <span className="text-slate-500 dark:text-slate-400">{completedTasks} / {totalTasks} Tasks</span>
                      <span className="text-slate-800 dark:text-white">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: project.strokeColor || '#f97316',
                          boxShadow: `0 0 8px ${project.strokeColor || '#f97316'}80`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">

        {/* Panel Toolbar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center space-x-2">
            <LayoutTemplate className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">Execution Timeline</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <CalendarDays className="h-4 w-4 mr-1.5 text-slate-400" />
                {format(startOfCurrentWeek, 'MMM d')} - {format(addDays(startOfCurrentWeek, 6), 'MMM d')}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-[100]">
              <Calendar
                mode="single"
                selected={selectedWeekDate}
                onSelect={(date) => date && setSelectedWeekDate(date)}
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Gantt Chart Container */}
        <div className="p-6 overflow-x-auto hide-scrollbar">
          <div className="min-w-[700px]">

            {/* Timeline Header (Days) */}
            <div className="flex">
              {/* Spacer for task names */}
              <div className="w-48 shrink-0"></div>
              {/* Day Columns */}
              <div className="flex-1 grid grid-cols-7 gap-2">
                {weekDays.map(day => (
                  <div key={day.toISOString()} className="text-center pb-4 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <div className="mb-1">{format(day, 'EEE')}</div>
                    <div className={cn("text-xs", isSameDay(day, new Date()) && "text-orange-500 dark:text-orange-400")}>{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Rows */}
            <div className="mt-6 space-y-8 relative">

              {/* Vertical Grid Lines */}
              <div className="absolute inset-0 flex ml-48 pointer-events-none">
                <div className="flex-1 grid grid-cols-7 gap-2 h-full">
                  {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="border-r border-slate-100 dark:border-slate-700/80 h-full"></div>
                  ))}
                </div>
              </div>

              {/* Grouped by Project */}
              {groupedProjects.map((project) => (
                <div key={project.id} className="relative z-10 space-y-3">
                  {/* Project Header Divider (Full Width) */}
                  <div className={cn("flex items-center justify-between mb-3 px-4 py-2.5 rounded-xl border w-full col-span-full shadow-sm", project.headerBg, project.headerBorder)}>
                    <div className="flex items-center gap-3">
                      <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shadow-sm", project.iconColor)}>
                        <FolderKanban className="h-3 w-3" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">{project.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn("text-[10px] font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-slate-800 dark:text-slate-200", project.headerBorder)}>
                        {project.tasks?.length || 0} Tasks
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">Lead: {project.manager}</span>
                    </div>
                  </div>

                  {/* Task Bars or Completed Status */}
                  {project.isCompleted ? (
                    <div className="flex items-center relative group animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="w-48 shrink-0 pr-4 border-l-4 pl-3 py-1 border-emerald-500">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Completed</p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Execution Finished</p>
                      </div>
                      <div className="flex-1">
                        <div className="h-8 rounded-lg shadow-sm flex items-center justify-between px-4 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 w-full col-span-full">
                          <div className="flex items-center">
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Project Execution Finished
                          </div>
                          <div className="flex items-center space-x-3 text-[10px]">
                            <span className="bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/30">
                              {project.tasks?.length * 4 || 0} Days Taken
                            </span>
                            <span className="bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300">
                              {(project.tasks?.length * 4 || 0) * 8} Hours Logged
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : project.timelineTasks.length > 0 ? (
                    project.timelineTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center relative group animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Task Name Label */}
                        <div
                          className="w-48 shrink-0 pr-4 border-l-4 pl-3 py-1"
                          style={{ borderColor: project.strokeColor || '#cbd5e1' }}
                        >
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{task.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{task.assignee}</p>
                        </div>

                        {/* Task Timeline Bar */}
                        <div className="flex-1 grid grid-cols-7 gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <div
                                className="h-8 rounded-lg shadow-sm flex items-center px-3 text-xs font-bold text-white whitespace-nowrap overflow-hidden transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md cursor-pointer"
                                style={{
                                  gridColumn: `${task.start + 1} / span ${task.duration}`,
                                  backgroundColor: project.strokeColor || '#f97316'
                                }}
                              >
                                {task.name}
                              </div>
                            </PopoverTrigger>
                            <PopoverContent align="center" className="w-64 p-4 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-[100]">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{task.name}</h4>
                                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Assigned to: {task.assignee}</p>
                                </div>
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400">Duration</span>
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">{task.duration} Days</span>
                                  </div>
                                  <div className="flex flex-col text-right">
                                    <span className="text-[10px] font-bold text-slate-400">Est. Hours</span>
                                    <span className="text-sm font-black text-orange-600 dark:text-orange-500">{task.duration * 8}h</span>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center relative group animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="w-48 shrink-0 pr-4 border-l-4 pl-3 py-1 border-slate-200 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-600 truncate">No tasks scheduled</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingProjectId ? 'Edit Project' : 'Create New Project'}</h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">{editingProjectId ? 'Update project details and execution parameters.' : 'Setup project details for the team.'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Marketing Campaign"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Project Lead</label>
                  <div className="relative">
                    <select
                      value={newProject.managerId || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedLead = leads.find(l => l.id === selectedId);
                        setNewProject({
                          ...newProject,
                          managerId: selectedId,
                          manager: selectedLead ? selectedLead.name : 'Unassigned'
                        });
                      }}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {leads.map(lead => (
                        <option key={lead.id} value={lead.id}>{lead.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Priority</label>
                  <div className="relative">
                    <select
                      value={newProject.priority}
                      onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Deadline</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Estimated Budget</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tasks & Assignees Section */}
              <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Tasks & Assignees</label>
                  <button
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-500 flex items-center"
                    onClick={() => setNewProject({ ...newProject, tasks: [...newProject.tasks, { id: Date.now().toString(), title: '', assignee: 'Unassigned', status: 'To Do' }] })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Task
                  </button>
                </div>
                {newProject.tasks.map((task, index) => (
                  <div key={task.id} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Design Dashboard"
                      value={task.title}
                      onChange={e => {
                        const updated = [...newProject.tasks];
                        updated[index].title = e.target.value;
                        setNewProject({ ...newProject, tasks: updated });
                      }}
                      className="flex-1 h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <div className="relative w-40 shrink-0">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all text-left flex items-center justify-between">
                            <span className="truncate">{task.assignee || 'Unassigned'}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 ml-2" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl" align="start">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {leads.map(member => {
                              const assignees = (!task.assignee || task.assignee === 'Unassigned') ? [] : task.assignee.split(', ').filter(Boolean);
                              const isSelected = assignees.includes(member.name);
                              return (
                                <label key={member.id} className="flex items-center px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer">
                                  <input
                                    type="radio"
                                    checked={isSelected}
                                    onChange={() => {
                                      const updated = [...newProject.tasks];
                                      if (isSelected) {
                                        updated[index].assignee = 'Unassigned';
                                        updated[index].assigneeId = null;
                                      } else {
                                        updated[index].assignee = member.name;
                                        updated[index].assigneeId = member.id;
                                      }
                                      setNewProject({ ...newProject, tasks: updated });
                                    }}
                                    className="mr-3 h-4 w-4 rounded-full border-slate-300 text-orange-600 focus:ring-orange-600 cursor-pointer accent-orange-600"
                                  />
                                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{member.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <button
                      onClick={() => {
                        const updated = newProject.tasks.filter((_, i) => i !== index);
                        setNewProject({ ...newProject, tasks: updated });
                      }}
                      className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {newProject.tasks.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No tasks added yet. Click "+ Add Task" to start assigning work.</p>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 mt-4">
              <button className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button
                className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveProject}
                disabled={newProject.name.trim().length < 3}
              >
                {editingProjectId ? 'Save Changes' : 'Launch Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

