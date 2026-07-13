import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, LayoutTemplate, Link as LinkIcon, Unlink, FileText, Send } from 'lucide-react';
import { WhatsAppBroadcastDialog } from '../WhatsAppBroadcastDialog';
import { FigjamDialog } from '../FigjamDialog';

export function ConnectedApps() {
  const [waConnected, setWaConnected] = useState(true);
  const [fjConnected, setFjConnected] = useState(true);
  const [isWaOpen, setIsWaOpen] = useState(false);
  const [isFjOpen, setIsFjOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Connected Apps</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Manage your third-party integrations and tools.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* WhatsApp Integration Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/10 dark:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366]">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">WhatsApp Business</CardTitle>
                <CardDescription className="text-xs font-semibold mt-0.5">Team communication & broadcasts.</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={waConnected ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}>
              {waConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardHeader>
          
          <CardContent className="flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Connection Status</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage API webhook</span>
                </div>
                <Switch checked={waConnected} onCheckedChange={setWaConnected} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-semibold text-slate-500">Recent Broadcasts</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">124</span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-semibold text-slate-500">Delivery Status</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">99.8%</span>
                </div>
              </div>
              
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-500 block mb-2">Supported Files</span>
                <div className="flex flex-wrap gap-2">
                  {['PDF', 'DOCX', 'Images', 'Videos', 'Excel', 'PowerPoint', 'ZIP'].map(file => (
                    <Badge key={file} variant="secondary" className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {file}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
            <Button 
              variant="default" 
              className="flex-1 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold"
              disabled={!waConnected}
              onClick={() => setIsWaOpen(true)}
            >
              <Send className="w-4 h-4 mr-2" />
              New Broadcast
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 font-bold" onClick={() => setWaConnected(!waConnected)}>
              {waConnected ? <Unlink className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            </Button>
          </CardFooter>
        </Card>

        {/* FigJam Integration Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A259FF]/10 dark:bg-[#A259FF]/20 text-[#A259FF]">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">FigJam Workspace</CardTitle>
                <CardDescription className="text-xs font-semibold mt-0.5">Collaborative whiteboard & diagrams.</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={fjConnected ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}>
              {fjConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardHeader>
          
          <CardContent className="flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Connection Status</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Figma API token access</span>
                </div>
                <Switch checked={fjConnected} onCheckedChange={setFjConnected} />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-semibold text-slate-500">Current Workspace</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#A259FF]" />
                    Hindustaan OS Design Team
                  </span>
                </div>
              </div>
              
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-500 block mb-2">Recent Boards</span>
                <div className="flex flex-col gap-2">
                  {['Sprint Retrospective', 'Architecture Planning', 'User Flow Mapping'].map(board => (
                    <div key={board} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {board}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Just now</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
            <Button 
              variant="default" 
              className="flex-1 rounded-xl bg-[#A259FF] hover:bg-[#8a3fe3] text-white font-bold"
              disabled={!fjConnected}
              onClick={() => setIsFjOpen(true)}
            >
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Open FigJam
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 font-bold" onClick={() => setFjConnected(!fjConnected)}>
              {fjConnected ? <Unlink className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            </Button>
          </CardFooter>
        </Card>

      </div>

      {/* Dialogs */}
      <WhatsAppBroadcastDialog open={isWaOpen} onOpenChange={setIsWaOpen} />
      <FigjamDialog open={isFjOpen} onOpenChange={setIsFjOpen} />

    </div>
  );
}
