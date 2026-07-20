import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CheckSquare, MoreHorizontal, Filter, Search, Plus, Eye, PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, FolderKanban, AlertTriangle, Loader2, Tag } from 'lucide-react';
import { cn, logActivity } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import TaskDetailsModal from '../components/dashboard/TaskDetailsModal';
import CreateTaskModal from '../components/dashboard/CreateTaskModal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth';

// --- Types & Mock Data ---

type Priority = 'Critical' | 'High' | 'Medium' | 'Normal' | 'Low';
type Status = 'To Do' | 'In Progress' | 'In Review' | 'Done';
interface Task {
  id: string;
  title: string;
  description: string;
  project_tag: string;
  projectId?: string;
  assignee_name: string;
  assignee_id: string;
  priority: Priority;
  due_date: string;
  status: Status;
  project_status?: string;
}

const COLUMNS: Status[] = ['To Do', 'In Progress', 'In Review', 'Done'];

// --- Helper Components ---

const PriorityBadge = ({ priority, isEmployeeDashboard }: { priority: Priority; isEmployeeDashboard: boolean }) => {
  const originalStyles = {
    High: 'bg-rose-100 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
    Normal: 'bg-amber-100 text-amber-700 dark:text-amber-300 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
  };

  const fixedStyles: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300 border-red-200 dark:border-red-500/20',
    High: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
    Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
    Normal: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
  };

  const styleClass = isEmployeeDashboard
    ? (fixedStyles[priority] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700')
    : (originalStyles[priority as keyof typeof originalStyles] || '');

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", styleClass)}>
      {priority}
    </span>
  );
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

const EmptyColumnPlaceholder = ({ status, role }: { status: Status; role: 'manager' | 'intern' }) => {
  const isEmployee = role === 'intern';
  const placeholders = {
    'To Do': {
      icon: CheckSquare,
      title: 'No tasks to do',
      desc: isEmployee ? 'All caught up! New tasks will appear here.' : 'All caught up! Drag tasks here to plan them.',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30'
    },
    'In Progress': {
      icon: PlayCircle,
      title: 'Nothing in progress',
      desc: isEmployee ? "Open a task and click 'Start Working' to begin." : 'Select a task and drag it here to get started.',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
    },
    'In Review': {
      icon: Eye,
      title: 'No tasks in review',
      desc: isEmployee ? 'Submit a task for review to see it here.' : 'Finished work goes here for approval.',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30'
    },
    'Done': {
      icon: CheckCircle2,
      title: 'No completed tasks',
      desc: 'Finish tasks to see them celebrated here.',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
    }
  };

  const { icon: Icon, title, desc, color } = placeholders[status];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-dashed h-[180px] mt-2 transition-all duration-300 shadow-sm",
      color
    )}>
      <Icon className="h-7 w-7 mb-2.5 opacity-90 animate-pulse" />
      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] leading-normal font-medium">{desc}</p>
    </div>
  );
};

// --- Main Page Component ---

