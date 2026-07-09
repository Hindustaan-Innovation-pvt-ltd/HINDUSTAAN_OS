import React, { useState } from 'react';
import { CalendarDays, LayoutTemplate, Briefcase, LayoutGrid, CheckSquare, Target, ListTodo, Plus, X, ChevronRight, MoreVertical, Edit2, Trash2, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import ProjectDetails from '@/components/projects/ProjectDetails';
import { Badge } from '@/components/ui/badge';

// --- Mock Data ---
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GANTT_TASKS = [
  { id: '1', name: 'Authentication Pipeline', start: 0, duration: 3, color: 'bg-emerald-500 dark:bg-emerald-600', assignee: 'Amanda S.' },
  { id: '2', name: 'Dashboard UI Revamp', start: 2, duration: 4, color: 'bg-blue-500 dark:bg-blue-600', assignee: 'Priya P.' },
  { id: '3', name: 'Supabase Migration', start: 0, duration: 5, color: 'bg-purple-500 dark:bg-purple-600', assignee: 'Rahul S.' },
  { id: '4', name: 'User Testing', start: 4, duration: 2, color: 'bg-amber-500 dark:bg-amber-600', assignee: 'Priya P.' },
  { id: '5', name: 'Marketing Launch', start: 5, duration: 2, color: 'bg-rose-500 dark:bg-rose-600', assignee: 'Rohan G.' }
];

import { GLOBAL_PROJECTS } from '@/data/mockData';
import { useProjects } from '@/context/ProjectContext';

export default function Projects({ session }: { session?: any }) {
  const [activeTab, setActiveTab] = useState('All');
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newProject, setNewProject] = useState({ name: '', manager: 'Amanda S.', deadline: '', budget: '', priority: 'Medium' });
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date());
  
  const role = session?.user?.user_metadata?.role || 'intern';
  
  const baseProjects = role === 'manager' ? projects : [projects[0]];

  const handleSaveProject = () => {
    if (!newProject.name) return;
    
    if (editingProjectId) {
      updateProject(editingProjectId, {
        name: newProject.name,
        manager: newProject.manager,
        deadline: newProject.deadline,
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
        tasks: [],
        milestones: [],
        status: 'Not Started',
        progress: 0,
        iconColor: randomColor.iconColor,
        strokeColor: randomColor.strokeColor,
        manager: newProject.manager || 'Unassigned',
        deadline: newProject.deadline || 'TBD',
        budget: newProject.budget ? `$${newProject.budget}` : 'TBD'
      };
      
      addProject(project);
    }
    
    setIsModalOpen(false);
    setEditingProjectId(null);
    setNewProject({ name: '', manager: 'Amanda S.', deadline: '', budget: '', priority: 'Medium' });
  };

  const startOfCurrentWeek = startOfWeek(selectedWeekDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  const dynamicTasks = React.useMemo(() => {
    const seed = selectedWeekDate.getDate();
    let taskList: any[] = [];
    projects.forEach((p, pIndex) => {
      p.tasks?.forEach((t: any, tIndex: number) => {
        if (t.status === 'Done' && seed % 2 === 0) return;
        const start = (t.id.charCodeAt(t.id.length-1) + pIndex + seed) % 6;
        const duration = (t.id.charCodeAt(0) % 3) + 2;
        const colors = ['bg-emerald-500 dark:bg-emerald-600', 'bg-blue-500 dark:bg-blue-600', 'bg-purple-500 dark:bg-purple-600', 'bg-amber-500 dark:bg-amber-600', 'bg-rose-500 dark:bg-rose-600'];
        const color = colors[(pIndex + tIndex + seed) % colors.length];
        
        taskList.push({
          id: t.id + seed + tIndex,
          name: t.title,
          start,
          duration,
          color,
          assignee: t.assignee
        });
      });
    });
    return taskList.slice(0, 6);
  }, [projects, selectedWeekDate]);
  const displayedProjects = baseProjects.filter(p => {
    if (activeTab === 'Active') return p.status !== 'Completed' && p.status !== 'Aborted';
    if (activeTab === 'Completed') return p.status === 'Completed';
    return true;
  });

  if (selectedProject) {
    return <ProjectDetails project={selectedProject} onBack={() => setSelectedProject(null)} />;
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
            setNewProject({ name: '', manager: 'Amanda S.', deadline: '', budget: '', priority: 'Medium' });
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

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-xs font-black uppercase text-slate-400">Project</th>
                <th className="p-4 text-xs font-black uppercase text-slate-400">Lead</th>
                <th className="p-4 text-xs font-black uppercase text-slate-400">Deadline</th>
                <th className="p-4 text-xs font-black uppercase text-slate-400">Status</th>
                <th className="p-4 text-xs font-black uppercase text-slate-400">Progress</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedProjects.map((project) => {
                const completedTasks = project.tasks.filter(t => t.status === 'Done').length;
                const totalTasks = project.tasks.length;
                const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                return (
                  <tr 
                    key={project.id} 
                    className="group border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white dark:border-slate-800", project.iconColor)}>
                          <LayoutTemplate className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{project.name}</p>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{totalTasks} tasks • {project.budget}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{project.manager}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{project.deadline}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        project.status === 'Completed' ? 'default' : 
                        project.status === 'In Progress' ? 'secondary' : 
                        project.status === 'Aborted' ? 'destructive' :
                        'outline'
                      } className={cn(
                        "font-bold tracking-wider uppercase text-[10px]",
                        project.status === 'Completed' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400",
                        project.status === 'In Progress' && "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-400",
                        project.status === 'On Hold' && "bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent dark:bg-amber-500/20 dark:text-amber-400",
                        project.status === 'Not Started' && "bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent dark:bg-slate-800 dark:text-slate-400",
                        project.status === 'Aborted' && "bg-red-100 text-red-700 hover:bg-red-200 border-transparent dark:bg-red-900/40 dark:text-red-400"
                      )}>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ 
                              width: `${progress}%`,
                              backgroundColor: project.strokeColor
                            }} 
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{progress}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedProject(project)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        {role === 'manager' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-200 dark:border-slate-800 shadow-xl p-1 bg-white dark:bg-slate-950 z-[100]">
                              <DropdownMenuItem className="font-bold text-sm cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => {
                                setEditingProjectId(project.id);
                                setNewProject({
                                  name: project.name,
                                  manager: project.manager,
                                  deadline: project.deadline && project.deadline !== 'TBD' ? project.deadline : '',
                                  budget: project.budget && project.budget !== 'TBD' ? project.budget.replace('$', '') : '',
                                  priority: 'Medium'
                                });
                                setIsModalOpen(true);
                              }}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              {project.status === 'Aborted' ? (
                                <DropdownMenuItem className="font-bold text-sm cursor-pointer rounded-lg text-emerald-600 focus:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => {
                                  updateProject(project.id, { status: 'In Progress' });
                                }}>
                                  <RotateCcw className="mr-2 h-4 w-4" /> Restore
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="font-bold text-sm cursor-pointer rounded-lg text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
                                  updateProject(project.id, { status: 'Aborted' });
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Abort
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
        <div className="p-6 overflow-x-auto">
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
            <div className="mt-6 space-y-6 relative">
              
              {/* Vertical Grid Lines */}
              <div className="absolute inset-0 flex ml-48 pointer-events-none">
                <div className="flex-1 grid grid-cols-7 gap-2 h-full">
                  {[0,1,2,3,4,5,6].map(i => (
                    <div key={i} className="border-r border-slate-100 dark:border-slate-800/50 h-full"></div>
                  ))}
                </div>
              </div>

              {/* Task Bars */}
              {dynamicTasks.map((task) => (
                <div key={task.id} className="flex items-center relative z-10 group animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Task Name Label */}
                  <div className="w-48 shrink-0 pr-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{task.name}</p>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{task.assignee}</p>
                  </div>
                  
                  {/* Task Timeline Bar */}
                  <div className="flex-1 grid grid-cols-7 gap-2">
                    <div 
                      className={cn("h-8 rounded-lg shadow-sm flex items-center px-3 text-xs font-bold text-white whitespace-nowrap overflow-hidden transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md", task.color)}
                      style={{ 
                        gridColumn: `${task.start + 1} / span ${task.duration}` 
                      }}
                    >
                      {task.name}
                    </div>
                  </div>
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
                  className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Project Lead</label>
                  <div className="relative">
                    <select
                      value={newProject.manager}
                      onChange={(e) => setNewProject({ ...newProject, manager: e.target.value })}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Amanda S.">Amanda S.</option>
                      <option value="Rahul S.">Rahul S.</option>
                      <option value="Priya P.">Priya P.</option>
                      <option value="Rohan G.">Rohan G.</option>
                      <option value="Unassigned">Unassigned</option>
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
                      className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
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
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors"
                  />
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
                      className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 mt-4">
              <button className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button 
                className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={handleSaveProject}
                disabled={!newProject.name.trim()}
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
