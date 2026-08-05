import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, FileText, CheckCircle, XCircle, AlertCircle, MessageSquare, Paperclip, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface WorkLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  currentUser: { role: string };
  onStatusChange: (id: string, status: string) => void;
}

export const WorkLogDrawer = ({ isOpen, onClose, log, currentUser, onStatusChange }: WorkLogDrawerProps) => {
  if (!log) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Work Log Details</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Employee Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-indigo-100 dark:border-indigo-500/20">
                  <AvatarFallback className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-lg">
                    {log.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{log.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Software Engineer</p>
                </div>
              </div>

              {/* Status Banner */}
              <div className={cn(
                "rounded-2xl p-4 flex items-center justify-between border",
                log.status === 'Approved' ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" :
                log.status === 'Pending' ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" :
                "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
              )}>
                <div className="flex items-center gap-3">
                  {log.status === 'Approved' ? <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> :
                   log.status === 'Pending' ? <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" /> :
                   <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />}
                  <div>
                    <h4 className={cn(
                      "font-bold",
                      log.status === 'Approved' ? "text-emerald-700 dark:text-emerald-400" :
                      log.status === 'Pending' ? "text-amber-700 dark:text-amber-400" :
                      "text-rose-700 dark:text-rose-400"
                    )}>
                      {log.status === 'Approved' ? 'Log Approved' : log.status === 'Pending' ? 'Pending Approval' : 'Log Rejected'}
                    </h4>
                    <p className={cn(
                      "text-xs font-medium",
                      log.status === 'Approved' ? "text-emerald-600/80 dark:text-emerald-400/80" :
                      log.status === 'Pending' ? "text-amber-600/80 dark:text-amber-400/80" :
                      "text-rose-600/80 dark:text-rose-400/80"
                    )}>
                      {log.status === 'Approved' ? 'This log has been verified.' : log.status === 'Pending' ? 'Awaiting manager review.' : 'This log was rejected.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">{log.date}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Hours</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">{log.hours.toFixed(1)}h</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 col-span-2">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Project</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">{log.project}</p>
                </div>
              </div>

              {/* Task Description */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Task Description
                </h4>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {log.task}
                </div>
              </div>

              {/* Attachments / Comments (Mocked) */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-slate-400" />
                  Attachments & Notes
                </h4>
                {log.note ? (
                   <div className="bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/10 text-sm text-indigo-800 dark:text-indigo-300">
                     {log.note}
                   </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No notes or attachments provided.</p>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            {(currentUser.role === 'manager' || currentUser.role === 'admin') && log.status !== 'Approved' && (
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                <Button 
                  onClick={() => {
                    onStatusChange(log.id, 'Approved');
                    onClose();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve Work Log
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      onStatusChange(log.id, 'Rejected');
                      onClose();
                    }}
                    className="flex-1 rounded-xl h-12 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold dark:border-rose-900/50 dark:hover:bg-rose-900/20"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 rounded-xl h-12 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Request Changes
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
