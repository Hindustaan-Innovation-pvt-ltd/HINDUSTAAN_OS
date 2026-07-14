import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Flag, LayoutGrid, Target, Users, CheckSquare, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProjects } from '@/context/ProjectContext';
import { GLOBAL_TEAM_MEMBERS } from '@/data/mockData';
import { getCurrentUser } from '@/lib/auth';

export default function ProjectDetails({ project, onBack }: { project: any, onBack: () => void }) {
  const { updateProject, addMilestone, updateMilestoneStatus } = useProjects();
  const [editingTask, setEditingTask] = useState<any>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

  const currentUser = getCurrentUser();
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const handleSaveTask = () => {
    if (!editingTask || !editingTask.title.trim()) return;
    const updatedTasks = (project.tasks || []).map((t: any) => t.id === editingTask.id ? editingTask : t);
    updateProject(project.id, { tasks: updatedTasks });
    setEditingTask(null);
  };

  const handleCreateMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneName.trim()) return;
    setSubmittingMilestone(true);
    try {
      await addMilestone(project.id, newMilestoneName.trim(), newMilestoneDate || undefined);
      setNewMilestoneName('');
      setNewMilestoneDate('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + (err.response?.data?.message || err.message || 'Failed to create milestone.'));
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const tasks: any[] = project.tasks || [];
  
  // Use real database milestones from project object
  const milestones = (project.milestones || []).map((m: any, index: number) => ({
    id: m.id || `m-${index}`,
    title: m.title || m.name || 'Unnamed Milestone',
    status: m.status === 'completed' || m.status === 'Done' ? 'completed' : 
            m.status === 'in-progress' || m.status === 'In Progress' ? 'in-progress' : 'pending',
    date: m.date || (m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `TBD`)
  }));

  const completedTasks = tasks.filter((t: any) => t?.status === 'Done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-orange-600 hover:border-orange-200 dark:hover:border-orange-900/50 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{project.name}</h2>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Lead: <span className="font-semibold text-slate-700 dark:text-slate-300">{project.manager || 'Unassigned'}</span></span>
            <span>•</span>
            <span>Due: <span className="font-semibold text-slate-700 dark:text-slate-300">{project.deadline || 'TBD'}</span></span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Tasks</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalTasks}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <LayoutGrid className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Completed</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedTasks}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Milestones</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{milestones.length}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Flag className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="relative z-10">
            <p className="text-sm font-bold opacity-90">Overall Progress</p>
            <p className="text-3xl font-black mt-1">{progress}%</p>
          </div>
          <div className="relative z-10 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Target className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Milestones Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project Milestones</h3>
              </div>
              {isManager && !showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-500 flex items-center transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </button>
              )}
            </div>
            
            {milestones.length === 0 && !showAddForm ? (
              <p className="text-xs text-slate-500 italic py-4">No milestones defined for this project.</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {milestones.map((milestone: any, i: number) => (
                  <div key={milestone?.id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10", 
                      milestone?.status === 'completed' ? "bg-emerald-500" : 
                      milestone?.status === 'in-progress' ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-800"
                    )}>
                      {milestone?.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-white" /> : 
                       milestone?.status === 'in-progress' ? <Clock className="h-4 w-4 text-white" /> :
                       <div className="h-2 w-2 rounded-full bg-slate-400" />
                      }
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-500">{milestone?.date}</span>
                        {isManager ? (
                          <select
                            value={milestone.status}
                            onChange={async (e) => {
                              try {
                                await updateMilestoneStatus(milestone.id, e.target.value);
                              } catch (err: any) {
                                alert(err.message || 'Failed to update milestone status.');
                              }
                            }}
                            className={cn("text-[9px] uppercase tracking-wider font-extrabold bg-white dark:bg-slate-900 border rounded-lg px-2 py-0.5 outline-none cursor-pointer focus:ring-2 focus:ring-orange-500/20 transition-all", 
                              milestone?.status === 'completed' ? "text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900/50" : 
                              milestone?.status === 'in-progress' ? "text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-900/50" : "text-slate-500 border-slate-200 dark:border-slate-800"
                            )}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        ) : (
                          <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider", 
                            milestone?.status === 'completed' ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20" : 
                            milestone?.status === 'in-progress' ? "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/20" : "text-slate-500 border-slate-200 dark:border-slate-800"
                          )}>
                            {milestone?.status}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{milestone?.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Milestone Form */}
          {showAddForm && (
            <form onSubmit={handleCreateMilestoneSubmit} className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Launch New Milestone</h4>
              <div className="space-y-2">
                <input
                  required
                  type="text"
                  placeholder="e.g. Beta release"
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMilestone || !newMilestoneName.trim()}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1"
                >
                  {submittingMilestone ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Launch
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Task Board / List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Task Tracker</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            {['To Do', 'In Progress', 'Done'].map(status => (
              <div key={status} className="flex flex-col bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">{status}</h4>
                  <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                    {tasks.filter((t: any) => t?.status === status).length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {tasks.filter((t: any) => t?.status === status).map((task: any, i: number) => (
                    <div key={task?.id || i} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{task?.title}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span className="text-xs font-medium text-slate-500">{task?.assignee}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.filter((t: any) => t.status === status).length === 0 && (
                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      <span className="text-xs font-medium text-slate-400">No tasks</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Edit Task Modal */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        {editingTask && (
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0">
            <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Edit Task</DialogTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update task details or move its status.</p>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Task Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Assignee</label>
                <div className="relative">
                  <select
                    value={editingTask.assignee}
                    onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {GLOBAL_TEAM_MEMBERS.map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</label>
                <div className="relative">
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3 mt-2">
              <button className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setEditingTask(null)}>
                Cancel
              </button>
              <button 
                className="flex-1 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={handleSaveTask}
                disabled={!editingTask.title.trim()}
              >
                Save Changes
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
