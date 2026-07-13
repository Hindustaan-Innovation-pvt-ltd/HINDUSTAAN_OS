import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import DashboardShell from './components/layout/DashboardShell';
import RoleBasedRouter from './components/dashboard/RoleBasedRouter';
import AdminDashboard from './pages/AdminDashboard';
import RolesAndPermissions from './pages/RolesAndPermissions';
import TaskBoard from './pages/TaskBoard';
import TimeAndStandup from './pages/TimeAndStandup';
import Milestones from './pages/Milestones';
import AboutUs from './pages/AboutUs';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import TeamMembers from './pages/TeamMembers';
import GanttTimeline from './pages/GanttTimeline';
import ProgressTracker from './pages/ProgressTracker';
import WorkLogs from './pages/WorkLogs';
import DailyStandups from './pages/DailyStandups';
import ContributionScores from './pages/ContributionScores';
import Register from './pages/Register';
import ProfileView from './pages/ProfileView';
import ProfileEdit from './pages/ProfileEdit';
import HelpSupport from '@/pages/HelpSupport';
import LeaveManagement from './pages/LeaveManagement';
// Supabase client removed for mock auth implementation

import { ThemeProvider } from '@/context/ThemeContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { UserProvider } from '@/context/UserContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { GLOBAL_LOGS } from '@/data/mockData';
import { mockWorkLogs } from '@/data/mockWorkLogs';
import { BrandLogo } from '@/components/ui/BrandLogo';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('Dashboard');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [prefilledName, setPrefilledName] = useState('');
  const [prefilledRole, setPrefilledRole] = useState('manager');

  // Router listener to synchronize pathname with React currentView state
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/profile') {
        setCurrentView('My Profile');
      } else if (path === '/profile/edit') {
        setCurrentView('Edit Profile');
      } else if (path === '/manager/leave-management' || path === '/employee/leave') {
        setCurrentView('Leave Management');
      } else if (path.includes('/dashboard') || path === '/') {
        setCurrentView('Dashboard');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange(); // run once on mount
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleNavigate = (view: string) => {
    const role = session?.user?.user_metadata?.role || 'employee';
    if (view === 'My Profile') {
      window.history.pushState({}, '', '/profile');
      setCurrentView('My Profile');
    } else if (view === 'Edit Profile') {
      window.history.pushState({}, '', '/profile/edit');
      setCurrentView('Edit Profile');
    } else if (view === 'Leave Management') {
      window.history.pushState({}, '', ['manager', 'admin'].includes(role) ? '/manager/leave-management' : '/employee/leave');
      setCurrentView('Leave Management');
    } else if (view === 'Dashboard') {
      window.history.pushState({}, '', `/${role}/dashboard`);
      setCurrentView('Dashboard');
    } else {
      if (window.location.pathname === '/' || window.location.pathname === '/login') {
        window.history.pushState({}, '', `/${role}/dashboard`);
      }
      setCurrentView(view);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setSession({ user: { email: user.email, user_metadata: { role: user.role, name: user.name, department: user.department } } });
        
        // Ensure login time is tracked for employee
        if (user.role === 'employee') {
          let userId = 'u-4';
          const email = user.email || '';
          if (email.toLowerCase().includes('amanda')) {
            userId = 'u-1';
          } else if (email.toLowerCase().includes('rahul')) {
            userId = 'u-2';
          } else if (email.toLowerCase().includes('priya')) {
            userId = 'u-3';
          }
          const loginKey = `login_time_${userId}`;
          if (!localStorage.getItem(loginKey)) {
            localStorage.setItem(loginKey, Date.now().toString());
          }
        }
        
        // Role-based Redirect Logic on Page Refresh
        const path = window.location.pathname;
        if (path === '/' || path === '/login' || path === '/admin/login') {
          window.history.replaceState({}, '', `/${user.role}/dashboard`);
        } else if (path.startsWith('/admin') && user.role !== 'admin') {
          localStorage.removeItem('hindustaan_user');
          sessionStorage.removeItem('hindustaan_user');
          setSession(null);
          window.history.replaceState({}, '', `/login`);
        } else if (path.startsWith('/manager') && !['manager', 'admin'].includes(user.role)) {
          localStorage.removeItem('hindustaan_user');
          sessionStorage.removeItem('hindustaan_user');
          setSession(null);
          window.history.replaceState({}, '', `/login`);
        }
      } catch (e) {
        localStorage.removeItem('hindustaan_user');
        sessionStorage.removeItem('hindustaan_user');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center gap-6 animate-pulse">
          <BrandLogo variant="auth" />
          <div className="text-sm font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Initializing Workspace...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <ProjectProvider>
        <UserProvider key={session?.user?.email || 'guest'}>
      <TooltipProvider>
          {!session ? (
            window.location.pathname === '/admin/login' ? (
              <Login 
                isAdminLogin={true}
                defaultEmail=""
                defaultName=""
                defaultRole="admin"
                onMockLogin={(role, email) => {
                  const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
                  if (userStr) {
                    const user = JSON.parse(userStr);
                    setSession({ user: { email: user.email, user_metadata: { role: user.role, name: user.name, department: user.department } } });
                    window.history.pushState({}, '', `/admin/dashboard`);
                    setCurrentView('Dashboard');
                  }
                }}
              />
            ) : authView === 'login' ? (
              <Login 
                defaultEmail={prefilledEmail}
                defaultName={prefilledName}
                defaultRole={prefilledRole}
                onMockLogin={(role, email) => {
                  const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
                  if (userStr) {
                    const user = JSON.parse(userStr);
                    setSession({ user: { email: user.email, user_metadata: { role: user.role, name: user.name, department: user.department } } });
                    window.history.pushState({}, '', `/${user.role}/dashboard`);
                    setCurrentView('Dashboard');
                  }
                }}
                onNavigateToRegister={() => {
                  setPrefilledEmail('');
                  setPrefilledName('');
                  setPrefilledRole('manager');
                  setAuthView('register');
                }}
              />
            ) : (
              <Register 
                onNavigateToLogin={(email, name, role) => {
                  if (email) setPrefilledEmail(email);
                  if (name) setPrefilledName(name);
                  if (role) setPrefilledRole(role);
                  setAuthView('login');
                }} 
              />
            )
        ) : (
          <DashboardShell
            currentView={currentView}
            onNavigate={handleNavigate}
            role={session.user?.user_metadata?.role || 'employee'}
            isMinimized={isSidebarMinimized}
            onMinimizeChange={setIsSidebarMinimized}
            onSignOut={() => {
              console.log('[onSignOut] Logout initiated');
              try {
                // 1. Calculate and save work log for current session before clearing
                const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
                let role = 'employee';
                let email = 'user@hindustaan.in';
                let userName = 'Tanvy Pandey';
                
                if (userStr) {
                  try {
                    const user = JSON.parse(userStr);
                    role = user.role || 'employee';
                    email = user.email || 'user@hindustaan.in';
                    userName = user.name || 'Tanvy Pandey';
                    console.log('[onSignOut] Logged-in user found:', user);
                  } catch (e) {
                    console.error('[onSignOut] Error parsing user details:', e);
                  }
                }
                
                if (role === 'employee') {
                  let currentUserId = 'u-4';
                  let currentUserName = userName;
                  let currentProject = 'Frontend Core';
                  let currentTask = 'Kanban Board & Work Logs';
                  
                  if (email.toLowerCase().includes('amanda')) {
                    currentUserId = 'u-1';
                    currentUserName = 'Amanda Smith';
                    currentProject = 'Frontend Core';
                    currentTask = 'Component Refactoring';
                  } else if (email.toLowerCase().includes('rahul')) {
                    currentUserId = 'u-2';
                    currentUserName = 'Rahul Sharma';
                    currentProject = 'Backend Core';
                    currentTask = 'Database Optimization';
                  } else if (email.toLowerCase().includes('priya')) {
                    currentUserId = 'u-3';
                    currentUserName = 'Priya Patel';
                    currentProject = 'Documentation';
                    currentTask = 'API Documentation V2';
                  }

                  // Determine active task in-progress dynamically
                  const savedTasksStr = localStorage.getItem('hindustaan_tasks_list');
                  if (savedTasksStr) {
                    try {
                      const allTasks = JSON.parse(savedTasksStr);
                      const inProgressTask = allTasks.find((t: any) =>
                        (t.assignee_id === currentUserId ||
                         t.assignee_name?.toLowerCase().includes(currentUserName.split(' ')[0].toLowerCase())) &&
                        t.status === 'In Progress'
                      );
                      if (inProgressTask) {
                        currentProject = inProgressTask.project_tag;
                        currentTask = inProgressTask.title;
                        console.log('[onSignOut] Dynamic active task detected:', inProgressTask);
                      }
                    } catch (e) {
                      console.error('[onSignOut] Error detecting active task:', e);
                    }
                  }
                  
                  const loginTimeStr = localStorage.getItem(`login_time_${currentUserId}`);
                  console.log('[onSignOut] login_time key:', `login_time_${currentUserId}`, 'value:', loginTimeStr);
                  if (loginTimeStr) {
                    const startTime = parseInt(loginTimeStr, 10);
                    const secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
                    
                    // Convert to hours (with minimum of 0.1 hours so short demo sessions show up nicely)
                    const hours = Math.max(0.1, Math.round((secondsElapsed / 3600) * 10) / 10);
                    
                    const initials = currentUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                    const newLog = {
                      id: `session-${Date.now()}`,
                      name: currentUserName,
                      initials: initials,
                      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                      hours: hours,
                      task: currentTask,
                      project: currentProject,
                      status: 'Pending'
                    };
                    
                    console.log('[onSignOut] Logging new work log entry:', newLog);

                    // Load existing logs, prepend new log, and save back
                    const existingLogsStr = localStorage.getItem('work_logs_list');
                    let logsList = existingLogsStr ? JSON.parse(existingLogsStr) : GLOBAL_LOGS;
                    logsList = [newLog, ...logsList];
                    localStorage.setItem('work_logs_list', JSON.stringify(logsList));

                    // Also log to work_logs_list_v4
                    const existingLogsV4Str = localStorage.getItem('work_logs_list_v4');
                    let logsListV4;
                    if (existingLogsV4Str) {
                      logsListV4 = JSON.parse(existingLogsV4Str);
                    } else {
                      logsListV4 = mockWorkLogs.map(log => ({
                        id: log.id,
                        name: log.employeeName,
                        initials: log.avatarInitials,
                        date: log.formattedDate,
                        rawDate: log.date,
                        project: log.project,
                        task: log.task,
                        hours: log.hours,
                        status: log.status || 'Approved'
                      }));
                    }
                    
                    const newV4Log = {
                      id: newLog.id,
                      name: newLog.name,
                      initials: newLog.initials,
                      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                      rawDate: new Date().toISOString(),
                      project: newLog.project,
                      task: newLog.task,
                      hours: newLog.hours,
                      status: newLog.status
                    };
                    logsListV4 = [newV4Log, ...logsListV4];
                    localStorage.setItem('work_logs_list_v4', JSON.stringify(logsListV4));
                    console.log('[onSignOut] Successfully logged to work_logs_list_v4');
                  } else {
                    console.warn('[onSignOut] Bypassing work log save: No login_time tracking value found in localStorage');
                  }
                  
                  localStorage.removeItem(`login_time_${currentUserId}`);
                }
              } catch (err) {
                console.error('[onSignOut] Fatal error during work log recording:', err);
              }
              
              localStorage.removeItem('hindustaan_user');
              sessionStorage.removeItem('hindustaan_user');
              window.history.pushState({}, '', '/');
              setCurrentView('Dashboard');
              setSession(null);
            }}
          >
            {currentView === 'Dashboard' && <RoleBasedRouter session={session} />}
            {currentView === 'Employees' && (
              <AdminDashboard showOnlyRole="employee" />
            )}
            {currentView === 'Managers' && (
              <AdminDashboard showOnlyRole="manager" />
            )}
            {currentView === 'Roles & Permissions' && (
              <RolesAndPermissions />
            )}
            {(currentView === 'Tasks' || currentView === 'My Tasks') && (
              <TaskBoard session={session} isSidebarMinimized={isSidebarMinimized} />
            )}
            {currentView === 'Time Tracking' && <TimeAndStandup session={session} />}
            {currentView === 'Milestones' && <Milestones session={session} />}
            {(currentView === 'Projects' || currentView === 'My Projects') && <Projects session={session} />}
            {currentView === 'About Us' && <AboutUs />}
            {currentView === 'Settings' && <Settings session={session} />}
            {currentView === 'My Profile' && (
              <ProfileView session={session} onNavigate={handleNavigate} />
            )}
            {currentView === 'Edit Profile' && (
              <ProfileEdit session={session} onNavigate={handleNavigate} />
            )}
            {currentView === 'Team Members' && <TeamMembers />}

            {/* New Pages */}
            {currentView === 'Gantt Timeline' && <GanttTimeline session={session} />}
            {currentView === 'Progress Tracker' && <ProgressTracker session={session} />}
            {currentView === 'Work Logs' && <WorkLogs session={session} />}
            {(currentView === 'Daily Standups' || currentView === 'Daily Standup') && <DailyStandups session={session} />}
            {(currentView === 'Contribution Scores' || currentView === 'My Performance') && <ContributionScores session={session} />}
            {currentView === 'Leave Management' && <LeaveManagement session={session} />}
            {currentView === 'Help & Support' && <HelpSupport session={session} />}

            {/* Fallback for anything else */}
            {![
              'Dashboard', 'Tasks', 'My Tasks', 'Time Tracking', 'Milestones',
              'Projects', 'My Projects', 'About Us', 'Settings', 'My Profile', 'Edit Profile', 'Team Members',
              'Gantt Timeline', 'Progress Tracker', 'Work Logs', 'Daily Standups', 'Daily Standup',
              'Contribution Scores', 'My Performance', 'Leave Management', 'Help & Support',
              'Employees', 'Managers', 'Roles & Permissions'
            ].includes(currentView) && (
              <div className="flex h-[400px] items-center justify-center text-slate-400 dark:text-slate-500">
                <p>Module "{currentView}" is under construction.</p>
              </div>
            )}
          </DashboardShell>
        )}
        <Toaster position="top-right" duration={4000} richColors closeButton expand />
      </TooltipProvider>
      </UserProvider>
      </ProjectProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;