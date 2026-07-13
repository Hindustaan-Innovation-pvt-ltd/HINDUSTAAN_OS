import React, { useState } from 'react';
import { 
  LifeBuoy, BookOpen, Bug, MessageCircle, Search, 
  ChevronDown, ChevronRight, Download, Paperclip, 
  Plus, CheckCircle2, Clock, AlertTriangle, FileText, FolderKanban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockFAQs = [
  { id: 1, question: "How do I submit daily work logs?", answer: "Navigate to Work Logs -> Add Entry -> Select project and hours.", category: "Work Logs" },
  { id: 2, question: "How do managers approve logs?", answer: "Managers can review pending logs under Team Work Logs.", category: "Manager Actions" },
  { id: 3, question: "How can I change my password?", answer: "Go to Settings -> Account Security -> Change Password.", category: "Security" },
];

const mockDocs = [
  { id: 1, title: "Creating Projects", desc: "Learn how to create and assign projects.", category: "Projects", icon: FolderKanban },
  { id: 2, title: "Logging Hours", desc: "Best practices for accurate timesheets.", category: "Work Logs", icon: Clock },
  { id: 3, title: "Using Standups", desc: "How to automate your daily standups.", category: "Getting Started", icon: MessageCircle },
];

const mockTickets = [
  { id: 'T-1001', subject: 'Unable to upload work logs', status: 'Open', priority: 'High', date: '2026-07-10' },
  { id: 'T-1002', subject: 'Need access to Design project', status: 'In Progress', priority: 'Medium', date: '2026-07-09' },
];

const mockBugs = [
  { id: 'B-2001', title: 'Crash on submit', module: 'Work Logs', status: 'Open', severity: 'High', date: '2026-07-10' },
];

export default function HelpSupport({ session }: { session?: any }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  
  const role = session?.user?.user_metadata?.role || 'employee';

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 bg-[#F8FAFC] dark:bg-slate-950 min-h-screen animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-page-title tracking-tight text-[#0F172A] dark:text-white flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-indigo-500" />
            Help & Support
          </h2>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">Get answers, read documentation, and report issues.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto custom-scrollbar mb-6">
          <TabsList className="w-full flex h-auto p-0 bg-transparent gap-2 min-w-max">
            {['dashboard', 'faqs', 'documentation', 'tickets', 'bugs'].map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="flex-1 h-10 rounded-xl data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 capitalize text-sm font-semibold transition-all"
              >
                {tab === 'dashboard' ? 'Overview' : tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setActiveTab('faqs')}>
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Total FAQs</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{mockFAQs.length}</h3>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform"><MessageCircle className="h-6 w-6 text-indigo-500" /></div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => setActiveTab('documentation')}>
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Docs Available</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{mockDocs.length}</h3>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform"><BookOpen className="h-6 w-6 text-emerald-500" /></div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-amber-300 transition-colors" onClick={() => setActiveTab('tickets')}>
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Open Tickets</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{mockTickets.length}</h3>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform"><AlertTriangle className="h-6 w-6 text-amber-500" /></div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-rose-300 transition-colors" onClick={() => setActiveTab('bugs')}>
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Reported Bugs</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{mockBugs.length}</h3>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl group-hover:scale-110 transition-transform"><Bug className="h-6 w-6 text-rose-500" /></div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Ticket T-0998 Resolved</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Admin closed your support ticket "Unable to login".</p>
                </div>
                <span className="text-xs text-slate-400 ml-auto">2h ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">New Documentation Added</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">"Using Standups" was added to the Docs portal.</p>
                </div>
                <span className="text-xs text-slate-400 ml-auto">Yesterday</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* FAQs TAB */}
        <TabsContent value="faqs" className="outline-none">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search FAQs..."
                  className="w-full pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 ring-indigo-500/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {role === 'manager' && (
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-semibold shrink-0">
                  <Plus className="h-4 w-4 mr-2" /> Add FAQ
                </Button>
              )}
            </div>
            <div className="p-4 sm:p-6 space-y-3">
              {mockFAQs.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase())).map((faq) => (
                <div key={faq.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-200 bg-white dark:bg-slate-800/50">
                  <button 
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none group"
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{faq.question}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{faq.category}</p>
                    </div>
                    {expandedFAQ === faq.id ? <ChevronDown className="h-5 w-5 text-indigo-500 shrink-0" /> : <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />}
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* DOCUMENTATION TAB */}
        <TabsContent value="documentation" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockDocs.map(doc => (
              <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-md transition-all cursor-pointer group">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <doc.icon className="h-6 w-6 text-indigo-500" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{doc.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{doc.desc}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none font-medium text-[10px]">{doc.category}</Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TICKETS TAB */}
        <TabsContent value="tickets" className="outline-none">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Support Tickets</h3>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-semibold">
                <Plus className="h-4 w-4 mr-2" /> New Ticket
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Ticket ID</th>
                    <th className="px-6 py-4 font-semibold">Subject</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Priority</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {mockTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{ticket.id}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{ticket.subject}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn("rounded-full border-none font-bold", 
                          ticket.status === 'Open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                        )}>{ticket.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-xs font-bold uppercase tracking-wider", 
                          ticket.priority === 'High' ? 'text-rose-500' : 'text-amber-500'
                        )}>{ticket.priority}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{ticket.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* BUGS TAB */}
        <TabsContent value="bugs" className="outline-none">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reported Bugs</h3>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md font-semibold">
                <Bug className="h-4 w-4 mr-2" /> Report Bug
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Bug ID</th>
                    <th className="px-6 py-4 font-semibold">Title</th>
                    <th className="px-6 py-4 font-semibold">Module</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {mockBugs.map(bug => (
                    <tr key={bug.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{bug.id}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{bug.title}</td>
                      <td className="px-6 py-4 text-slate-500">{bug.module}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-full border-none font-bold">
                          {bug.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">{bug.severity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
