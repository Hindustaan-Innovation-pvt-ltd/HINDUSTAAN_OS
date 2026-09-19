import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, CheckSquare, MoreHorizontal, Filter, Search, Plus, Eye, 
  PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, FolderKanban, 
  AlertTriangle, Loader2, Tag, Zap, Clock, X, MessageSquare, AlertCircle,
  GripVertical, Sparkles, Flame, ArrowUp, ArrowRight, ArrowDown, Layers,
  ListTodo, UserCheck, Lock
} from 'lucide-react';
import { cn, logActivity } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import TaskDetailsModal from '../components/TaskDetailsModal';
import CreateTaskModal from '../components/CreateTaskModal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getCurrentUser, isManagerOrAdmin } from '@/lib/auth';
import { formatToMMDDYYYY } from '@/context/ProjectContext';

// --- Types & Mock Data ---

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

type Priority = 'Critical' | 'High' | 'Medium' | 'Normal' | 'Low';
type Status = 'To Do' | 'In Progress' | 'In Review' | 'Done';
type ViewFilter = 'all' | 'my-tasks' | 'pool' | 'overdue';

interface Task {
  id: string;
  title: string;
  description: string;
  project_tag: string;
  projectId?: string;
  assignee_name: string;
  assignee_id: string;
  priority: Priority;
  start_date?: string;
  due_date: string;
  status: Status;
  project_status?: string;
  delay_reason?: string;
  subtasks?: Subtask[];
}

const COLUMNS: Status[] = ['To Do', 'In Progress', 'In Review', 'Done'];

interface ColumnConfig {
  status: Status;
  title: string;
  accent: string;
  badge: string;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
  icon: React.ElementType;
  description: string;
}

const COLUMNS_CONFIG: ColumnConfig[] = [
  {
    status: 'To Do',
    title: 'To Do',
    accent: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40',
    iconBg: 'bg-sky-50 dark:bg-sky-950/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    borderAccent: 'border-t-sky-500',
    icon: ListTodo,
    description: 'Backlog & pool tasks ready to be planned'
  },
  {
    status: 'In Progress',
    title: 'In Progress',
    accent: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderAccent: 'border-t-amber-500',
    icon: PlayCircle,
    description: 'Claimed deliverables actively being worked on'
  },
  {
    status: 'In Review',
    title: 'In Review',
    accent: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
    iconBg: 'bg-purple-50 dark:bg-purple-950/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderAccent: 'border-t-purple-500',
    icon: Eye,
    description: 'Submitted work pending evaluation & sign-off'
  },
  {
    status: 'Done',
    title: 'Done',
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderAccent: 'border-t-emerald-500',
    icon: CheckCircle2,
    description: 'Successfully finished & approved deliverables'
  }
];

// --- Helper Components ---

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const config: Record<Priority, { bg: string; text: string; border: string; icon: React.ElementType }> = {
    Critical: {
      bg: 'bg-red-50 dark:bg-red-950/50',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-900/60',
      icon: Flame
    },
    High: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-900/60',
      icon: ArrowUp
    },
    Medium: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-900/60',
      icon: ArrowRight
    },
    Normal: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-900/60',
      icon: ArrowRight
    },
    Low: {
      bg: 'bg-slate-50 dark:bg-slate-800/60',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
      icon: ArrowDown
    }
  };

  const item = config[priority] || config.Normal;
  const Icon = item.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
      item.bg, item.text, item.border
    )}>
      <Icon className="h-2.5 w-2.5 shrink-0" />
      {priority}
    </span>
  );
};

const getInitials = (name: string) => {
  if (!name || name === 'Unassigned') return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const EmptyColumnPlaceholder = ({ config, role, onQuickAdd }: { config: ColumnConfig; role: 'manager' | 'intern'; onQuickAdd?: () => void }) => {
  const Icon = config.icon;
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-slate-800 min-h-[180px] bg-white/40 dark:bg-slate-900/20 transition-all">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-2 shadow-xs", config.iconBg, config.iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">{config.title} is empty</h5>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] leading-tight">
        {config.description}
      </p>
      {role === 'manager' && onQuickAdd && (
        <button
          onClick={onQuickAdd}
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add a task
        </button>
      )}
    </div>
  );
};

