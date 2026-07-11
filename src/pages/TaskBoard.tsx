import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CheckSquare, MoreHorizontal, Filter, Search, Plus, Eye, PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, FolderKanban } from 'lucide-react';
import { cn, logActivity } from '@/lib/utils';
import TaskDetailsModal from '../components/dashboard/TaskDetailsModal';
import CreateTaskModal from '../components/dashboard/CreateTaskModal';
import { INITIAL_TASKS } from '@/data/mockData';

// --- Types & Mock Data ---

type Priority = 'High' | 'Medium' | 'Normal' | 'Low';
type Status = 'To Do' | 'In Progress' | 'In Review' | 'Done';
interface Task {
  id: string;
  title: string;
  description: string;
  project_tag: string;
  assignee_name: string;
  assignee_id: string;
  priority: Priority;
  due_date: string;
  status: Status;
}

const COLUMNS: Status[] = ['To Do', 'In Progress', 'In Review', 'Done'];

// --- Helper Components ---

const PriorityBadge = ({ priority, isEmployeeDashboard }: { priority: Priority; isEmployeeDashboard: boolean }) => {
  const originalStyles = {
    High: 'bg-rose-100 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
    Normal: 'bg-amber-100 text-amber-700 dark:text-amber-300 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
  };

  const fixedStyles = {
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
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('hindustaan_tasks_list');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  useEffect(() => {
    localStorage.setItem('hindustaan_tasks_list', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hindustaan_tasks_list' && e.newValue) {
        setTasks(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Mock current user based on session
  const role = session?.user?.user_metadata?.role || 'manager';
  
  // Resolve intern profile dynamically based on session email/metadata
  const email = session?.user?.email || 'user@hindustaan.in';
  
  let currentUserId = 'manager-1';
  let currentUserName = 'Admin User';
  
  if (role === 'intern' || role === 'employee') {
    if (email.toLowerCase().includes('amanda')) {
      currentUserId = 'u-1';
      currentUserName = 'Amanda Smith';
    } else if (email.toLowerCase().includes('rahul')) {
      currentUserId = 'u-2';
      currentUserName = 'Rahul Sharma';
    } else if (email.toLowerCase().includes('priya')) {
      currentUserId = 'u-3';
      currentUserName = 'Priya Patel';
    } else {
      currentUserId = 'u-4';
      currentUserName = 'Tanvy';
    }
  }

  const currentUser = {
    id: currentUserId,
    role: (role === 'employee' ? 'intern' : role) as 'manager' | 'intern',
    name: currentUserName
  };

  // Base tasks. If intern, only show tasks of the project he/she is working on of that particular employee
  const baseTasks = currentUser.role === 'intern'
    ? tasks.filter(task => task.assignee_id === currentUser.id || task.assignee_name === currentUser.name)
    : tasks;

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

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (task && task.status !== status) {
        logActivity(currentUserName, `moved task to ${status}`, task.title, 'task');
      }
      return prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      );
    });
    setDraggedTaskId(null);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleCreateTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
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
                isSidebarMinimized 
                  ? "min-w-[250px] lg:min-w-0 max-w-[380px] lg:max-w-none flex-1" 
                  : "min-w-[320px] max-w-[320px] shrink-0"
              )}
              onDragOver={currentUser.role === 'manager' ? handleDragOver : undefined}
              onDrop={currentUser.role === 'manager' ? (e) => handleDrop(e, columnStatus) : undefined}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{columnStatus}</h3>
                  <span className="flex h-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {columnTasks.length}
                  </span>
                </div>
                <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Column Track */}
              <div className="flex-1 flex flex-col gap-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/60 min-h-[150px]">
                {columnTasks.length === 0 ? (
                  <EmptyColumnPlaceholder status={columnStatus} role={currentUser.role} />
                ) : (
                  columnTasks.map(task => {
                    return (
                      <div
                        key={task.id}
                        draggable={currentUser.role === 'manager'}
                        onClick={() => setSelectedTask(task)}
                        onDragStart={currentUser.role === 'manager' ? (e) => handleDragStart(e, task.id) : undefined}
                        onDragEnd={currentUser.role === 'manager' ? handleDragEnd : undefined}
                        className={cn(
                          "group relative bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-md dark:shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer",
                          currentUser.role === 'manager' && "active:cursor-grabbing",
                          draggedTaskId === task.id ? "opacity-50 border-dashed border-orange-400 shadow-none" : "opacity-100"
                        )}
                      >
                        {/* Top Row: Priority & Project */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <FolderKanban className="h-3.5 w-3.5 text-orange-500/80 shrink-0" />
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                              {task.project_tag}
                            </span>
                          </div>
                          <PriorityBadge priority={task.priority} isEmployeeDashboard={currentUser.role === 'intern'} />
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                          {task.description}
                        </p>

                        {/* Bottom Row: Date & Assignee */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                          <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold">Deadline: {task.due_date}</span>
                          </div>
                          
                          <div 
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20 text-[10px] font-bold text-orange-700 dark:text-orange-300 ring-2 ring-white dark:ring-slate-900"
                            title={task.assignee_name}
                          >
                            {getInitials(task.assignee_name)}
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
      />
    </div>
  );
}
