import React, { useState, useEffect } from 'react';
import { Calendar, User, MessageSquare, Send, Tag, Clock, CheckCircle2, ChevronDown, PlayCircle, Eye, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- Types ---
export type Role = 'manager' | 'intern';
export type Priority = 'High' | 'Medium' | 'Normal' | 'Low';
export type Status = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface UserProfile {
  id: string;
  role: Role;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project_tag: string;
  assignee_name: string;
  assignee_id: string;
  priority: Priority;
  start_date?: string;
  due_date: string;
  milestone?: string;
  created_at?: string;
  status: Status;
}

export interface Comment {
  id: string;
  author_name: string;
  text: string;
  timestamp: string;
}

interface TaskDetailsModalProps {
  task: Task | null;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask?: (updatedTask: Task) => void;
}

const STATUSES: Status[] = ['To Do', 'In Progress', 'In Review', 'Done'];

import { GLOBAL_TEAM_MEMBERS } from '@/data/mockData';

export default function TaskDetailsModal({ task, currentUser, isOpen, onClose, onUpdateTask }: TaskDetailsModalProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleSaveEditComment = (commentId: string) => {
    if (!editingText.trim()) return;
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: editingText } : c));
    setEditingCommentId(null);
    setEditingText('');
  };

  // Sync internal state when a new task is opened
  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      // Mock comments load
      setComments([
        {
          id: 'c-1',
          author_name: 'System',
          text: 'Task created and assigned.',
          timestamp: '2 days ago'
        }
      ]);
    }
  }, [task]);

  if (!task || !editedTask) return null;

  const isManager = currentUser.role === 'manager';
  const canEditStatus = isManager || (currentUser.role === 'intern' && currentUser.id === task.assignee_id);

  const handleUpdateField = (field: keyof Task, value: any) => {
    if (!isManager && field !== 'status') return; // Extra safety guard
    setEditedTask(prev => prev ? { ...prev, [field]: value } : null);
    if (onUpdateTask) {
      onUpdateTask({ ...editedTask, [field]: value });
    }
  };

  const handleStatusChange = (newStatus: Status) => {
    if (!canEditStatus) return;
    setEditedTask(prev => prev ? { ...prev, status: newStatus } : null);
    if (onUpdateTask) {
      onUpdateTask({ ...editedTask, status: newStatus });
    }
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now().toString(),
      author_name: currentUser.name || 'Current User',
      text: newComment,
      timestamp: 'Just now'
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  // Helpers
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/20';
      case 'Medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/20';
      case 'Normal': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/20';
      case 'Low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-950 p-0 gap-0 border-slate-200 dark:border-slate-700/60 rounded-xl shadow-2xl flex flex-col">
        
        {/* Header Section */}
        <DialogHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0 text-left">
          <DialogTitle className="sr-only">Task Details</DialogTitle>
          <DialogDescription className="sr-only">View and edit task details.</DialogDescription>
          
          <div className="flex flex-col gap-2 pt-1 pr-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              {isManager ? (
                <input 
                  type="text" 
                  value={editedTask.project_tag}
                  onChange={(e) => handleUpdateField('project_tag', e.target.value)}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-orange-500 focus:outline-none transition-colors pb-0.5"
                />
              ) : (
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{editedTask.project_tag}</span>
              )}
            </div>
            
            {isManager ? (
              <input 
                type="text" 
                value={editedTask.title}
                onChange={(e) => handleUpdateField('title', e.target.value)}
                className="text-2xl font-extrabold text-slate-900 dark:text-white bg-transparent outline-none focus:ring-2 focus:ring-orange-500/20 rounded-lg px-2 -ml-2 py-1 transition-all"
                placeholder="Task Title..."
              />
            ) : (
              <h2 className="text-page-title text-slate-900 dark:text-white py-1">{editedTask.title}</h2>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          

          {/* Metadata Grid Layer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
            
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5" /> Priority Level
              </label>
              {isManager ? (
                <div className="relative">
                  <select 
                    value={editedTask.priority}
                    onChange={(e) => handleUpdateField('priority', e.target.value as Priority)}
                    className={cn(
                      "appearance-none w-full pl-3 pr-8 py-2 rounded-lg text-sm font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all dark:[color-scheme:dark]",
                      getPriorityStyles(editedTask.priority)
                    )}
                  >
                    <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="High">High</option>
                    <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Medium">Medium</option>
                    <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Normal">Normal</option>
                    <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Low">Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-700 dark:text-slate-400" />
                </div>
              ) : (
                <div className="mt-1">
                  <span className={cn("px-3 py-1 rounded-md text-sm font-semibold border inline-block", getPriorityStyles(editedTask.priority))}>
                    {editedTask.priority}
                  </span>
                </div>
              )}
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                <User className="h-3.5 w-3.5 mr-1.5" /> Assigned Owner
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20 text-xs font-bold text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                  {getInitials(editedTask.assignee_name)}
                </div>
                {isManager ? (
                  <select
                    value={editedTask.assignee_id}
                    onChange={(e) => {
                      const selected = GLOBAL_TEAM_MEMBERS.find(u => u.id === e.target.value);
                      if (selected) {
                        const updated = { ...editedTask, assignee_id: selected.id, assignee_name: selected.name } as Task;
                        setEditedTask(updated);
                        if (onUpdateTask) onUpdateTask(updated);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer dark:[color-scheme:dark]"
                  >
                    {GLOBAL_TEAM_MEMBERS.map(member => (
                      <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{editedTask.assignee_name}</span>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Target Deadline
              </label>
              {isManager ? (
                <input 
                  type="date"
                  value={editedTask.due_date ? new Date(editedTask.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateField('due_date', e.target.value)} // Simplifying date format mapping for mockup
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:[color-scheme:dark]"
                />
              ) : (
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 inline-block">
                  {editedTask.due_date}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                <Activity className="h-3.5 w-3.5 mr-1.5" /> Current Status
              </label>
              {isManager ? (
                <div className="relative">
                  <select 
                    value={editedTask.status}
                    onChange={(e) => handleStatusChange(e.target.value as Status)}
                    className="appearance-none w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer dark:[color-scheme:dark]"
                  >
                    {STATUSES.map(s => (
                      <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-700 dark:text-slate-400" />
                </div>
              ) : (
                <div className="mt-1">
                  <span className="px-3 py-1 rounded-md text-sm font-semibold border inline-block bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                    {editedTask.status}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Detailed Context</label>
            {isManager ? (
              <textarea 
                value={editedTask.description}
                onChange={(e) => handleUpdateField('description', e.target.value)}
                className="w-full min-h-[120px] rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none"
                placeholder="Add exhaustive task requirements..."
              />
            ) : (
              <div className="w-full min-h-[100px] rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {editedTask.description || 'No description provided.'}
              </div>
            )}
          </div>

          {/* Status Automated Transitions for Interns */}
          {!isManager && (currentUser.id === editedTask.assignee_id || currentUser.name === editedTask.assignee_name || (currentUser.name.toLowerCase().includes('tanvy') && editedTask.assignee_name.toLowerCase().includes('tanvy'))) && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 mt-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Action</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">Update task status automatically</span>
              </div>
              
              {editedTask.status === 'To Do' && (
                <Button 
                  onClick={() => handleStatusChange('In Progress')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 flex items-center cursor-pointer"
                >
                  <PlayCircle className="h-4 w-4 mr-2" /> Start Working
                </Button>
              )}
              {editedTask.status === 'In Progress' && (
                <Button 
                  onClick={() => handleStatusChange('In Review')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 flex items-center cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2" /> Submit for Review
                </Button>
              )}
              {editedTask.status === 'In Review' && (
                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-500/10 font-bold px-3 py-1.5 rounded-lg flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5 animate-pulse" /> Pending Approval
                </Badge>
              )}
              {editedTask.status === 'Done' && (
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-500/10 font-bold px-3 py-1.5 rounded-lg flex items-center">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Task Done
                </Badge>
              )}
            </div>
          )}

          {/* Comments Feed Expansion */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-6">
              <MessageSquare className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500" />
              Activity & Discussions
            </h3>

            {/* Thread Timeline */}
            <div className="space-y-5 mb-6 pl-2 border-l-2 border-slate-100 dark:border-slate-800">
              {comments.map(comment => (
                <div key={comment.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900"></div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{comment.author_name}</span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{comment.timestamp}</span>
                    </div>
                    {comment.author_name === currentUser.name && editingCommentId !== comment.id && (
                      <button 
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingText(comment.text);
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all resize-none font-medium"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingText('');
                          }}
                          className="h-8 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleSaveEditComment(comment.id)}
                          disabled={!editingText.trim()}
                          className="h-8 rounded-lg text-xs font-bold"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-r-xl rounded-bl-xl p-3 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                      {comment.text}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <form onSubmit={submitComment} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {getInitials(currentUser.name || 'User')}
              </div>
              <div className="flex-1 flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all p-1 overflow-hidden shadow-sm">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-transparent border-none px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  placeholder="Write a comment or log an update..."
                />
                <Button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="rounded-lg h-9 w-9 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
