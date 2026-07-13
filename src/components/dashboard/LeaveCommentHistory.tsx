import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Trash2, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface LeaveComment {
  id: string;
  leaveId: number;
  managerId: string;
  managerName: string;
  avatar?: string;
  comment: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LeaveCommentHistoryProps {
  leaveId: number;
  comments: LeaveComment[];
  isManager: boolean;
  onEditComment?: (commentId: string, newText: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function LeaveCommentHistory({ 
  leaveId, 
  comments, 
  isManager, 
  onEditComment, 
  onDeleteComment 
}: LeaveCommentHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const leaveComments = comments.filter(c => c.leaveId === leaveId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (leaveComments.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center">
        <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> 
        {isManager ? "Manager Comments History" : "Manager Feedback"}
      </h4>
      
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[1.1rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
        {leaveComments.map((comment) => (
          <div key={comment.id} className="relative flex items-start gap-4 z-10 group">
            <Avatar className="h-10 w-10 ring-4 ring-white dark:ring-slate-900 shadow-sm shrink-0">
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-bold">
                {comment.managerName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{comment.managerName}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                    {new Date(comment.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  {comment.edited && (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">(Edited)</span>
                  )}
                </div>
                
                {isManager && onEditComment && onDeleteComment && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingId(comment.id); setEditText(comment.comment); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteComment?.(comment.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              {editingId === comment.id ? (
                <div className="space-y-3 mt-2">
                  <Textarea 
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[80px] text-sm bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-900/50 focus:ring-blue-500/30"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-7 text-xs font-bold">Cancel</Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        onEditComment?.(comment.id, editText);
                        setEditingId(null);
                      }}
                      className="h-7 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Check className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                  "{comment.comment}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { MessageSquare } from 'lucide-react';
