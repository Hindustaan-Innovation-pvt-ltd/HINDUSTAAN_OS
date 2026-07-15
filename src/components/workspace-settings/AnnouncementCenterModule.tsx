import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Megaphone, Pin, Plus, Eye, BookOpen, Trash2, Edit2, Calendar, 
  User, CheckCircle2, Archive, Clock, Bold, Italic, List, Code, AlertCircle, Search
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  targetAudience: 'Everyone' | 'Managers' | 'Employees' | 'Specific Teams';
  status: 'Draft' | 'Scheduled' | 'Published' | 'Archived';
  isPinned: boolean;
  views: number;
  readPercentage: number;
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Q3 All Hands Meeting Scheduled',
    description: '<p>Hi everyone, our Q3 All Hands meeting is scheduled for <strong>July 28th at 3:00 PM IST</strong>. We will discuss product roadmap updates, new hires, and department alignments.</p>',
    createdBy: 'Aditya Sen (HR)',
    date: '2026-07-14',
    priority: 'High',
    targetAudience: 'Everyone',
    status: 'Published',
    isPinned: true,
    views: 124,
    readPercentage: 89
  },
  {
    id: 'ann-2',
    title: 'Workspace Leave Policy Updates',
    description: '<p>Please note that leave requests must now be submitted at least <strong>5 days</strong> in advance to ensure smooth resource planning. Emergency leaves are exempt.</p>',
    createdBy: 'HR Dept',
    date: '2026-07-12',
    priority: 'Medium',
    targetAudience: 'Employees',
    status: 'Published',
    isPinned: false,
    views: 98,
    readPercentage: 74
  },
  {
    id: 'ann-3',
    title: 'New API Security Best Practices Document',
    description: '<p>Engineering managers, please review and propagate the new security compliance standards for backend route handlers.</p>',
    createdBy: 'Security Team',
    date: '2026-07-10',
    priority: 'High',
    targetAudience: 'Managers',
    status: 'Published',
    isPinned: false,
    views: 45,
    readPercentage: 92
  },
  {
    id: 'ann-4',
    title: 'Server Migration Plan',
    description: '<p>Migration of Database clusters to regional cloud instance is scheduled for <strong>Aug 1st, 02:00 AM IST</strong>.</p>',
    createdBy: 'DevOps Lead',
    date: '2026-07-15',
    priority: 'High',
    targetAudience: 'Specific Teams',
    status: 'Scheduled',
    isPinned: false,
    views: 0,
    readPercentage: 0
  }
];

