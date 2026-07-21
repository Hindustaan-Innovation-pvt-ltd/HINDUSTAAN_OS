import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import EmployeeProfileView from './pages/EmployeeProfileView';
import EmployeeProfileEdit from './pages/EmployeeProfileEdit';
import HelpSupport from '@/pages/HelpSupport';
import LeaveManagement from './pages/LeaveManagement';
import WorkspaceSettings from './pages/workspace/WorkspaceSettings';
import EmailLogsModule from '@/components/workspace-settings/EmailLogsModule';
import AnnouncementCenterModule from '@/components/workspace-settings/AnnouncementCenterModule';
import SystemNotificationsModule from '@/components/workspace-settings/SystemNotificationsModule';
import DeliveryChannelsModule from '@/components/workspace-settings/DeliveryChannelsModule';
import SecuritySettings from './pages/SecuritySettings';
import Subscriptions from './pages/Subscriptions';

import { ThemeProvider } from '@/context/ThemeContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { UserProvider, useUser } from '@/context/UserContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { SocketProvider } from '@/context/SocketContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

import { BrandLogo } from '@/components/ui/BrandLogo';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useUser();
  const role = user?.role || 'employee';
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const handleSignOut = () => {
    // Clear legacy storage for safety if there's any left
    localStorage.removeItem('hindustaan_user');
    sessionStorage.removeItem('hindustaan_user');
    window.dispatchEvent(new Event('auth-logout'));
    window.location.href = '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<Login defaultRole="manager" />} />
      <Route path="/admin/login" element={<Login isAdminLogin={true} defaultRole="admin" />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardShell
              isMinimized={isSidebarMinimized}
              onMinimizeChange={setIsSidebarMinimized}
              onSignOut={handleSignOut}
            />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to={`/${role}/dashboard`} replace />} />
        <Route path="/employee/dashboard" element={<RoleBasedRouter />} />
        <Route path="/manager/dashboard" element={<RoleBasedRouter />} />
        <Route path="/admin/dashboard" element={<RoleBasedRouter />} />
        <Route path="/tasks" element={<TaskBoard />} />
        <Route path="/time-tracking" element={<TimeAndStandup />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/timeline" element={<GanttTimeline />} />
        <Route path="/performance" element={<ProgressTracker />} />
        <Route path="/milestones" element={<Milestones />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/team" element={<TeamMembers />} />
        <Route path="/roles" element={<RolesAndPermissions />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/profile" element={['manager', 'admin'].includes(role) ? <ProfileView /> : <EmployeeProfileView />} />
        <Route path="/profile/edit" element={['manager', 'admin'].includes(role) ? <ProfileEdit /> : <EmployeeProfileEdit />} />
        <Route path="/manager/leave-management" element={<LeaveManagement />} />
        <Route path="/employee/leave" element={<LeaveManagement />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/security" element={<SecuritySettings />} />
        <Route path="/admin/workspace/general" element={<WorkspaceSettings />} />
        <Route path="/admin/workspace/email" element={<EmailLogsModule />} />
        <Route path="/admin/workspace/announcements" element={<AnnouncementCenterModule />} />
        <Route path="/admin/workspace/notifications" element={<SystemNotificationsModule />} />
        <Route path="/admin/workspace/channels" element={<DeliveryChannelsModule />} />
        <Route path="/admin/subscriptions" element={<Subscriptions />} />
        <Route path="/work-logs" element={<WorkLogs />} />
        <Route path="/daily-standups" element={<DailyStandups />} />
        <Route path="/contribution-scores" element={<ContributionScores />} />
      </Route>
      
      <Route path="*" element={<Navigate to={`/${role}/dashboard`} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <NotificationProvider>
          <UserProvider>
            <ProjectProvider>
              <SocketProvider>
                <TooltipProvider>
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                  <Toaster position="top-right" duration={4000} richColors closeButton expand />
                </TooltipProvider>
              </SocketProvider>
            </ProjectProvider>
          </UserProvider>
        </NotificationProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  );
}

export default App;