// --- Main Page Component ---

const safeDateString = (val: any): string => {
  if (!val || val === 'No Date' || val === 'TBD' || val === 'Invalid Date') return '';
  const parsed = Date.parse(val);
  if (isNaN(parsed)) return '';
  try {
    return new Date(parsed).toISOString();
  } catch {
    return '';
  }
};

const CACHE_KEY_KANBAN = 'cached_kanban_tasks';
const CACHE_KEY_TEAM = 'cached_team_members';

const getInitialCachedTasks = (): Task[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_KANBAN);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

const getInitialCachedTeam = (): any[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_TEAM);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

export default function TaskBoard({ session, isSidebarMinimized = false }: { session?: any; isSidebarMinimized?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>(getInitialCachedTasks);
  const [loading, setLoading] = useState(() => getInitialCachedTasks().length === 0);
  const [teamMembers, setTeamMembers] = useState<any[]>(getInitialCachedTeam);
  const [dbProjects, setDbProjects] = useState<any[]>([]);

  const mapBackendTask = (t: any): Task => {
    const assignees = t.assignees || [];
    const firstAssignee = assignees[0] || {};
    const rawStatus = (t.status || '').toLowerCase().replace(/[\s_-]+/g, '');
    const normalizedStatus: Status = 
      rawStatus === 'done' || rawStatus === 'completed' ? 'Done' :
      rawStatus === 'inprogress' ? 'In Progress' :
      rawStatus === 'inreview' ? 'In Review' : 'To Do';

    const rawPriority = (t.priority || '').toLowerCase();
    const normalizedPriority: Priority =
      rawPriority === 'high' ? 'High' :
      rawPriority === 'low' ? 'Low' :
      rawPriority === 'critical' ? 'Critical' : 'Normal';

    return {
      id: t.id,
      title: t.title,
      description: t.desc || t.description || '',
      project_tag: t.project_tag || t.project?.name || 'General',
      projectId: t.projectId || t.project?.id,
      project_status: t.project_status || t.project?.status,
      assignee_name: t.assignee_name || t.assignee?.name || firstAssignee.user?.name || firstAssignee.name || 'Unassigned',
      assignee_id: t.assignee_id || t.assigneeId || firstAssignee.userId || firstAssignee.user?.id || firstAssignee.id || 'unassigned',
      priority: normalizedPriority,
      start_date: t.start_date ? new Date(t.start_date).toISOString() : (t.startDate ? safeDateString(t.startDate) : ''),
      due_date: t.due_date ? new Date(t.due_date).toISOString() : (t.dueDate ? safeDateString(t.dueDate) : ''),
      status: normalizedStatus,
      delay_reason: t.delay_reason || (t.comments?.find((c: any) => c.content?.startsWith('[DELAY REASON]:'))?.content?.replace('[DELAY REASON]:', '').trim()) || '',
      subtasks: Array.isArray(t.subtasks)
        ? t.subtasks.map((s: any, idx: number) => ({
            id: s.id || `st-${idx}`,
            title: s.title || s.text || '',
            completed: !!(s.completed || s.done)
          }))
        : (typeof t.subtasks === 'string' ? (() => {
            try {
              const parsed = JSON.parse(t.subtasks || '[]');
              return Array.isArray(parsed) ? parsed.map((s: any, idx: number) => ({
                id: s.id || `st-${idx}`,
                title: s.title || s.text || '',
                completed: !!(s.completed || s.done)
              })) : [];
            } catch { return []; }
          })() : [])
    };
  };

  const fetchTasksData = async (silent = false) => {
    try {
      if (!silent && tasks.length === 0) {
        setLoading(true);
      }

      const loggedUser = getCurrentUser();
      const isUserManagerOrAdmin = isManagerOrAdmin(loggedUser?.role);

      const requests: Promise<any>[] = [api.get('/tasks?limit=1000')];
      if (isUserManagerOrAdmin) {
        requests.push(api.get('/projects'));
        requests.push(api.get('/team'));
      }

      const [res, projRes, teamRes] = await Promise.all(requests);

      if (res?.data?.success) {
        const backendTasks = res.data.data || [];
        const mapped = backendTasks.map(mapBackendTask);
        setTasks(mapped);
        try {
          localStorage.setItem(CACHE_KEY_KANBAN, JSON.stringify(mapped));
        } catch (e) {}
      }

      if (projRes?.data?.success) {
        setDbProjects(projRes.data.data || []);
      }

      if (teamRes?.data?.success) {
        const members = teamRes.data.data.members || [];
        setTeamMembers(members);
        try {
          localStorage.setItem(CACHE_KEY_TEAM, JSON.stringify(members));
        } catch (e) {}
      }
    } catch (e: any) {
      console.warn('Backend unavailable or failed to load Kanban tasks.', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData(true);

    const handleUpdate = () => {
      fetchTasksData(true);
    };

    window.addEventListener('task_created', handleUpdate);
    window.addEventListener('task_updated', handleUpdate);

    return () => {
      window.removeEventListener('task_created', handleUpdate);
      window.removeEventListener('task_updated', handleUpdate);
    };
  }, []);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Resolve current user dynamically from active database session
  const loggedInUser = getCurrentUser();
  const canManage = isManagerOrAdmin(loggedInUser?.role);
  const role = canManage ? 'manager' : 'intern';
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
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  // Claim Task Modal States
  const [claimingTask, setClaimingTask] = useState<Task | null>(null);
  const [claimDateTime, setClaimDateTime] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Delay Reason Modal States
  const [delayModalData, setDelayModalData] = useState<{ task: Task; newStatus: Status } | null>(null);
  const [delayReasonText, setDelayReasonText] = useState('');
  const [isSubmittingDelay, setIsSubmittingDelay] = useState(false);

  const handleClaimTask = (task: Task) => {
    setClaimingTask(task);
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(18, 0, 0, 0);
    const offset = target.getTimezoneOffset() * 60000;
    const localISO = new Date(target.getTime() - offset).toISOString().slice(0, 16);
    setClaimDateTime(localISO);
  };

  const handleConfirmClaim = async () => {
    if (!claimingTask || !claimDateTime) return;
    setIsSubmittingClaim(true);
    try {
      const res = await api.patch(`/tasks/${claimingTask.id}/claim`, {
        dueDate: new Date(claimDateTime).toISOString()
      });
      if (res.data?.success) {
        toast.success('Task Claimed Successfully!', {
          description: `You committed target deadline: ${format(new Date(claimDateTime), 'dd MMM yyyy, hh:mm a')}`
        });
        setTasks(prev => prev.map(t => t.id === claimingTask.id ? {
          ...t,
          assignee_name: currentUserName,
          assignee_id: currentUserId,
          start_date: new Date().toISOString(),
          due_date: new Date(claimDateTime).toISOString(),
          status: 'In Progress'
        } : t));
        window.dispatchEvent(new CustomEvent('task_updated'));
        setClaimingTask(null);
      }
    } catch (err: any) {
      toast.error('Failed to claim task', { description: err.response?.data?.message || err.message });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleConfirmDelayReason = async () => {
    if (!delayModalData || !delayReasonText.trim()) {
      toast.error('Delay reason required', { description: 'Please provide an explanation for the delay.' });
      return;
    }
    const { task, newStatus } = delayModalData;
    setIsSubmittingDelay(true);
    try {
      const backendStatus = mapStatusToBackend(newStatus);
      const res = await api.patch(`/tasks/${task.id}/status`, {
        status: backendStatus,
        delayReason: delayReasonText.trim()
      });
      if (res.data?.success) {
        toast.success(`Task moved to ${newStatus}`, {
          description: `Delay reason recorded and logged.`
        });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, delay_reason: delayReasonText.trim() } : t));
        logActivity(currentUserName, `moved task to ${newStatus} (Delay Reason: ${delayReasonText.trim()})`, task.title, 'task');
        window.dispatchEvent(new CustomEvent('task_updated'));
        setDelayModalData(null);
        setDelayReasonText('');
      }
    } catch (err: any) {
      toast.error('Failed to update status', { description: err.response?.data?.message || err.message });
    } finally {
      setIsSubmittingDelay(false);
    }
  };

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
  }, [baseTasks, projectFilter, assigneeFilter, priorityFilter, viewFilter, searchQuery, isSidebarMinimized]);

  const filteredTasks = baseTasks.filter(task => {
    if (projectFilter !== 'All' && task.project_tag !== projectFilter) return false;
    if (assigneeFilter !== 'All' && task.assignee_name !== assigneeFilter) return false;
    if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchTag = (task.project_tag || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    if (viewFilter === 'my-tasks') {
      return String(task.assignee_id) === String(currentUser.id);
    }
    if (viewFilter === 'pool') {
      return !task.assignee_id || task.assignee_id === 'unassigned' || task.assignee_name === 'Unassigned';
    }
    if (viewFilter === 'overdue') {
      if (!task.due_date || task.status === 'Done') return false;
      return new Date() > new Date(task.due_date);
    }
    return true;
  });

  // --- Drag & Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
    setTimeout(() => setDraggedTaskId(id), 0);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
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
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === status) {
      setDraggedTaskId(null);
      return;
    }

    if (task.status === 'Done' && status !== 'Done') {
      toast.error('Task Completed', { description: 'Completed tasks cannot be moved back to To Do, In Progress, or In Review.' });
      setDraggedTaskId(null);
      return;
    }

    if (status === 'Done' && currentUser.role === 'intern') {
      toast.error('Manager Approval Required', { description: 'Only managers can approve tasks as Done. Please drag to "In Review".' });
      setDraggedTaskId(null);
      return;
    }

    // Intercept Overdue Task!
    const isOverdue = task.due_date && new Date() > new Date(task.due_date);
    if (isOverdue && task.status !== 'Done') {
      setDraggedTaskId(null);
      setDelayModalData({ task, newStatus: status });
      setDelayReasonText('');
      return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    try {
      const backendStatus = mapStatusToBackend(status);
      const res = await api.patch(`/tasks/${taskId}/status`, { status: backendStatus });
      if (res.data?.success) {
        logActivity(currentUserName, `moved task to ${status}`, task.title, 'task');
        window.dispatchEvent(new CustomEvent('task_updated'));
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
        assigneeId: updatedTask.assignee_id || undefined,
        subtasks: updatedTask.subtasks || []
      });
      toast.success('Task updated successfully');
      window.dispatchEvent(new CustomEvent('task_updated'));
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
        window.dispatchEvent(new CustomEvent('task_created'));
        fetchTasksData();
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to create task', { description: e.response?.data?.message || e.message });
    }
  };

  // Sprint metrics for high-level board summary
  const openPoolCount = baseTasks.filter(t => !t.assignee_id || t.assignee_id === 'unassigned' || t.assignee_name === 'Unassigned').length;
  const inProgressCount = baseTasks.filter(t => t.status === 'In Progress').length;
  const inReviewCount = baseTasks.filter(t => t.status === 'In Review').length;
  const completedCount = baseTasks.filter(t => t.status === 'Done').length;
  const myTasksCount = baseTasks.filter(t => String(t.assignee_id) === String(currentUser.id)).length;
  const overdueCount = baseTasks.filter(t => t.due_date && t.status !== 'Done' && new Date() > new Date(t.due_date)).length;

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header & High-Level Sprint Metrics */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Layers className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Kanban Sprint Board</h2>
              <Badge variant="outline" className="font-extrabold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {baseTasks.length} Deliverable{baseTasks.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Live sprint pipeline, deliverable claiming pool, and execution velocity.
            </p>
          </div>

          {/* Quick Create Task (Managers & Admins) */}
          {currentUser.role === 'manager' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-sm shadow-orange-500/30 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" /> Create Deliverable
            </button>
          )}
        </div>

        {/* High-Level Pipeline Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Tasks</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{baseTasks.length}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>

          <div 
            onClick={() => setViewFilter(viewFilter === 'pool' ? 'all' : 'pool')}
            className={cn(
              "border rounded-2xl p-3.5 flex items-center justify-between shadow-xs cursor-pointer transition-all",
              viewFilter === 'pool'
                ? "bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/30"
                : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-orange-200"
            )}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Open Pool</p>
              <p className="text-xl font-black text-orange-600 dark:text-orange-400 mt-0.5">{openPoolCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Zap className="h-4 w-4 fill-current" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">In Progress</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{inProgressCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PlayCircle className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Completed</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{completedCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Interactive Controls & Quick Filters Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
          {/* Quick View Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setViewFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
                viewFilter === 'all'
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              All Tasks ({baseTasks.length})
            </button>

            <button
              onClick={() => setViewFilter('pool')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                viewFilter === 'pool'
                  ? "bg-orange-600 text-white shadow-xs"
                  : "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
              )}
            >
              <Zap className="h-3 w-3 fill-current" /> Open Pool ({openPoolCount})
            </button>

            <button
              onClick={() => setViewFilter('my-tasks')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                viewFilter === 'my-tasks'
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <UserCheck className="h-3 w-3" /> My Tasks ({myTasksCount})
            </button>

            <button
              onClick={() => setViewFilter('overdue')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                viewFilter === 'overdue'
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              )}
            >
              <AlertTriangle className="h-3 w-3" /> Overdue ({overdueCount})
            </button>
          </div>

          {/* Search, Project & Priority Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex-1 sm:flex-none">
              <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 w-28 sm:w-44"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 ml-1">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-8.5 text-xs font-bold rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 w-[140px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {projects.map(p => (
                  <SelectItem key={p} value={p} className="text-xs font-semibold">
                    {p === 'All' ? 'All Projects' : p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8.5 text-xs font-bold rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All" className="text-xs font-semibold">All Priorities</SelectItem>
                <SelectItem value="Critical" className="text-xs font-semibold text-red-600">Critical</SelectItem>
                <SelectItem value="High" className="text-xs font-semibold text-rose-600">High</SelectItem>
                <SelectItem value="Medium" className="text-xs font-semibold text-blue-600">Medium</SelectItem>
                <SelectItem value="Normal" className="text-xs font-semibold text-amber-600">Normal</SelectItem>
                <SelectItem value="Low" className="text-xs font-semibold text-slate-600">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Kanban Columns Board Canvas */}
      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 min-h-[350px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Syncing Kanban Sprint...</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fetching live task deliverables and velocity from the server.</p>
        </div>
      ) : (
        <div className="relative group/board w-full">
          {/* Column Scroll Buttons for Tablet/Mobile */}
          {isOverflowing && (
            <>
              <button
                onClick={() => scroll('left')}
                className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={() => scroll('right')}
                className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Kanban Columns Grid */}
          <div
            ref={scrollContainerRef}
            className={cn(
              "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 w-full items-start overflow-x-auto pb-6"
            )}
          >
            {COLUMNS_CONFIG.map(config => {
              const columnStatus = config.status;
              const columnTasks = filteredTasks
                .filter(t => t.status === columnStatus)
                .sort((a, b) => {
                  // 1. Logged in employee's assigned tasks always at the very top
                  const isAMine = String(a.assignee_id) === String(currentUser.id);
                  const isBMine = String(b.assignee_id) === String(currentUser.id);
                  if (isAMine && !isBMine) return -1;
                  if (!isAMine && isBMine) return 1;

                  // 2. Unassigned / open pool tasks come next
                  const isAUnassigned = !a.assignee_id || a.assignee_id === 'unassigned' || a.assignee_name === 'Unassigned';
                  const isBUnassigned = !b.assignee_id || b.assignee_id === 'unassigned' || b.assignee_name === 'Unassigned';
                  if (isAUnassigned && !isBUnassigned) return -1;
                  if (!isAUnassigned && isBUnassigned) return 1;

                  return 0;
                });
              const isDragTarget = dragOverColumn === columnStatus;

              return (
                <div
                  key={columnStatus}
                  className="flex flex-col w-full min-w-[280px] rounded-3xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs"
                  onDragOver={(e) => (canManage || currentUser.role === 'intern') && handleDragOver(e, columnStatus)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => (canManage || currentUser.role === 'intern') && handleDrop(e, columnStatus)}
                >
                  {/* Top Colored Accent Bar */}
                  <div className={cn("h-1 w-full", config.accent)} />

                  {/* Column Header */}
                  <div className="flex items-center justify-between p-3.5 px-4 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", config.iconBg, config.iconColor)}>
                        <config.icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {config.title}
                      </h3>
                      <span className={cn("text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 border", config.badge)}>
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Quick Add button for managers */}
                    {currentUser.role === 'manager' && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                        title={`Add task to ${config.title}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Column Task Cards Dropzone Track */}
                  <div className={cn(
                    "flex flex-col gap-3 p-3 min-h-[480px] max-h-[calc(100vh-320px)] overflow-y-auto transition-all duration-200",
                    isDragTarget && "ring-2 ring-orange-500/60 bg-orange-500/5 border-orange-400 border-dashed rounded-2xl"
                  )}>
                    {columnTasks.length === 0 ? (
                      <EmptyColumnPlaceholder 
                        config={config} 
                        role={currentUser.role} 
                        onQuickAdd={currentUser.role === 'manager' ? () => setIsCreateModalOpen(true) : undefined}
                      />
                    ) : (
                      columnTasks.map(task => {
                        const isAborted = task.project_status === 'aborted';
                        const isCompleted = task.status === 'Done';
                        const isAssignedToCurrentUser = String(task.assignee_id) === String(currentUser.id);
                        const isUnassigned = !task.assignee_id || task.assignee_id === 'unassigned' || task.assignee_name === 'Unassigned';
                        const isAssignedToOther = !isUnassigned && !isAssignedToCurrentUser;
                        const canDrag = (currentUser.role === 'manager' || isAssignedToCurrentUser) && !isAborted && !isCompleted;

                        let deadlineStatus: 'past' | 'today' | 'tomorrow' | 'normal' | null = null;
                        let formattedDueDate = 'No Deadline';

                        if (task.due_date) {
                          try {
                            const due = new Date(task.due_date);
                            if (!isNaN(due.getTime())) {
                              formattedDueDate = format(due, 'dd MMM, hh:mm a');
                              if (!isCompleted && !isAborted) {
                                const now = new Date();
                                if (now.getTime() > due.getTime()) {
                                  deadlineStatus = 'past';
                                } else {
                                  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                  if (diffDays === 0) deadlineStatus = 'today';
                                  else if (diffDays === 1) deadlineStatus = 'tomorrow';
                                  else deadlineStatus = 'normal';
                                }
                              }
                            }
                          } catch (e) {}
                        }

                        let formattedStartDate = '';
                        if (task.start_date) {
                          try {
                            const started = new Date(task.start_date);
                            if (!isNaN(started.getTime())) {
                              formattedStartDate = format(started, 'dd MMM, hh:mm a');
                            }
                          } catch (e) {}
                        }

                        const subtaskList = task.subtasks || [];
                        const subtaskTotal = subtaskList.length;
                        const subtaskDone = subtaskList.filter(s => s.completed).length;

                        return (
                          <div
                            key={task.id}
                            draggable={canDrag}
                            onClick={() => setSelectedTask(task)}
                            onDragStart={canDrag ? (e) => handleDragStart(e, task.id) : undefined}
                            onDragEnd={canDrag ? handleDragEnd : undefined}
                            className={cn(
                              "group/card relative rounded-2xl p-4 border shadow-xs transition-all duration-200 flex flex-col justify-between gap-3",
                              isAssignedToOther && currentUser.role !== 'manager'
                                ? "opacity-55 hover:opacity-85 bg-slate-100/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 cursor-pointer"
                                : isAssignedToCurrentUser
                                ? "bg-white dark:bg-slate-900 border-orange-300/80 dark:border-orange-800/80 ring-2 ring-orange-500/30 hover:shadow-md hover:border-orange-400"
                                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700",
                              canDrag ? "cursor-grab active:cursor-grabbing hover:-translate-y-0.5" : "cursor-pointer",
                              draggedTaskId === task.id ? "opacity-25 scale-95 border-dashed border-orange-500" : "",
                              isAborted && "opacity-75 grayscale bg-slate-50 dark:bg-slate-900/40 border-red-200 dark:border-red-900/50 hover:shadow-none hover:translate-y-0 cursor-not-allowed",
                              isCompleted && "border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-950/10"
                            )}
                          >
                            <div className="space-y-2.5">
                              {/* Card Meta Header: Project Tag, Ownership/Lock Badge, Priority */}
                              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                                    <FolderKanban className="h-3 w-3 shrink-0 text-slate-400" />
                                    <span className="truncate">{task.project_tag}</span>
                                  </span>

                                  {isAssignedToCurrentUser && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/80 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800 shadow-xs">
                                      <UserCheck className="h-2.5 w-2.5 text-orange-600" /> My Task
                                    </span>
                                  )}

                                  {isAssignedToOther && currentUser.role !== 'manager' && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-300/60 dark:border-slate-700/60">
                                      <Lock className="h-2.5 w-2.5 text-slate-400" /> Locked
                                    </span>
                                  )}

                                  {isUnassigned && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 px-2 py-0.5 rounded-full animate-pulse">
                                      <Zap className="h-2.5 w-2.5 fill-orange-500" /> Pool
                                    </span>
                                  )}

                                  {isAborted && (
                                    <Badge variant="destructive" className="text-[8px] py-0 px-1 leading-tight uppercase bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200/50">Aborted</Badge>
                                  )}
                                </div>

                                <PriorityBadge priority={task.priority} />
                              </div>

                              {/* Task Title */}
                              <h4 className={cn(
                                "text-sm font-bold leading-snug transition-colors line-clamp-2",
                                isAssignedToOther && currentUser.role !== 'manager'
                                  ? "text-slate-600 dark:text-slate-400"
                                  : "text-slate-900 dark:text-white",
                                !isAborted && "group-hover/card:text-orange-600 dark:group-hover/card:text-orange-400",
                                isAborted && "line-through text-slate-400 dark:text-slate-500"
                              )}>
                                {task.title}
                              </h4>

                              {/* Task Description */}
                              {task.description && (
                                <p className={cn(
                                  "text-xs line-clamp-2 font-normal leading-relaxed",
                                  isAborted ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-500 dark:text-slate-400"
                                )}>
                                  {task.description}
                                </p>
                              )}

                              {/* Meta Chips: Claimed on / Deliver by / Subtasks */}
                              {(formattedStartDate || (formattedDueDate && formattedDueDate !== 'No Deadline') || subtaskTotal > 0) && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {formattedStartDate && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50 px-1.5 py-0.5 rounded-md">
                                      📌 Claimed {formattedStartDate}
                                    </span>
                                  )}
                                  {formattedDueDate && formattedDueDate !== 'No Deadline' && (
                                    <span className={cn(
                                      "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                                      deadlineStatus === 'past' ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900" :
                                      deadlineStatus === 'today' ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900" :
                                      "bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                                    )}>
                                      🎯 Deliver {formattedDueDate}
                                    </span>
                                  )}
                                  {subtaskTotal > 0 && (
                                    <span className={cn(
                                      "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                                      subtaskDone === subtaskTotal
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    )}>
                                      ✅ {subtaskDone}/{subtaskTotal} Subtasks
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Subtask Progress Bar if task has subtasks */}
                              {subtaskTotal > 0 && (() => {
                                const allDone = subtaskDone === subtaskTotal;
                                return (
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={cn("h-full transition-all duration-300", allDone ? "bg-emerald-500" : "bg-orange-500")}
                                        style={{ width: `${(subtaskDone / subtaskTotal) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                      {Math.round((subtaskDone / subtaskTotal) * 100)}%
                                    </span>
                                  </div>
                                );
                              })()}

                              {/* Delay Reason Alert Box */}
                              {task.delay_reason && (
                                <div className="flex items-start gap-1.5 p-2 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-[10px] text-rose-700 dark:text-rose-300 font-semibold leading-relaxed">
                                  <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2"><strong>Delay Reason:</strong> {task.delay_reason}</span>
                                </div>
                              )}
                            </div>

                            {/* Card Footer: Assignee Avatar on Left, Deadline & Claim on Right */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-auto gap-2">
                              {/* Assignee Avatar & Label */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border",
                                  isUnassigned
                                    ? "border-dashed border-slate-300 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800"
                                    : isAssignedToCurrentUser
                                    ? "border-orange-300 bg-orange-500 text-white"
                                    : "border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                )}>
                                  {getInitials(task.assignee_name)}
                                </div>
                                <span className={cn(
                                  "text-[11px] font-semibold truncate max-w-[85px]",
                                  isAssignedToCurrentUser
                                    ? "text-orange-600 dark:text-orange-400 font-bold"
                                    : "text-slate-600 dark:text-slate-400"
                                )}>
                                  {isUnassigned ? 'Unassigned' : isAssignedToCurrentUser ? 'You' : task.assignee_name}
                                </span>
                              </div>

                              {/* Target Deadline & Action Button */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {task.due_date && (
                                  <div className={cn(
                                    "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md",
                                    deadlineStatus === 'past' ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900" :
                                    deadlineStatus === 'today' ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900" :
                                    "text-slate-500 dark:text-slate-400"
                                  )}>
                                    {deadlineStatus === 'past' || deadlineStatus === 'today' ? (
                                      <AlertTriangle className="h-3 w-3 shrink-0" />
                                    ) : (
                                      <Clock className="h-3 w-3 shrink-0" />
                                    )}
                                    <span>{formattedDueDate}</span>
                                  </div>
                                )}

                                {/* Claim Button for Interns on Unassigned Tasks */}
                                {isUnassigned && !isCompleted && !isAborted && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClaimTask(task);
                                    }}
                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-[11px] px-2.5 py-1 rounded-lg shadow-xs shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
                                    title="Self-claim deliverable with target deadline"
                                  >
                                    <Zap className="h-3 w-3 fill-white" /> Claim
                                  </button>
                                )}
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
        onClaimTask={handleClaimTask}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
        currentUser={currentUser}
        projects={dbProjects}
        teamMembers={teamMembers}
      />

      {/* Claim Task Modal with Date + Time Picker */}
      <Dialog open={!!claimingTask} onOpenChange={(open) => !open && setClaimingTask(null)}>
        {claimingTask && (
          <DialogContent className="sm:max-w-[440px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-orange-50/50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                <Zap className="h-5 w-5 fill-current" />
                <span className="text-xs font-black uppercase tracking-wider">Self-Claim Deliverable</span>
              </div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                Claim "{claimingTask.title}"
              </DialogTitle>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Project: <span className="font-bold text-slate-800 dark:text-slate-200">{claimingTask.project_tag}</span>
              </p>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Your Target Deadline (Date & Time)</span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">Required</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    value={claimDateTime}
                    onChange={(e) => setClaimDateTime(e.target.value)}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select both the date and exact time by which you will deliver this task. If delayed, you'll need to submit a delay reason.
                </p>
              </div>
            </div>

            <DialogFooter className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => setClaimingTask(null)}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClaim}
                disabled={isSubmittingClaim || !claimDateTime}
                className="flex-1 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingClaim ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                Commit & Claim
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delay Reason Modal for Overdue Tasks */}
      <Dialog open={!!delayModalData} onOpenChange={(open) => !open && setDelayModalData(null)}>
        {delayModalData && (
          <DialogContent className="sm:max-w-[460px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b border-rose-100 dark:border-rose-950/50 bg-rose-50/60 dark:bg-rose-950/20">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-wider">Deadline Overdue</span>
              </div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                Delay Reason Required
              </DialogTitle>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Committed Target: <span className="font-bold text-rose-600 dark:text-rose-400">{delayModalData.task.due_date ? format(new Date(delayModalData.task.due_date), 'dd MMM yyyy, hh:mm a') : 'Passed'}</span>
              </p>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                The committed deadline for <strong>"{delayModalData.task.title}"</strong> has passed. To move this task to <strong>{delayModalData.newStatus}</strong>, please provide an honest explanation for the delay.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Reason for Delay <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Blocked on API integration schema, encountered merge conflicts, unexpected edge case bug..."
                  value={delayReasonText}
                  onChange={(e) => setDelayReasonText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => setDelayModalData(null)}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelayReason}
                disabled={isSubmittingDelay || delayReasonText.trim().length < 5}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingDelay ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit & Move
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
