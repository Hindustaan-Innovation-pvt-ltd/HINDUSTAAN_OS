import React, { useState } from 'react';
import { Trophy, Target, Flag, Clock, CheckCircle2, Rocket } from 'lucide-react';
import { GLOBAL_TEAM_MEMBERS } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

import { useProjects } from '@/context/ProjectContext';

// --- Mock Data ---
const contributionData = {
  'Today': { score: 87, tasks: 32, hours: 28, miles: 18 },
  'This Week': { score: 72, tasks: 24, hours: 20, miles: 12 },
  'This Month': { score: 94, tasks: 38, hours: 32, miles: 22 },
};

const TEAM = GLOBAL_TEAM_MEMBERS.map(m => m.name);

function MetricCard({ name, data, period, onPeriodChange }: { name: string, data: any, period: string, onPeriodChange: (p: string) => void }) {
  const { score, tasks, hours, miles } = data[period as keyof typeof data];
  
  return (
    <Card className="w-full relative overflow-hidden shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <CardTitle className="text-lg flex items-center">
            <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
            Performance Metric
          </CardTitle>
          <CardDescription className="mt-1 font-semibold">{name}</CardDescription>
        </div>
        <Tabs value={period} onValueChange={onPeriodChange} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 sm:w-[300px]">
            <TabsTrigger value="Today">Today</TabsTrigger>
            <TabsTrigger value="This Week">This Week</TabsTrigger>
            <TabsTrigger value="This Month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative flex items-center justify-center w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f97316" strokeWidth="12" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * score) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{score}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Score</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                <span className="text-emerald-600 dark:text-emerald-400">Tasks Completed (40%)</span>
                <span className="text-emerald-700 dark:text-emerald-300">{tasks}/40</span>
              </div>
              <Progress value={(tasks / 40) * 100} className="h-2 [&>div]:bg-emerald-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                <span className="text-orange-600 dark:text-orange-400">Hours Logged (35%)</span>
                <span className="text-orange-700 dark:text-orange-300">{hours}/35</span>
              </div>
              <Progress value={(hours / 35) * 100} className="h-2 [&>div]:bg-orange-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                <span className="text-amber-600 dark:text-amber-400">Milestones Hit (25%)</span>
                <span className="text-amber-700 dark:text-amber-300">{miles}/25</span>
              </div>
              <Progress value={(miles / 25) * 100} className="h-2 [&>div]:bg-amber-500" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Milestones({ session }: { session?: any }) {
  const { projects } = useProjects();
  const [globalPeriod, setGlobalPeriod] = useState('Today');
  const role = session?.user?.user_metadata?.role || 'intern';

  const derivedProjects = projects.map((p: any) => {
    const totalTasks = p.tasks?.length || 0;
    const completedTasks = p.tasks?.filter((t: any) => t.status === 'Done').length || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    let status = 'On Track';
    let color = 'bg-emerald-500';
    if (progress === 100) { status = 'Completed'; color = 'bg-blue-500'; }
    else if (progress < 30 && totalTasks > 0) { status = 'At Risk'; color = 'bg-rose-500'; }
    else if (progress >= 80) { status = 'Almost Done'; color = 'bg-emerald-500'; }
    else if (totalTasks === 0) { status = 'Pending'; color = 'bg-slate-400'; }
    return { id: p.id, name: p.name, progress, status, color };
  });

  const derivedMilestones = projects.flatMap((p: any) => {
    if (!p.milestones || p.milestones.length === 0) {
      // Generate generic milestones if none exist
      return [
        { id: `m1-${p.id}`, title: `${p.name} - Alpha`, status: p.status === 'Done' ? 'completed' : 'in-progress' }
      ];
    }
    return p.milestones;
  }).map((m: any, i: number) => {
    const isCompleted = m.status === 'completed';
    const progress = isCompleted ? 100 : (m.status === 'in-progress' ? 50 : 0);
    const colors = ['bg-slate-800 dark:bg-slate-400', 'bg-orange-500', 'bg-slate-300 dark:bg-slate-700', 'bg-indigo-500'];
    return { id: m.id || `m-${i}`, name: m.title, progress, color: colors[i % colors.length] };
  }).slice(0, 5); // Show top 5 milestones
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Milestones & Contribution</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review your performance scores and team contribution metrics.</p>
      </div>

      {/* Content Rendering based on Role */}
      {role === 'manager' ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Project Progress */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Rocket className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                Project Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {derivedProjects.length > 0 ? derivedProjects.map(project => (
                  <div key={project.id}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-200">{project.name}</span>
                      <span className={cn("text-slate-500 dark:text-slate-400")}>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className={cn("h-3", `[&>div]:${project.color}`)} />
                    <div className="mt-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 text-right">
                      {project.status}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 italic">No projects found.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Milestone Progress */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                Milestone Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {derivedMilestones.length > 0 ? derivedMilestones.map(milestone => (
                  <div key={milestone.id}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-200 flex items-center">
                        <Flag className="h-3.5 w-3.5 mr-1.5 text-slate-400 dark:text-slate-500" />
                        {milestone.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{milestone.progress}%</span>
                    </div>
                    <Progress value={milestone.progress} className={cn("h-3", `[&>div]:${milestone.color}`)} />
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 italic">No milestones found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Manager View: All Employee Contributions */}
        <div className="mt-12">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Team Contributions</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {TEAM.map(member => (
              <MetricCard 
                key={member}
                name={member}
                data={contributionData}
                period={globalPeriod}
                onPeriodChange={setGlobalPeriod}
              />
            ))}
          </div>
        </div>
        </>
      ) : (
        <MetricCard 
          name="My Contributions"
          data={contributionData}
          period={globalPeriod}
          onPeriodChange={setGlobalPeriod}
        />
      )}
    </div>
  );
}
