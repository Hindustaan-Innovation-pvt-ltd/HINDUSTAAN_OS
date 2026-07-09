import React from 'react';
import ManagerDashboard from './ManagerDashboard';
import InternDashboard from './InternDashboard';

interface RoleBasedRouterProps {
  session: any;
}

export default function RoleBasedRouter({ session }: RoleBasedRouterProps) {
  // Extract role from Supabase session token metadata
  // Fallback to 'manager' for demonstration if metadata is not explicitly configured
  const role = session?.user?.user_metadata?.role || 'manager';

  if (role === 'manager') {
    return <ManagerDashboard />;
  }

  // Fallback / default execution view
  return <InternDashboard session={session} />;
}
