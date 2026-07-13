import React from 'react';
import ManagerDashboard from './ManagerDashboard';
import InternDashboard from './InternDashboard';
import AdminDashboard from '../../pages/AdminDashboard';

interface RoleBasedRouterProps {
  session: any;
}

export default function RoleBasedRouter({ session }: RoleBasedRouterProps) {
  const role = session?.user?.user_metadata?.role || 'manager';

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'manager') {
    return <ManagerDashboard />;
  }

  return <InternDashboard session={session} />;
}
