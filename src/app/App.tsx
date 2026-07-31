import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from '../features/auth/pages/Login';
import Logout from '../features/auth/pages/Logout';
import DashboardShell from '../components/layout/DashboardShell';
import RoleBasedRouter from '../components/dashboard/RoleBasedRouter';
import AdminDashboard from '../features/dashboard/pages/AdminDashboard';
import RolesAndPermissions from '../features/workspace/pages/RolesAndPermissions';
import TaskBoard from '../features/tasks/pages/TaskBoard';
import TimeAndStandup from '../features/leaves/pages/TimeAndStandup';
import Milestones from '../features/projects/pages/Milestones';
import AboutUs from '../features/pages/AboutUs';
import Projects from '../features/projects/pages/Projects';
import Settings from '../features/workspace/pages/Settings';
import TeamMembers from '../features/team/pages/TeamMembers';
import GanttTimeline from '../features/projects/pages/GanttTimeline';
import ProgressTracker from '../features/leaves/pages/ProgressTracker';
import WorkLogs from '../features/leaves/pages/WorkLogs';
import DailyStandups from '../features/leaves/pages/DailyStandups';
import ContributionScores from '../features/leaves/pages/ContributionScores';
import Register from '../features/auth/pages/Register';
import ProfileView from '../features/team/pages/ProfileView';
import ProfileEdit from '../features/team/pages/ProfileEdit';
import EmployeeProfileView from '../features/team/pages/EmployeeProfileView';
import EmployeeProfileEdit from '../features/team/pages/EmployeeProfileEdit';
import HelpSupport from '../features/pages/HelpSupport';
import LeaveManagement from '../features/leaves/pages/LeaveManagement';
import WorkspaceSettings from '../features/workspace/pages/WorkspaceSettings';
import EmailLogsModule from '@/components/workspace-settings/EmailLogsModule';
import AnnouncementCenterModule from '@/components/workspace-settings/AnnouncementCenterModule';
import SystemNotificationsModule from '@/components/workspace-settings/SystemNotificationsModule';
import DeliveryChannelsModule from '@/components/workspace-settings/DeliveryChannelsModule';
import ActivityLogsModule from '@/components/workspace-settings/ActivityLogsModule';
import SecuritySettings from '../features/workspace/pages/SecuritySettings';
import Subscriptions from '../features/workspace/pages/Subscriptions';

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

  const handleSignOut = async () => {
    try {
      const { logoutUser } = await import('@/lib/auth');
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('hindustaan_user');
      sessionStorage.removeItem('hindustaan_user');
      window.dispatchEvent(new Event('auth-logout'));
      window.location.href = '/login';
    }
  };

  return (
    <Routes>
      <Route path="/logout" element={<Logout />} />
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
        <Route path="/employee/dashboard" element={['employee', 'intern'].includes(role) ? <RoleBasedRouter /> : <Navigate to={`/${role}/dashboard`} replace />} />
        <Route path="/manager/dashboard" element={role === 'manager' ? <RoleBasedRouter /> : <Navigate to={`/${role}/dashboard`} replace />} />
        <Route path="/admin/dashboard" element={role === 'admin' ? <RoleBasedRouter /> : <Navigate to={`/${role}/dashboard`} replace />} />
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
        <Route path="/admin/leave-management" element={<LeaveManagement />} />
        <Route path="/admin/leaves" element={<LeaveManagement />} />
        <Route path="/manager/leave-management" element={<LeaveManagement />} />
        <Route path="/employee/leave" element={<LeaveManagement />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/security" element={<SecuritySettings />} />
        <Route path="/admin/workspace/general" element={<WorkspaceSettings />} />
        <Route path="/admin/workspace/email" element={<EmailLogsModule />} />
        <Route path="/manager/email" element={<EmailLogsModule />} />
        <Route path="/admin/workspace/announcements" element={<AnnouncementCenterModule />} />
        <Route path="/admin/workspace/notifications" element={<SystemNotificationsModule />} />
        <Route path="/admin/workspace/channels" element={<DeliveryChannelsModule />} />
        <Route path="/admin/workspace/activity-logs" element={<ActivityLogsModule />} />
        <Route path="/admin/activity-logs" element={<ActivityLogsModule />} />
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