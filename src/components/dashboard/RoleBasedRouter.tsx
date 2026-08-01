import React from 'react';
import ManagerDashboard from './ManagerDashboard';
import InternDashboard from './InternDashboard';
import AdminDashboard from '../../features/dashboard/pages/AdminDashboard';
import { useUser } from '@/context/UserContext';
import { getCurrentUser } from '@/lib/auth';

interface RoleBasedRouterProps {}

export default function RoleBasedRouter({}: RoleBasedRouterProps) {
  const { user } = useUser();
  const role = user?.role || getCurrentUser()?.role || localStorage.getItem('role') || 'manager';

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'manager') {
    return <ManagerDashboard />;
  }

  return <InternDashboard />;
}
// Force re-eval
