import React, { useState } from 'react';
import { X, Calendar, User, Tag, Clock, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, Priority } from './TaskDetailsModal';
import { GLOBAL_TEAM_MEMBERS } from '@/data/mockData';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  currentUser?: { id: string; role: 'manager' | 'intern'; name: string };
}

export default function CreateTaskModal({ isOpen, onClose, onCreateTask, currentUser }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  
  // Interns can only assign to themselves. Default to their ID if intern.
  const [assigneeId, setAssigneeId] = useState(currentUser?.role === 'intern' ? currentUser.id : '');
  
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [milestone, setMilestone] = useState('');

  if (!isOpen) return null;

  const isPastDue = dueDate && new Date(dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
  
  const availableMembers = currentUser?.role === 'intern' 
    ? GLOBAL_TEAM_MEMBERS.filter(m => m.id === currentUser.id)
    : GLOBAL_TEAM_MEMBERS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priority) return; // Enforce priority (HTML required should catch this too)
    
    // Deduplication logic
    const savedTasks = localStorage.getItem('hindustaan_tasks_list');
    const existingTasks: Task[] = savedTasks ? JSON.parse(savedTasks) : [];
    
    const now = Date.now();
    const duplicate = existingTasks.find(t => 
      t.title.trim().toLowerCase() === title.trim().toLowerCase() &&
      t.project_tag === (projectTag || 'General') &&
      t.created_at &&
      (now - new Date(t.created_at).getTime()) < 60000
    );

    if (duplicate) {
      alert(`Duplicate task detected! Returning existing task ID: ${duplicate.id}`);
      onClose();
      return;
    }
    
    const assignee = GLOBAL_TEAM_MEMBERS.find(u => u.id === assigneeId);
    
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      project_tag: projectTag || 'General',
      assignee_name: assignee ? assignee.name : 'Unassigned',
      assignee_id: assigneeId || 'unassigned',
      priority,
      start_date: startDate || undefined,
      due_date: dueDate || new Date().toISOString().split('T')[0],
      milestone: milestone || undefined,
      created_at: new Date().toISOString(),
      status: 'To Do'
    };

    onCreateTask(newTask);
    
    setTitle('');
    setDescription('');
    setProjectTag('');
    setPriority('');
    setAssigneeId(currentUser?.role === 'intern' ? currentUser.id : '');
    setStartDate('');
    setDueDate('');
    setMilestone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create New Task</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Task Name <span className="text-rose-500">*</span></label>
            <input 
              required
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="e.g. Design Landing Page"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1.5" /> Project Domain
              </label>
              <input 
                type="text"
                value={projectTag}
                onChange={e => setProjectTag(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="e.g. Frontend Core"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5" /> Priority Level <span className="text-rose-500">*</span>
              </label>
              <select 
                required
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer dark:[color-scheme:dark]"
              >
                <option className="bg-white dark:bg-slate-800" value="" disabled>Select Priority...</option>
                <option className="bg-white dark:bg-slate-800" value="High">High</option>
                <option className="bg-white dark:bg-slate-800" value="Medium">Medium</option>
                <option className="bg-white dark:bg-slate-800" value="Normal">Normal</option>
                <option className="bg-white dark:bg-slate-800" value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <User className="h-3.5 w-3.5 mr-1.5" /> Assign To {currentUser?.role === 'manager' && "(Optional)"}
              </label>
              <select 
                required={currentUser?.role === 'intern'}
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer dark:[color-scheme:dark]"
              >
                {currentUser?.role === 'manager' && (
                  <option className="bg-white dark:bg-slate-800" value="">Unassigned</option>
                )}
                {availableMembers.map(member => (
                  <option className="bg-white dark:bg-slate-800" key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Target className="h-3.5 w-3.5 mr-1.5" /> Milestone (Optional)
              </label>
              <input 
                type="text"
                value={milestone}
                onChange={e => setMilestone(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="e.g. Beta Release"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Start Date
              </label>
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:[color-scheme:dark]"
              />
            </div>

            <div className="relative">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Due Date <span className="text-rose-500">*</span>
              </label>
              <input 
                required
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className={cn(
                  "w-full bg-white dark:bg-slate-900 border text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-colors dark:[color-scheme:dark]",
                  isPastDue 
                    ? "border-amber-300 text-amber-700 dark:border-amber-700/50 dark:text-amber-500 focus:ring-amber-500/20 bg-amber-50/30 dark:bg-amber-900/10" 
                    : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-orange-500/20"
                )}
              />
              {isPastDue && (
                <div className="absolute -bottom-5 left-0 flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Warning: Backfilling past due date
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Detailed Context</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full min-h-[120px] rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none"
              placeholder="Add exhaustive task requirements..."
            />
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-sm active:scale-95 transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
