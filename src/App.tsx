import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import DashboardShell from './components/layout/DashboardShell';
import RoleBasedRouter from './components/dashboard/RoleBasedRouter';
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
// Supabase client removed for mock auth implementation

import { ThemeProvider } from './context/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProjectProvider } from './context/ProjectContext';
import { Toaster } from '@/components/ui/sonner';
import { GLOBAL_LOGS } from '@/data/mockData';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('Dashboard');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('hindustaan_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setSession({ user: { email: user.email, user_metadata: { role: user.role } } });
      } catch (e) {
        localStorage.removeItem('hindustaan_user');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center gap-6 animate-pulse">
          <img src="/logo-full.png" alt="Hindustaan OS" className="w-[150px] dark:hidden object-contain" />
          <img src="/logo-full-dark.png" alt="Hindustaan OS" className="w-[150px] hidden dark:block object-contain" />
          <div className="text-sm font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Initializing Workspace...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <TooltipProvider>
        <ProjectProvider>
          {!session ? (
            <Login onMockLogin={() => {
            const userStr = localStorage.getItem('hindustaan_user');
            if (userStr) {
              const user = JSON.parse(userStr);
              setSession({ user: { email: user.email, user_metadata: { role: user.role } } });
            }
          }} />
        ) : (
          <DashboardShell
            currentView={currentView}
            onNavigate={setCurrentView}
            role={session.user?.user_metadata?.role || 'employee'}
            isMinimized={isSidebarMinimized}
            onMinimizeChange={setIsSidebarMinimized}
            onSignOut={() => {
              // 1. Calculate and save work log for current session before clearing
              const role = session.user?.user_metadata?.role || 'employee';
              const email = session.user?.email || 'user@hindustaan.in';
              
              if (role === 'employee') {
                let currentUserId = 'u-4';
                let currentUserName = 'Tanvy Pandey';
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
                
                const loginTimeStr = localStorage.getItem(`login_time_${currentUserId}`);
                if (loginTimeStr) {
                  const startTime = parseInt(loginTimeStr, 10);
                  const secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
                  
                  // Convert to hours (with minimum of 0.1 hours so short demo sessions show up nicely)
                  const hours = Math.max(0.1, Math.round((secondsElapsed / 3600) * 10) / 10);
                  
                  const initials = currentUserName.split(' ').map(n => n[0]).join('').toUpperCase();
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
                  
                  // Load existing logs, prepend new log, and save back
                  const existingLogsStr = localStorage.getItem('work_logs_list');
                  let logsList = existingLogsStr ? JSON.parse(existingLogsStr) : GLOBAL_LOGS;
                  logsList = [newLog, ...logsList];
                  localStorage.setItem('work_logs_list', JSON.stringify(logsList));
                }
                
                localStorage.removeItem(`login_time_${currentUserId}`);
              }
              
              localStorage.removeItem('hindustaan_user');
              setSession(null);
            }}
          >
            {currentView === 'Dashboard' && <RoleBasedRouter session={session} />}
            {(currentView === 'Tasks' || currentView === 'My Tasks') && (
              <TaskBoard session={session} isSidebarMinimized={isSidebarMinimized} />
            )}
            {currentView === 'Time Tracking' && <TimeAndStandup session={session} />}
            {currentView === 'Milestones' && <Milestones session={session} />}
            {(currentView === 'Projects' || currentView === 'My Projects') && <Projects session={session} />}
            {currentView === 'About Us' && <AboutUs />}
            {currentView === 'Settings' && <Settings session={session} />}
            {currentView === 'My Profile' && <Settings session={session} defaultTab="profile" />}
            {currentView === 'Team Members' && <TeamMembers session={session} />}

            {/* New Pages */}
            {currentView === 'Gantt Timeline' && <GanttTimeline session={session} />}
            {currentView === 'Progress Tracker' && <ProgressTracker session={session} />}
            {currentView === 'Work Logs' && <WorkLogs session={session} />}
            {(currentView === 'Daily Standups' || currentView === 'Daily Standup') && <DailyStandups session={session} />}
            {(currentView === 'Contribution Scores' || currentView === 'My Performance') && <ContributionScores session={session} />}

            {/* Fallback for anything else */}
            {![
              'Dashboard', 'Tasks', 'My Tasks', 'Time Tracking', 'Milestones',
              'Projects', 'My Projects', 'About Us', 'Settings', 'My Profile', 'Team Members',
              'Gantt Timeline', 'Progress Tracker', 'Work Logs', 'Daily Standups', 'Daily Standup',
              'Contribution Scores', 'My Performance'
            ].includes(currentView) && (
              <div className="flex h-[400px] items-center justify-center text-slate-400 dark:text-slate-500">
                <p>Module "{currentView}" is under construction.</p>
              </div>
            )}
          </DashboardShell>
        )}
        <Toaster position="top-right" richColors />
        </ProjectProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;