export default function TaskBoard({ session, isSidebarMinimized = false }: { session?: any; isSidebarMinimized?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [dbProjects, setDbProjects] = useState<any[]>([]);

  const mapBackendTask = (t: any): Task => {
    const assignees = t.assignees || [];
    const firstAssignee = assignees[0] || {};
    return {
      id: t.id,
      title: t.title,
      description: t.desc || t.description || '',
      project_tag: t.project_tag || t.project?.name || 'General',
      projectId: t.projectId,
      project_status: t.project_status || t.project?.status,
      assignee_name: t.assignee_name || t.assignee?.name || firstAssignee.name || 'Unassigned',
      assignee_id: t.assignee_id || t.assigneeId || firstAssignee.id || 'unassigned',
      priority: t.priority === 'High' ? 'High' : t.priority === 'Low' ? 'Low' : t.priority === 'Normal' ? 'Normal' : t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
      due_date: t.due_date || (t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      status: t.status === 'Done' || t.status === 'done' || t.status === 'completed' ? 'Done' :
              t.status === 'In Progress' || t.status === 'in-progress' ? 'In Progress' :
              t.status === 'In Review' || t.status === 'in-review' ? 'In Review' : 'To Do'
    };
  };

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks?limit=1000');
      if (res.data?.success) {
        const backendTasks = res.data.data || [];
        setTasks(backendTasks.map(mapBackendTask));
      }
      
      const loggedUser = getCurrentUser();
      const isManagerOrAdmin = loggedUser?.role === 'manager' || loggedUser?.role === 'admin';

      if (isManagerOrAdmin) {
        const projRes = await api.get('/projects');
        if (projRes.data?.success) {
          setDbProjects(projRes.data.data || []);
        }

        const teamRes = await api.get('/team');
        if (teamRes.data?.success) {
          setTeamMembers(teamRes.data.data.members || []);
        }
      }
    } catch (e: any) {
      console.warn('Backend unavailable or failed to load Kanban tasks.', e.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Resolve current user dynamically from active database session
  const loggedInUser = getCurrentUser();
  const role = loggedInUser?.role === 'employee' ? 'intern' : (loggedInUser?.role || 'manager');
  const currentUserId = loggedInUser?.id || 'manager-1';
  const currentUserName = loggedInUser?.name || 'Admin User';

  const currentUser = {
    id: currentUserId,
    role: role as 'manager' | 'intern',
    name: currentUserName
  };

  // Base tasks (backend /api/tasks already filters tasks for intern/employee roles on server)
  const baseTasks = tasks;

  // Extract unique filter options dynamically based on the baseTasks visible to this user
  const projects = ['All', ...Array.from(new Set(baseTasks.map(t => t.project_tag)))];
  const assignees = ['All', ...Array.from(new Set(baseTasks.map(t => t.assignee_name)))];

  // Filter States
  const [projectFilter, setProjectFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Scroll Ref for Kanban Columns
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340; // width of one column + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkOverflow = () => {
      setIsOverflowing(container.scrollWidth > container.clientWidth);
    };

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(container);

    // Initial check
    checkOverflow();

    return () => {
      observer.disconnect();
    };
  }, [baseTasks, projectFilter, assigneeFilter, searchQuery, isSidebarMinimized]);

  const filteredTasks = baseTasks.filter(task => {
    if (projectFilter !== 'All' && task.project_tag !== projectFilter) return false;
    if (assigneeFilter !== 'All' && task.assignee_name !== assigneeFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // --- Drag & Drop Handlers ---
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
    // Slight delay to allow the ghost image to render before applying opacity to original
    setTimeout(() => setDraggedTaskId(id), 0);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const mapStatusToBackend = (status: Status): string => {
    switch (status) {
      case 'To Do': return 'todo';
      case 'In Progress': return 'in-progress';
      case 'In Review': return 'in-review';
      case 'Done': return 'done';
      default: return 'todo';
    }
  };

  const handleDrop = async (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (task.status === status) {
      setDraggedTaskId(null);
      return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    try {
      const backendStatus = mapStatusToBackend(status);
      const res = await api.patch(`/tasks/${taskId}/status`, { status: backendStatus });
      if (res.data?.success) {
        logActivity(currentUserName, `moved task to ${status}`, task.title, 'task');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to move task', { description: err.response?.data?.message || err.message });
      fetchTasksData();
    }
    setDraggedTaskId(null);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);

    try {
      const backendPriority = updatedTask.priority.toLowerCase() === 'normal' ? 'medium' : updatedTask.priority.toLowerCase();
      const backendStatus = mapStatusToBackend(updatedTask.status);
      await api.patch(`/tasks/${updatedTask.id}`, {
        title: updatedTask.title,
        desc: updatedTask.description,
        priority: backendPriority,
        status: backendStatus,
        dueDate: updatedTask.due_date ? new Date(updatedTask.due_date) : undefined,
        assigneeId: updatedTask.assignee_id || undefined
      });
      toast.success('Task updated successfully');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to update task', { description: e.response?.data?.message || e.message });
      fetchTasksData();
    }
  };

  const handleCreateTask = async (taskFields: any) => {
    try {
      const backendPriority = taskFields.priority.toLowerCase() === 'normal' ? 'medium' : taskFields.priority.toLowerCase();
      const res = await api.post('/tasks', {
        title: taskFields.title,
        desc: taskFields.description,
        projectId: taskFields.projectId,
        assigneeId: taskFields.assigneeId || undefined,
        priority: backendPriority,
        startDate: taskFields.start_date ? new Date(taskFields.start_date) : undefined,
        dueDate: taskFields.due_date ? new Date(taskFields.due_date) : undefined,
        status: 'todo',
        milestoneId: taskFields.milestoneId || undefined
      });
      if (res.data?.success) {
        toast.success('Task created successfully');
        fetchTasksData();
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to create task', { description: e.response?.data?.message || e.message });
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8">
      
      {/* Header & Interactive Toolbar Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Kanban Board</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Manage cohort sprint velocity and track active tasks.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 w-40 sm:w-64"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center px-3 border-r border-slate-200 dark:border-slate-700/60">
              <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 mr-2" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filters</span>
            </div>
            
            <select 
              className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-0 cursor-pointer outline-none px-2"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              {projects.map(p => <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" key={p} value={p}>{p === 'All' ? 'All Projects' : p}</option>)}
            </select>
          </div>

          {/* Create Task Button (Managers Only) */}
          {currentUser.role === 'manager' && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ml-2"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Columns Layout Wrapper with scroll buttons */}
      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 min-h-[350px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Loading Kanban tasks...</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please wait while we sync the sprint velocity from the server.</p>
        </div>
      ) : (
        <div className="relative group/board w-full">
          {/* Left Scroll Arrow */}
          {isOverflowing && (
            <button
              onClick={() => scroll('left')}
              className={cn(
                "absolute -left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all cursor-pointer",
                currentUser.role === 'intern' ? "opacity-100" : "opacity-0 group-hover/board:opacity-100"
              )}
              title="Scroll Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Right Scroll Arrow */}
          {isOverflowing && (
            <button
              onClick={() => scroll('right')}
              className={cn(
                "absolute -right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all cursor-pointer",
                currentUser.role === 'intern' ? "opacity-100" : "opacity-0 group-hover/board:opacity-100"
              )}
              title="Scroll Right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            className={cn(
              "flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory h-fit w-full",
              currentUser.role === 'intern' ? "hide-scrollbar pb-1" : "scrollbar-hide",
              isSidebarMinimized && "lg:grid lg:grid-cols-4 lg:overflow-x-visible lg:pb-0"
            )}
          >
            {COLUMNS.map(columnStatus => {
            const columnTasks = filteredTasks.filter(t => t.status === columnStatus);
            
            return (
              <div 
                key={columnStatus} 
                className={cn(
                  "flex flex-col w-full snap-start",
                  currentUser.role === 'intern' && "h-fit",
                  isSidebarMinimized 
                    ? "min-w-[250px] lg:min-w-0 max-w-[380px] lg:max-w-none flex-1" 
                    : "min-w-[320px] max-w-[320px] shrink-0"
                )}
                onDragOver={currentUser.role === 'manager' ? handleDragOver : undefined}
                onDrop={currentUser.role === 'manager' ? (e) => handleDrop(e, columnStatus) : undefined}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      columnStatus === 'To Do' ? "bg-blue-500" :
                      columnStatus === 'In Progress' ? "bg-amber-500" :
                      columnStatus === 'In Review' ? "bg-purple-500" : "bg-emerald-500"
                    )} />
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{columnStatus}</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  
                  <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {/* Column Track */}
                <div className={cn("flex flex-col gap-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/60 min-h-[150px] h-fit")}>
                  {columnTasks.length === 0 ? (
                    <EmptyColumnPlaceholder status={columnStatus} role={currentUser.role} />
                  ) : (
                    columnTasks.map(task => {
                      const isPastDue = task.due_date && new Date(task.due_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                      const isAborted = task.project_status === 'aborted';
                      return (
                        <div
                          key={task.id}
                          draggable={currentUser.role === 'manager' && !isAborted}
                          onClick={() => setSelectedTask(task)}
                          onDragStart={(currentUser.role === 'manager' && !isAborted) ? (e) => handleDragStart(e, task.id) : undefined}
                          onDragEnd={(currentUser.role === 'manager' && !isAborted) ? handleDragEnd : undefined}
                          className={cn(
                            "group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-md dark:shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[180px]",
                            currentUser.role === 'manager' && !isAborted && "active:cursor-grabbing",
                            draggedTaskId === task.id ? "absolute opacity-0 pointer-events-none" : "relative opacity-100",
                            isAborted && "opacity-75 grayscale bg-slate-50 dark:bg-slate-900/40 border-red-200 dark:border-red-900/50 hover:shadow-none hover:translate-y-0 cursor-not-allowed"
                          )}
                        >
                          <div>
                            {/* Project Tag & Priority */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-1.5 min-w-0">
                                <Tag className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider truncate">
                                  {task.project_tag}
                                </span>
                                {isAborted && (
                                  <Badge variant="destructive" className="text-[8px] py-0 px-1 ml-1 leading-tight uppercase bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200/50">Aborted</Badge>
                                )}
                              </div>
                              <PriorityBadge priority={task.priority} isEmployeeDashboard={currentUser.role === 'intern'} />
                            </div>

                            {/* Title & Description */}
                            <h4 className={cn("text-sm font-bold text-slate-900 dark:text-white mb-1 leading-tight transition-colors", 
                              !isAborted && "group-hover:text-orange-600 dark:group-hover:text-orange-400",
                              isAborted && "line-through text-slate-500 dark:text-slate-400"
                            )}>
                              {task.title}
                            </h4>
                            <p className={cn("text-xs line-clamp-2", 
                              isAborted ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-500 dark:text-slate-400"
                            )}>
                              {task.description}
                            </p>
                          </div>

                          {/* Bottom Row: Date */}
                          <div className="flex items-center pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                            <div className={cn("flex items-center space-x-1.5", 
                              task.due_date && new Date(task.due_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) 
                                ? "text-rose-600 dark:text-rose-500" 
                                : "text-slate-400 dark:text-slate-500"
                            )}>
                              {task.due_date && new Date(task.due_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                              <span className="text-xs font-semibold">Deadline: {task.due_date} {task.due_date && new Date(task.due_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && <span className="ml-1 text-[9px] uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-1 py-0.5 rounded">Past</span>}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      <TaskDetailsModal 
        task={selectedTask}
        currentUser={currentUser}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
      />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
        currentUser={currentUser}
        projects={dbProjects}
        teamMembers={teamMembers}
      />
    </div>
  );
}
