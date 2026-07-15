import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Users, Search, Filter, Plus, Download, MoreVertical, MapPin, 
  Mail, Phone, GraduationCap, Briefcase, Calendar, CheckCircle2, 
  MessageSquare, Clock, Trophy, ExternalLink, Activity, ArrowRightLeft, MessageCircle, Loader2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getCurrentUser, type User } from '@/lib/auth';
import api from '@/lib/api';

// Generate 30 realistic mock interns
const generateMockInterns = (currentUser?: User | null) => {
  const depts = ['Frontend', 'Backend', 'AI/ML', 'UI/UX'];
  const roles = ['Frontend Developer Intern', 'Backend Developer Intern', 'AI Researcher Intern', 'Product Design Intern'];
  const projects = ['Dashboard UI Revamp', 'Supabase Migration', 'Predictive Model V2', 'Onboarding Flow'];
  const statuses = ['Online', 'Busy', 'Offline', 'Leave'];
  
  const defaultEmployeeName = currentUser?.role === 'employee' ? currentUser.name : "Tanvy Pandey";
  const defaultManagerName = currentUser?.role === 'manager' ? currentUser.name : "Aakash Gupta";

  return Array.from({ length: 30 }).map((_, i) => ({
    id: `INT-2026-${(i + 1).toString().padStart(3, '0')}`,
    name: i === 0 ? defaultEmployeeName : `Intern Member ${i + 1}`,
    email: i === 0 ? (currentUser?.role === 'employee' ? currentUser.email : "tanvy.pandey@hindustaan.in") : `intern${i+1}@hindustaan.in`,
    phone: "+91 9876543210",
    college: "IIT Delhi",
    degree: "B.Tech Computer Science",
    role: roles[i % roles.length],
    department: depts[i % depts.length],
    manager: defaultManagerName,
    project: projects[i % projects.length],
    score: Math.floor(Math.random() * (100 - 65 + 1)) + 65,
    attendance: Math.floor(Math.random() * (100 - 80 + 1)) + 80,
    currentTask: i % 3 === 0 ? "Building Team Members UI" : "Writing API Endpoints",
    hoursLogged: Math.floor(Math.random() * (45 - 20 + 1)) + 20,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    joiningDate: "June 1, 2026",
    expectedEndDate: "Sept 1, 2026",
    skills: ["React", "TypeScript", "Tailwind CSS", "Node.js"].slice(0, (i % 3) + 2),
  }));
};

