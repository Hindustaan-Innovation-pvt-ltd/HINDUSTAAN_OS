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
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client to listen for real-time auth states
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { ThemeProvider } from './context/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('Dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          Loading Hindustaan OS Workspace...
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <TooltipProvider>
        {!session ? (
          <Login onMockLogin={(role) => setSession({ user: { email: 'user@hindustaan.in', user_metadata: { role } } })} />
        ) : (
          <DashboardShell
            currentView={currentView}
            onNavigate={setCurrentView}
            role={session.user?.user_metadata?.role || 'intern'}
            onSignOut={() => {
              if (supabaseUrl.includes('placeholder')) {
                setSession(null);
              } else {
                supabase.auth.signOut();
              }
            }}
          >
            {currentView === 'Dashboard' && <RoleBasedRouter session={session} />}
            {(currentView === 'Tasks' || currentView === 'My Tasks') && <TaskBoard session={session} />}
            {currentView === 'Time Tracking' && <TimeAndStandup session={session} />}
            {currentView === 'Milestones' && <Milestones session={session} />}
            {(currentView === 'Projects' || currentView === 'My Projects') && <Projects session={session} />}
            {currentView === 'About Us' && <AboutUs />}
            {currentView === 'Settings' && <Settings session={session} />}
            {currentView === 'Team Members' && <TeamMembers session={session} />}
            {/* New Pages */}
            {currentView === 'Gantt Timeline' && <GanttTimeline session={session} />}
            {currentView === 'Progress Tracker' && <ProgressTracker session={session} />}
            {currentView === 'Work Logs' && <WorkLogs session={session} />}
            {(currentView === 'Daily Standups' || currentView === 'Daily Standup') && <DailyStandups session={session} />}
            {(currentView === 'Contribution Scores' || currentView === 'My Performance') && <ContributionScores session={session} />}

            {/* Fallback for anything else */}
            {!['Dashboard', 'Tasks', 'My Tasks', 'Time Tracking', 'Milestones',
              'Projects', 'My Projects', 'About Us', 'Settings', 'Team Members',
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
      </TooltipProvider >
    </ThemeProvider >
  );
}

export default App;