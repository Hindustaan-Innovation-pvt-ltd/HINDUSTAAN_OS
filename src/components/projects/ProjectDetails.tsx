import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, Flag, LayoutGrid, Target, Users, 
  CheckSquare, Plus, Loader2, Calendar, Trash2, Edit2, AlertCircle, X,
  Zap, AlertTriangle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, formatToMMDDYYYY } from '@/context/ProjectContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';

export default function ProjectDetails({ project, onBack }: { project: any, onBack: () => void }) {
  const { updateProject } = useProjects();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Claim and Delay states
  const [claimingTask, setClaimingTask] = useState<any>(null);
  const [claimDateTime, setClaimDateTime] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [delayModalData, setDelayModalData] = useState<{ task: any; newStatus: string } | null>(null);
  const [delayReasonText, setDelayReasonText] = useState('');
  const [isSubmittingDelay, setIsSubmittingDelay] = useState(false);

  // New task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: project.endDate || ''
  });

  const currentUser = getCurrentUser();
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  // Load active team members for task assignment
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get('/team/profiles');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setTeamMembers(res.data.data);
        } else {
          const teamRes = await api.get('/team');
          if (teamRes.data?.success && Array.isArray(teamRes.data.data?.members)) {
            setTeamMembers(teamRes.data.data.members);
          }
        }
      } catch (err) {
        console.warn('Failed to load team members in ProjectDetails:', err);
      }
    };
    fetchTeam();
  }, []);

  const tasks: any[] = project.tasks || [];
  const completedTasks = tasks.filter((t: any) => t?.status === 'Done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Handle Assigning New Task
  const handleAssignTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setSubmittingTask(true);
    try {
      const selectedMember = teamMembers.find(m => m.id === taskForm.assigneeId);
      const res = await api.post('/tasks', {
        title: taskForm.title.trim(),
        desc: taskForm.description.trim(),
        projectId: project.id,
        assigneeId: taskForm.assigneeId && taskForm.assigneeId !== 'unassigned' ? taskForm.assigneeId : undefined,
        priority: taskForm.priority.toLowerCase(),
        startDate: taskForm.startDate ? new Date(taskForm.startDate) : undefined,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : (project.endDate ? new Date(project.endDate) : undefined),
        status: 'todo'
      });

      if (res.data?.success) {
        toast.success('Task assigned successfully!', {
          description: selectedMember ? `Assigned to ${selectedMember.name}` : 'Created as unassigned task.'
        });
        window.dispatchEvent(new CustomEvent('task_created'));
        setIsAssignModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          assigneeId: '',
          priority: 'Medium',
          startDate: new Date().toISOString().split('T')[0],
          dueDate: project.endDate || ''
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to assign task', {
        description: err.response?.data?.message || err.message || 'Server error'
      });
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleClaimTask = (task: any) => {
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
          description: `Committed target deadline: ${format(new Date(claimDateTime), 'dd MMM yyyy, hh:mm a')}`
        });
        window.dispatchEvent(new CustomEvent('task_updated'));
        setClaimingTask(null);
      }
    } catch (err: any) {
      toast.error('Failed to claim task', { description: err.response?.data?.message || err.message });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleConfirmDelay = async () => {
    if (!delayModalData || !delayReasonText.trim()) {
      toast.error('Delay reason required');
      return;
    }
    const { task, newStatus } = delayModalData;
    setIsSubmittingDelay(true);
    try {
      const backendStatus = newStatus === 'Done' ? 'done' : 
                            newStatus === 'In Progress' ? 'in-progress' :
                            newStatus === 'In Review' ? 'in-review' : 'todo';
      const res = await api.patch(`/tasks/${task.id}/status`, {
        status: backendStatus,
        delayReason: delayReasonText.trim()
      });
      if (res.data?.success) {
        toast.success(`Task status updated to ${newStatus}`, {
          description: 'Delay reason recorded.'
        });
        window.dispatchEvent(new CustomEvent('task_updated'));
        setDelayModalData(null);
        setDelayReasonText('');
        if (editingTask?.id === task.id) setEditingTask(null);
      }
    } catch (err: any) {
      toast.error('Failed to update status', { description: err.response?.data?.message || err.message });
    } finally {
      setIsSubmittingDelay(false);
    }
  };

  // Handle Updating Existing Task
  const handleSaveTask = async () => {
    if (!editingTask || !editingTask.title.trim()) return;

    // Check if task deadline has passed and status is being changed
    const taskDueDate = editingTask.due_date || editingTask.dueDate || editingTask.executionDate;
    const isOverdue = taskDueDate && new Date() > new Date(taskDueDate);
    if (isOverdue && editingTask.status !== 'Done') {
      setDelayModalData({ task: editingTask, newStatus: editingTask.status });
      setDelayReasonText('');
      return;
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingTask.id);
      if (isUuid) {
        await api.patch(`/tasks/${editingTask.id}`, {
          title: editingTask.title,
          desc: editingTask.description,
          assigneeId: editingTask.assigneeId && editingTask.assigneeId !== 'unassigned' ? editingTask.assigneeId : undefined,
          status: editingTask.status === 'Done' ? 'done' : 
                  editingTask.status === 'In Progress' ? 'in-progress' :
                  editingTask.status === 'In Review' ? 'in-review' : 'todo'
        });
      } else {
        const updatedTasks = tasks.map((t: any) => t.id === editingTask.id ? editingTask : t);
        await updateProject(project.id, { tasks: updatedTasks });
      }
      toast.success('Task updated successfully');
      window.dispatchEvent(new CustomEvent('task_updated'));
      setEditingTask(null);
    } catch (err: any) {
      toast.error('Failed to update task', { description: err.response?.data?.message || err.message });
    }
  };

  // Handle Deleting Task
  const handleDeleteTask = async (taskId: string) => {
    if (!taskId) return;
    setDeletingTaskId(taskId);
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);
      if (isUuid) {
        await api.delete(`/tasks/${taskId}`);
      }
      const updatedTasks = tasks.filter((t: any) => t.id !== taskId);
      await updateProject(project.id, { tasks: updatedTasks });
      toast.success('Task removed');
      window.dispatchEvent(new CustomEvent('task_deleted'));
      if (editingTask?.id === taskId) setEditingTask(null);
    } catch (err: any) {
      toast.error('Failed to delete task', { description: err.response?.data?.message || err.message });
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Lock edits/assignments when the project is actively in progress
  const isLocked = project.status === 'In Progress';

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-orange-600 hover:border-orange-200 dark:hover:border-orange-900/50 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{project.name}</h2>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 font-bold">
                {project.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium">
              <span>{totalTasks} Deliverable{totalTasks !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedTasks} Completed ({progress}%)</span>
            </p>
          </div>
        </div>

        {isManager && !isLocked && (
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Assign Task
          </button>
        )}
        {isLocked && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-3.5 py-2 rounded-xl">
            🔒 In Progress – Locked
          </span>
        )}
      </div>

      {/* Description if present */}
      {project.description && project.description !== project.name && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Project Scope & Brief</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Deliverables</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalTasks}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <LayoutGrid className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Completed Tasks</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedTasks}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-wider opacity-90">Sprint Completion</p>
            <p className="text-3xl font-black mt-1">{progress}%</p>
          </div>
          <div className="relative z-10 h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Target className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Task Tracker Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Task Deliverables</h3>
              <p className="text-xs text-slate-400 font-medium">Sprint execution and individual assignments for this project.</p>
            </div>
          </div>

          {isManager && !isLocked && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-800/60 px-3.5 py-2 rounded-xl transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Assign Task
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <CheckSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No tasks assigned yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1 font-medium">
              Get started by assigning deliverables to team members. They will appear here and on the Kanban board.
            </p>
            {isManager && !isLocked && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="mt-4 flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Assign First Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['To Do', 'In Progress', 'Done'].map(status => {
              const columnTasks = tasks.filter((t: any) => t?.status === status);
              return (
                <div key={status} className="flex flex-col bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">{status}</h4>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {columnTasks.map((task: any, i: number) => {
                      const priorityColor = 
                        task.priority?.toLowerCase() === 'high' ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' :
                        task.priority?.toLowerCase() === 'low' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' :
                        'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';

                      const isUnassigned = !task?.assigneeId || task?.assigneeId === 'unassigned' || task?.assignee === 'Unassigned' || task?.assignee_name === 'Unassigned';
                      const taskDueDate = task?.due_date || task?.dueDate || task?.executionDate;
                      const taskStartDate = task?.start_date || task?.startDate;
                      let formattedDueDate = '';
                      let formattedStartDate = '';
                      if (taskDueDate) {
                        try {
                          const d = new Date(taskDueDate);
                          formattedDueDate = isNaN(d.getTime()) ? formatToMMDDYYYY(taskDueDate) : format(d, 'dd MMM');
                        } catch { formattedDueDate = formatToMMDDYYYY(taskDueDate); }
                      }
                      if (taskStartDate) {
                        try {
                          const d = new Date(taskStartDate);
                          formattedStartDate = isNaN(d.getTime()) ? formatToMMDDYYYY(taskStartDate) : format(d, 'dd MMM');
                        } catch { formattedStartDate = formatToMMDDYYYY(taskStartDate); }
                      }
                      // Subtasks (already parsed by ProjectContext)
                      const subtaskList: any[] = Array.isArray(task?.subtasks) ? task.subtasks : [];
                      const subtaskTotal = subtaskList.length;
                      const subtaskDone = subtaskList.filter((s: any) => s?.done || s?.completed).length;

                      return (
                        <div 
                          key={task?.id || i} 
                          onClick={() => isManager && !isLocked && setEditingTask(task)}
                          className={cn(
                            "group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 space-y-2.5",
                            isManager && !isLocked ? "hover:border-orange-500/50 hover:shadow-md cursor-pointer" : "cursor-default"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                              {task?.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isUnassigned && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800/50">
                                  Pool
                                </span>
                              )}
                              {task.priority && (
                                <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md border", priorityColor)}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          </div>

                          {task?.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                              {task.description}
                            </p>
                          )}

                          {task?.delay_reason && (
                            <div className="flex items-start gap-1 p-1 px-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-md text-[10px] text-rose-700 dark:text-rose-300 font-semibold leading-tight">
                              <AlertCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">Late: {task.delay_reason}</span>
                            </div>
                          )}

                          {/* Meta chips: Claimed on / Deliver by / Subtasks */}
                          {(formattedStartDate || formattedDueDate || subtaskTotal > 0) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {formattedStartDate && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50 px-1.5 py-0.5 rounded-md">
                                  📌 Claimed {formattedStartDate}
                                </span>
                              )}
                              {formattedDueDate && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 px-1.5 py-0.5 rounded-md">
                                  🎯 Deliver {formattedDueDate}
                                </span>
                              )}
                              {subtaskTotal > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded-md">
                                  ✅ {subtaskDone}/{subtaskTotal} Subtasks
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold gap-2">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[100px]">{task?.assignee || task?.assignee_name || 'Unassigned'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isUnassigned && task.status !== 'Done' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClaimTask(task);
                                  }}
                                  className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-lg shadow-sm shadow-orange-500/20 transition-all active:scale-95"
                                >
                                  <Zap className="h-2.5 w-2.5 fill-white" /> Claim
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {columnTasks.length === 0 && (
                      <div className="h-28 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <span className="text-xs font-semibold text-slate-400">No {status} tasks</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40">
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Assign Task</DialogTitle>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Assign a deliverable under <span className="font-bold text-orange-600 dark:text-orange-400">{project.name}</span>
            </p>
          </DialogHeader>

          <form onSubmit={handleAssignTaskSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Design UI components for analytics"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Task Scope / Description
              </label>
              <textarea
                rows={2}
                placeholder="Provide instructions, acceptance criteria, or links..."
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assign To (Team Member)
                </label>
                <Select
                  value={taskForm.assigneeId || 'unassigned'}
                  onValueChange={val => setTaskForm({ ...taskForm, assigneeId: val === 'unassigned' ? '' : val })}
                >
                  <SelectTrigger className="w-full h-11 text-sm font-bold">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} {member.role ? `(${member.role})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Priority
                </label>
                <Select
                  value={taskForm.priority}
                  onValueChange={val => setTaskForm({ ...taskForm, priority: val })}
                >
                  <SelectTrigger className="w-full h-11 text-sm font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Due Date
                </label>
                {project.deadline && project.deadline !== 'TBD' && (
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    Project Target: {project.deadline}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingTask || !taskForm.title.trim()}
                className="flex-1 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Assign Task
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit / View Task Modal */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        {editingTask && (
          <DialogContent className="sm:max-w-[450px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Task Details</DialogTitle>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Update deliverable status or assignment</p>
                </div>
                {isManager && (
                  <button
                    onClick={() => handleDeleteTask(editingTask.id)}
                    disabled={deletingTaskId === editingTask.id}
                    className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete task"
                  >
                    {deletingTaskId === editingTask.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Task Title</label>
                <input
                  type="text"
                  disabled={!isManager}
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors disabled:opacity-75"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Assignee</label>
                <Select
                  disabled={!isManager}
                  value={editingTask.assigneeId || 'unassigned'}
                  onValueChange={(val) => {
                    const member = teamMembers.find(m => m.id === val);
                    setEditingTask({ 
                      ...editingTask, 
                      assigneeId: val === 'unassigned' ? null : val,
                      assignee: member ? member.name : 'Unassigned'
                    });
                  }}
                >
                  <SelectTrigger className="w-full h-11 text-sm font-bold">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Execution Status</label>
                <Select
                  value={editingTask.status || 'To Do'}
                  onValueChange={(val) => setEditingTask({ ...editingTask, status: val })}
                >
                  <SelectTrigger className="w-full h-11 text-sm font-bold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="In Review">In Review</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="p-6 pt-0 flex gap-3">
              <button 
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors" 
                onClick={() => setEditingTask(null)}
              >
                Close
              </button>
              <button 
                className="flex-1 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-500/20 transition-colors disabled:opacity-50" 
                onClick={handleSaveTask}
                disabled={!editingTask.title.trim()}
              >
                Save Changes
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Claim Task Modal */}
      <Dialog open={!!claimingTask} onOpenChange={(open) => !open && setClaimingTask(null)}>
        {claimingTask && (
          <DialogContent className="sm:max-w-[440px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-orange-50/50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                <Zap className="h-5 w-5 fill-current" />
                <span className="text-xs font-black uppercase tracking-wider">Self-Claim Task</span>
              </div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                Claim "{claimingTask.title}"
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Committed Target Deadline (Date & Time) <span className="text-rose-500">*</span>
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
                  Select your committed delivery date and time.
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

      {/* Delay Reason Modal */}
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
            </DialogHeader>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                The committed deadline for <strong>"{delayModalData.task.title}"</strong> has passed. To change this task's status to <strong>{delayModalData.newStatus}</strong>, please mention the reason for the delay.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Reason for Delay <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this task was delayed..."
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
                onClick={handleConfirmDelay}
                disabled={isSubmittingDelay || delayReasonText.trim().length < 5}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingDelay ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit & Update
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