export default function TeamMembers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  
  const currentUser = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'active' | 'pending'>('active');

  // Approval Dialog States
  const [approvingUser, setApprovingUser] = useState<any | null>(null);
  const [empIdInput, setEmpIdInput] = useState('');
  const [isApprovingSubmit, setIsApprovingSubmit] = useState(false);

  const [stats, setStats] = useState({
    totalInterns: 0,
    onlineCount: 0,
    leaveCount: 0,
    pendingInvitations: 0
  });

  const [selectedIntern, setSelectedIntern] = useState<any | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [reassignIntern, setReassignIntern] = useState<any | null>(null);
  const [reassignMessage, setReassignMessage] = useState('');
  const [newProject, setNewProject] = useState('');
  const [whatsappIntern, setWhatsappIntern] = useState<any | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const mapBackendMember = (m: any) => {
    const depts = ['Frontend', 'Backend', 'AI/ML', 'UI/UX'];
    const matchedDept = depts.find(d => d.toLowerCase() === (m.department || '').toLowerCase()) || m.department || 'Frontend';

    const defaultSkills: Record<string, string[]> = {
      'Frontend': ['React', 'TypeScript', 'Tailwind CSS', 'CSS3'],
      'Backend': ['Node.js', 'Express', 'PostgreSQL', 'Prisma'],
      'AI/ML': ['Python', 'PyTorch', 'Scikit-Learn', 'Pandas'],
      'UI/UX': ['Figma', 'UI Design', 'Wireframing', 'Prototyping'],
      'Engineering': ['React', 'TypeScript', 'Node.js', 'Prisma'],
      'Operations': ['Excel', 'Coordination', 'Planning', 'Strategy'],
      'HR': ['Recruitment', 'Onboarding', 'Communication', 'Sourcing'],
      'Marketing': ['SEO', 'Content', 'Social Media', 'Analytics'],
      'Sales': ['Pitching', 'Closing', 'CRM', 'Negotiation']
    };

    return {
      id: m.id || m.empId || '',
      empId: m.empId || '',
      name: m.name || 'Unknown Intern',
      email: m.email || '',
      phone: m.phone || 'N/A',
      college: m.college || 'IIT Delhi',
      degree: m.degree || 'B.Tech Computer Science',
      role: m.role || 'Intern',
      department: matchedDept,
      manager: m.manager || 'Aakash Gupta',
      project: m.project || 'Bench',
      score: typeof m.score === 'string' ? parseFloat(m.score) || 75 : m.score || 75,
      attendance: m.attendance || 95,
      currentTask: m.currentTask || 'No active task',
      hoursLogged: typeof m.hoursLogged === 'string' ? parseFloat(m.hoursLogged) || 0 : m.hoursLogged || 0,
      status: m.status || 'Offline',
      joiningDate: m.joiningDate || 'June 1, 2026',
      expectedEndDate: m.expectedEndDate || 'Sept 1, 2026',
      skills: m.skills || defaultSkills[matchedDept] || ['TypeScript', 'Git']
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Active team
      const teamRes = await api.get('/team');
      if (teamRes.data?.success) {
        const backendMembers = teamRes.data.data.members || [];
        setInterns(backendMembers.map(mapBackendMember));
        setStats(prev => ({
          ...prev,
          totalInterns: teamRes.data.data.stats.totalInterns,
          onlineCount: teamRes.data.data.stats.onlineCount,
          leaveCount: teamRes.data.data.stats.leaveCount,
        }));
      }

      // 2. Fetch Pending approvals
      if (currentUser?.role === 'manager') {
        const pendingRes = await api.get('/team/pending');
        if (pendingRes.data?.success) {
          const pendingData = pendingRes.data.data || [];
          setPendingApprovals(pendingData);
          setStats(prev => ({
            ...prev,
            pendingInvitations: pendingData.length
          }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching team data:', err);
      if (err.response?.status !== 401) {
        toast.error('Data Load Error', { description: err.message || 'Failed to load team directories.' });
      }
      const mockInterns = generateMockInterns(currentUser);
      setInterns(mockInterns);
      setStats(prev => ({
        ...prev,
        totalInterns: mockInterns.length,
        onlineCount: mockInterns.filter(i => i.status === 'Online').length,
        leaveCount: mockInterns.filter(i => i.status === 'Leave').length,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalInterns = stats.totalInterns;
  const onlineCount = stats.onlineCount;
  const leaveCount = stats.leaveCount;

  // Filter Logic
  const filteredInterns = interns.filter(intern => {
    // Search
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      intern.name.toLowerCase().includes(searchLower) ||
      intern.email.toLowerCase().includes(searchLower) ||
      intern.skills.some((skill: string) => skill.toLowerCase().includes(searchLower));
    
    // Department Filter
    let matchesDept = false;
    if (deptFilter === 'all') matchesDept = true;
    else if (deptFilter === 'frontend' && intern.department === 'Frontend') matchesDept = true;
    else if (deptFilter === 'backend' && intern.department === 'Backend') matchesDept = true;
    else if (deptFilter === 'aiml' && intern.department === 'AI/ML') matchesDept = true;
    else if (deptFilter === 'uiux' && intern.department === 'UI/UX') matchesDept = true;

    // Status Filter
    const matchesStatus = statusFilter === 'all' || intern.status.toLowerCase() === statusFilter;

    // Project Filter
    const matchesProject = projectFilter === 'all' || intern.project === projectFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesProject;
  });

  const hasActiveFilters = searchTerm !== '' || deptFilter !== 'all' || statusFilter !== 'all' || projectFilter !== 'all';

  // Handlers
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviteOpen(false);
    toast.success("Invitation Sent Successfully", {
      description: "A temporary password and setup instructions have been emailed to the intern.",
    });
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignIntern || !newProject) return;

    // Update Interns state
    setInterns(prev => prev.map(intern => 
      intern.id === reassignIntern.id ? { ...intern, project: newProject } : intern
    ));

    // Fire local storage notification for the employee
    const savedEmpNotifications = localStorage.getItem('hindustaan_employee_notifications');
    let empNotifications = [];
    if (savedEmpNotifications && savedEmpNotifications !== 'null') {
      try {
        empNotifications = JSON.parse(savedEmpNotifications);
      } catch (e) {
        console.error(e);
      }
    }
    const newEmpNotification = {
      id: Date.now(),
      category: 'Projects',
      icon: '🔄',
      title: 'Project Reassigned',
      message: reassignMessage || `You have been reassigned to project: ${newProject}`,
      time: 'Just now',
      unread: true,
      group: 'Today',
      priority: 'Important'
    };
    localStorage.setItem('hindustaan_employee_notifications', JSON.stringify([newEmpNotification, ...empNotifications]));
    window.dispatchEvent(new Event('employee-notifications-updated'));

    toast.success("Project Reassigned", {
      description: `${reassignIntern.name} has been moved to ${newProject}.`,
    });
    setReassignIntern(null);
    setNewProject('');
    setReassignMessage('');
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappIntern || !whatsappMessage) return;

    const phoneNum = whatsappIntern.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    
    setWhatsappIntern(null);
    setWhatsappMessage('');
  };

  const handleConfirmApproval = async () => {
    if (!approvingUser) return;
    setIsApprovingSubmit(true);
    try {
      const response = await api.post(`/auth/approve/${approvingUser.id}`, {
        empId: empIdInput.trim() || undefined
      });
      if (response.data?.success) {
        toast.success('Account Approved', {
          description: response.data.message || `User has been approved successfully.`
        });
        setApprovingUser(null);
        setEmpIdInput('');
        // Refresh directories
        await fetchData();
      }
    } catch (err: any) {
      console.error('Error approving user:', err);
      toast.error('Approval Failed', {
        description: err.response?.data?.message || err.message || 'An error occurred during approval.'
      });
    } finally {
      setIsApprovingSubmit(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <Users className="mr-2 h-6 w-6 text-orange-500" />
            Team Members
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage interns, onboarding, assignments, and performance.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-bold h-10">
                <Plus className="mr-2 h-4 w-4" />
                Invite Intern
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Invite New Intern</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteSubmit} className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Manager</label>
                    <Input required defaultValue={currentUser?.role === 'manager' ? currentUser.name : "Aakash Gupta"} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Last Name</label>
                    <Input required placeholder="E.g. Gupta" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Personal Email</label>
                    <Input required type="email" placeholder="aakash@example.com" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Department</label>
                    <Select defaultValue="engineering">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Role</label>
                    <Input required placeholder="Frontend Intern" className="rounded-xl" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                  <Button type="submit" className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">Send Invitation</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Interns</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalInterns}</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Online</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{onlineCount}</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">On Leave</span>
            <span className="text-3xl font-black text-amber-600 dark:text-amber-500">{leaveCount}</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Pending Approvals</span>
            <span className="text-3xl font-black text-blue-600 dark:text-blue-500">{pendingApprovals.length}</span>
          </CardContent>
        </Card>
      </div>

      {loading && interns.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading team directory...</p>
        </Card>
      ) : (
        <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as any)} className="w-full space-y-6">
          {currentUser?.role === 'manager' && (
            <TabsList className="bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-2 self-start w-fit">
              <TabsTrigger value="active" className="rounded-lg font-bold px-4 py-2">
                Active Directory
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg font-bold px-4 py-2 relative">
                Pending Approvals
                {pendingApprovals.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-black bg-orange-500 text-white rounded-full">
                    {pendingApprovals.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="active" className="space-y-6 mt-0">
            {/* Filters & Search */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search by name, email, skills..." 
                    className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {Array.from(new Set(interns.map(i => i.project))).map(proj => (
                        <SelectItem key={proj} value={proj}>{proj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Depts</SelectItem>
                      <SelectItem value="frontend">Frontend</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="aiml">AI/ML</SelectItem>
                      <SelectItem value="uiux">UI/UX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px] rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="online">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          Online
                        </div>
                      </SelectItem>
                      <SelectItem value="busy">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-rose-500" />
                          Busy
                        </div>
                      </SelectItem>
                      <SelectItem value="leave">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          Leave
                        </div>
                      </SelectItem>
                      <SelectItem value="offline">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-slate-400" />
                          Offline
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant={hasActiveFilters ? "secondary" : "outline"} 
                    size="icon" 
                    className={cn("rounded-xl shrink-0 transition-colors", hasActiveFilters && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-0")}
                    onClick={() => {
                      setSearchTerm('');
                      setDeptFilter('all');
                      setStatusFilter('all');
                      setProjectFilter('all');
                    }}
                    title={hasActiveFilters ? "Clear filters" : "Filter"}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Grid of Interns */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5">
              {filteredInterns.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No team members found matching search or filters.
                </div>
              ) : (
                filteredInterns.map((intern) => (
                  <Card 
                    key={intern.id} 
                    className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-colors cursor-pointer flex flex-col group overflow-hidden"
                    onClick={() => setSelectedIntern(intern)}
                  >
                    <CardHeader className="p-5 pb-0 border-b border-transparent">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-950 shadow-sm">
                              <AvatarFallback className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold">
                                {intern.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950",
                              intern.status === 'Online' ? "bg-emerald-500" :
                              intern.status === 'Busy' ? "bg-rose-500" :
                              intern.status === 'Leave' ? "bg-amber-500" : "bg-slate-400"
                            )} />
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {intern.name}
                            </CardTitle>
                            <CardDescription className="text-xs font-semibold text-slate-500 line-clamp-1 mt-0.5">
                              {intern.role}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/30 transition-all border-0 shadow-none" onClick={(e) => {
                            e.stopPropagation();
                            setReassignIntern(intern);
                            setReassignMessage(`Hi ${intern.name.split(' ')[0]}, you are being moved from ${intern.project} to a new project.`);
                            setNewProject('');
                          }} title="Reassign Project">
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 transition-all border-0 shadow-none" onClick={(e) => {
                            e.stopPropagation();
                            setWhatsappIntern(intern);
                            setWhatsappMessage(`Hi ${intern.name.split(' ')[0]}, `);
                          }} title="Send WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-all border-0 shadow-none" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              <DropdownMenuItem className="font-medium cursor-pointer"><CheckCircle2 className="mr-2 h-4 w-4" /> Assign Task</DropdownMenuItem>
                              <DropdownMenuItem className="font-medium cursor-pointer text-rose-600 dark:text-rose-400"><Clock className="mr-2 h-4 w-4" /> Deactivate</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 flex-1 flex flex-col gap-4">
                      
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Score</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white flex items-center">
                            <Trophy className="h-3 w-3 text-orange-500 mr-1" /> {intern.score}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Logged</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white flex items-center">
                            <Clock className="h-3 w-3 text-blue-500 mr-1" /> {intern.hoursLogged} hrs
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-2 flex-1">
                        <div className="space-y-1.5 flex-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md" title={intern.project}>
                            {intern.project}
                          </p>
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Task</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md" title={intern.currentTask}>
                            {intern.currentTask}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {intern.skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-0 rounded text-[10px] px-1.5">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {currentUser?.role === 'manager' && (
            <TabsContent value="pending" className="space-y-6 mt-0">
              {pendingApprovals.length === 0 ? (
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
                  <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Pending Approvals</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    All registered accounts are currently approved and active. New registrations will show up here.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                  {pendingApprovals.map((pending) => (
                    <Card key={pending.id} className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold">
                              {pending.name ? pending.name.split(' ').map((n: string) => n[0]).join('') : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {pending.name || 'Unknown User'}
                            </CardTitle>
                            <CardDescription className="text-xs font-semibold text-slate-500 truncate">
                              {pending.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Role</p>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 capitalize">{pending.role || 'Intern'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Department</p>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200">{pending.department || 'Engineering'}</p>
                          </div>
                          {pending.designation && (
                            <div className="col-span-2 border-t border-slate-200/50 dark:border-slate-800/80 pt-2 mt-1">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Designation</p>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200">{pending.designation}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2.5 pt-2">
                          <Button 
                            onClick={() => {
                              setApprovingUser(pending);
                              setEmpIdInput('');
                            }}
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
                          >
                            <Check className="h-4 w-4 mr-1.5" /> Approve Account
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Intern Profile Drawer (Sheet) */}
      <Sheet open={!!selectedIntern} onOpenChange={(open) => !open && setSelectedIntern(null)}>
        <SheetContent className="w-full sm:max-w-md lg:max-w-lg overflow-y-auto bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-0 rounded-l-3xl">
          {selectedIntern && (
            <div className="flex flex-col min-h-full">
              {/* Cover & Header */}
              <div className="h-32 bg-gradient-to-br from-orange-500 to-rose-600 relative rounded-tl-3xl shrink-0">
                <div className="absolute -bottom-10 left-6">
                  <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-950 shadow-md">
                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-3xl font-black text-slate-900 dark:text-white">
                      {selectedIntern.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="pt-14 px-6 pb-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white">
                      {selectedIntern.name}
                    </SheetTitle>
                    <p className="text-sm font-bold text-slate-500 mt-1">{selectedIntern.role}</p>
                    <Badge variant="outline" className="mt-3 rounded text-xs font-bold bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/80 dark:text-slate-300 dark:border-slate-700">
                      {selectedIntern.id}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="rounded-full shadow-sm">
                      <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                    <Button size="icon" className="rounded-full shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                      setWhatsappIntern(selectedIntern);
                      setWhatsappMessage(`Hi ${selectedIntern.name.split(' ')[0]}, `);
                    }}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="overview" className="w-full">
                  <div className="px-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
                    <TabsList className="bg-transparent border-0 p-0 h-12 w-full justify-start gap-6 rounded-none">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-0 h-12 font-bold text-slate-500 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Overview</TabsTrigger>
                      <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-0 h-12 font-bold text-slate-500 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Activity</TabsTrigger>
                      <TabsTrigger value="performance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-0 h-12 font-bold text-slate-500 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Performance</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="overview" className="m-0 p-6 space-y-8">
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Contact & Info</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" /> {selectedIntern.email}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" /> {selectedIntern.phone}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" /> {selectedIntern.college} - {selectedIntern.degree}
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Internship Details */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Internship Details</h4>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedIntern.department}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedIntern.project}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Manager</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                            <Avatar className="h-5 w-5 mr-2 inline-block"><AvatarFallback className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold">AG</AvatarFallback></Avatar>
                            {selectedIntern.manager}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedIntern.joiningDate} - {selectedIntern.expectedEndDate}</p>
                        </div>
                      </div>
                    </div>

                  </TabsContent>
                  
                  <TabsContent value="activity" className="m-0 p-6">
                    <div className="space-y-6">
                      <div className="relative pl-6 py-2 before:absolute before:left-2 before:top-4 before:bottom-[-24px] before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                        <div className="absolute left-[3px] top-4 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-950" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Task Completed: Dashboard Analytics UI</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Today, 2:30 PM</p>
                      </div>
                      <div className="relative pl-6 py-2 before:absolute before:left-2 before:top-4 before:bottom-[-24px] before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                        <div className="absolute left-[3px] top-4 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-950" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Daily Standup Submitted</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Today, 9:15 AM</p>
                      </div>
                      <div className="relative pl-6 py-2">
                        <div className="absolute left-[3px] top-4 h-2.5 w-2.5 rounded-full bg-orange-500 ring-4 ring-white dark:ring-slate-950" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Hours Logged: 6.5 hours</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Yesterday</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="performance" className="m-0 p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-orange-600 dark:text-orange-500 mb-1">{selectedIntern.score}%</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contribution</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mb-1">{selectedIntern.attendance}%</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-700 dark:text-slate-300">Sprint Progress</span>
                          <span className="text-slate-900 dark:text-white">75%</span>
                        </div>
                        <Progress value={75} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-orange-500" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reassign Project Dialog */}
      <Dialog open={!!reassignIntern} onOpenChange={(open) => !open && setReassignIntern(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-orange-500" />
              Reassign Project
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReassignSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Team Member</label>
              <Input disabled value={reassignIntern?.name || ''} className="rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">New Project</label>
              <Select required value={newProject} onValueChange={setNewProject}>
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select a new project..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                  <SelectItem value="Dashboard UI Revamp">Dashboard UI Revamp</SelectItem>
                  <SelectItem value="Supabase Migration">Supabase Migration</SelectItem>
                  <SelectItem value="Predictive Model V2">Predictive Model V2</SelectItem>
                  <SelectItem value="Onboarding Flow">Onboarding Flow</SelectItem>
                  <SelectItem value="Backend API V3">Backend API V3</SelectItem>
                  <SelectItem value="Marketing Site">Marketing Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Message to Employee</label>
              <Textarea 
                required 
                value={reassignMessage} 
                onChange={(e) => setReassignMessage(e.target.value)}
                className="rounded-xl resize-none h-24 bg-slate-50 dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-800"
                placeholder="Explain the reassignment..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setReassignIntern(null)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">Reassign & Notify</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Message Dialog */}
      <Dialog open={!!whatsappIntern} onOpenChange={(open) => !open && setWhatsappIntern(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-emerald-500" />
              Send WhatsApp Message
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWhatsAppSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">To</label>
              <Input disabled value={whatsappIntern?.name || ''} className="rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Message</label>
              <Textarea 
                required 
                value={whatsappMessage} 
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="rounded-xl resize-none h-32 bg-slate-50 dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-800"
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setWhatsappIntern(null)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Send via WhatsApp</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approval Details Modal */}
      <Dialog open={!!approvingUser} onOpenChange={(open) => !open && setApprovingUser(null)}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" />
              Approve User Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</label>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{approvingUser?.name}</p>
                <p className="text-xs text-slate-500">{approvingUser?.email}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider capitalize">
                  {approvingUser?.role} • {approvingUser?.department}
                </p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Assign Employee ID (Optional)
              </label>
              <Input 
                value={empIdInput} 
                onChange={(e) => setEmpIdInput(e.target.value)}
                placeholder="e.g. EMP-1004 (Leave blank for auto-generation)"
                className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-orange-500/10 focus:border-orange-500"
              />
              <p className="text-[10px] text-slate-400">
                If left blank, the system automatically assigns the next sequential Employee ID.
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setApprovingUser(null)} 
              className="rounded-xl font-bold"
              disabled={isApprovingSubmit}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmApproval}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={isApprovingSubmit}
            >
              {isApprovingSubmit ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              Confirm & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
