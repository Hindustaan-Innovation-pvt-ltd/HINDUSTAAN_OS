import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, Download, Trophy, Users, FolderKanban, Activity, TrendingUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WorkLog {
  id: string; name: string; initials: string; date: string; rawDate: string;
  project: string; task: string; hours: number; status: string;
}
interface Props {
  isOpen: boolean; onOpenChange: (v: boolean) => void;
  logs: WorkLog[]; role: string; currentUser: { name: string; email: string };
}

const COLORS = ['#8b5cf6','#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899'];
const TT = { borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)', background:'#0f172a', color:'#e2e8f0', fontSize:'12px' };

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient }: { label:string; value:string; icon:any; gradient:string }) {
  return (
    <div className={`rounded-3xl border border-white/10 dark:border-white/10 border-slate-200 bg-gradient-to-br ${gradient} p-5 sm:p-6 h-[130px] flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
        <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white opacity-80" />
        </div>
      </div>
      <p className="text-4xl font-bold text-white dark:text-white text-slate-900">{value}</p>
    </div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, iconColor, children, height = 300 }: { title:string; icon:any; iconColor:string; children:React.ReactNode; height?:number }) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-5 sm:p-6">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
        <Icon className={`h-4 w-4 ${iconColor}`} />{title}
      </h3>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

export function TotalHoursModal({ isOpen, onOpenChange, logs, role, currentUser }: Props) {
  const [dateRange, setDateRange] = useState('This Month');

  const filtered = useMemo(() =>
    role === 'employee' ? logs.filter(l => l.name === currentUser.name) : logs,
    [logs, role, currentUser.name]
  );

  const totalHours    = filtered.reduce((a, l) => a + l.hours, 0);
  const approvedHours = filtered.filter(l => l.status === 'Approved').reduce((a, l) => a + l.hours, 0);
  const pendingHours  = filtered.filter(l => l.status === 'Pending').reduce((a, l) => a + l.hours, 0);

  // ── project map ──
  const projectsArr = useMemo(() => {
    const m = new Map<string,{hours:number;tasks:number;employees:Map<string,number>}>();
    filtered.forEach(l => {
      const p = m.get(l.project) || {hours:0,tasks:0,employees:new Map()};
      p.hours += l.hours; p.tasks += 1;
      p.employees.set(l.name,(p.employees.get(l.name)||0)+l.hours);
      m.set(l.project,p);
    });
    return Array.from(m.entries());
  },[filtered]);

  // ── employee map ──
  const employees = useMemo(() => {
    const m = new Map<string,{hours:number;pending:number;tasks:number;projects:Set<string>}>();
    filtered.forEach(l => {
      const e = m.get(l.name)||{hours:0,pending:0,tasks:0,projects:new Set<string>()};
      e.hours+=l.hours; if(l.status==='Pending') e.pending+=l.hours;
      e.tasks+=1; e.projects.add(l.project); m.set(l.name,e);
    });
    return Array.from(m.entries()).sort((a,b)=>b[1].hours-a[1].hours);
  },[filtered]);

  // ── chart data ──
  const pieData = projectsArr.map(([name,d])=>({name,value:+d.hours.toFixed(1)}));

  const trendData = useMemo(()=>{
    const m = new Map<string,number>();
    filtered.forEach(l=>{ m.set(l.date,(m.get(l.date)||0)+l.hours); });
    return Array.from(m.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,hours])=>({date:date.substring(0,6),hours:+hours.toFixed(1)}));
  },[filtered]);

  const rankData = employees.slice(0,5).map(([n,d])=>({name:n.split(' ')[0],hours:+d.hours.toFixed(1)}));

  const timelineMap = useMemo(()=>{
    const m = new Map<string,WorkLog[]>();
    filtered.forEach(l=>{ if(!m.has(l.date)) m.set(l.date,[]); m.get(l.date)!.push(l); });
    return Array.from(m.entries()).sort((a,b)=>new Date(b[0]).getTime()-new Date(a[0]).getTime());
  },[filtered]);

  const handleExportCSV = () => {
    const csv = "data:text/csv;charset=utf-8,Date,Employee,Project,Task,Hours,Status\n"
      + filtered.map(l=>`"${l.date}","${l.name}","${l.project}","${l.task}",${l.hours},"${l.status}"`).join('\n');
    const a = document.createElement('a'); a.href=encodeURI(csv); a.download='work_logs.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('CSV Exported');
  };
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text(role==='manager'?'Team Productivity Overview':'My Work Summary',14,15);
      doc.text(`Total: ${totalHours.toFixed(1)}h | Approved: ${approvedHours.toFixed(1)}h`,14,25);
      autoTable(doc,{startY:35,head:[['Date','Employee','Project','Task','Hours','Status']],body:filtered.map(l=>[l.date,l.name,l.project,l.task,`${l.hours}h`,l.status])});
      doc.save('work_logs.pdf'); toast.success('PDF Exported');
    } catch { toast.error('Export failed'); }
  };

  const isManager = role === 'manager';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] sm:w-[95vw] lg:w-[92vw] xl:w-[90vw] max-w-[1600px] h-[92vh] overflow-hidden rounded-[32px] border border-white/10 dark:border-white/10 border-slate-200 bg-white/95 dark:bg-[#060816]/95 backdrop-blur-[28px] p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <style>{`.mscroll::-webkit-scrollbar{width:5px}.mscroll::-webkit-scrollbar-thumb{background:rgba(139,92,246,.35);border-radius:999px}`}</style>

        {/* Sticky Header */}
        <div className="shrink-0 px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-slate-100 dark:border-white/10 bg-white/80 dark:bg-[#060816]/80 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/15 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-violet-500 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {isManager ? 'Team Productivity Overview' : 'My Work Summary'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Generated dynamically from work logs
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px] h-9 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:bg-[#0f172a] dark:border-white/10">
                  {['Today','This Week','This Month','Custom Range'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              {isManager && <>
                <Button onClick={handleExportPDF} size="sm" variant="outline" className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-violet-500/20 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
                </Button>
                <Button onClick={handleExportCSV} size="sm" variant="outline" className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-violet-500/20 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
                </Button>
              </>}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="mscroll flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">

          {/* Stat Cards */}
          <div className={`grid gap-4 ${isManager ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            <StatCard label={isManager?'Team Hours':'Total Logged'} value={`${totalHours.toFixed(1)}h`} icon={Clock} gradient="from-violet-600/80 to-indigo-600/80" />
            <StatCard label="Approved" value={`${approvedHours.toFixed(1)}h`} icon={Activity} gradient="from-emerald-600/80 to-teal-600/80" />
            <StatCard label="Pending" value={`${pendingHours.toFixed(1)}h`} icon={TrendingUp} gradient="from-amber-500/80 to-orange-500/80" />
            {isManager
              ? <StatCard label="Active Staff" value={`${employees.length}`} icon={Users} gradient="from-blue-600/80 to-cyan-600/80" />
              : null}
          </div>

          {/* ── MANAGER VIEW ── */}
          {isManager && (
            <>
              {/* Projects + Right Panel */}
              <div className="grid xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
                    <FolderKanban className="h-4 w-4 text-violet-400" /> Project Analysis
                  </h3>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projectsArr.map(([pName,pData],i)=>(
                      <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 hover:border-violet-400/40 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{pName}</span>
                          <Badge className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-0 font-bold ml-2 shrink-0">{pData.hours.toFixed(1)}h</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{pData.tasks} tasks</p>
                        <div className="mt-2 space-y-1">
                          {Array.from(pData.employees.entries()).slice(0,2).map(([emp,hrs],j)=>(
                            <div key={j} className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{emp.split(' ')[0]}</span><span className="font-medium">{hrs.toFixed(1)}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Contributors + Pie */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-200/40 dark:border-amber-500/20 bg-gradient-to-br from-orange-50 dark:from-orange-500/10 to-violet-50 dark:to-violet-500/10 p-5">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
                      <Trophy className="h-4 w-4 text-amber-400" /> Top Contributors
                    </h3>
                    {employees.slice(0,4).map(([name,data],i)=>(
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{['🥇','🥈','🥉','4️⃣'][i]}</span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{name}</span>
                        </div>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">{data.hours.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                  <ChartCard title="Project Distribution" icon={FolderKanban} iconColor="text-violet-400" height={260}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                          {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Pie>
                        <Tooltip contentStyle={TT}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>

              {/* Bottom Charts */}
              <div className="grid xl:grid-cols-2 gap-6">
                <ChartCard title="Team Hours Trend" icon={Activity} iconColor="text-indigo-400" height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/>
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`${v}h`}/>
                      <Tooltip contentStyle={TT}/>
                      <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} dot={{r:4,fill:'#8b5cf6',strokeWidth:0}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Productivity Ranking" icon={Users} iconColor="text-emerald-400" height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rankData} layout="vertical" margin={{left:10,right:24}}>
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/>
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={65}/>
                      <Tooltip cursor={{fill:'rgba(139,92,246,0.06)'}} contentStyle={TT}/>
                      <Bar dataKey="hours" fill="#10b981" radius={[0,8,8,0]} barSize={20}/>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Employee Productivity Table</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5">
                      <tr>{['Employee','Projects','Tasks','Total Logged','Pending'].map(h=><th key={h} className="px-5 py-3 text-left font-bold">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {employees.map(([name,data],i)=>(
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{name}</td>
                          <td className="px-5 py-3.5 text-slate-500">{data.projects.size}</td>
                          <td className="px-5 py-3.5 text-slate-500">{data.tasks}</td>
                          <td className="px-5 py-3.5 font-bold text-violet-600 dark:text-violet-400">{data.hours.toFixed(1)}h</td>
                          <td className="px-5 py-3.5">{data.pending>0?<Badge className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 font-bold">{data.pending.toFixed(1)}h</Badge>:<span className="text-slate-300">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── EMPLOYEE VIEW ── */}
          {!isManager && (
            <>
              {/* Analytics Grid */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {/* Projects */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                    <FolderKanban className="h-4 w-4 text-violet-400" /> Projects
                  </h3>
                  <div className="space-y-3">
                    {projectsArr.map(([name,d],i)=>{
                      const pct = totalHours>0 ? Math.round((d.hours/totalHours)*100) : 0;
                      return (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-violet-300/40 transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-800 dark:text-white text-sm">{name}</span>
                            <Badge className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-0 font-bold text-[10px]">{d.hours.toFixed(1)}h</Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 mb-2">{d.tasks} tasks</p>
                          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all" style={{width:`${pct}%`}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pie Chart */}
                <ChartCard title="Hours Per Project" icon={FolderKanban} iconColor="text-emerald-400" height={260}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="45%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                        {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={TT}/>
                      <Legend iconType="circle" iconSize={8} formatter={(v)=><span className="text-xs text-slate-500 dark:text-slate-400">{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Bar Chart */}
                <ChartCard title="Daily Logged Hours" icon={Activity} iconColor="text-blue-400" height={260}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{left:0,right:8,top:4,bottom:0}}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false}/>
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${v}h`} width={28}/>
                      <Tooltip cursor={{fill:'rgba(139,92,246,0.06)'}} contentStyle={TT}/>
                      <Bar dataKey="hours" fill="#8b5cf6" radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-indigo-400" /> Task History Timeline
                </h3>
                <div className="space-y-5">
                  {timelineMap.map(([date,items],i)=>(
                    <div key={i} className="relative pl-5 border-l-2 border-violet-400/30 pb-1">
                      <div className="absolute w-2.5 h-2.5 bg-violet-500 rounded-full -left-[7px] top-1"/>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{date}</h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {items.map(item=>(
                          <div key={item.id} className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug truncate">{item.task}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.project}</p>
                            </div>
                            <Badge className="bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-0 font-bold shrink-0">{item.hours}h</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
