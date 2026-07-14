import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Clock, Calendar, Download, Trophy, Users, FolderKanban, Activity, TrendingUp, CheckCircle2, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WorkLog { id:string; name:string; initials:string; date:string; rawDate:string; project:string; task:string; hours:number; status:string; }
interface Props { isOpen:boolean; onOpenChange:(v:boolean)=>void; logs:WorkLog[]; role:string; currentUser:{name:string;email:string}; }

const C = ['#8b5cf6','#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899'];
const TT = { borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)', background:'#0f172a', color:'#e2e8f0', fontSize:'13px', padding:'10px 14px' };

function StatCard({ label, value, sub, icon:Icon, from, to, border }:{ label:string; value:string; sub?:string; icon:any; from:string; to:string; border:string }) {
  return (
    <div className={`rounded-[28px] border ${border} bg-gradient-to-br ${from} ${to} p-7 flex flex-col justify-between min-h-[190px]`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white/60">{label}</p>
        <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center">
          <Icon className="h-5 w-5 text-slate-900 dark:text-white/80" />
        </div>
      </div>
      <div>
        <p className="text-6xl font-bold text-slate-900 dark:text-white leading-none mt-4">{value}</p>
        {sub && <p className="text-sm text-slate-900 dark:text-white/50 mt-2">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, icon:Icon, color, children }:{ title:string; icon:any; color:string; children:React.ReactNode }) {
  return (
    <div>
      <h3 className={`text-xs font-bold uppercase tracking-[0.15em] ${color} flex items-center gap-2 mb-5`}>
        <Icon className="h-4 w-4" />{title}
      </h3>
      {children}
    </div>
  );
}

export function TotalHoursModal({ isOpen, onOpenChange, logs, role, currentUser }: Props) {
  const [dateRange, setDateRange] = useState('This Month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const isManager = role === 'manager';

  const filtered = useMemo(() => {
    let result = isManager ? logs : logs.filter(l => l.name === currentUser.name);
    
    const now = new Date();
    result = result.filter(l => {
      if (dateRange === 'Custom Range') {
        if (!customRange?.from) return true;
        if (!l.rawDate) return true;
        const logDate = new Date(l.rawDate);
        if (!customRange.to) {
          return logDate.toDateString() === customRange.from.toDateString();
        }
        return logDate >= customRange.from && logDate <= customRange.to;
      }
      
      if (!l.rawDate) return true;
      
      const logDate = new Date(l.rawDate);
      
      if (dateRange === 'Today') {
        return logDate.toDateString() === now.toDateString();
      }
      
      if (dateRange === 'Yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return logDate.toDateString() === yesterday.toDateString();
      }
      
      if (dateRange === 'Last 7 Days' || dateRange === 'This Week') {
        const diffTime = now.getTime() - logDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      
      if (dateRange === 'This Month') {
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      }
      
      return true;
    });
    
    return result;
  }, [logs, isManager, currentUser.name, dateRange]);

  const total    = filtered.reduce((a,l)=>a+l.hours,0);
  const approved = filtered.filter(l=>l.status==='Approved').reduce((a,l)=>a+l.hours,0);
  const pending  = filtered.filter(l=>l.status==='Pending').reduce((a,l)=>a+l.hours,0);

  const projectsArr = useMemo(()=>{
    const m = new Map<string,{hours:number;tasks:number;employees:Map<string,number>}>();
    filtered.forEach(l=>{ const p=m.get(l.project)||{hours:0,tasks:0,employees:new Map()}; p.hours+=l.hours; p.tasks+=1; p.employees.set(l.name,(p.employees.get(l.name)||0)+l.hours); m.set(l.project,p); });
    return Array.from(m.entries()).sort((a,b)=>b[1].hours-a[1].hours);
  },[filtered]);

  const employees = useMemo(()=>{
    const m = new Map<string,{hours:number;pending:number;tasks:number;projects:Set<string>}>();
    filtered.forEach(l=>{ const e=m.get(l.name)||{hours:0,pending:0,tasks:0,projects:new Set<string>()}; e.hours+=l.hours; if(l.status==='Pending') e.pending+=l.hours; e.tasks+=1; e.projects.add(l.project); m.set(l.name,e); });
    return Array.from(m.entries()).sort((a,b)=>b[1].hours-a[1].hours);
  },[filtered]);

  const pieData   = projectsArr.map(([n,d])=>({name:n,value:+d.hours.toFixed(1)}));
  const rankData  = employees.slice(0,5).map(([n,d])=>({name:n.split(' ')[0],hours:+d.hours.toFixed(1)}));
  const maxHours  = employees[0]?.[1]?.hours || 1;

  const trendData = useMemo(()=>{
    const m=new Map<string,number>();
    filtered.forEach(l=>{ m.set(l.date,(m.get(l.date)||0)+l.hours); });
    return Array.from(m.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,hours])=>({date:date.substring(0,6),hours:+hours.toFixed(1)}));
  },[filtered]);

  const timelineMap = useMemo(()=>{
    const m=new Map<string,WorkLog[]>();
    filtered.forEach(l=>{ if(!m.has(l.date)) m.set(l.date,[]); m.get(l.date)!.push(l); });
    return Array.from(m.entries()).sort((a,b)=>new Date(b[0]).getTime()-new Date(a[0]).getTime());
  },[filtered]);

  const empPie  = projectsArr.map(([n,d])=>({name:n,value:+d.hours.toFixed(1)}));
  const empBar  = trendData;

  const handleCSV = ()=>{ const csv="data:text/csv;charset=utf-8,Date,Employee,Project,Task,Hours,Status\n"+filtered.map(l=>`"${l.date}","${l.name}","${l.project}","${l.task}",${l.hours},"${l.status}"`).join('\n'); const a=document.createElement('a'); a.href=encodeURI(csv); a.download='work_logs.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); toast.success('CSV Exported'); };
  const handlePDF = ()=>{ try{ const doc=new jsPDF(); doc.text(isManager?"Employee's Productivity Overview":'My Work Summary',14,15); autoTable(doc,{startY:25,head:[['Date','Employee','Project','Task','Hours','Status']],body:filtered.map(l=>[l.date,l.name,l.project,l.task,`${l.hours}h`,l.status])}); doc.save('work_logs.pdf'); toast.success('PDF Exported'); }catch{ toast.error('Failed'); } };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] sm:w-[95vw] xl:w-[92vw] max-w-[1800px] sm:max-w-none h-[92vh] overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-white/96 dark:bg-[#070a14]/96 backdrop-blur-[32px] p-0 shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-300">
        <style>{`.ms::-webkit-scrollbar{width:5px}.ms::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.4);border-radius:99px}`}</style>

        {/* ── STICKY HEADER ── */}
        <div className="shrink-0 px-10 py-8 border-b border-slate-200 dark:border-white/[0.07] bg-white/90 dark:bg-[#070a14]/90 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0 ring-1 ring-violet-500/30">
                <Clock className="h-7 w-7 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{isManager ? "Employee's Productivity Overview" : 'My Work Summary'}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5"/>Generated dynamically from work logs</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px] h-10 rounded-2xl border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold"><SelectValue/></SelectTrigger>
                <SelectContent className="rounded-2xl bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                  {['Today','Yesterday','Last 7 Days','This Month','Custom Range'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              {dateRange === 'Custom Range' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 rounded-2xl bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:bg-white/10 border transition-all">
                      <Calendar className="mr-2 h-4 w-4" />
                      {customRange?.from ? (
                        customRange.to ? (
                          <>
                            {format(customRange.from, "LLL dd, y")} -{" "}
                            {format(customRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(customRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-2xl" align="start">
                    <CalendarComponent
                      mode="range"
                      defaultMonth={customRange?.from}
                      selected={customRange}
                      onSelect={setCustomRange}
                      numberOfMonths={2}
                      className="text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] rounded-2xl p-3"
                    />
                  </PopoverContent>
                </Popover>
              )}
              {isManager && <>
                <Button onClick={handlePDF} size="sm" className="h-10 px-5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-violet-500/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white text-sm font-semibold transition-all"><Download className="h-4 w-4 mr-2"/>PDF</Button>
                <Button onClick={handleCSV} size="sm" className="h-10 px-5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-violet-500/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white text-sm font-semibold transition-all"><Download className="h-4 w-4 mr-2"/>CSV</Button>
              </>}
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="ms flex-1 overflow-y-auto px-10 py-10 space-y-12">

          {/* ── MANAGER VIEW ── */}
          {isManager && (
            <>
              {/* ROW 1: Projects + Contributors */}
              <div className="grid xl:grid-cols-[1fr_420px] gap-8">
                {/* Project Analysis */}
                <Section title="Project Analysis" icon={FolderKanban} color="text-violet-400">
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-7">
                    {projectsArr.map(([pName,pData],i)=>(
                      <div key={i} className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-violet-500/30 transition-all p-6 min-h-[200px] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-bold text-slate-900 dark:text-white text-base leading-snug">{pName}</span>
                            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 font-bold ml-2 shrink-0 text-sm px-2.5 py-1">{pData.hours.toFixed(1)}h</Badge>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{pData.tasks} tasks logged</p>
                          <div className="space-y-2">
                            {Array.from(pData.employees.entries()).slice(0,3).map(([emp,hrs],j)=>(
                              <div key={j} className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-slate-500"/>{emp.split(' ')[0]}</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{hrs.toFixed(1)}h</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Top Contributors */}
                <Section title="Top Contributors" icon={Trophy} color="text-amber-400">
                  <div className="rounded-[28px] border border-amber-500/20 bg-gradient-to-br from-orange-500/10 to-violet-500/10 p-7 h-full">
                    <div className="space-y-2">
                      {employees.slice(0,4).map(([name,data],i)=>{
                        const pct = Math.round((data.hours/maxHours)*100);
                        return (
                          <div key={i} className="py-4 border-b border-slate-200 dark:border-white/[0.06] last:border-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{['🥇','🥈','🥉','4️⃣'][i]}</span>
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/40 to-indigo-500/40 flex items-center justify-center text-slate-900 dark:text-white font-bold text-sm">{name.split(' ').map((n:string)=>n[0]).join('')}</div>
                                <span className="font-semibold text-slate-900 dark:text-white text-base">{name}</span>
                              </div>
                              <span className="font-black text-amber-400 text-lg">{data.hours.toFixed(1)}h</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden ml-12">
                              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{width:`${pct}%`}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Section>
              </div>

              {/* ROW 2: Three charts */}
              <div className="grid xl:grid-cols-3 gap-8">
                {/* Hours Trend */}
                <div className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-8 min-h-[420px]">
                  <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-400 flex items-center gap-2 mb-6"><Activity className="h-4 w-4"/>Team Hours Trend</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v=>`${v}h`} width={36}/>
                        <Tooltip contentStyle={TT}/>
                        <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} dot={{r:5,fill:'#8b5cf6',strokeWidth:0}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Project Distribution Pie */}
                <div className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-8 min-h-[420px]">
                  <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-violet-400 flex items-center gap-2 mb-6"><FolderKanban className="h-4 w-4"/>Project Distribution</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="45%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                          {pieData.map((_,i)=><Cell key={i} fill={C[i%C.length]}/>)}
                        </Pie>
                        <Tooltip contentStyle={TT}/>
                        <Legend iconType="circle" iconSize={10} formatter={(v)=><span className="text-xs text-slate-500 dark:text-slate-400">{v}</span>}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Productivity Ranking */}
                <div className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-8 min-h-[420px]">
                  <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400 flex items-center gap-2 mb-6"><Users className="h-4 w-4"/>Productivity Ranking</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rankData} layout="vertical" margin={{left:8,right:24,top:4,bottom:4}}>
                        <XAxis type="number" stroke="#475569" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis type="category" dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} width={72}/>
                        <Tooltip cursor={{fill:'rgba(139,92,246,0.07)'}} contentStyle={TT}/>
                        <Bar dataKey="hours" fill="#10b981" radius={[0,8,8,0]} barSize={24}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ROW 3: Table */}
              <div className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200 dark:border-white/[0.07]">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Employee Productivity Table</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-200 dark:border-white/[0.05]">
                      <tr>{['Employee','Projects','Tasks','Total Logged','Pending'].map(h=><th key={h} className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {employees.map(([name,data],i)=>(
                        <tr key={i} className={`hover:bg-slate-50 dark:bg-white/[0.03] transition-colors border-b border-slate-100 dark:border-white/[0.04] last:border-0 ${i%2===0?'bg-slate-50 dark:bg-white/[0.01]':''}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-slate-900 dark:text-white font-bold text-sm shrink-0">{name.split(' ').map((n:string)=>n[0]).join('')}</div>
                              <span className="text-lg font-bold text-slate-900 dark:text-white">{name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-base text-slate-500 dark:text-slate-400">{data.projects.size}</td>
                          <td className="px-8 py-6 text-base text-slate-500 dark:text-slate-400">{data.tasks}</td>
                          <td className="px-8 py-6 text-lg font-bold text-violet-400">{data.hours.toFixed(1)}h</td>
                          <td className="px-8 py-6">{data.pending>0?<Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 font-bold text-sm px-3 py-1">{data.pending.toFixed(1)}h</Badge>:<span className="text-slate-600 text-lg">—</span>}</td>
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
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-7">
                {/* Projects */}
                <div className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-7">
                  <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-violet-400 flex items-center gap-2 mb-5"><FolderKanban className="h-4 w-4"/>Projects</h4>
                  <div className="space-y-4">
                    {projectsArr.map(([name,d],i)=>{
                      const pct = total>0?Math.round((d.hours/total)*100):0;
                      return (
                        <div key={i} className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:border-violet-500/30 transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                            <Badge className="bg-violet-500/20 text-violet-300 border-0 font-bold">{d.hours.toFixed(1)}h</Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{d.tasks} tasks</p>
                          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{width:`${pct}%`}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pie */}
                <div className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-7">
                  <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400 flex items-center gap-2 mb-5"><FolderKanban className="h-4 w-4"/>Hours Per Project</h4>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={empPie} cx="50%" cy="44%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                          {empPie.map((_,i)=><Cell key={i} fill={C[i%C.length]}/>)}
                        </Pie>
                        <Tooltip contentStyle={TT}/>
                        <Legend iconType="circle" iconSize={8} formatter={(v)=><span className="text-xs text-slate-500 dark:text-slate-400">{v}</span>}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar */}
                <div className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-7">
                  <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-blue-400 flex items-center gap-2 mb-5"><Activity className="h-4 w-4"/>Daily Logged Hours</h4>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={empBar} margin={{left:0,right:8,top:4,bottom:0}}>
                        <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`${v}h`} width={30}/>
                        <Tooltip cursor={{fill:'rgba(139,92,246,0.07)'}} contentStyle={TT}/>
                        <Bar dataKey="hours" fill="#8b5cf6" radius={[6,6,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-[28px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-8">
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-400 flex items-center gap-2 mb-6"><Calendar className="h-4 w-4"/>Task History Timeline</h4>
                <div className="space-y-6">
                  {timelineMap.map(([date,items],i)=>(
                    <div key={i} className="relative pl-6 border-l-2 border-violet-500/30 pb-2">
                      <div className="absolute w-3 h-3 bg-violet-500 rounded-full -left-[7px] top-1"/>
                      <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">{date}</h5>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map(item=>(
                          <div key={item.id} className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03] px-5 py-4 flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug truncate">{item.task}</p>
                              <p className="text-xs text-slate-500 mt-1">{item.project}</p>
                            </div>
                            <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/20 font-bold shrink-0 text-xs">{item.hours}h</Badge>
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
