import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, Download, Trophy, Users, FolderKanban, CheckSquare, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Assuming the log structure from mockWorkLogs
interface WorkLog {
  id: string;
  name: string;
  initials: string;
  date: string;
  rawDate: string;
  project: string;
  task: string;
  hours: number;
  status: string;
}

interface TotalHoursModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  logs: WorkLog[];
  role: string;
  currentUser: { name: string; email: string };
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function TotalHoursModal({ isOpen, onOpenChange, logs, role, currentUser }: TotalHoursModalProps) {
  const [dateRange, setDateRange] = useState('Jul 1, 2026 -> Current Date');
  
  // 1. Filter logs based on date range (mocked filter logic)
  const filteredLogs = useMemo(() => {
    // In a real app, parse date strings and filter. 
    // Here we'll just use all logs for the visual structure since data is static mock.
    let baseLogs = logs;
    if (role === 'employee') {
      baseLogs = baseLogs.filter(l => l.name === currentUser.name);
    }
    return baseLogs;
  }, [logs, role, currentUser.name, dateRange]);

  // Calculations
  const totalHours = filteredLogs.reduce((acc, log) => acc + (log.hours || 0), 0);
  const approvedHours = filteredLogs.filter(l => l.status === 'Approved').reduce((acc, log) => acc + (log.hours || 0), 0);
  const pendingHours = filteredLogs.filter(l => l.status === 'Pending').reduce((acc, log) => acc + (log.hours || 0), 0);

  // Export functions
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Employee,Project,Task,Hours,Status\n"
      + filteredLogs.map(l => `"${l.date}","${l.name}","${l.project}","${l.task}",${l.hours},"${l.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "work_logs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exported Successfully');
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text(role === 'manager' ? "Team Productivity Overview" : "My Work Summary", 14, 15);
      doc.text(`Total Hours: ${totalHours.toFixed(1)}h | Approved: ${approvedHours.toFixed(1)}h`, 14, 25);
      
      const tableData = filteredLogs.map(l => [l.date, l.name, l.project, l.task, `${l.hours}h`, l.status]);
      
      autoTable(doc, {
        startY: 35,
        head: [['Date', 'Employee', 'Project', 'Task', 'Hours', 'Status']],
        body: tableData,
      });
      
      doc.save("work_logs_export.pdf");
      toast.success('PDF Exported Successfully');
    } catch (e) {
      toast.error('Failed to export PDF');
    }
  };

  const renderEmployeeView = () => {
    // Project logic
    const projectsMap = new Map<string, { hours: number, tasks: number }>();
    filteredLogs.forEach(l => {
      const p = projectsMap.get(l.project) || { hours: 0, tasks: 0 };
      p.hours += l.hours;
      p.tasks += 1;
      projectsMap.set(l.project, p);
    });
    const projects = Array.from(projectsMap.entries()).map(([name, data]) => ({ name, ...data }));
    
    // Timeline Logic
    const timelineMap = new Map<string, WorkLog[]>();
    filteredLogs.forEach(l => {
      const day = l.date; // For simplicity
      if (!timelineMap.has(day)) timelineMap.set(day, []);
      timelineMap.get(day)!.push(l);
    });
    const timeline = Array.from(timelineMap.entries()).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

    // Charts Data
    const pieData = projects.map(p => ({ name: p.name, value: p.hours }));
    const barData = timeline.map(([date, items]) => ({
      date: date.substring(0, 6),
      hours: items.reduce((sum, i) => sum + i.hours, 0)
    })).reverse();

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 rounded-xl border border-purple-500/20">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Logged</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Approved</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{approvedHours.toFixed(1)}h</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{pendingHours.toFixed(1)}h</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <FolderKanban className="h-4 w-4 mr-2 text-purple-500" />
              Projects Worked On
            </h3>
            <div className="space-y-3">
              {projects.map((p, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-purple-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1"/> {p.hours.toFixed(1)}h Logged</span>
                    <span className="flex items-center"><CheckSquare className="h-3 w-3 mr-1"/> {p.tasks} Tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <PieChartIcon className="h-4 w-4 mr-2 text-emerald-500" />
              Hours per Project
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-500" />
              Daily Logged Hours
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
            Task History Timeline
          </h3>
          <div className="space-y-6">
            {timeline.map(([date, items], idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 pb-2">
                <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[7px] top-1" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{date}</h4>
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.task}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{item.project}</p>
                      </div>
                      <Badge variant="secondary" className="w-fit bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                        {item.hours}h Logged
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderManagerView = () => {
    // Project-wise analysis
    const projectsMap = new Map<string, { hours: number, employees: Map<string, number> }>();
    filteredLogs.forEach(l => {
      const p = projectsMap.get(l.project) || { hours: 0, employees: new Map() };
      p.hours += l.hours;
      p.employees.set(l.name, (p.employees.get(l.name) || 0) + l.hours);
      projectsMap.set(l.project, p);
    });
    const projects = Array.from(projectsMap.entries());

    // Employee Productivity Table
    const empMap = new Map<string, { hours: number, pending: number, tasks: number, projects: Set<string> }>();
    filteredLogs.forEach(l => {
      const e = empMap.get(l.name) || { hours: 0, pending: 0, tasks: 0, projects: new Set() };
      e.hours += l.hours;
      if (l.status === 'Pending') e.pending += l.hours;
      e.tasks += 1;
      e.projects.add(l.project);
      empMap.set(l.name, e);
    });
    const employees = Array.from(empMap.entries()).sort((a,b) => b[1].hours - a[1].hours);
    const uniqueEmployees = employees.length;

    const pieData = projects.map(p => ({ name: p[0], value: p[1].hours }));
    
    // Team Hours Trend (Line Chart)
    const timelineMap = new Map<string, number>();
    filteredLogs.forEach(l => {
      const day = l.date.substring(0, 6);
      timelineMap.set(day, (timelineMap.get(day) || 0) + l.hours);
    });
    const trendData = Array.from(timelineMap.entries()).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([date, hours]) => ({ date, hours }));

    // Employee Productivity Ranking (Bar Chart)
    const barData = employees.slice(0, 5).map(([name, data]) => ({ name: name.split(' ')[0], hours: data.hours }));

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} size="sm" variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
            <Button onClick={handleExportCSV} size="sm" variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 rounded-xl border border-purple-500/20">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Team Hours</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Approved</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{approvedHours.toFixed(1)}h</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{pendingHours.toFixed(1)}h</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Active Staff</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">{uniqueEmployees} <span className="text-sm font-medium">Emp</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
             <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <FolderKanban className="h-4 w-4 mr-2 text-purple-500" />
              Project-wise Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map(([pName, pData], idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-900 dark:text-white truncate pr-2">{pName}</span>
                    <Badge className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold shrink-0">{pData.hours.toFixed(1)}h</Badge>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {Array.from(pData.employees.entries()).slice(0,3).map(([emp, hrs], i) => (
                      <div key={i} className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center"><Users className="h-3 w-3 mr-1"/> {emp}</span>
                        <span>{hrs.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-amber-500" />
              Top Contributors
            </h3>
            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200/50 dark:border-amber-700/30 space-y-3">
              {employees.slice(0, 3).map(([name, data], idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{name}</span>
                  </div>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-400">{data.hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
            
            <div className="h-[200px] mt-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">Project Distribution</h4>
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-2 text-indigo-500" />
              Team Hours Trend
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <Users className="h-4 w-4 mr-2 text-emerald-500" />
              Productivity Ranking
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="hours" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Employee Productivity Table</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Projects</th>
                  <th className="px-4 py-3">Tasks</th>
                  <th className="px-4 py-3">Total Logged</th>
                  <th className="px-4 py-3">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {employees.map(([name, data], idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{name}</td>
                    <td className="px-4 py-3 text-slate-500">{data.projects.size} Projects</td>
                    <td className="px-4 py-3 text-slate-500">{data.tasks}</td>
                    <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">{data.hours.toFixed(1)}h</td>
                    <td className="px-4 py-3">
                      {data.pending > 0 ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20">{data.pending.toFixed(1)}h</Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[90vh] flex flex-col p-0">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-blue-600" />
        
        <DialogHeader className="p-6 pb-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                  {role === 'manager' ? 'Team Productivity Overview' : 'My Work Summary'}
                </DialogTitle>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Generated dynamically from work logs
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] h-9 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:ring-purple-500/20 focus:border-purple-500">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="This Week">This Week</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="Jul 1, 2026 -> Current Date">Jul 1, 2026 -&gt; Current Date</SelectItem>
                  <SelectItem value="Custom Range">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 relative">
          {role === 'manager' ? renderManagerView() : renderEmployeeView()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
