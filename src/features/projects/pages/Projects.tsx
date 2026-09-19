import React, { useState, useRef } from 'react';
import { 
  Briefcase, Plus, ChevronRight, MoreVertical, Edit2, Trash2, X, RotateCcw, 
  FolderKanban, ExternalLink, CheckCircle2, Zap, Clock, CheckSquare, AlertTriangle,
  Sparkles, UploadCloud, FileText, Loader2, Check, Layers, Cpu, Database, Palette, 
  Trash, ArrowRight, CornerDownLeft, RefreshCw, Copy, FileCode2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import ProjectDetails from '@/components/projects/ProjectDetails';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/context/ProjectContext';
import { useNotifications } from '@/context/NotificationContext';
import { useUser } from '@/context/UserContext';
import { isManagerOrAdmin } from '@/lib/auth';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function Projects({ session }: { session?: any }) {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('All');
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<any>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const { user } = useUser();
  const role = session?.user?.user_metadata?.role || user?.role || localStorage.getItem('role') || 'intern';
  const currentUserName = user?.name || session?.user?.user_metadata?.name || localStorage.getItem('userName') || 'Project Manager';
  const currentUserId = user?.id || session?.user?.id || localStorage.getItem('userId') || 'manager-1';

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newProject, setNewProject] = useState({ 
    name: '', 
    description: ''
  });
  const [quickTasks, setQuickTasks] = useState<string[]>([]);
  const [quickTaskInput, setQuickTaskInput] = useState('');

  // --- JSON Task Import State ---
  const [docMode, setDocMode] = useState<'json' | 'manual'>('json');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docText, setDocText] = useState('');
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aiTasks, setAiTasks] = useState<Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    priority: string;
    estimatedHours?: number;
    selected: boolean;
  }>>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [showTextarea, setShowTextarea] = useState(true);
  const [customTaskInput, setCustomTaskInput] = useState('');
  const [customTaskCategory, setCustomTaskCategory] = useState<'Frontend' | 'Backend' | 'Database' | 'Integration'>('Frontend');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SAMPLE_JSON_TEMPLATE = JSON.stringify({
    projectName: "Logistics Marketplace",
    projectDescription: "Frontend implementation of Phase 1 MVP",
    tasks: [
      {
        title: "Authentication & User Management UI",
        category: "Frontend",
        description: "Login & signup screens for customer, transporter, driver, admin (role-based UI) with OTP/password reset",
        priority: "Critical",
        estimatedHours: 10
      },
      {
        title: "Shipment Creation & Booking UI",
        category: "Frontend",
        description: "Create Shipment form with map pin address, cargo type, quote estimate screen, and booking confirmation",
        priority: "Critical",
        estimatedHours: 12
      },
      {
        title: "Transporter, Vehicle & Driver Management UI",
        category: "Frontend",
        description: "Transporter onboarding form and vehicle/driver management dashboard",
        priority: "High",
        estimatedHours: 9
      },
      {
        title: "Live Tracking UI",
        category: "Frontend",
        description: "Customer app live map with vehicle marker, route, ETA and admin multi-vehicle view",
        priority: "Critical",
        estimatedHours: 14
      }
    ]
  }, null, 2);

  const resetModalState = () => {
    setIsModalOpen(false);
    setEditingProjectId(null);
    setNewProject({ name: '', description: '' });
    setQuickTasks([]);
    setQuickTaskInput('');
    setDocFile(null);
    setDocText('');
    setAiTasks([]);
    setIsAnalyzingDoc(false);
    setShowTextarea(true);
    setCustomTaskInput('');
    setSelectedCategoryFilter('All');
    setDocMode('json');
  };

  const handleAnalyzeDocument = async () => {
    if (!docFile && !docText.trim()) {
      toast.error("Please upload a .json file or paste your tasks JSON.");
      return;
    }

    setIsAnalyzingDoc(true);
    try {
      let rawJson = docText.trim();
      if (docFile) {
        rawJson = await docFile.text();
      }

      if (rawJson.startsWith('```')) {
        rawJson = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(rawJson);
      } catch (clientErr: any) {
        // If client-side JSON parse fails, call backend API as fallback
        const formData = new FormData();
        if (docFile) formData.append('file', docFile);
        if (docText.trim()) formData.append('text', docText.trim());
        const response = await api.post('/projects/ai-parse-document', formData);
        parsedData = response.data?.data;
      }

      if (parsedData) {
        let name = '';
        let desc = '';
        let tasksList: any[] = [];

        if (Array.isArray(parsedData)) {
          tasksList = parsedData;
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          name = parsedData.projectName || parsedData.name || '';
          desc = parsedData.projectDescription || parsedData.description || '';
          tasksList = Array.isArray(parsedData.tasks) ? parsedData.tasks : [];
        }

        if (name && (!newProject.name || newProject.name.trim() === '')) {
          setNewProject(prev => ({ ...prev, name }));
        }
        if (desc && (!newProject.description || newProject.description.trim() === '')) {
          setNewProject(prev => ({ ...prev, description: desc }));
        }

        if (tasksList.length === 0) {
          throw new Error("No tasks found in the JSON. Please check the format.");
        }

        const formattedTasks = tasksList.map((t: any, idx: number) => ({
          id: `json-${Date.now()}-${idx}`,
          title: t.title || t.name || `Task ${idx + 1}`,
          category: t.category || 'Frontend',
          description: t.description || '',
          priority: t.priority || 'Medium',
          estimatedHours: Number(t.estimatedHours || t.hours || 6),
          selected: true
        }));

        setAiTasks(formattedTasks);
        toast.success("Tasks Imported!", {
          description: `Loaded ${formattedTasks.length} task(s) from JSON. Ready to launch into database!`
        });
      }
    } catch (error: any) {
      console.error("Failed to parse tasks JSON:", error);
      const msg = error.response?.data?.message || error.message || "Failed to parse JSON";
      toast.error("JSON Import Failed", { description: msg });
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const baseProjects = (role === 'manager' || role === 'admin' ? projects : projects).filter(Boolean);

  const handleSaveProject = async () => {
    if (!newProject.name) return;

    if (editingProjectId) {
      await updateProject(editingProjectId, {
        name: newProject.name,
        description: newProject.description
      });
      toast.success("Project Updated Successfully!", {
        description: `"${newProject.name}" details have been saved.`
      });
      resetModalState();
    } else {
      const colors = [
        { iconColor: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400', strokeColor: '#9333ea' },
        { iconColor: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', strokeColor: '#0891b2' },
        { iconColor: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400', strokeColor: '#db2777' }
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const finalTasks = docMode === 'json' && aiTasks.length > 0
        ? aiTasks.filter(t => t.selected).map(t => ({
            title: t.title,
            description: t.description ? `[${t.category}] ${t.description}` : `[${t.category}]`,
            status: 'To Do',
            priority: t.priority || 'Medium',
            assigneeId: ''
          }))
        : quickTasks.map(taskTitle => ({
            title: taskTitle,
            description: '',
            status: 'To Do',
            priority: 'Medium',
            assigneeId: ''
          }));

      const project = {
        id: Date.now().toString(),
        name: newProject.name,
        description: newProject.description || newProject.name,
        tasks: finalTasks,
        milestones: [],
        status: 'Not Started',
        progress: 0,
        iconColor: randomColor.iconColor,
        strokeColor: randomColor.strokeColor,
        manager: currentUserName || 'Unassigned',
        managerId: currentUserId || '',
        deadline: 'TBD'
      };

      // Close modal and clear form IMMEDIATELY for instantaneous UI feedback
      resetModalState();

      toast.success("Project Created Successfully!", {
        description: finalTasks.length > 0 
          ? `"${project.name}" created with ${finalTasks.length} task(s) ready in the open pool.`
          : `"${project.name}" has been added to active projects.`
      });
      addNotification({
        type: 'success',
        category: 'Projects',
        icon: '🚀',
        title: 'Project Created',
        message: `New project "${project.name}" has been created with ${finalTasks.length} task(s).`,
        group: 'Today',
      });

      // Perform network creation in background (ProjectContext already added optimistic project)
      addProject(project).catch((err) => {
        console.error("Failed to create project:", err);
        toast.error("Failed to sync project with server.");
      });
    }
  };

  const displayedProjects = baseProjects.filter(p => {
    if (activeTab === 'Active') return p.status !== 'Completed' && p.status !== 'Aborted';
    if (activeTab === 'Completed') return p.status === 'Completed';
    return true;
  });

  if (selectedProject) {
    const liveProject = projects.find((p: any) => p.id === selectedProject.id) || selectedProject;
    return <ProjectDetails project={liveProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Projects</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage active workspace projects, deliverables, and team progress.</p>
        </div>
        {isManagerOrAdmin(role) && (
          <button onClick={() => {
            setEditingProjectId(null);
            setNewProject({ name: '', description: '' });
            setIsModalOpen(true);
          }} className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> New Project
          </button>
        )}
      </div>

      {/* Project Overview List */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Active Projects</h3>
          </div>
          <div className="flex space-x-4 text-sm font-bold">
            <button
              onClick={() => setActiveTab('All')}
              className={cn("pb-1", activeTab === 'All' ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
            >All</button>
            <button
              onClick={() => setActiveTab('Active')}
              className={cn("pb-1", activeTab === 'Active' ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
            >Active</button>
            <button
              onClick={() => setActiveTab('Completed')}
              className={cn("pb-1", activeTab === 'Completed' ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
            >Completed</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-transparent">
          {displayedProjects.map((project, idx) => {
            const projectTasks = project.tasks || [];
            const totalTasks = projectTasks.length;
            const openPoolTasks = projectTasks.filter((t: any) => !t.assigneeId || t.assigneeId === 'unassigned' || t.assignee === 'Unassigned' || !t.assignee_id).length;
            const inProgressTasks = projectTasks.filter((t: any) => {
              const st = (t.status || '').toLowerCase();
              return st === 'in-progress' || st === 'in progress' || st === 'review';
            }).length;
            const completedTasks = projectTasks.filter((t: any) => {
              const st = (t.status || '').toLowerCase();
              return st === 'done' || st === 'completed';
            }).length;
            const progress = typeof project.progress === 'number' && project.progress > 0 
              ? project.progress 
              : (totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100));

            return (
              <div
                key={project.id}
                className="group relative bg-card/90 text-card-foreground backdrop-blur-xl border border-border shadow-sm hover:shadow-md hover:border-border/80 rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1.5 cursor-pointer overflow-hidden flex flex-col"
                onClick={() => setSelectedProject(project)}
              >
                {/* Premium Background Gradient Glow */}
                <div
                  className="absolute -right-20 -top-20 w-40 h-40 rounded-full blur-[70px] opacity-20 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"
                  style={{ backgroundColor: project.strokeColor || '#f97316' }}
                />

                <div className="p-5 relative z-10 border-b border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] border border-slate-100/50 dark:border-slate-800/50 backdrop-blur-md relative overflow-hidden",
                        project.iconColor
                      )}
                    >
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent" />
                      <FolderKanban className="h-5 w-5 relative z-10" />
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Badge variant={
                        project.status === 'Completed' ? 'default' :
                          project.status === 'In Progress' ? 'secondary' :
                            project.status === 'Aborted' ? 'destructive' :
                              'outline'
                      } className={cn(
                        "font-black tracking-widest uppercase text-[8px] px-2 py-0.5 rounded-md backdrop-blur-md border",
                        project.status === 'Completed' && "bg-emerald-500/10 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
                        project.status === 'In Progress' && "bg-blue-500/10 text-blue-700 border-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
                        project.status === 'On Hold' && "bg-amber-500/10 text-amber-700 border-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
                        project.status === 'Not Started' && "bg-slate-500/10 text-slate-700 border-slate-200/50 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
                        project.status === 'Aborted' && "bg-red-500/10 text-red-700 border-red-200/50 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
                      )}>
                        {project.status}
                      </Badge>

                      {isManagerOrAdmin(role) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-6 w-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors outline-none focus:ring-2 focus:ring-orange-500/50 backdrop-blur-sm">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-200 dark:border-slate-800 shadow-2xl p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-[100]">
                            <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => {
                              setSelectedProject(project);
                            }}>
                              <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Details
                            </DropdownMenuItem>
                            {project.status !== 'In Progress' && (
                              <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => {
                                setEditingProjectId(project.id);
                                setNewProject({
                                  name: project.name,
                                  description: project.description || ''
                                });
                                setIsModalOpen(true);
                              }}>
                                <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            )}
                            {project.status === 'Aborted' ? (
                              <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg text-emerald-600 focus:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => {
                                updateProject(project.id, { status: 'In Progress' });
                                toast.success("Project Restored", { description: `"${project.name}" has been restored to active projects.` });
                              }}>
                                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg text-amber-600 focus:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30" onClick={() => {
                                updateProject(project.id, { status: 'Aborted' });
                                toast.success("Project Aborted", { description: `"${project.name}" has been marked as Aborted.` });
                              }}>
                                <X className="mr-2 h-3.5 w-3.5" /> Abort
                              </DropdownMenuItem>
                            )}
                             <DropdownMenuItem className="font-bold text-xs cursor-pointer rounded-lg text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => {
                              setDeletingProject(project);
                              setDeletionReason('');
                              setDeleteModalOpen(true);
                            }}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 tracking-tight">
                      {project.name}
                    </h4>
                    {project.description && project.description !== project.name ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                        {totalTasks} deliverable{totalTasks !== 1 ? 's' : ''} in workspace
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 bg-slate-50/50 dark:bg-slate-900/30 flex-1 flex flex-col justify-between space-y-4 relative z-10">
                  {/* Live Task Distribution Stats */}
                  <div className="grid grid-cols-3 gap-2 bg-white/70 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-orange-50/70 dark:bg-orange-950/30 border border-orange-100/80 dark:border-orange-900/30">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Pool
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-white mt-0.5">{openPoolTasks}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Unclaimed</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/30">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Active
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-white mt-0.5">{inProgressTasks}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">In Progress</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100/80 dark:border-emerald-900/30">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-white mt-0.5">{completedTasks}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Finished</span>
                    </div>
                  </div>

                  {/* Overall Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        {totalTasks === 0 ? "No tasks queued yet" : `${completedTasks} of ${totalTasks} Tasks Done`}
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: project.strokeColor || '#f97316',
                          boxShadow: `0 0 8px ${project.strokeColor || '#f97316'}80`
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {totalTasks === completedTasks && totalTasks > 0 ? "All completed" : `${totalTasks - completedTasks} remaining`}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                      className="text-[11px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors"
                      title="Open full project details"
                    >
                      Details <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editingProjectId ? 'Edit Project' : 'Create New Project'}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {editingProjectId 
                      ? 'Update project parameters and scope.' 
                      : 'Auto-decompose PRD specifications or manually queue team deliverables.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetModalState} 
                className="p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Dual Mode Switcher (only for new projects) */}
              {!editingProjectId && (
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setDocMode('json')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all",
                      docMode === 'json'
                        ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200/70 dark:border-slate-700/70"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <FileCode2 className="h-3.5 w-3.5 text-orange-500" />
                    <span>Import Tasks (JSON)</span>
                    <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      Direct DB
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocMode('manual')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all",
                      docMode === 'manual'
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/70 dark:border-slate-700/70"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Manual Task Entry</span>
                  </button>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 1: DIRECT JSON TASK IMPORTER */}
              {/* ============================================================== */}
              {!editingProjectId && docMode === 'json' && (
                <div className="space-y-4">
                  {aiTasks.length === 0 ? (
                    <div className="space-y-3">
                      {/* Document Dropzone */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDocFile(e.target.files[0]);
                          }
                        }}
                      />

                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            setDocFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group",
                          isDragging
                            ? "border-orange-500 bg-orange-500/10 scale-[0.99]"
                            : docFile
                              ? "border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20"
                              : "border-slate-200 dark:border-slate-700 hover:border-orange-400/80 hover:bg-orange-50/30 dark:hover:bg-slate-800/40"
                        )}
                      >
                        {docFile ? (
                          <div className="flex items-center justify-between gap-3 w-full bg-white dark:bg-slate-800 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 truncate">
                              <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <FileCode2 className="h-5 w-5" />
                              </div>
                              <div className="text-left truncate">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{docFile.name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{Math.round(docFile.size / 1024)} KB • JSON File Attached</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocFile(null)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="h-12 w-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-inner">
                              <UploadCloud className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Click to upload or drag & drop tasks <span className="text-orange-600 dark:text-orange-400">.json</span> file
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Instantly parses tasks and uploads directly into the database
                            </p>
                          </>
                        )}
                      </div>

                      {/* Paste JSON Area with Copy Template Button */}
                      <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-orange-500" />
                            <span>Or Paste Tasks JSON Directly</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(SAMPLE_JSON_TEMPLATE);
                              setDocText(SAMPLE_JSON_TEMPLATE);
                              toast.success("Sample JSON Copied & Pasted!", {
                                description: "Sample template loaded into the box below."
                              });
                            }}
                            className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800 transition-all hover:scale-105 active:scale-95"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy Sample JSON</span>
                          </button>
                        </div>

                        <textarea
                          rows={6}
                          placeholder={`{\n  "projectName": "My Project",\n  "tasks": [\n    { "title": "Task 1", "category": "Frontend", "description": "...", "priority": "High", "estimatedHours": 8 }\n  ]\n}`}
                          value={docText}
                          onChange={(e) => setDocText(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-slate-400 resize-y font-mono"
                        />
                      </div>

                      {/* Import Action Button */}
                      <button
                        type="button"
                        onClick={handleAnalyzeDocument}
                        disabled={(!docFile && !docText.trim()) || isAnalyzingDoc}
                        className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        {isAnalyzingDoc ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span>Validating & Parsing Tasks JSON...</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4" />
                            <span>Import Tasks from JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Deliverables Extracted Preview State */
                    <div className="space-y-4 animate-in fade-in duration-300">
                      
                      {/* Success Banner */}
                      <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-orange-500/10 to-amber-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">
                              {aiTasks.length} Tasks Imported from JSON
                            </p>
                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Verified and ready to launch directly into the database.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAiTasks([]);
                            setDocFile(null);
                            setDocText('');
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                        >
                          Re-import JSON
                        </button>
                      </div>

                      {/* Project Name & Description Input (Pre-filled from JSON) */}
                      <div className="space-y-3 p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                            <span>Project Name <span className="text-rose-500">*</span></span>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                              ✓ Imported from JSON
                            </span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Core Banking Portal"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Project Description
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Brief project summary..."
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
                          />
                        </div>
                      </div>

                      {/* Category Filters & Bulk Action Bar */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          {/* Filter Tabs */}
                          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                            {['All', 'Frontend', 'Backend', 'Database', 'Integration'].map((cat) => {
                              const count = cat === 'All' 
                                ? aiTasks.length 
                                : aiTasks.filter(t => (t.category || '').toLowerCase() === cat.toLowerCase()).length;
                              if (count === 0 && cat !== 'All') return null;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setSelectedCategoryFilter(cat)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1",
                                    selectedCategoryFilter === cat
                                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                  )}
                                >
                                  <span>{cat}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 dark:bg-black/20 font-black">
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Select / Deselect All */}
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setAiTasks(prev => prev.map(t => ({ ...t, selected: true })))}
                              className="text-orange-600 dark:text-orange-400 hover:underline"
                            >
                              Select All
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                              type="button"
                              onClick={() => setAiTasks(prev => prev.map(t => ({ ...t, selected: false })))}
                              className="text-slate-400 hover:underline"
                            >
                              Clear Selection
                            </button>
                          </div>
                        </div>

                        {/* Extracted Tasks Scrollable Cards List */}
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {aiTasks
                            .filter(t => selectedCategoryFilter === 'All' || (t.category || '').toLowerCase() === selectedCategoryFilter.toLowerCase())
                            .map((task) => {
                              const cat = (task.category || '').toLowerCase();
                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "flex items-start justify-between gap-3 p-3 rounded-xl border transition-all text-xs",
                                    task.selected
                                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
                                      : "bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-60"
                                  )}
                                >
                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={task.selected}
                                      onChange={() => {
                                        setAiTasks(prev => prev.map(t => t.id === task.id ? { ...t, selected: !t.selected } : t));
                                      }}
                                      className="mt-0.5 h-4 w-4 rounded accent-orange-600 cursor-pointer"
                                    />
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                                          cat === 'frontend' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
                                          cat === 'backend' && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
                                          cat === 'database' && "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
                                          cat === 'integration' && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                        )}>
                                          {task.category}
                                        </span>

                                        <span className={cn(
                                          "px-1.5 py-0.5 rounded text-[9px] font-bold",
                                          task.priority === 'Critical' && "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
                                          task.priority === 'High' && "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
                                          task.priority === 'Medium' && "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
                                          task.priority === 'Low' && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        )}>
                                          {task.priority}
                                        </span>

                                        {task.estimatedHours && (
                                          <span className="text-[9px] font-semibold text-slate-400">
                                            ⏱️ {task.estimatedHours}h est.
                                          </span>
                                        )}
                                      </div>

                                      <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                        {task.title}
                                      </p>
                                      {task.description && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setAiTasks(prev => prev.filter(t => t.id !== task.id))}
                                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="Remove deliverable"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                        </div>

                        {/* Inline Add Custom Deliverable */}
                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <input
                            type="text"
                            placeholder="+ Add extra deliverable to queue..."
                            value={customTaskInput}
                            onChange={(e) => setCustomTaskInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = customTaskInput.trim();
                                if (val) {
                                  setAiTasks(prev => [
                                    ...prev,
                                    {
                                      id: `custom-${Date.now()}`,
                                      title: val,
                                      category: customTaskCategory,
                                      description: 'Custom deliverable added by manager',
                                      priority: 'Medium',
                                      estimatedHours: 4,
                                      selected: true
                                    }
                                  ]);
                                  setCustomTaskInput('');
                                }
                              }
                            }}
                            className="flex-1 h-9 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500"
                          />
                          <select
                            value={customTaskCategory}
                            onChange={(e: any) => setCustomTaskCategory(e.target.value)}
                            className="h-9 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none"
                          >
                            <option value="Frontend">Frontend</option>
                            <option value="Backend">Backend</option>
                            <option value="Database">Database</option>
                            <option value="Integration">Integration</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const val = customTaskInput.trim();
                              if (val) {
                                setAiTasks(prev => [
                                  ...prev,
                                  {
                                    id: `custom-${Date.now()}`,
                                    title: val,
                                    category: customTaskCategory,
                                    description: 'Custom deliverable added by manager',
                                    priority: 'Medium',
                                    estimatedHours: 4,
                                    selected: true
                                  }
                                ]);
                                setCustomTaskInput('');
                              }
                            }}
                            disabled={!customTaskInput.trim()}
                            className="h-9 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-xl disabled:opacity-40"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: MANUAL TASKS ENTRY (OR EDIT MODE) */}
              {/* ============================================================== */}
              {(editingProjectId || docMode === 'manual') && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Project Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Website Redesign Sprint 1"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Manual Task Adder */}
                  {!editingProjectId && (
                    <div className="space-y-3 p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-black uppercase tracking-wider text-orange-950 dark:text-orange-300 flex items-center gap-1.5">
                            <CheckSquare className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                            Today's Tasks / Deliverables (Quick Add)
                          </label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Type a task title and press <strong>Enter</strong> to queue it into the intern pool.
                          </p>
                        </div>
                        {quickTasks.length > 0 && (
                          <span className="text-[10px] font-extrabold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                            {quickTasks.length} queued
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Build login page, Setup Supabase tables, Test API..."
                          value={quickTaskInput}
                          onChange={(e) => setQuickTaskInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = quickTaskInput.trim();
                              if (val) {
                                setQuickTasks(prev => [...prev, val]);
                                setQuickTaskInput('');
                              }
                            }
                          }}
                          className="flex-1 h-11 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/50 rounded-xl px-3.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = quickTaskInput.trim();
                            if (val) {
                              setQuickTasks(prev => [...prev, val]);
                              setQuickTaskInput('');
                            }
                          }}
                          disabled={!quickTaskInput.trim()}
                          className="h-11 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Plus className="h-4 w-4" /> Add
                        </button>
                      </div>

                      {quickTasks.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {quickTasks.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 p-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="truncate">{t}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setQuickTasks(prev => prev.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          No tasks queued yet. Interns can view and claim these tasks directly with their target deadline.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Project Description (Optional) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Project Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief description or objectives for this project..."
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-slate-400 resize-none"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <button 
                type="button"
                className="px-5 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs" 
                onClick={resetModalState}
              >
                Cancel
              </button>

              <button
                type="button"
                className="px-6 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                onClick={handleSaveProject}
                disabled={newProject.name.trim().length < 2 || isAnalyzingDoc}
              >
                {editingProjectId ? (
                  'Save Changes'
                ) : (
                  <>
                    <span>
                      Launch Project 
                      {docMode === 'json' && aiTasks.filter(t => t.selected).length > 0 
                        ? ` (${aiTasks.filter(t => t.selected).length} Tasks)` 
                        : quickTasks.length > 0 ? ` (${quickTasks.length} Tasks)` : ''}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Project Deletion Reason Modal */}
      {deleteModalOpen && deletingProject && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Project</h3>
                  <p className="text-xs font-semibold text-slate-500">{deletingProject.name}</p>
                </div>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{deletingProject.name}"</span>? Please specify a reason for deleting this project. A notification will be broadcast to all team members.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Reason for Deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={deletionReason}
                  onChange={e => setDeletionReason(e.target.value)}
                  placeholder="Explain why this project is being deleted (e.g. Scope completed, Timeline updated, Merged into another module)..."
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!deletionReason.trim() || isDeleting}
                onClick={async () => {
                  if (!deletingProject || !deletionReason.trim()) return;
                  const projId = deletingProject.id;
                  const projName = deletingProject.name;
                  const reason = deletionReason.trim();

                  // Instant UI feedback: close modal immediately
                  setDeleteModalOpen(false);
                  setDeletingProject(null);
                  setDeletionReason('');

                  try {
                    await deleteProject(projId, reason);
                    addNotification({
                      type: 'alert',
                      category: 'Projects',
                      icon: '🚨',
                      title: `Project Deleted: ${projName}`,
                      message: `Project "${projName}" was deleted by Manager.\nReason: ${reason}`,
                      group: 'Today',
                    });
                    toast.success("Project Deleted", { description: `"${projName}" removed successfully.` });
                  } catch (err: any) {
                    toast.error("Failed to delete project", { description: err?.message || 'Server error' });
                  }
                }}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