export default function AnnouncementCenterModule() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor and Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [formAudience, setFormAudience] = useState<Announcement['targetAudience']>('Everyone');
  const [formStatus, setFormStatus] = useState<Announcement['status']>('Draft');
  const [formPinned, setFormPinned] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/announcements');
      if (res.data?.success) {
        // Map backend content schema to frontend description key
        const mapped = (res.data.data || []).map((ann: any) => ({
          id: ann.id,
          title: ann.title,
          description: ann.content,
          createdBy: ann.createdBy,
          date: ann.createdAt ? ann.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          priority: ann.priority,
          targetAudience: ann.targetAudience,
          status: ann.status,
          isPinned: ann.isPinned,
          views: ann.views,
          readPercentage: ann.readPercentage
        }));
        setAnnouncements(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch announcements:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Analytics Calculations
  const totalAnnouncements = announcements.length;
  const publishedCount = announcements.filter(a => a.status === 'Published').length;
  const scheduledCount = announcements.filter(a => a.status === 'Scheduled').length;
  const totalViews = announcements.reduce((sum, a) => sum + a.views, 0);
  const avgReadRate = announcements.filter(a => a.status === 'Published').length > 0
    ? Math.round(announcements.filter(a => a.status === 'Published').reduce((sum, a) => sum + a.readPercentage, 0) / publishedCount)
    : 0;

  // Filter application
  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = 
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ann.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAudience = audienceFilter === 'all' || ann.targetAudience === audienceFilter;
    const matchesStatus = statusFilter === 'all' || ann.status === statusFilter;
    return matchesSearch && matchesAudience && matchesStatus;
  });

  // Sort: pinned first, then date desc
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedAnn(null);
    setFormTitle('');
    setFormDesc('');
    setFormPriority('Medium');
    setFormAudience('Everyone');
    setFormStatus('Published');
    setFormPinned(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setIsEditing(true);
    setSelectedAnn(ann);
    setFormTitle(ann.title);
    setFormDesc(ann.description);
    setFormPriority(ann.priority);
    setFormAudience(ann.targetAudience);
    setFormStatus(ann.status);
    setFormPinned(ann.isPinned);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      try {
        const res = await api.delete(`/notifications/announcements/${id}`);
        if (res.data?.success) {
          toast.success('Announcement deleted successfully.');
          fetchAnnouncements();
        }
      } catch (err: any) {
        toast.error('Delete failed', { description: err.response?.data?.message || err.message });
      }
    }
  };

  const handlePinToggle = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/announcements/${id}/pin`);
      if (res.data?.success) {
        const isPinned = res.data.data.isPinned;
        toast.success(isPinned ? 'Announcement pinned to top.' : 'Announcement unpinned.');
        fetchAnnouncements();
      }
    } catch (err: any) {
      toast.error('Action failed', { description: err.response?.data?.message || err.message });
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formDesc.trim()) {
      toast.error('Title and description are required.');
      return;
    }

    const userStr = localStorage.getItem('hindustaan_user');
    let authorName = 'System Administrator';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        authorName = user.name || authorName;
      } catch (e) {}
    }

    const payload = {
      title: formTitle.trim(),
      content: formDesc,
      priority: formPriority,
      targetAudience: formAudience,
      status: formStatus,
      isPinned: formPinned,
      createdBy: authorName
    };

    try {
      if (isEditing && selectedAnn) {
        const res = await api.put(`/notifications/announcements/${selectedAnn.id}`, payload);
        if (res.data?.success) {
          toast.success('Announcement updated successfully!');
          fetchAnnouncements();
        }
      } else {
        const res = await api.post('/notifications/announcements', payload);
        if (res.data?.success) {
          toast.success('Announcement created successfully!');
          fetchAnnouncements();
        }
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error('Save failed', { description: err.response?.data?.message || err.message });
    }
  };

  // Simulated Rich Text Editor Command Wrapper
  const handleEditorCommand = (command: string) => {
    const textarea = document.getElementById('ann-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    if (command === 'bold') {
      replacement = `<strong>${selectedText || 'Bold Text'}</strong>`;
    } else if (command === 'italic') {
      replacement = `<em>${selectedText || 'Italic Text'}</em>`;
    } else if (command === 'list') {
      replacement = `\n<ul>\n  <li>${selectedText || 'List Item'}</li>\n</ul>\n`;
    } else if (command === 'code') {
      replacement = `<code>${selectedText || 'Code snippet'}</code>`;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setFormDesc(newText);
    
    // Focus back and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-page-title text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-indigo-500" />
          Announcement Center
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl">
          Manage organization-wide announcements and broadcasts.
        </p>
      </div>

      {/* Analytics header cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Announcements</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalAnnouncements}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Megaphone className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Published</p>
              <h3 className="text-2xl font-black text-emerald-500 mt-1">{publishedCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Announcement Views</p>
              <h3 className="text-2xl font-black text-blue-500 mt-1">{totalViews}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Read Rate</p>
              <h3 className="text-2xl font-black text-purple-500 mt-1">{avgReadRate}%</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Toolbar */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input 
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
            {/* Audience Filters */}
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 dark:border-slate-800">
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="Everyone">Everyone</SelectItem>
                <SelectItem value="Managers">Managers</SelectItem>
                <SelectItem value="Employees">Employees</SelectItem>
                <SelectItem value="Specific Teams">Specific Teams</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filters */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-10 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 dark:border-slate-800">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleOpenCreate} 
              className="rounded-xl bg-[#5B7CFF] hover:bg-[#5B7CFF]/90 text-white font-bold"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create
            </Button>
          </div>
        </div>
      </Card>

      {/* Announcements List (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedAnnouncements.length === 0 ? (
          <Card className="col-span-2 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-800 h-[200px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Megaphone className="h-8 w-8 mb-2 text-slate-350" />
            <p className="text-sm font-semibold">No announcements found matching the filter.</p>
          </Card>
        ) : (
          sortedAnnouncements.map((ann) => {
            let priorityBadge = <Badge className="bg-blue-500/10 text-blue-500 border-0">Low</Badge>;
            if (ann.priority === 'High') {
              priorityBadge = <Badge className="bg-rose-500/10 text-rose-500 border-0">High Priority</Badge>;
            } else if (ann.priority === 'Medium') {
              priorityBadge = <Badge className="bg-amber-500/10 text-amber-500 border-0">Medium</Badge>;
            }

            let statusBadge = <Badge className="bg-emerald-500/10 text-emerald-500 border-0">Published</Badge>;
            if (ann.status === 'Draft') {
              statusBadge = <Badge className="bg-slate-500/10 text-slate-500 border-0">Draft</Badge>;
            } else if (ann.status === 'Scheduled') {
              statusBadge = <Badge className="bg-blue-500/10 text-blue-500 border-0">Scheduled</Badge>;
            } else if (ann.status === 'Archived') {
              statusBadge = <Badge className="bg-amber-500/10 text-amber-500 border-0">Archived</Badge>;
            }

            return (
              <Card key={ann.id} className={`rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm flex flex-col justify-between overflow-hidden relative ${
                ann.isPinned ? 'ring-2 ring-orange-500/50' : ''
              }`}>
                {ann.isPinned && (
                  <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500" title="Pinned Announcement">
                    <Pin className="h-4 w-4 fill-orange-500" />
                  </div>
                )}

                <CardHeader className="pb-3 pr-10">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {priorityBadge}
                    {statusBadge}
                    <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">{ann.targetAudience}</Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug">{ann.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
                    <User className="h-3 w-3" /> By {ann.createdBy} • <Calendar className="h-3 w-3" /> {ann.date}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4 flex-1">
                  <div 
                    className="text-sm text-slate-600 dark:text-slate-300 font-medium prose dark:prose-invert max-w-none line-clamp-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: ann.description }}
                  />
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between text-xs">
                  {/* Views & Read Rate */}
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {ann.views}</span>
                    {ann.status === 'Published' && (
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {ann.readPercentage}% read</span>
                    )}
                  </div>

                  {/* Actions Group */}
                  <div className="flex items-center gap-1">
                    <Button 
                      onClick={() => handlePinToggle(ann.id)} 
                      variant="ghost" 
                      size="icon" 
                      className={`h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${ann.isPinned ? 'text-orange-500' : 'text-slate-400'}`}
                      title={ann.isPinned ? "Unpin" : "Pin to top"}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      onClick={() => handleOpenEdit(ann)} 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      onClick={() => handleDelete(ann.id)} 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Editor & Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-orange-500" /> {isEditing ? 'Edit Announcement' : 'Create Announcement'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Publish news, alerts, or schedules to targeted roles/teams.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Announcement Title</label>
              <Input 
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 font-semibold"
              />
            </div>

            {/* Simulated Rich Text Editor Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message Description (Rich Text Editor)</label>
                
                {/* Editor Toolbar */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-0.5 border border-slate-200/50 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => handleEditorCommand('bold')}
                    className="h-6 w-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900"
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleEditorCommand('italic')}
                    className="h-6 w-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900"
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleEditorCommand('list')}
                    className="h-6 w-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900"
                    title="Bullet List"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleEditorCommand('code')}
                    className="h-6 w-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900"
                    title="Code Snippet"
                  >
                    <Code className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <textarea 
                id="ann-textarea"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full h-32 p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/55 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority Level</label>
                <Select value={formPriority} onValueChange={(v: any) => setFormPriority(v)}>
                  <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-slate-800">
                    <SelectItem value="Low">Low Priority</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="High">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Audience</label>
                <Select value={formAudience} onValueChange={(v: any) => setFormAudience(v)}>
                  <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-slate-800">
                    <SelectItem value="Everyone">Everyone</SelectItem>
                    <SelectItem value="Managers">Managers</SelectItem>
                    <SelectItem value="Employees">Employees</SelectItem>
                    <SelectItem value="Specific Teams">Specific Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                  <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-slate-800">
                    <SelectItem value="Published">Publish Immediately</SelectItem>
                    <SelectItem value="Scheduled">Schedule / Queue</SelectItem>
                    <SelectItem value="Draft">Save as Draft</SelectItem>
                    <SelectItem value="Archived">Archive Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input 
                  type="checkbox"
                  id="pin-ann-chk"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="pin-ann-chk" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  <Pin className="h-3.5 w-3.5 text-slate-400" /> Pin to top of feed
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)} 
              className="rounded-xl border-slate-200 dark:border-slate-700 font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="rounded-xl bg-[#5B7CFF] hover:bg-[#5B7CFF]/90 text-white font-bold"
            >
              {isEditing ? 'Save Changes' : 'Create & Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
