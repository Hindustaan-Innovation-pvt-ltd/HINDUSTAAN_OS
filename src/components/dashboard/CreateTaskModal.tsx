import React, { useState } from 'react';
import { X, Calendar, User, Tag, Clock, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskFields: any) => void;
  currentUser?: { id: string; role: 'manager' | 'intern'; name: string };
  projects: any[];
  teamMembers: any[];
}

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  onCreateTask, 
  currentUser, 
  projects = [], 
  teamMembers = [] 
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Normal' | 'Low' | ''>('');
  
  const [assigneeIds, setAssigneeIds] = useState<string[]>(currentUser?.role === 'intern' ? [currentUser.id] : []);
  
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const isPastDue = dueDate && new Date(dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
  
  const availableMembers = currentUser?.role === 'intern' 
    ? teamMembers.filter(m => m.id === currentUser.id)
    : teamMembers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priority || !projectId) return;
    
    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      projectId,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      assigneeId: assigneeIds[0] || undefined,
      priority,
      start_date: startDate || undefined,
      due_date: dueDate || undefined
    });
    
    setTitle('');
    setDescription('');
    setProjectId('');
    setPriority('');
    setAssigneeIds(currentUser?.role === 'intern' ? [currentUser.id] : []);
    setStartDate('');
    setDueDate('');
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
                <Tag className="h-3.5 w-3.5 mr-1.5" /> Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
              >
                <option value="" disabled>Select Project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5" /> Priority Level <span className="text-rose-500">*</span>
              </label>
              <select 
                required
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
              >
                <option value="" disabled>Select Priority...</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Start Date
              </label>
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
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
                  "w-full bg-white dark:bg-slate-900 border text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-colors",
                  isPastDue 
                    ? "border-amber-300 text-amber-700 dark:border-amber-700/50 dark:text-amber-500 focus:ring-amber-500/20 bg-amber-50/30 dark:bg-amber-900/10" 
                    : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-orange-500/20"
                )}
              />
              {isPastDue && (
                <div className="absolute right-0 top-0 flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 px-2 py-0.5 rounded-lg">
                  <AlertCircle className="h-3 w-3 mr-1" /> Past Due
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
              placeholder="Provide a detailed breakdown of the task requirements..."
            />
          </div>

          {/* Assign 1 task to multiple employees below description */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                <User className="h-3.5 w-3.5 mr-1.5" /> Assign To Multiple Employees
              </label>
              {assigneeIds.length > 0 && (
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  {assigneeIds.length} {assigneeIds.length === 1 ? 'employee selected' : 'employees selected'}
                </span>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar">
              {availableMembers.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-2">No team members available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableMembers.map(member => {
                    const isSelected = assigneeIds.includes(member.id);
                    return (
                      <label 
                        key={member.id} 
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all text-left",
                          isSelected 
                            ? "bg-orange-500/10 border-orange-500/40 text-orange-700 dark:text-orange-400 font-bold" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 font-semibold"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                            isSelected ? "bg-orange-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}>
                            {member.name ? member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <span className="text-sm truncate">{member.name}</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setAssigneeIds(assigneeIds.filter(id => id !== member.id));
                            } else {
                              setAssigneeIds([...assigneeIds, member.id]);
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 -mx-6 -mb-6 p-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-95 transition-all"
            >
              Launch Task
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
