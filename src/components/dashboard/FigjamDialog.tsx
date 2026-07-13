import React, { useState } from 'react';
import { 
  X, 
  PenTool,
  Share2,
  Users,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function FigjamDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 flex flex-col rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Figjam Header */}
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between shrink-0 m-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#A259FF] text-white">
              <PenTool className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white leading-none">
                Sprint 3 Brainstorming
              </DialogTitle>
              <p className="text-xs font-semibold text-slate-500 mt-1">Edited 2 mins ago by Amanda</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Active Users */}
            <div className="flex -space-x-2 mr-2">
              <img className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=32&h=32" alt="User" />
              <img className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900" src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=32&h=32" alt="User" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                +3
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 shadow-sm font-semibold">
              <Share2 className="h-4 w-4 mr-2 text-slate-500" /> Share
            </Button>
            <Button size="sm" className="h-9 px-4 rounded-xl bg-[#0ACF83] hover:bg-[#09b573] text-white font-bold shadow-sm">
              Present
            </Button>
          </div>
        </DialogHeader>

        {/* Mock Canvas Area */}
        <div className="flex-1 relative bg-[#F5F6F8] dark:bg-[#0F172A] overflow-hidden" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', 
               backgroundSize: '24px 24px' 
             }}>
          
          {/* Centered Mock Content */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="flex flex-col items-center">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-64 rotate-[-3deg] border-t-8 border-[#FF7262] transform transition-transform hover:scale-105 cursor-pointer">
                <p className="font-bold text-slate-900 dark:text-white text-lg">Revamp Auth Flow</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">Need to support SSO via Google and Github by Friday.</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs font-bold text-slate-500">Amanda</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-64 rotate-[4deg] mt-8 ml-32 border-t-8 border-[#1ABCFE] transform transition-transform hover:scale-105 cursor-pointer">
                <p className="font-bold text-slate-900 dark:text-white text-lg">Update DB Schema</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">Add relation between organizations and active subscriptions.</p>
              </div>
            </div>
          </div>

          {/* Floating Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800">
            <TooltipProvider>
              {['Cursor', 'Hand', 'Marker', 'Sticky Note', 'Text', 'Shape'].map((tool, i) => (
                <Tooltip key={tool}>
                  <TooltipTrigger asChild>
                    <button className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${i === 3 ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      <div className="h-5 w-5 rounded bg-current opacity-70" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="font-bold text-xs">{tool}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
