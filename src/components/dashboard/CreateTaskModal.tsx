import React, { useState } from 'react';
import { X, Calendar, User, Tag, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, Priority } from './TaskDetailsModal';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
}

import { GLOBAL_TEAM_MEMBERS } from '@/data/mockData';

export default function CreateTaskModal({ isOpen, onClose, onCreateTask }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [priority, setPriority] = useState<Priority>('Normal');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Assignee name lookup
    const assignee = GLOBAL_TEAM_MEMBERS.find(u => u.id === assigneeId);
    
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title,
      description,
      project_tag: projectTag || 'General',
      assignee_name: assignee ? assignee.name : 'Unassigned',
      assignee_id: assigneeId || 'unassigned',
      priority,
      due_date: dueDate || new Date().toISOString().split('T')[0],
      status: 'To Do'
    };

    onCreateTask(newTask);
    
    // Reset form
    setTitle('');
    setDescription('');
    setProjectTag('');
    setPriority('Normal');
    setAssigneeId('');
    setDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create New Task</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Task Title */}
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
            {/* Project Tag */}
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
            
            {/* Priority */}
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5" /> Priority Level
              </label>
              <select 
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
              >
                <option className="bg-white dark:bg-slate-800" value="High">High</option>
                <option className="bg-white dark:bg-slate-800" value="Medium">Medium</option>
                <option className="bg-white dark:bg-slate-800" value="Normal">Normal</option>
                <option className="bg-white dark:bg-slate-800" value="Low">Low</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <User className="h-3.5 w-3.5 mr-1.5" /> Assign To <span className="text-rose-500">*</span>
              </label>
              <select 
                required
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
              >
                <option className="bg-white dark:bg-slate-800" value="" disabled>Select Assignee...</option>
                {GLOBAL_TEAM_MEMBERS.map(member => (
                  <option className="bg-white dark:bg-slate-800" key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Due Date <span className="text-rose-500">*</span>
              </label>
              <input 
                required
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Detailed Context</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full min-h-[120px] rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none"
              placeholder="Add exhaustive task requirements..."
            />
          </div>

          {/* Footer Actions */}
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
